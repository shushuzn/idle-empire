// 纯函数数值层：所有经济和战斗公式放这里，方便测试
import { BUILDINGS, UPGRADES, SHOP, OFFLINE_CAP_HOURS } from './data.js';

export const GROWTH = 1.15;
export const PRESTIGE_THRESHOLD = 1e6;
export const OFFLINE_CAP_SECONDS = OFFLINE_CAP_HOURS * 3600;

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

export function buildingBonus(state, building) {
  let bonus = buildingResonanceBonus(state, building.id);
  if (building.id === 'tidal') bonus += upgradeBonus(state, 'tide');
  if (building.id === 'archive') bonus += storyBonus(state);
  return bonus;
}

export function buildingMultiplier(state, building) {
  return 1 + buildingBonus(state, building);
}

// 所有建筑共用的产出倍率（升级 + 碎片 + 商店 + 全局回响）
export function productionMultiplier(state) {
  return (
    (1 + upgradeBonus(state, 'building') + upgradeBonus(state, 'global') + resonanceGlobalBonus(state)) *
    shardMultiplier(state) *
    (1 + shopLevel(state, 'idle') * 0.08)
  );
}

// 单座建筑每秒产出（含全部倍率），UI 显示「每个 +X/秒」用
export function buildingRate(building, state) {
  return building.baseProduction * productionMultiplier(state) * buildingMultiplier(state, building);
}

export function production(state) {
  const mult = productionMultiplier(state);
  let base = 0;
  for (const b of BUILDINGS) {
    const count = state.buildings[b.id] || 0;
    if (count) base += count * b.baseProduction * buildingMultiplier(state, b);
  }
  return base * mult;
}

export function clickPower(state) {
  const boost = 1 + upgradeBonus(state, 'click') + upgradeBonus(state, 'global');
  const shop = 1 + shopLevel(state, 'click') * 0.12;
  const auto = upgradeBonus(state, 'auto');
  return {
    perClick: boost * shardMultiplier(state) * shop,
    perSecond: boost * shardMultiplier(state) * shop * auto,
  };
}

export function totalPerSecond(state) {
  return production(state) + clickPower(state).perSecond;
}

export function bossDamageParts(state) {
  const { perClick } = clickPower(state);
  const mult = 1 + upgradeBonus(state, 'boss') + shopLevel(state, 'boss') * 0.1;
  return { click: perClick * 4 * mult, building: production(state) * mult };
}

// 护盾期间点击伤害翻倍、建筑伤害减半；二阶段再吃「相位刀锋」
export function bossDamage(state, { shielded = false, phase2 = false } = {}) {
  const { click, building } = bossDamageParts(state);
  let c = click;
  let b = building;
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
    shopLevel(state, 'offline') * 0.06;
  return Math.min(1, rate);
}

export function offlineEarnings(state, seconds) {
  const capped = Math.min(seconds, OFFLINE_CAP_SECONDS);
  return { seconds: capped, gold: totalPerSecond(state) * capped * offlineRate(state) };
}

export function shardsFor(totalEarned) {
  if (totalEarned < PRESTIGE_THRESHOLD) return 0;
  return Math.max(1, Math.floor(Math.sqrt(totalEarned / PRESTIGE_THRESHOLD)));
}

export function shopCost(item, level) {
  return item.base * Math.pow(level + 1, 2);
}
