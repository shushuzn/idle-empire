// 纯函数数值层：所有经济和战斗公式放这里，方便测试
import { BUILDINGS, UPGRADES, SHOP, OFFLINE_CAP_HOURS } from './data.js';

export const GROWTH = 1.15;
export const PRESTIGE_THRESHOLD = 1e6;
export const OFFLINE_CAP_SECONDS = OFFLINE_CAP_HOURS * 3600;

/* ---------- 潮汐与季风 ---------- */

export const TIDE_BASE_SECONDS = 20 * 60;
export const TIDE_EXTEND_SECONDS = 2 * 60;
export const TIDE_MONSOON_PHASES = 6;
export const TIDE_AFFINITY_BONUS = 0.6;

// 四种潮段按固定顺序轮转；季风在每 6 段后换向，并让偏爱的潮段多出现两次
export const TIDE_PHASES = [
  { id: 'flood', name: '涨潮', icon: 'sunring', effect: 'building', base: 0.3, desc: '建筑产出 +30%' },
  { id: 'ebb', name: '退潮', icon: 'moon', effect: 'click', base: 0.6, desc: '点击收益 +60%' },
  { id: 'storm', name: '风暴', icon: 'bolt', effect: 'boss', base: 0.45, desc: 'Boss 伤害 +45%' },
  { id: 'calm', name: '静海', icon: 'swirl', effect: 'all', base: 0.1, offline: 0.1, desc: '全项 +10%，离线 +10%' },
];
export const TIDE_PHASE_BY_ID = new Map(TIDE_PHASES.map((p) => [p.id, p]));
const TIDE_ORDER = TIDE_PHASES.map((p) => p.id);

export const MONSOONS = [
  { id: 'warm', name: '暖流', favor: 'flood', effect: 'building', base: 0.1 },
  { id: 'cold', name: '寒流', favor: 'ebb', effect: 'click', base: 0.1 },
  { id: 'trade', name: '信风', favor: 'storm', effect: 'boss', base: 0.1 },
  { id: 'hush', name: '无风', favor: 'calm', effect: 'all', base: 0.05 },
];
export const MONSOON_BY_ID = new Map(MONSOONS.map((m) => [m.id, m]));

// 建筑专属升级：潮汐电站沿用旧的 tide，新建筑各有一条
const BUILDING_UPGRADE_TYPES = {
  tidal: 'tide',
  mill: 'mill',
  salt: 'salt',
  stormtower: 'stormtower',
  ranch: 'ranch',
};

export function tideDuration(state) {
  return TIDE_BASE_SECONDS + upgradeBonus(state, 'extend');
}

export function monsoonAt(index) {
  const block = Math.floor(Math.max(0, Number(index) || 0) / TIDE_MONSOON_PHASES);
  return MONSOONS[block % MONSOONS.length];
}

export function tidePhaseAt(index) {
  const pos = Math.max(0, Math.floor(Number(index) || 0)) % TIDE_MONSOON_PHASES;
  if (pos < TIDE_ORDER.length) return TIDE_PHASE_BY_ID.get(TIDE_ORDER[pos]);
  return TIDE_PHASE_BY_ID.get(monsoonAt(index).favor);
}

export function tideBonuses(state) {
  const bonus = { building: 0, click: 0, boss: 0, all: 0, offline: 0 };
  if (!state || !state.tideStarted) return bonus;
  const index = Math.max(0, Math.floor(Number(state.tideIndex) || 0));
  const watch = 1 + upgradeBonus(state, 'watch');
  const contract = 1 + upgradeBonus(state, 'monsoon');
  const phase = tidePhaseAt(index);
  if (phase.effect === 'all') {
    bonus.all += phase.base * watch;
    if (phase.offline) bonus.offline += phase.offline * watch;
  } else {
    bonus[phase.effect] += phase.base * watch;
  }
  const monsoon = monsoonAt(index);
  bonus[monsoon.effect] += monsoon.base * contract;
  return bonus;
}

// 累计经历过的潮段数（含开局第一段），成就与剧情都用这个口径
export function tideTotal(state) {
  let total = 0;
  for (const phase of TIDE_PHASES) {
    total += Math.max(0, Math.floor(Number(state.tideCounts?.[phase.id]) || 0));
  }
  return total;
}

export function tideState(state) {
  const index = Math.max(0, Math.floor(Number(state.tideIndex) || 0));
  const duration = tideDuration(state);
  const elapsed = state && state.tideStarted
    ? Math.min(Math.max(0, Number(state.tideElapsed) || 0), duration)
    : 0;
  return {
    started: Boolean(state && state.tideStarted),
    index,
    duration,
    elapsed,
    remaining: Math.max(0, duration - elapsed),
    progress: duration ? elapsed / duration : 0,
    phase: tidePhaseAt(index),
    monsoon: monsoonAt(index),
    nextPhase: tidePhaseAt(index + 1),
    nextMonsoon: monsoonAt(index + 1),
    blockPos: index % TIDE_MONSOON_PHASES,
    bonuses: tideBonuses(state),
  };
}

// 进入当前潮段：累计经历次数、季风图鉴与交替次数；同一段只记一次
export function markTideEntered(state) {
  if (!state || !state.tideStarted) return false;
  const index = Math.max(0, Math.floor(Number(state.tideIndex) || 0));
  if (state.tideCountedIndex === index) return false;
  state.tideCountedIndex = index;
  const phase = tidePhaseAt(index);
  if (!state.tideCounts || typeof state.tideCounts !== 'object') state.tideCounts = {};
  for (const p of TIDE_PHASES) state.tideCounts[p.id] = Math.max(0, Math.floor(Number(state.tideCounts[p.id]) || 0));
  state.tideCounts[phase.id] += 1;
  const monsoon = monsoonAt(index);
  if (!Array.isArray(state.monsoonSeen)) state.monsoonSeen = [];
  if (!state.monsoonSeen.includes(monsoon.id)) state.monsoonSeen.push(monsoon.id);
  if (index > 0 && index % TIDE_MONSOON_PHASES === 0) {
    state.monsoonChanges = Math.max(0, Math.floor(Number(state.monsoonChanges) || 0)) + 1;
  }
  return true;
}

export function startTide(state) {
  if (!state.tideStarted) {
    state.tideStarted = true;
    state.tideElapsed = 0;
  }
  const index = Number(state.tideIndex);
  state.tideIndex = Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0;
  markTideEntered(state);
  return tideState(state);
}

// 只在线推进：离线不补算潮段与季风
export function advanceTide(state, seconds) {
  if (!state || !state.tideStarted) return 0;
  let left = Number(seconds);
  if (!Number.isFinite(left) || left <= 0) return 0;
  let transitions = 0;
  let elapsed = Math.max(0, Number(state.tideElapsed) || 0);
  state.tideIndex = Math.max(0, Math.floor(Number(state.tideIndex) || 0));
  while (left > 0 && transitions < 10000) {
    const duration = tideDuration(state);
    const remain = duration - elapsed;
    if (left < remain) {
      elapsed += left;
      left = 0;
      break;
    }
    left -= Math.max(0, remain);
    elapsed = 0;
    state.tideIndex += 1;
    transitions += 1;
    markTideEntered(state);
  }
  state.tideElapsed = elapsed;
  return transitions;
}

// 回响：同一种建筑堆到 25/50/100/200 座时逐级强化
export const RESONANCE_TIERS = [25, 50, 100, 200];
export const RESONANCE_BONUS = [0.15, 0.3, 0.5, 0.8];
export const RESONANCE_LABELS = ['I', 'II', 'III', 'IV'];
export const RESONANCE_GLOBAL_STEP = 10; // 每累计 10 层
export const RESONANCE_GLOBAL_BONUS = 0.02;
export const RESONANCE_GLOBAL_CAP = 0.3;

// 记忆档案馆：每 3 篇剧情 +5%，默认封顶 +40%
export const ARCHIVE_STORY_STEP = 3;
export const ARCHIVE_BONUS_STEP = 0.05;
export const ARCHIVE_BASE_CAP = 0.4;

export function costOf(building, owned) {
  return Math.floor(building.baseCost * Math.pow(GROWTH, owned));
}

export function bulkCost(building, owned, count) {
  let total = 0;
  for (let i = 0; i < count; i++) total += costOf(building, owned + i);
  return total;
}

export function maxAffordable(building, owned, gold, limit = 500) {
  const first = costOf(building, owned);
  if (limit < 1 || !(gold >= first)) return { count: 0, cost: 0 };
  // 等比数列求和反解一个估计值，避免高价建筑在「最大」模式下逐座试算
  const estimate = Math.log1p((gold * (GROWTH - 1)) / first) / Math.log(GROWTH);
  let count = Math.min(limit, Math.max(1, Math.floor(estimate)));
  let total = bulkCost(building, owned, count);
  while (count > 1 && total > gold) {
    count--;
    total -= costOf(building, owned + count);
  }
  while (count < limit) {
    const next = total + costOf(building, owned + count);
    if (next > gold) break;
    total = next;
    count++;
  }
  return { count, cost: total };
}

function hasUpgrade(state, id) {
  return state.upgrades.includes(id);
}

export function upgradeBonus(state, type) {
  let total = 0;
  for (const u of UPGRADES) {
    if (u.effect[0] === type && hasUpgrade(state, u.id)) total += u.effect[1];
  }
  return total;
}

function shopLevel(state, id) {
  return (state.shop && state.shop[id]) || 0;
}

export function shardMultiplier(state) {
  return 1 + state.shards * 0.02;
}

/* ---------- 回响 ---------- */

export function resonanceTier(state, buildingId) {
  const count = state.buildings?.[buildingId] || 0;
  let tier = 0;
  for (let i = 0; i < RESONANCE_TIERS.length; i++) {
    if (count >= RESONANCE_TIERS[i]) tier = i + 1;
  }
  return tier;
}

export function nextResonance(state, buildingId) {
  const tier = resonanceTier(state, buildingId);
  if (tier >= RESONANCE_TIERS.length) return null;
  const count = state.buildings?.[buildingId] || 0;
  const at = RESONANCE_TIERS[tier];
  return { tier: tier + 1, at, need: Math.max(0, at - count), label: RESONANCE_LABELS[tier] };
}

export function maxResonanceTier(state) {
  let max = 0;
  for (const id of Object.keys(state.buildings || {})) {
    const tier = resonanceTier(state, id);
    if (tier > max) max = tier;
  }
  return max;
}

export function resonanceCount(state) {
  let n = 0;
  for (const id of Object.keys(state.buildings || {})) {
    if (resonanceTier(state, id) > 0) n++;
  }
  return n;
}

export function resonanceLayers(state) {
  let layers = 0;
  for (const id of Object.keys(state.buildings || {})) layers += resonanceTier(state, id);
  return layers;
}

export function resonanceGlobalBonus(state) {
  const layers = resonanceLayers(state);
  return Math.min(
    RESONANCE_GLOBAL_CAP,
    Math.floor(layers / RESONANCE_GLOBAL_STEP) * RESONANCE_GLOBAL_BONUS,
  );
}

// 共鸣升级与回响核心都只放大单座建筑的回响加成
export function echoBoost(state) {
  return 1 + upgradeBonus(state, 'echo') + shopLevel(state, 'echo') * 0.05;
}

export function buildingResonanceBonus(state, buildingId) {
  const tier = resonanceTier(state, buildingId);
  if (!tier) return 0;
  return RESONANCE_BONUS[tier - 1] * echoBoost(state);
}

/* ---------- 单座建筑专属加成 ---------- */

export function storyBonusCap(state) {
  return ARCHIVE_BASE_CAP + upgradeBonus(state, 'archive') + shopLevel(state, 'archive') * 0.02;
}

export function storyBonus(state) {
  const unlocked = state.story?.unlocked?.length || 0;
  return Math.min(storyBonusCap(state), Math.floor(unlocked / ARCHIVE_STORY_STEP) * ARCHIVE_BONUS_STEP);
}

export function buildingBonus(state, building, { tide = true } = {}) {
  let bonus = buildingResonanceBonus(state, building.id);
  const upgradeType = BUILDING_UPGRADE_TYPES[building.id];
  if (upgradeType) bonus += upgradeBonus(state, upgradeType);
  if (building.id === 'archive') bonus += storyBonus(state);
  // 潮汐建筑在自己的潮段里大幅增产，观潮升级会一起放大
  if (tide && state.tideStarted && building.tideAffinity) {
    if (tidePhaseAt(state.tideIndex || 0).id === building.tideAffinity) {
      bonus += TIDE_AFFINITY_BONUS * (1 + upgradeBonus(state, 'watch'));
    }
  }
  return bonus;
}

export function buildingMultiplier(state, building, opts) {
  return 1 + buildingBonus(state, building, opts);
}

// 所有建筑共用的产出倍率（升级 + 碎片 + 商店 + 全局回响 + 潮段）
export function productionMultiplier(state, { tide = true } = {}) {
  const flow = tide ? tideBonuses(state) : null;
  return (
    (1 + upgradeBonus(state, 'building') + upgradeBonus(state, 'global') + resonanceGlobalBonus(state)) *
    shardMultiplier(state) *
    (1 + shopLevel(state, 'idle') * 0.08) *
    (1 + (flow ? flow.building + flow.all : 0))
  );
}

// 单座建筑每秒产出（含全部倍率），UI 显示「每个 +X/秒」用
export function buildingRate(building, state, opts) {
  return building.baseProduction * productionMultiplier(state, opts) * buildingMultiplier(state, building, opts);
}

export function production(state, opts) {
  const mult = productionMultiplier(state, opts);
  let base = 0;
  for (const b of BUILDINGS) {
    const count = state.buildings[b.id] || 0;
    if (count) base += count * b.baseProduction * buildingMultiplier(state, b, opts);
  }
  return base * mult;
}

export function clickPower(state, { tide = true } = {}) {
  const flow = tide ? tideBonuses(state) : null;
  const boost =
    (1 + upgradeBonus(state, 'click') + upgradeBonus(state, 'global')) *
    (1 + (flow ? flow.click + flow.all : 0));
  const shop = 1 + shopLevel(state, 'click') * 0.12;
  const auto = upgradeBonus(state, 'auto');
  return {
    perClick: boost * shardMultiplier(state) * shop,
    perSecond: boost * shardMultiplier(state) * shop * auto,
  };
}

export function totalPerSecond(state, opts) {
  return production(state, opts) + clickPower(state, opts).perSecond;
}

export function bossDamageParts(state, { tide = true } = {}) {
  const { perClick } = clickPower(state, { tide });
  const flow = tide ? tideBonuses(state) : null;
  const mult =
    (1 + upgradeBonus(state, 'boss') + shopLevel(state, 'boss') * 0.1) *
    (1 + (flow ? flow.boss + flow.all : 0));
  return { click: perClick * 4 * mult, building: production(state, { tide }) * mult };
}

// 护盾期间点击伤害翻倍、建筑伤害减半；二阶段再吃「相位刀锋」
// 盐碱傀儡会切换弱点：对应来源伤害 ×1.5
export function bossDamage(state, { shielded = false, phase2 = false, weakness = null, tide = true } = {}) {
  const { click, building } = bossDamageParts(state, { tide });
  let c = click;
  let b = building;
  if (weakness === 'click') c *= 1.5;
  else if (weakness === 'building') b *= 1.5;
  if (shielded) {
    const breaker = 1 + upgradeBonus(state, 'breaker');
    c *= 2 * breaker;
    b *= 0.5 * breaker;
  }
  if (phase2) {
    const phase = 1 + upgradeBonus(state, 'phase');
    c *= phase;
    b *= phase;
  }
  return c + b;
}

// 二阶段奖励合并结算：第一段 + 第二段的 1.5 倍
export function bossReward(boss) {
  return boss.reward * (boss.phases === 2 ? 2.5 : 1);
}

export function offlineRate(state) {
  const rate =
    0.5 +
    upgradeBonus(state, 'offline') +
    shopLevel(state, 'offline') * 0.06 +
    tideBonuses(state).offline;
  return Math.min(1, rate);
}

export function offlineEarnings(state, seconds) {
  const capped = Math.min(seconds, OFFLINE_CAP_SECONDS);
  // 离线期间不推进潮段，按无潮汐的基准产能结算；静海的离线加成仍生效
  return { seconds: capped, gold: totalPerSecond(state, { tide: false }) * capped * offlineRate(state) };
}

export function shardsFor(totalEarned) {
  if (totalEarned < PRESTIGE_THRESHOLD) return 0;
  return Math.max(1, Math.floor(Math.sqrt(totalEarned / PRESTIGE_THRESHOLD)));
}

export function shopCost(item, level) {
  return item.base * Math.pow(level + 1, 2);
}
