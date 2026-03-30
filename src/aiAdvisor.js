/**
 * aiAdvisor.js
 * 本地 AI 策略顾问 v4 — 使用真实 game multiplier stack
 *
 * 数据源：window.BUILDINGS_DATA, window.UPGRADES_DATA, window.G
 * 由 gameAdapter.js 同步维护，确保单一数据源
 * multiplier 使用 window.__gameBridge（真实 js/ 函数）
 */

// 复合分数权重：平衡ROI与绝对增益
const SCORE_WEIGHT = 0.3;

/**
 * 复合推荐分数 = roi * (1 + SCORE_WEIGHT * log10(gpsAfter+1))
 * 早期：ROI 主导；后期：绝对值也参与权衡
 */
function compositeScore(gpsAfter, cost) {
  if (cost <= 0 || gpsAfter <= 0) return 0;
  const roi = gpsAfter / cost;
  const absBonus = Math.log10(gpsAfter + 1);
  return roi * (1 + SCORE_WEIGHT * absBonus);
}

/**
 * 计算建筑边际收益，使用真实的 multiplier stack：
 * gpsAfter = baseProduction * buildingMultiplier * dynastyMultiplier * prestigeMultiplier
 * marginalGps = baseProduction * 0.1 * buildingMultiplier * dynastyMultiplier * prestigeMultiplier
 */
function analyzeBuildings(gold, bridge) {
  const data = (typeof window !== 'undefined' && window.BUILDINGS_DATA) || [];
  if (!data || data.length === 0) return [];

  const owned = (typeof window !== 'undefined' && window.G?.buildings) || {};

  const scored = data
    .filter(b => b.unlocked !== false)  // 过滤未解锁建筑（unlockAt/rebirthRequired 条件未满足）
    .map(b => {
    const count = owned[b.id] || 0;
    const costMult = Math.pow(1.15, count);
    const nextCost = Math.floor(b.baseCost * costMult);

    // 真实 multiplier 计算（与 js/game.js 一致）
    const buildingMult = bridge?.getBuildingMultiplier?.(window.G, b.id) ?? 1.0;
    const dynastyMult  = bridge?.getDynastyMultiplier?.(window.G) ?? 1.0;
    const prestigeMult = bridge?.getPrestigeMultiplier?.(window.G) ?? 1.0;
    const totalMult = buildingMult * dynastyMult * prestigeMult;

    // 购买第 (count+1) 个后的总 GPS（用于计算边际 ROI）
    const gpsAfter = b.baseProduction * (1 + (count + 1) * 0.1) * totalMult;
    // 边际 GPS = 买一个新增的产出
    const marginalGps = b.baseProduction * 0.1 * totalMult;
    const affordable = gold >= nextCost;
    const score = affordable ? compositeScore(gpsAfter, nextCost) : 0;

    // 计算最大可买数量（不超过100）
    let maxBuy = 0;
    let remaining = gold;
    let loopMult = Math.pow(1.15, count);
    let testCount = 0;
    while (testCount < 100) {
      loopMult *= 1.15;
      const c = Math.floor(b.baseCost * loopMult);
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
      affordable,
      score,
      maxBuy,
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * 升级 ROI 分析，使用 window.__gameBridge.getUpgradeBonus
 * G.upgrades 是 ID 数组（js/game.js 的真实格式）
 */
function analyzeUpgrades(gold, currentGps, bridge) {
  if (!currentGps || currentGps <= 0) return [];

  const data = (typeof window !== 'undefined' && window.UPGRADES_DATA) || [];
  if (!data || data.length === 0) return [];

  const scored = data
    .filter(u => !u.purchased)  // use synced UPGRADES_DATA flag, not raw G.upgrades array
    .map(u => {
      // 从 UPGRADES[i].effect.type/value 计算 gpsGain（与 js/upgrades.js 一致）
      let gpsGain = 0;
      if (u.effect?.type === 'building') {
        const buildingBonus = bridge?.getUpgradeBonus?.('building') ?? 0;
        // dynastyMult already in currentGps; effect applies to building component only
        gpsGain = currentGps * u.effect.value / (1 + buildingBonus);
      } else if (u.effect?.type === 'global' || u.effect?.type === 'empire') {
        gpsGain = currentGps * u.effect.value;
      }
      // click/boss/artifact/rebirth/season 类型 gpsGain = 0

      const roi = gpsGain / u.cost;
      return { ...u, gpsGain, roi, affordable: gold >= u.cost };
    })
    .filter(u => u.roi > 0 && gold >= u.cost);

  // O(n) 取 max 而非全量排序 O(n log n)
  const best = scored.reduce((max, u) => u.roi > max.roi ? u : max, scored[0]);
  return best ? [best] : [];
}

/**
 * Boss 阶段分析
 */
function analyzeBoss(G) {
  if (!G) return null;
  const bossHp = G._bossHp || 0;
  const bossMaxHp = G._bossMaxHp || 1;
  const currentBoss = G._currentBoss;
  const clickDamage = G.clickDamage || 1;
  const gold = G.gold || 0;

  if (!currentBoss) return null;

  const hpPercent = bossMaxHp > 0 ? bossHp / bossMaxHp : 1;
  if (hpPercent <= 0 || hpPercent >= 1) return null;

  if (hpPercent < 0.2) {
    const timeToKill = bossHp / Math.max(1, clickDamage);
    if (timeToKill < 30) {
      return {
        action: 'attack',
        reason: `Boss 血量 ${Math.floor(hpPercent * 100)}%，可以击杀！`,
        confidence: 'high',
      };
    }
  }

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

  return null;
}

/**
 * 转生时机分析
 * 使用 G.totalEarned（而非 gold）判断是否满足转生门槛
 */
function analyzeRebirth(G, bridge) {
  if (!G) return null;
  const dynastyLevel = G._dynastyLevel || 1;
  const totalEarned = G.totalEarned || 0;
  const requirement = bridge?.getRebirthRequirement?.(G) ?? Infinity;

  if (totalEarned >= requirement && dynastyLevel > 1) {
    return {
      action: 'rebirth',
      reason: `累计 ${(totalEarned / 1e9).toFixed(1)}B 金币已达到转生门槛，建议转生获取灵魂宝石`,
      confidence: 'high',
    };
  }
  return null;
}

/**
 * Prestige 时机分析
 */
function analyzePrestige(G, bridge) {
  if (!G) return null;
  const totalEarned = G.totalEarned || 0;
  const prestigeShards = G._prestigeShards || 0;
  const nextGain = bridge?.getPrestigeGain?.(G) ?? 0;
  const dynastyLevel = G._dynastyLevel || 1;

  // 累计金币高但 prestige gain 很小时，说明需要 prestige
  if (totalEarned > 1e9 && nextGain >= 1) {
    const efficiency = nextGain / Math.max(1, totalEarned);
    if (efficiency < 1e-6 || prestigeShards < 10) {
      return {
        action: 'prestige',
        reason: `累计 ${(totalEarned / 1e9).toFixed(1)}B 金币，prestige 可得 +${nextGain} 碎片（王朝 Lv${dynastyLevel}）`,
        confidence: 'medium',
        nextGain,
      };
    }
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
  const bridge = window.__gameBridge;

  if (gps === 0 && gold < 50) {
    return {
      type: 'click_farm',
      reason: '金币极少，优先点击积累购买第一个建筑',
      confidence: 'high',
    };
  }

  const bossHint = analyzeBoss(G);
  if (bossHint) return { type: 'boss', ...bossHint };

  const rebirthHint = analyzeRebirth(G, bridge);
  if (rebirthHint) return { type: 'rebirth', ...rebirthHint };

  const prestigeHint = analyzePrestige(G, bridge);
  if (prestigeHint) return { type: 'prestige', ...prestigeHint };

  const buildingScores = analyzeBuildings(gold, bridge);
  const topBuilding = buildingScores.find(b => b.affordable) || null;
  const topUpgrade = analyzeUpgrades(gold, gps, bridge)[0] || null;

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
        reason: `升级「${topUpgrade.name}」${UPGRADE_HOURS}小时回本（+${Math.floor(topUpgrade.gpsGain)} GPS），优先于建筑`,
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
      buyMode: topBuilding.maxBuy >= 100 ? 'x100' : topBuilding.maxBuy >= 10 ? 'x10' : 'x1',
      buyCount: Math.min(topBuilding.maxBuy || 1, 100),
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

  switch (advice.type) {
    case 'building':
      return `建议 ${advice.buyMode === 'x100' ? 'x100' : advice.buyMode === 'x10' ? '批量 x10' : '单个'}购买：${advice.target.name}`;
    case 'upgrade':
      return `建议升级：${advice.target.name}（+${Math.floor(advice.target.gpsGain)} GPS）`;
    case 'boss':
      return advice.reason;
    case 'rebirth':
      return advice.reason;
    case 'prestige':
      return advice.reason;
    case 'click_farm':
      return '点击积累金币购买第一个建筑';
    case 'wait':
      return `等待金币达到 ${Math.floor(advice.nextCost / 1e6)}M`;
    default:
      return '继续当前策略';
  }
}
