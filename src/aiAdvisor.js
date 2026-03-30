/**
 * aiAdvisor.js
 * 本地 AI 策略顾问 v2 — 基于规则的优化算法
 *
 * 数据源：window.BUILDINGS_DATA, window.G（由 gameAdapter.js 维护）
 * 不重复定义建筑/升级数据，确保单一数据源
 */

/**
 * 计算复合推荐分数 = 边际GPS增益/价格 * (1 + log10(绝对增益+1))
 * 早期：比率主导；后期：绝对值也参与权衡
 */
function compositeScore(marginalGps, cost) {
  if (cost <= 0 || marginalGps <= 0) return 0;
  const roi = marginalGps / cost;
  const absBonus = Math.log10(marginalGps + 1);
  return roi * (1 + 0.3 * absBonus);
}

/**
 * 计算建筑边际收益（复用 gameAdapter.js 的同步后的 BUILDINGS_DATA）
 */
function analyzeBuildings(buildings, gold) {
  const data = (typeof window !== 'undefined' && window.BUILDINGS_DATA) || buildings;
  const owned = (typeof window !== 'undefined' && window.G?.buildings) || buildings;

  const scored = data.map(b => {
    const count = owned[b.id] || 0;
    const costMult = Math.pow(1.15, count);
    const nextCost = Math.floor(b.baseCost * costMult);
    // 边际产出 = (n+1时的产出) - (n时的产出)
    const gpsAfter = b.baseProduction * (1 + (count + 1) * 0.1);
    const gpsBefore = b.baseProduction * (1 + count * 0.1);
    const marginalGps = gpsAfter - gpsBefore;
    const affordable = gold >= nextCost;
    const score = affordable ? compositeScore(marginalGps, nextCost) : 0;

    // 推荐 buy mode：买 10 个需要多少金币，以及当前金币够买几个
    const costFor10 = Array.from({ length: 10 }, (_, i) =>
      Math.floor(b.baseCost * Math.pow(1.15, count + i))
    ).reduce((s, c) => s + c, 0);
    const canBuy10 = gold >= costFor10;

    return {
      ...b,
      count,
      nextCost,
      marginalGps,
      affordable,
      score,
      gpsPerGold: marginalGps / nextCost,
      buyMode: canBuy10 ? 'x10' : 'x1',
      gpsAccumulation: marginalGps * 3600, // 每小时增益
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * 升级 ROI 分析（乘数修正版）
 */
function analyzeUpgrades(upgrades, gold, currentGps) {
  if (!currentGps || currentGps <= 0) return [];

  const data = (typeof window !== 'undefined' && window.UPGRADES_DATA) || upgrades;
  const purchased = (typeof window !== 'undefined' && window.G?.upgrades) || upgrades;

  // 全局产出倍率（从已有升级反推）
  let globalMultiplier = 1.0;
  const knownUpgrades = {
    'building_speed_1': 0.15, 'building_speed_2': 0.25, 'building_speed_3': 0.35,
    'building_speed_4': 0.50, 'building_speed_5': 1.00,
    'global_boost_1': 0.10, 'global_boost_2': 0.20, 'global_boost_3': 0.30,
  };
  Object.entries(knownUpgrades).forEach(([id, boost]) => {
    if (purchased[id]) globalMultiplier += boost;
  });

  const scored = data
    .filter(u => !purchased[u.id])
    .map(u => {
      // 解析 desc 中的百分比
      const pctMatch = u.desc.match(/(\+?\d+)%/);
      if (!pctMatch) return { ...u, gpsGain: 0, roi: 0 };
      const pct = parseInt(pctMatch[1]) / 100;

      let gpsGain;
      if (u.desc.includes('建筑产出')) {
        // 建筑产出升级：gpsGain = currentGps * pct / globalMultiplier（加回乘数前）
        gpsGain = (currentGps / globalMultiplier) * pct;
      } else if (u.desc.includes('全局') || u.desc.includes('帝国')) {
        // 全局升级直接乘
        gpsGain = currentGps * pct;
      } else {
        gpsGain = 0; // 点击/Boss 暂不优化
      }

      const roi = gpsGain / u.cost;
      return { ...u, gpsGain, roi, affordable: gold >= u.cost };
    })
    .filter(u => u.roi > 0 && gold >= u.cost);

  return scored.sort((a, b) => b.roi - a.roi);
}

/**
 * Boss 阶段分析
 */
function analyzeBoss(G) {
  if (!G) return null;
  const bossHp = G.bossHp || 0;
  const bossMaxHp = G.bossMaxHp || 1;
  const bossLevel = G.bossLevel || 1;
  const clickDamage = G.clickDamage || 1;
  const gold = G.gold || 0;
  const gps = G.goldPerSecond || 0;

  const hpPercent = bossHp / bossMaxHp;
  const goldPerSecond = gps || 0;

  // 如果 Boss 血量低于 20%，有实力可以打掉
  if (hpPercent < 0.2) {
    const timeToKill = bossHp / Math.max(1, clickDamage);
    if (timeToKill < 30 || goldPerSecond > 0) {
      return {
        action: 'attack',
        reason: `Boss 血量 ${Math.floor(hpPercent * 100)}%，可以击杀！`,
        confidence: 'high',
      };
    }
  }

  // Boss 血量高于 80%，且金币充足时：金币 > Boss 血量 * 10 的 3 倍时建议继续刷
  if (hpPercent > 0.8) {
    const targetGold = bossMaxHp * 3;
    if (gold < targetGold) {
      return {
        action: 'farm',
        reason: `Boss 血量过高，先刷金币到 ${Math.floor(targetGold / 1e6)}M 再打`,
        confidence: 'medium',
        targetGold,
      };
    }
  }

  return null; // Boss 不是当前瓶颈
}

/**
 * 转生时机分析
 */
function analyzeRebirth(G) {
  if (!G) return null;
  const gold = G.gold || 0;
  const rebirthPower = G.rebirthPower || 1;
  const totalRebirths = G.totalRebirths || 0;

  // 简化：金币超过 1T 且 rebirthPower > 1 时建议转生
  if (gold > 1e12 && rebirthPower > 1) {
    return {
      action: 'rebirth',
      reason: `当前转生加成 x${rebirthPower.toFixed(1)}，建议转生获取更高加成`,
      confidence: 'medium',
    };
  }
  return null;
}

/**
 * 主分析函数
 */
export function analyzeGameState(G) {
  if (!G) return null;

  const gold = G.gold || 0;
  const gps = G.goldPerSecond || 0;
  const buildings = G.buildings || {};

  // === 早期：金币极少，提示点击 ===
  if (gps === 0 && gold < 50) {
    return {
      type: 'click_farm',
      reason: '金币极少，优先点击积累购买第一个建筑',
      confidence: 'high',
    };
  }

  // === Boss 分析 ===
  const bossHint = analyzeBoss(G);
  if (bossHint) {
    return { type: 'boss', ...bossHint };
  }

  // === 转生分析 ===
  const rebirthHint = analyzeRebirth(G);
  if (rebirthHint) {
    return { type: 'rebirth', ...rebirthHint };
  }

  // === 建筑分析 ===
  const buildingScores = analyzeBuildings(buildings, gold);
  const topBuilding = buildingScores.find(b => b.affordable) || null;

  // === 升级分析 ===
  const upgradeScores = analyzeUpgrades({}, gold, gps);
  const topUpgrade = upgradeScores[0] || null;

  // === 复合决策 ===
  if (!topBuilding && !topUpgrade) {
    return {
      type: 'wait',
      reason: gold < 10 ? '等待离线收益累积...' : '等待金币达到购买阈值',
      confidence: 'low',
      nextCost: buildingScores[0]?.nextCost || 10,
    };
  }

  // 升级优先阈值：升级的 3600秒增益 > 建筑买一个的 3600秒增益
  const UPGRADE_HOURS = 1; // 1小时回本
  if (topUpgrade) {
    const upgradeHourGain = topUpgrade.gpsGain * 3600 * UPGRADE_HOURS;
    const buildingHourGain = (topBuilding?.marginalGps || 0) * 3600 * UPGRADE_HOURS;
    if (upgradeHourGain > buildingHourGain * 0.8) {
      return {
        type: 'upgrade',
        target: topUpgrade,
        building: topBuilding,
        reason: `升级「${topUpgrade.id}」${UPGRADE_HOURS}小时回本（+${Math.floor(topUpgrade.gpsGain)} GPS），优先于建筑`,
        confidence: 'medium',
      };
    }
  }

  if (topBuilding) {
    const buyCount = Math.floor(gold / topBuilding.nextCost);
    return {
      type: 'building',
      target: topBuilding,
      upgrade: topUpgrade,
      reason: `「${topBuilding.icon} ${topBuilding.name}」复合分数最优（+${topBuilding.marginalGps.toFixed(2)} GPS/个）`,
      confidence: topBuilding.count === 0 ? 'high' : 'medium',
      buyMode: topBuilding.buyMode,
      buyCount: Math.min(buyCount, 100), // 最多 100 个
    };
  }

  return {
    type: 'wait',
    reason: '等待金币累积中...',
    confidence: 'low',
  };
}

/**
 * 获取简要文字建议（兼容旧接口）
 */
export function getAdviceText(G) {
  const advice = analyzeGameState(G);
  if (!advice) return '加载中...';
  const gold = G?.gold || 0;

  switch (advice.type) {
    case 'building':
      return `建议 ${advice.buyMode === 'x10' ? '批量 x10' : '单个'}购买：${advice.target.name}`;
    case 'upgrade':
      return `建议升级：${advice.target.id}（+${Math.floor(advice.target.gpsGain)} GPS）`;
    case 'boss':
      return advice.reason;
    case 'rebirth':
      return advice.reason;
    case 'click_farm':
      return '点击积累金币购买第一个建筑';
    case 'wait':
      return `等待金币达到 ${Math.floor(advice.nextCost / 1e6)}M`;
    default:
      return '继续当前策略';
  }
}
