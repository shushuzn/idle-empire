// 0.2.0「深井回响」：新增内容、回响、护盾/二阶段与旧档迁移
import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/engine.js';
import { defaultState, normalize, save, SAVE_KEY } from '../src/game/state.js';
import { BUILDINGS, UPGRADES, BOSSES, ACHIEVEMENTS, SHOP } from '../src/game/data.js';
import { CHAPTERS } from '../src/game/story.js';
import * as B from '../src/game/balance.js';

const NOW = 1_700_000_000_000;
const byId = (list, id) => list.find((x) => x.id === id);
const bossIndex = (id) => BOSSES.findIndex((b) => b.id === id);
const storyIds = (n) => Array.from({ length: n }, (_, i) => `story_${i}`);
const approx = (actual, expected, eps = 1e-9) => {
  assert.ok(Math.abs(actual - expected) < eps, `${actual} 与 ${expected} 不相等`);
};

function memoryStorage() {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: (k) => (memory.has(k) ? memory.get(k) : null),
    setItem: (k, v) => memory.set(k, String(v)),
    removeItem: (k) => memory.delete(k),
  };
  return memory;
}

test('内容数量达标且各表 id 唯一', () => {
  assert.equal(BUILDINGS.length, 26);
  assert.equal(UPGRADES.length, 47);
  assert.equal(BOSSES.length, 21);
  assert.equal(ACHIEVEMENTS.length, 46);
  assert.equal(CHAPTERS.length, 30);
  assert.equal(SHOP.length, 6);

  for (const [name, list] of Object.entries({ BUILDINGS, UPGRADES, BOSSES, ACHIEVEMENTS, SHOP, CHAPTERS })) {
    const ids = list.map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, `${name} 存在重复 id`);
  }

  // 新 Boss 的解锁线保持递增，避免出现「后一个更早解锁」
  const unlocks = BOSSES.map((b) => b.unlockAt);
  for (let i = 1; i < unlocks.length; i++) assert.ok(unlocks[i] > unlocks[i - 1], `${BOSSES[i].id} 解锁条件倒挂`);
});

test('回响按 25/50/100/200 座逐级解锁', () => {
  const s = defaultState();
  const steps = [[24, 0], [25, 1], [49, 1], [50, 2], [99, 2], [100, 3], [199, 3], [200, 4], [260, 4]];
  for (const [count, tier] of steps) {
    s.buildings = { mine: count };
    assert.equal(B.resonanceTier(s, 'mine'), tier, `${count} 座应为 ${tier} 级`);
  }

  s.buildings = { mine: 30 };
  assert.deepEqual(B.nextResonance(s, 'mine'), { tier: 2, at: 50, need: 20, label: 'II' });
  s.buildings = { mine: 200 };
  assert.equal(B.nextResonance(s, 'mine'), null);
});

test('回响加成随等级提升，并被回声升级与商店放大', () => {
  const s = defaultState();
  s.buildings = { mine: 50 }; // 回响 II = +30%
  assert.equal(B.buildingResonanceBonus(s, 'mine'), 0.3);
  assert.equal(B.buildingResonanceBonus(s, 'lumber'), 0);

  s.upgrades = ['echo1'];
  assert.equal(B.buildingResonanceBonus(s, 'mine'), 0.3 * 1.25);
  s.upgrades = ['echo1', 'echo2'];
  assert.equal(B.buildingResonanceBonus(s, 'mine'), 0.3 * 1.75);
  s.shop.echo = 4;
  assert.ok(Math.abs(B.buildingResonanceBonus(s, 'mine') - 0.3 * 1.95) < 1e-12);
});

test('每 10 层回响给 2% 全局产出，封顶 30%', () => {
  const s = defaultState();
  s.buildings = { mine: 25, lumber: 50 }; // 1 + 2 = 3 层
  assert.equal(B.resonanceLayers(s), 3);
  assert.equal(B.resonanceGlobalBonus(s), 0);

  s.buildings = { mine: 25, lumber: 50, farm: 100, castle: 200 }; // 1 + 2 + 3 + 4 = 10 层
  assert.equal(B.resonanceLayers(s), 10);
  assert.equal(B.resonanceGlobalBonus(s), 0.02);

  const many = {};
  for (let i = 0; i < 38; i++) many[`b${i}`] = 200; // 152 层
  assert.equal(B.resonanceLayers({ buildings: many }), 152);
  assert.equal(B.resonanceGlobalBonus({ buildings: many }), B.RESONANCE_GLOBAL_CAP);
});

test('产出公式计入单座回响与全局回响', () => {
  const s = defaultState();
  s.buildings = { mine: 25 }; // 单座 +15%，全局 0
  assert.equal(Math.round(B.production(s) * 100) / 100, Math.round(25 * 1.5 * 1.15 * 100) / 100);

  s.buildings = { mine: 25, lumber: 10, farm: 100 }; // 1 + 0 + 3 = 4 层，仍无全局
  const sum = BUILDINGS.reduce((acc, b) => acc + (s.buildings[b.id] || 0) * B.buildingRate(b, s), 0);
  assert.ok(Math.abs(sum - B.production(s)) < 1e-9);

  // 10 层时全局 +2%，所有建筑一起放大
  s.buildings = { mine: 25, lumber: 50, farm: 100, castle: 200 };
  const base =
    25 * 1.5 * 1.15 + // 金矿：回响 I
    50 * 6 * 1.3 + // 伐木场：回响 II
    100 * 22 * 1.5 + // 农场：回响 III
    200 * 2500 * 1.8; // 城堡：回响 IV
  assert.equal(Math.round(B.production(s)), Math.round(base * 1.02));
});

test('记忆档案馆按剧情数加成，默认 40% 封顶', () => {
  const s = defaultState();
  const archive = byId(BUILDINGS, 'archive');
  s.buildings = { archive: 1 };

  s.story.unlocked = storyIds(9); // 9 篇 → +15%
  approx(B.storyBonus(s), 0.15);
  assert.equal(Math.round(B.buildingRate(archive, s)), Math.round(archive.baseProduction * 1.15));

  s.story.unlocked = storyIds(27); // 45% 被默认上限压到 40%
  assert.equal(B.storyBonus(s), B.ARCHIVE_BASE_CAP);

  s.upgrades = ['archive'];
  approx(B.storyBonusCap(s), 0.6);
  assert.equal(B.storyBonus(s), 0.45);

  s.shop.archive = 5; // 上限再 +10%
  approx(B.storyBonusCap(s), 0.7);
  s.story.unlocked = storyIds(60);
  approx(B.storyBonus(s), 0.7);
});

test('潮汐调度只加成潮汐电站', () => {
  const s = defaultState();
  s.buildings = { tidal: 10 };
  const tidal = byId(BUILDINGS, 'tidal');
  assert.equal(B.buildingRate(tidal, s), tidal.baseProduction);
  s.upgrades = ['tide'];
  assert.equal(B.buildingRate(tidal, s), tidal.baseProduction * 1.4);
  assert.equal(B.buildingRate(byId(BUILDINGS, 'station'), s), byId(BUILDINGS, 'station').baseProduction);
});

test('护盾期点击翻倍、建筑伤害减半，破盾者可放大', () => {
  const s = defaultState();
  s.buildings = { mine: 20 }; // 产能 30/秒（未到回响），点击 1
  const parts = B.bossDamageParts(s);
  assert.equal(parts.click, 4);
  assert.equal(parts.building, 30);
  assert.equal(B.bossDamage(s), 34);
  assert.equal(B.bossDamage(s, { shielded: true }), 8 + 15);

  s.upgrades = ['breaker1'];
  assert.equal(B.bossDamage(s, { shielded: true }), 12 + 22.5);
  assert.equal(B.bossDamage(s), 34); // 非护盾期不吃破盾者
});

test('二阶段伤害吃到相位刀锋，击杀奖励 2.5 倍', () => {
  const s = defaultState();
  s.buildings = { mine: 20 };
  assert.equal(B.bossDamage(s, { phase2: true }), 34);
  s.upgrades = ['phase1'];
  assert.equal(B.bossDamage(s, { phase2: true }), 51);

  assert.equal(B.bossReward(byId(BOSSES, 'devourer')), 1.8e9 * 2.5);
  assert.equal(B.bossReward(byId(BOSSES, 'worm')), 180_000);
});

test('Boss 护盾被击破时只计数一次', () => {
  const g = new Game(defaultState());
  g.s.lifetimeEarned = 500_000;
  g.s.bossIndex = bossIndex('worm');
  g.s.bossHp = 21_002; // 护盾线为 30,000 × 30% = 9,000

  const info = g.bossState();
  assert.equal(info.shielded, true);
  assert.equal(info.shieldPct, 0.3);
  assert.equal(info.shieldHp, 9_000);
  assert.equal(info.shieldLeft, 2);

  const first = g.attack();
  assert.equal(first.brokeShield, true);
  assert.equal(g.s.shieldsBroken, 1);
  assert.equal(g.s.bossHp, 21_002 - 8); // 护盾期点击伤害翻倍

  const second = g.attack();
  assert.equal(second.brokeShield, false);
  assert.equal(g.s.shieldsBroken, 1);
  assert.equal(g.s.bossHp, 20_994 - 4); // 破盾后恢复正常
});

test('二阶段 Boss 先清第一管血，再击杀并按 2.5 倍结算', () => {
  const g = new Game(defaultState());
  const devourer = byId(BOSSES, 'devourer');
  g.s.lifetimeEarned = 3e9;
  g.s.bossIndex = bossIndex('devourer');
  g.s.bossHp = 1;
  g.s.bossPhase = 1;
  g.s.achievements = ACHIEVEMENTS.map((a) => a.id); // 排除成就奖励，只验证 Boss 结算

  const phase = g.attack();
  assert.equal(phase.phase, 2);
  assert.equal(phase.killed, null);
  assert.equal(phase.reward, 0);
  assert.equal(g.s.bossPhase, 2);
  assert.equal(g.s.bossHp, devourer.hp * 0.6);
  assert.equal(g.s.gold, 0);

  const mid = g.bossState();
  assert.equal(mid.phase, 2);
  assert.equal(mid.maxHp, devourer.hp * 0.6);
  assert.equal(mid.shielded, false);

  g.s.bossHp = 1;
  const kill = g.attack();
  assert.equal(kill.killed.id, 'devourer');
  assert.equal(kill.reward, devourer.reward * 2.5);
  assert.equal(g.s.gold, kill.reward);
  assert.equal(g.s.phaseKills, 1);
  assert.equal(g.s.kills, 1);
  assert.equal(g.s.bossPhase, 1);
});

test('旧档 Boss 下标按 id 迁移，新档按新下标读取', () => {
  // 0.1.0 下标 3 是深渊恶魔；插入深井蠕虫后应落到下标 4
  assert.equal(normalize({ version: 4, bossIndex: 3 }, NOW).bossIndex, bossIndex('demon'));
  assert.equal(normalize({ version: 4, bossIndex: 9 }, NOW).bossIndex, bossIndex('eye'));
  assert.equal(normalize({ version: 4, bossIndex: 14 }, NOW).bossIndex, bossIndex('emperor'));
  assert.equal(normalize({ version: 5, bossIndex: 3 }, NOW).bossIndex, bossIndex('worm'));

  // bossId 优先于下标
  assert.equal(normalize({ version: 4, bossIndex: 3, bossId: 'worm' }, NOW).bossIndex, bossIndex('worm'));
  assert.equal(normalize({ bossId: 'bishop' }, NOW).bossIndex, bossIndex('bishop'));
  assert.equal(normalize({ bossId: 'gone', bossIndex: 2 }, NOW).bossIndex, 2);
});

test('读档时第二阶段血量按 60% 上限夹取', () => {
  const phase2 = normalize(
    { version: 5, bossIndex: bossIndex('devourer'), bossPhase: 2, bossHp: 1e12 },
    NOW,
  );
  assert.equal(phase2.bossPhase, 2);
  assert.equal(phase2.bossHp, 240_000_000 * 0.6);

  const phase1 = normalize(
    { version: 5, bossIndex: bossIndex('devourer'), bossHp: 1e12 },
    NOW,
  );
  assert.equal(phase1.bossPhase, 1);
  assert.equal(phase1.bossHp, 240_000_000);

  // 只有两段 Boss 才保留阶段，其他 Boss 一律回第一阶段
  const worm = normalize({ version: 5, bossIndex: bossIndex('worm'), bossPhase: 2, bossHp: 1e9 }, NOW);
  assert.equal(worm.bossPhase, 1);
  assert.equal(worm.bossHp, 30_000);
});

test('新建筑需要指定前置建筑数量，已拥有则不受限', () => {
  const g = new Game(defaultState());
  g.s.lifetimeEarned = 1.3e12; // 越过所有“前一座成本”的老门槛
  const deepmine = byId(BUILDINGS, 'deepmine');
  const tidal = byId(BUILDINGS, 'tidal');
  const antimatter = byId(BUILDINGS, 'antimatter');
  const archive = byId(BUILDINGS, 'archive');

  assert.equal(g.buildingUnlocked(deepmine), false);
  g.s.buildings = { factory: 15 };
  assert.equal(g.buildingUnlocked(deepmine), true);

  g.s.buildings = { temple: 10 };
  assert.equal(g.buildingUnlocked(tidal), true);
  g.s.buildings = { quantum: 8 };
  assert.equal(g.buildingUnlocked(antimatter), true);
  g.s.buildings = { multiverse: 5 };
  assert.equal(g.buildingUnlocked(archive), true);

  // 已拥有时即使前置被转生清空也继续可见
  g.s.lifetimeEarned = 0;
  g.s.buildings = { deepmine: 1 };
  assert.equal(g.buildingUnlocked(deepmine), true);
});

test('回声与专属升级需要回响或建筑数量前置', () => {
  const g = new Game(defaultState());
  g.s.gold = 2e13;

  assert.equal(g.buyUpgrade('echo1'), false);
  g.s.buildings = { mine: 25 };
  assert.equal(g.buyUpgrade('echo1'), true);
  assert.equal(g.buyUpgrade('echo2'), true);

  assert.equal(g.buyUpgrade('tide'), false);
  g.s.buildings = { mine: 25, tidal: 10 };
  assert.equal(g.buyUpgrade('tide'), true);

  assert.equal(g.buyUpgrade('archive'), false);
  g.s.buildings = { mine: 25, tidal: 10, archive: 5 };
  assert.equal(g.buyUpgrade('archive'), true);

  assert.equal(g.buyUpgrade('phase1'), false);
  g.s.upgrades.push('breaker1');
  assert.equal(g.buyUpgrade('phase1'), true);
});

test('回响提示只在首次达到该等级时触发', () => {
  const events = [];
  const g = new Game(defaultState(), { onResonance: (list) => events.push(list) });
  g.s.buildings = { factory: 15 };
  g.s.lifetimeEarned = 1e6;
  g.s.gold = 1e9;

  assert.equal(g.buyBuilding('deepmine', 'x10'), true);
  assert.equal(g.buyBuilding('deepmine', 'x10'), true);
  assert.equal(events.length, 0); // 20 座还没到 25

  g.s.buildings.deepmine = 24;
  assert.equal(g.buyBuilding('deepmine'), true);
  assert.equal(events.length, 1);
  assert.equal(events[0][0].building.id, 'deepmine');
  assert.equal(events[0][0].tier, 1);
  assert.ok(g.s.resonanceSeen.includes('deepmine:1'));

  assert.equal(g.buyBuilding('deepmine'), true);
  assert.equal(events.length, 1); // 同一等级不重复提示
});

test('新增成就按建筑数、剧情数、破盾与阶段进度解锁', () => {
  const g = new Game(defaultState());
  g.s.buildings = { deepmine: 30, mine: 25 };
  g.s.story.unlocked = storyIds(12);
  g.s.shieldsBroken = 10;
  g.s.phaseKills = 1;

  const unlocked = g.checkAchievements().map((a) => a.id);
  for (const id of ['echo1', 'deep30', 'stories12', 'shields10', 'phases1']) {
    assert.ok(unlocked.includes(id), `应解锁 ${id}`);
  }
  assert.equal(g.s.achievements.includes('echo4'), false);
  assert.equal(g.s.achievements.includes('stories24'), false);
});

test('深井剧情按新条件解锁', () => {
  const g = new Game(defaultState());
  g.s.buildings = { deepmine: 10, tidal: 10, antimatter: 8, archive: 5, mine: 200 };
  g.s.bossIndex = bossIndex('worm') + 1;

  const unlocked = g.checkStory().map((c) => c.id);
  for (const id of ['well_light', 'tide_names', 'antimatter_words', 'blank_card', 'second_station', 'echo_truth']) {
    assert.ok(unlocked.includes(id), `应解锁 ${id}`);
  }

  const fresh = new Game(defaultState());
  fresh.s.buildings = { deepmine: 9, tidal: 9, antimatter: 7, archive: 4, mine: 199 };
  const locked = fresh.checkStory().map((c) => c.id);
  for (const id of ['well_light', 'tide_names', 'antimatter_words', 'blank_card', 'echo_truth']) {
    assert.ok(!locked.includes(id), `不应解锁 ${id}`);
  }
});

test('存档同时写入 bossId，旧档也能按 id 找回', () => {
  const memory = memoryStorage();
  const s = defaultState();
  s.bossIndex = bossIndex('bishop');
  assert.equal(save(s, NOW), true);

  const raw = JSON.parse(memory.get(SAVE_KEY));
  assert.equal(raw.bossId, 'bishop');
  assert.equal(raw.version, 6);
  assert.equal(normalize(raw, NOW).bossIndex, bossIndex('bishop'));

  // 模拟 0.1.0 的原始存档：只有 version 和 bossIndex
  memory.set(SAVE_KEY, JSON.stringify({ version: 4, bossIndex: 3, bossHp: 1000, buildings: { mine: 5 } }));
  const loaded = normalize(JSON.parse(memory.get(SAVE_KEY)), NOW);
  assert.equal(loaded.bossIndex, bossIndex('demon'));
  assert.equal(loaded.bossId, 'demon');
});

test('读档只保留合法的回响提示记录与新手引导状态', () => {
  const s = normalize(
    { resonanceSeen: ['mine:1', 'mine:1', 'lumber:2', 'x:1', 'mine:9', 42, 'farm:4'], tutorialSeen: 1 },
    NOW,
  );
  assert.deepEqual(s.resonanceSeen, ['mine:1', 'lumber:2', 'farm:4']);
  assert.equal(s.tutorialSeen, true);
  assert.equal(defaultState().tutorialSeen, false);
});

test('回响核心与档案核心可从商店购买并计入加成', () => {
  const g = new Game(defaultState());
  g.s.shards = 3;
  assert.equal(g.buyShop('echo'), true);
  assert.equal(g.s.shards, 0);

  g.s.buildings = { mine: 25 };
  assert.ok(Math.abs(B.buildingResonanceBonus(g.s, 'mine') - 0.15 * 1.05) < 1e-12);

  g.s.shards = 3;
  assert.equal(g.buyShop('archive'), true);
  g.s.story.unlocked = storyIds(27);
  approx(B.storyBonusCap(g.s), 0.42);
  approx(B.storyBonus(g.s), 0.42);
});
