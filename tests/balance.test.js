import test from 'node:test';
import assert from 'node:assert/strict';
import {
  costOf, bulkCost, maxAffordable, production, clickPower,
  bossDamage, offlineEarnings, shardsFor, shopCost, upgradeBonus,
} from '../src/game/balance.js';
import { BUILDINGS, SHOP } from '../src/game/data.js';
import { defaultState } from '../src/game/state.js';

const mine = BUILDINGS[0];

test('成本按 1.15 递增，批量买价等于逐个相加', () => {
  assert.equal(costOf(mine, 0), 10);
  assert.equal(costOf(mine, 1), 11);
  assert.equal(costOf(mine, 2), 13);
  assert.equal(bulkCost(mine, 0, 3), 10 + 11 + 13);
});

test('最大可买数量不会超支', () => {
  const { count, cost } = maxAffordable(mine, 0, 21);
  assert.equal(count, 2);
  assert.equal(cost, 21);
  assert.equal(maxAffordable(mine, 0, 9).count, 0);
});

test('升级只影响对应类型，全局升级额外叠加', () => {
  const s = defaultState();
  s.upgrades = ['click1', 'speed1', 'global1'];
  assert.equal(Math.round(upgradeBonus(s, 'click') * 100), 20);
  assert.equal(Math.round(upgradeBonus(s, 'building') * 100), 15);
  assert.equal(Math.round(upgradeBonus(s, 'global') * 100), 10);
});

test('建筑产出与点击收益都吃到全局加成', () => {
  const s = defaultState();
  s.buildings = { mine: 10 };
  s.upgrades = ['speed1', 'click1', 'global1'];
  // 10 座 × 1.5/秒 × (1 + 0.15 + 0.1)
  assert.equal(Math.round(production(s) * 100) / 100, 18.75);
  assert.equal(Math.round(clickPower(s).perClick * 1000) / 1000, 1.3);
});

test('碎片与转生倍率', () => {
  const s = defaultState();
  assert.equal(shardsFor(999_999), 0);
  assert.equal(shardsFor(1_000_000), 1);
  assert.equal(shardsFor(4_000_000), 2);
  s.shards = 50;
  assert.equal(Math.round(clickPower(s).perClick * 10) / 10, 2);
});

test('商店价格随等级平方增长', () => {
  const idle = SHOP[0];
  assert.equal(shopCost(idle, 0), 2);
  assert.equal(shopCost(idle, 1), 8);
  assert.equal(shopCost(idle, 3), 32);
});

test('离线收益有 8 小时上限，且按离线比例结算', () => {
  const s = defaultState();
  s.buildings = { mine: 10 }; // 15/秒
  const short = offlineEarnings(s, 3600);
  assert.equal(Math.round(short.gold), 27000); // 15 * 3600 * 0.5
  const long = offlineEarnings(s, 24 * 3600);
  assert.equal(long.seconds, 8 * 3600);
  assert.equal(Math.round(long.gold), 216000);
});

test('Boss 伤害随点击与产能提升', () => {
  const s = defaultState();
  const base = bossDamage(s);
  s.buildings = { mine: 20 };
  assert.ok(bossDamage(s) > base);
});
