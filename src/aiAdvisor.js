/**
 * aiAdvisor.js
 * 本地 AI 策略顾问 v3 — 基于规则的优化算法
 *
 * 数据源：window.BUILDINGS_DATA, window.UPGRADES_DATA, window.G
 * 由 gameAdapter.js 同步维护，确保单一数据源
 */

/**
 * 计算复合推荐分数 = 总GPS增益/价格 * (1 + log10(绝对增益+1))
 * 早期：比率主导；后期：绝对值也参与权衡
 */
function compositeScore(gpsAfter, cost) {
  if (cost <= 0 || gpsAfter <= 0) return 0;
  const roi = gpsAfter / cost;
  const absBonus = Math.log10(gpsAfter + 1);
  return roi * (1 + 0.3 * absBonus);
}

/**
 * 几何级数：买 n 个的总成本
 * 建筑价格公式：baseCost * 1.15^count
 */
function geometricSum(baseCost, count) {
  if (count <= 0) return 0;
  // 实际使用整数计算
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(baseCost * Math.pow(1.15, i));
  }
  return total;
}

/**
 * 计算建筑边际收益（复用 gameAdapter.js 同步后的 window.BUILDINGS_DATA）
 */
function analyzeBuildings(buildings, gold) {
  const data = (typeof window !== 'undefined' && window.BUILDINGS_DATA) || [];
  if (!data || data.length === 0) return [];

  const owned = (typeof window !== 'undefined' && window.G?.buildings) || buildings || {};

  const scored = data.map(b => {
    const count = owned[b.id] || 0;
    const costMult = Math.pow(1.15, count);
    const nextCost = Math.floor(b.baseCost * costMult);
    // 总产出 = baseProduction * (1 + count * 0.1)
    const gpsAfter = b.baseProduction * (1 + (count + 1) * 0.1);
    const gpsBefore = b.baseProduction * (1 + count * 0.1);
    // 边际产出
    const marginalGps = gpsAfter - gpsBefore;
    const affordable = gold >= nextCost;
    // 复合分数基于总产出而非边际
    const score = affordable ? compositeScore(gpsAfter, nextCost) : 0;

    // 批量购买计算：当前金币能买几个
    const costFor10 = geometricSum(b.baseCost, 10);
    const costFor100 = geometricSum(b.baseCost, 100);
    const canBuy10 = gold >= costFor10;
    const canBuy100 = gold >= costFor100;

    // 计算最大可买数量（不超过100）
    let maxBuy = 0;
    let remaining = gold;
    let testCount = 0;
    while (testCount < 100) {
      const c = Math.floor(b.baseCost * Math.pow(1.15, count + testCount));
      if (c > remaining) break;
      remaining -= c;
      testCount++;
      maxBuy = testCount;
    }

    return {
      ...b,
      count,
      nextCost,
      marginalGps,
      gpsAfter,
      affordable,
      score,
      gpsPerGold: marginalGps / nextCost,
      buyMode: canBuy100 ? 'x100' : canBuy10 ? 'x10' : 'x1',
      maxBuy,
      gpsAccumulation: marginalGps * 3600, // 每小时增益
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * 升级 ROI 分析（基于 window.UPGRADES_DATA）
 */
function analyzeUpgrades(upgrades, gold, currentGps) {
  if (!currentGps || currentGps <= 0) return [];

  const data = (typeof window !== 'undefined' && window.UPGRADES_DATA) || [];
  if (!data || data.length === 0) return [];

  const purchased = (typeof window !== 'undefined' && window.G?.upgrades) || upgrades || {};

  // 从 window.UPGRADES_DATA 动态获取已购买升级的反推乘数（仅影响GPS的升级）
  let globalMultiplier = 1.0;
  data.forEach(u => {
    if (purchased[u.id]) {
      const pctMatch = u.desc.match(/(\+?\d+)%/);
      if (pctMatch) {
        const pct = parseInt(pctMatch[1]) / 100;
        // 只有建筑产出和全局收益升级才计入GPS乘数
        if (u.desc.includes('建筑产出') || u.desc.includes('全局') || u.desc.includes('帝国')) {
          globalMultiplier += pct;
        }
        // click_power 和 boss_damage 不影响GPS，不计入
      }
    }
  });

  const scored = data
    .filter(u => !purchased[u.id])
    .map(u => {
      const pctMatch = u.desc.match(/(\+?\d+)%/);
      if (!pctMatch) return { ...u, gpsGain: 0, roi: 0 };
      const pct = parseInt(pctMatch[1]) / 100;

      let gpsGain;
      if (u.desc.includes('建筑产出')) {
        // 建筑产出升级：加回乘数前
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
  // 使用 gameAdapter 同步后的字段
  const bossHp = G._bossHp || 0;
  const bossMaxHp = G._bossMaxHp || 1;
  const currentBoss = G._currentBoss;
  const clickDamage = G.clickDamage || 1;
  const gold = G.gold || 0;
  const gps = G.goldPerSecond || 0;

  if (!currentBoss) return null; // 没有激活的Boss

  const hpPercent = bossMaxHp > 0 ? bossHp / bossMaxHp : 1;
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

  // Boss 血量高于 80%，且金币不足时建议刷钱
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
  const dynastyLevel = G._dynastyLevel || 1;
  const prestigeShards = G._prestigeShards || 0;
  const rebirths = G._rebirths || 0;

  // 金币超过 1T 且王朝等级 > 1（已进行过转生）时建议转生
  if (gold > 1e12 && dynastyLevel > 1) {
    return {
      action: 'rebirth',
      reason: `王朝等级 ${dynastyLevel}，${prestigeShards} 碎片，建议转生获取更高加成`,
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

  // 升级优先：升级的 1 小时增益 > 建筑买一个的 1 小时增益 * 0.8
  const UPGRADE_HOURS = 1;
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
    return {
      type: 'building',
      target: topBuilding,
      upgrade: topUpgrade,
      reason: `「${topBuilding.icon} ${topBuilding.name}」复合分数最优（+${topBuilding.marginalGps.toFixed(2)} GPS/个）`,
      confidence: topBuilding.count === 0 ? 'high' : 'medium',
      buyMode,
      buyCount: Math.min(buyCount, 100),
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
      return `建议 ${advice.buyMode === 'x100' ? 'x100' : advice.buyMode === 'x10' ? '批量 x10' : '单个'}购买：${advice.target.name}`;
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
