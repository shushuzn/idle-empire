// 纯函数数值层：所有经济和战斗公式放这里，方便测试
import { BUILDINGS, UPGRADES, SHOP, OFFLINE_CAP_HOURS } from './data.js';

export const GROWTH = 1.15;
export const PRESTIGE_THRESHOLD = 1e6;

export function costOf(building, owned) {
  return Math.floor(building.baseCost * Math.pow(GROWTH, owned));
}

export function bulkCost(building, owned, count) {
  let total = 0;
  for (let i = 0; i < count; i++) total += costOf(building, owned + i);
  return total;
}

export function maxAffordable(building, owned, gold, limit = 500) {
  let count = 0;
  let total = 0;
  while (count < limit) {
    const next = costOf(building, owned + count);
    if (total + next > gold) break;
    total += next;
    count++;
  }
  return { count, cost: total };
}

function ownedUpgrades(state) {
  return new Set(state.upgrades);
}

export function upgradeBonus(state, type) {
  let total = 0;
  const owned = ownedUpgrades(state);
  for (const u of UPGRADES) {
    if (owned.has(u.id) && u.effect[0] === type) total += u.effect[1];
  }
  return total;
}

function shopLevel(state, id) {
  return (state.shop && state.shop[id]) || 0;
}

export function shardMultiplier(state) {
  return 1 + state.shards * 0.02;
}

export function production(state) {
  let base = 0;
  for (const b of BUILDINGS) {
    const count = state.buildings[b.id] || 0;
    if (count) base += count * b.baseProduction;
  }
  const mult =
    (1 + upgradeBonus(state, 'building') + upgradeBonus(state, 'global')) *
    shardMultiplier(state) *
    (1 + shopLevel(state, 'idle') * 0.08);
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

export function bossDamage(state) {
  const { perClick } = clickPower(state);
  const raw = perClick * 4 + production(state);
  return raw * (1 + upgradeBonus(state, 'boss') + shopLevel(state, 'boss') * 0.1);
}

export function offlineRate(state) {
  const rate =
    0.5 +
    upgradeBonus(state, 'offline') +
    shopLevel(state, 'offline') * 0.06;
  return Math.min(1, rate);
}

export function offlineEarnings(state, seconds) {
  const capped = Math.min(seconds, OFFLINE_CAP_HOURS * 3600);
  return { seconds: capped, gold: totalPerSecond(state) * capped * offlineRate(state) };
}

export function shardsFor(totalEarned) {
  if (totalEarned < PRESTIGE_THRESHOLD) return 0;
  return Math.max(1, Math.floor(Math.sqrt(totalEarned / PRESTIGE_THRESHOLD)));
}

export function shopCost(item, level) {
  return item.base * Math.pow(level + 1, 2);
}
