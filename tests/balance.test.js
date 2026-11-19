import test from 'node:test';
import assert from 'node:assert/strict';
import {
  costOf, bulkCost, maxAffordable, production, clickPower,
  bossDamage, offlineEarnings, shardsFor, shopCost, upgradeBonus,
  buildingRate, OFFLINE_CAP_SECONDS,
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

test('封闭式最大购买与逐座试算结果一致', () => {
  const loop = (building, owned, gold, limit = 500) => {
    let count = 0;
    let total = 0;
    while (count < limit) {
      const next = costOf(building, owned + count);
      if (total + next > gold) break;
      total += next;
      count++;
    }
    return { count, cost: total };
  };
  const golds = [0, 9, 10, 21, 1e3, 1e6, 1e9, 1e12, 1e18, 1e30];
  for (const building of [BUILDINGS[0], BUILDINGS[3], BUILDINGS.at(-1)]) {
    for (const owned of [0, 1, 10, 50, 120, 300]) {
      for (const gold of golds) {
        for (const limit of [1, 3, 500]) {
          assert.deepEqual(
            maxAffordable(building, owned, gold, limit),
            loop(building, owned, gold, limit),
            `${building.name} owned=${owned} gold=${gold} limit=${limit}`,
          );
        }
      }
    }
  }
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

test('单座产出与总产出口径一致', () => {
  const s = defaultState();
  s.buildings = { mine: 7, lumber: 3 };
  s.upgrades = ['speed2', 'global1'];
  s.shards = 5;
  const sum = BUILDINGS.reduce((acc, b) => acc + (s.buildings[b.id] || 0) * buildingRate(b, s), 0);
  assert.ok(Math.abs(sum - production(s)) < 1e-9);
  assert.ok(buildingRate(BUILDINGS[1], s) > buildingRate(BUILDINGS[0], s));
});

test('每座建筑的回本时间在合理区间内（后期不再出现天文数字）', () => {
  const paybacks = BUILDINGS.map((b) => b.baseCost / b.baseProduction);
  for (const [i, p] of paybacks.entries()) {
    assert.ok(p >= 4 && p <= 2200, `${BUILDINGS[i].name} 回本 ${p.toFixed(0)}s 超出范围`);
    if (i > 0) assert.ok(p >= paybacks[i - 1] * 0.9, `${BUILDINGS[i].name} 回本时间出现倒挂`);
  }
  // 后期建筑不能比首座亏 100 倍以上，否则等于买不到收益
  assert.ok(paybacks.at(-1) / paybacks[0] < 400);
});

test('离线结算上限与导出常量一致', () => {
  assert.equal(OFFLINE_CAP_SECONDS, 8 * 3600);
  const s = defaultState();
  s.buildings = { mine: 10 };
  assert.equal(offlineEarnings(s, OFFLINE_CAP_SECONDS * 3).seconds, OFFLINE_CAP_SECONDS);
});
