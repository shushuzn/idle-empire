/**
 * aiAdvisor.js
 * 本地 AI 策略顾问 — 基于规则的优化算法
 * 分析游戏状态，计算最优建筑/升级推荐
 */

/**
 * 计算购买一个建筑后的边际 GPS 增益
 */
function marginalGpsGain(building, currentCount) {
  const baseCost = building.baseCost;
  const baseProduction = building.baseProduction;
  const costMultiplier = Math.pow(1.15, currentCount);
  const nextCost = Math.floor(baseCost * costMultiplier);
  const gpsAfter = baseProduction * (1 + (currentCount + 1) * 0.1);
  const gpsBefore = baseProduction * (1 + currentCount * 0.1);
  const marginalGps = gpsAfter - gpsBefore;
  return { nextCost, marginalGps, gpsPerGold: marginalGps / nextCost };
}

/**
 * 计算升级的性价比
 */
function upgradeValue(upgrade, currentGps) {
  const { id, cost, desc } = upgrade;
  // 从 desc 解析百分比加成
  const pctMatch = desc.match(/(\+?\d+)%/);
  if (!pctMatch) return 0;
  const pct = parseInt(pctMatch[1]) / 100;

  let affectedGps;
  if (desc.includes('点击')) return 0; // 点击加成暂不优化
  if (desc.includes('建筑')) affectedGps = currentGps * pct;
  else if (desc.includes('Boss') || desc.includes('屠戮')) return 0; // Boss伤害单独计算
  else if (desc.includes('全局') || desc.includes('帝国')) affectedGps = currentGps * pct;
  else affectedGps = currentGps * pct;

  return affectedGps / cost;
}

/**
 * 主分析函数：输入游戏状态，返回推荐
 * @param {object} G — window.G 游戏状态
 * @returns {object} { type, target, reason, confidence }
 */
export function analyzeGameState(G) {
  if (!G) return null;

  const buildings = G.buildings || {};
  const upgrades = G.upgrades || {};
  const gold = G.gold || 0;
  const gps = G.goldPerSecond || 0;

  if (gps === 0 && gold < 100) {
    return {
      type: 'click_farm',
      target: 'mine',
      reason: '金币不足，优先积累点击金币购买第一个建筑',
      confidence: 'high',
    };
  }

  // === 建筑 ROI 分析 ===
  const BUILDINGS_DATA = [
    { id: 'mine',        name: '金矿',         baseCost: 10,      baseProduction: 1.5 },
    { id: 'lumber',      name: '伐木场',        baseCost: 100,     baseProduction: 6 },
    { id: 'farm',        name: '农场',          baseCost: 500,     baseProduction: 22 },
    { id: 'factory',     name: '工厂',          baseCost: 3000,    baseProduction: 100 },
    { id: 'bank',        name: '银行',          baseCost: 50000,   baseProduction: 500 },
    { id: 'castle',      name: '城堡',          baseCost: 500000,  baseProduction: 2500 },
    { id: 'temple',      name: '神殿',          baseCost: 5000000, baseProduction: 15000 },
    { id: 'spaceship',   name: '太空站',        baseCost: 5e7,    baseProduction: 1e5 },
    { id: 'quantum_lab', name: '量子实验室',    baseCost: 8e8,    baseProduction: 1.2e6 },
    { id: 'dyson_ring',  name: '戴森环',        baseCost: 1.2e10, baseProduction: 1.5e7 },
    { id: 'time_machine',name: '时间机器',       baseCost: 2e11,   baseProduction: 2e8 },
    { id: 'multiverse',  name: '多元宇宙门户',  baseCost: 3e12,   baseProduction: 3e9 },
  ];

  // 计算每个建筑的性价比（考虑已拥有数量）
  const buildingScores = BUILDINGS_DATA.map(b => {
    const count = buildings[b.id] || 0;
    const { nextCost, marginalGps, gpsPerGold } = marginalGpsGain(b, count);
    const affordable = gold >= nextCost;
    const roi = gpsPerGold; // 每金币的 GPS 增益
    return { ...b, count, nextCost, marginalGps, gpsPerGold: roi, affordable };
  });

  // 过滤掉买不起的，按 GPS/金币 排序找最优
  const affordableBuildings = buildingScores
    .filter(b => b.affordable)
    .sort((a, b) => b.gpsPerGold - a.gpsPerGold);

  const topBuilding = affordableBuildings[0] || null;

  // === 升级 ROI 分析 ===
  const UPGRADES = [
    { id: 'click_power_1',    cost: 500,      desc: '点击伤害 +20%' },
    { id: 'click_power_2',    cost: 5000,     desc: '点击伤害 +30%' },
    { id: 'building_speed_1', cost: 1000,     desc: '建筑产出 +15%' },
    { id: 'building_speed_2', cost: 10000,   desc: '建筑产出 +25%' },
    { id: 'building_speed_3', cost: 100000,  desc: '建筑产出 +35%' },
    { id: 'building_speed_4', cost: 1000000, desc: '建筑产出 +50%' },
    { id: 'global_boost_1',   cost: 5e6,     desc: '全局收益 +10%' },
    { id: 'global_boost_2',   cost: 5e7,     desc: '全局收益 +20%' },
  ];

  const upgradeScores = UPGRADES
    .filter(u => !upgrades[u.id])
    .map(u => ({ ...u, value: upgradeValue(u, gps) }))
    .filter(u => u.value > 0 && gold >= u.cost)
    .sort((a, b) => b.value - a.value);

  const topUpgrade = upgradeScores[0] || null;

  // === 综合推荐 ===
  const REBUILD_THRESHOLD = 0.5; // 升级性价比超过建筑 ROI 的倍数时优先升级

  if (topUpgrade && topBuilding) {
    const upgradeRatio = topUpgrade.value / (topBuilding?.gpsPerGold || 0.001);
    if (upgradeRatio > REBUILD_THRESHOLD) {
      return {
        type: 'upgrade',
        target: topUpgrade,
        building: topBuilding,
        reason: `升级「${topUpgrade.id}」全局收益更高（${topUpgrade.desc}），建议优先购买`,
        confidence: upgradeRatio > 2 ? 'high' : 'medium',
      };
    }
  }

  if (topBuilding) {
    const pct = Math.min(100, Math.floor((gold / topBuilding.nextCost) * 100));
    return {
      type: 'building',
      target: topBuilding,
      upgrade: topUpgrade,
      reason: `「${topBuilding.name}」性价比最优（每金币获取 ${topBuilding.gpsPerGold.toExponential(2)} GPS）`,
      confidence: topBuilding.count === 0 ? 'high' : 'medium',
      buyMode: pct >= 100 ? 'x10' : 'x1',
    };
  }

  // 都买不起
  return {
    type: 'wait',
    target: null,
    reason: gold < 10 ? '金币不足，等待离线收益累积' : '等待金币累积，下一个建筑需要更多金币',
    confidence: 'low',
    waitGold: affordableBuildings[0]?.nextCost || 10,
  };
}

/**
 * 生成简要文字建议
 */
export function getAdviceText(G) {
  const advice = analyzeGameState(G);
  if (!advice) return '加载中...';
  const gold = G?.gold || 0;

  switch (advice.type) {
    case 'building':
      return `建议购买：${advice.target.name}（剩余金币可买 ${Math.floor(gold / advice.target.nextCost)} 个）`;
    case 'upgrade':
      return `建议升级：${advice.target.id} — ${advice.target.desc}`;
    case 'click_farm':
      return '点击积累金币购买第一个建筑';
    case 'wait':
      return `等待金币达到 ${(advice.waitGold / 1e6).toFixed(1)}M`;
    default:
      return '继续当前策略';
  }
}
