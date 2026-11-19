// 0.3.0「潮汐与季风」：周期事件、潮汐建筑、特殊 Boss 与存档迁移
import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/engine.js';
import {
  defaultState, normalize, save, SAVE_KEY, VERSION,
} from '../src/game/state.js';
import {
  BUILDINGS, UPGRADES, BOSSES, ACHIEVEMENTS,
} from '../src/game/data.js';
import { CHAPTERS } from '../src/game/story.js';
import * as B from '../src/game/balance.js';

const NOW = 1_700_000_000_000;
const byId = (list, id) => list.find((x) => x.id === id);
const bossIndex = (id) => BOSSES.findIndex((b) => b.id === id);
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

test('潮汐内容数量与各表 id 完整', () => {
  assert.equal(BUILDINGS.length, 26);
  assert.equal(UPGRADES.length, 47);
  assert.equal(BOSSES.length, 21);
  assert.equal(ACHIEVEMENTS.length, 46);
  assert.equal(CHAPTERS.length, 30);

  assert.deepEqual(
    BUILDINGS.filter((b) => b.tideAffinity).map((b) => b.id).sort(),
    ['mill', 'ranch', 'salt', 'stormtower'],
  );
  const tideUpgrades = UPGRADES.filter((u) => ['watch', 'monsoon', 'extend', 'mill', 'salt', 'stormtower', 'ranch'].includes(u.effect[0]));
  assert.equal(tideUpgrades.length, 14);

  const special = BOSSES.filter((b) => b.weaknessSwitch || b.stormShield || b.shieldRegen);
  assert.deepEqual(special.map((b) => b.id), ['golem', 'whale', 'stormeye']);

  const tideAchievements = ACHIEVEMENTS.filter((a) => [
    'tidephase', 'tidetotal', 'monsooncount', 'bosskill', 'calmprestige', 'calmclicks', 'newbuildings',
  ].includes(a.cond[0]));
  assert.equal(tideAchievements.length, 14);

  for (const id of ['tide_timetable', 'salt_letter', 'storm_quiet', 'whale_song', 'doldrums', 'second_timetable']) {
    assert.ok(byId(CHAPTERS, id), `缺少剧情 ${id}`);
  }
});

test('潮段按四段轮转，季风每 6 段换向并重复偏爱的潮段', () => {
  const order = Array.from({ length: 12 }, (_, i) => B.tidePhaseAt(i).id);
  assert.deepEqual(order, [
    'flood', 'ebb', 'storm', 'calm', 'flood', 'flood',
    'flood', 'ebb', 'storm', 'calm', 'ebb', 'ebb',
  ]);
  assert.deepEqual([0, 6, 12, 18].map((i) => B.monsoonAt(i).id), ['warm', 'cold', 'trade', 'hush']);
  // 无风季风让静海在每 6 段里额外重复两次
  assert.deepEqual(
    Array.from({ length: 6 }, (_, i) => B.tidePhaseAt(18 + i).id),
    ['flood', 'ebb', 'storm', 'calm', 'calm', 'calm'],
  );
});

test('潮段时长随延长线升级增加', () => {
  const s = defaultState();
  assert.equal(B.tideDuration(s), 20 * 60);
  s.upgrades = ['extend1'];
  assert.equal(B.tideDuration(s), 22 * 60);
  s.upgrades = ['extend1', 'extend2', 'extend3', 'extend4'];
  assert.equal(B.tideDuration(s), 28 * 60);
});

test('能算出距离下一次指定潮段的秒数，季风重复也计入', () => {
  const s = defaultState();
  assert.equal(B.secondsUntilPhase(s, 'storm'), null);
  B.startTide(s);
  assert.equal(B.secondsUntilPhase(s, 'flood'), 0);
  assert.equal(B.secondsUntilPhase(s, 'ebb'), 1200);
  // 涨潮还剩 1200 秒，过完退潮就是风暴
  assert.equal(B.secondsUntilPhase(s, 'storm'), 1200 + 1200);

  B.advanceTide(s, 1200 * 2 + 300);
  assert.equal(B.tideState(s).phase.id, 'storm');
  assert.equal(B.secondsUntilPhase(s, 'storm'), 0);
  // 风暴后是静海，暖流季风让涨潮在下一段重复一次
  assert.equal(B.secondsUntilPhase(s, 'flood'), 900 + 1200);

  B.advanceTide(s, 900 + 1200 * 2);
  assert.equal(B.tideState(s).phase.id, 'flood');
  // 当前是暖流重复的涨潮，风暴要等到下一个季风块
  assert.equal(B.secondsUntilPhase(s, 'storm'), 1200 + 1200 * 2);
});

test('开始潮汐只记一次当前潮段', () => {
  const s = defaultState();
  assert.equal(s.tideStarted, false);
  const first = B.startTide(s);
  assert.equal(first.started, true);
  assert.equal(first.phase.id, 'flood');
  assert.equal(first.monsoon.id, 'warm');
  assert.deepEqual(s.tideCounts, { flood: 1, ebb: 0, storm: 0, calm: 0 });
  assert.deepEqual(s.monsoonSeen, ['warm']);
  assert.equal(B.tideTotal(s), 1);

  B.startTide(s);
  assert.equal(s.tideCounts.flood, 1);
  assert.equal(B.tideTotal(s), 1);
});

test('推进潮段会累计经历次数、季风交替与剩余时间', () => {
  const s = defaultState();
  B.startTide(s);
  assert.equal(B.advanceTide(s, 3600), 3);
  assert.equal(s.tideIndex, 3);
  assert.equal(B.tideState(s).phase.id, 'calm');
  assert.deepEqual(s.tideCounts, { flood: 1, ebb: 1, storm: 1, calm: 1 });
  assert.equal(B.tideTotal(s), 4);
  assert.equal(s.monsoonChanges, 0);

  assert.equal(B.advanceTide(s, 3600), 3);
  assert.equal(s.tideIndex, 6);
  assert.equal(B.tideState(s).monsoon.id, 'cold');
  assert.equal(s.monsoonChanges, 1);
  assert.deepEqual(s.monsoonSeen, ['warm', 'cold']);
  assert.deepEqual(s.tideCounts, { flood: 4, ebb: 1, storm: 1, calm: 1 });
  assert.equal(B.tideTotal(s), 7);

  B.advanceTide(s, 100);
  assert.equal(s.tideElapsed, 100);
  assert.equal(B.tideState(s).remaining, 1100);
});

test('潮段加成作用于建筑、点击与 Boss，观潮与季风契约放大它们', () => {
  const s = defaultState();
  B.startTide(s);
  s.buildings = { mine: 10 };
  approx(B.production(s), 15 * 1.4); // 涨潮 +30% + 暖流 +10%
  approx(B.clickPower(s).perClick, 1);

  s.upgrades = ['watch1'];
  approx(B.production(s), 15 * (1 + 0.36 + 0.1));
  s.upgrades = ['watch1', 'monsoon1'];
  approx(B.production(s), 15 * (1 + 0.36 + 0.125));

  s.tideIndex = 7; // 退潮 + 寒流点击加成
  approx(B.clickPower(s).perClick, 1 + 0.72 + 0.125);

  s.tideIndex = 3; // 静海：全项 +12%，暖流建筑 +12.5%
  approx(B.clickPower(s).perClick, 1 + 0.12);
  approx(B.production(s), 15 * (1 + 0.12 + 0.125));

  s.tideIndex = 14; // 信风季风里的风暴段
  approx(
    B.bossDamage(s),
    (B.clickPower(s).perClick * 4 + B.production(s)) * (1 + 0.54 + 0.125),
  );
});

test('潮汐建筑只在对应潮段获得亲和加成', () => {
  const s = defaultState();
  const mill = byId(BUILDINGS, 'mill');
  s.buildings = { mill: 1 };
  assert.equal(B.buildingBonus(s, mill), 0); // 未开始潮汐

  B.startTide(s);
  approx(B.buildingBonus(s, mill), 0.6);
  s.tideIndex = 1;
  assert.equal(B.buildingBonus(s, mill), 0);

  s.tideIndex = 0;
  s.upgrades = ['watch1'];
  approx(B.buildingBonus(s, mill), 0.72);
  approx(
    B.buildingRate(mill, s),
    mill.baseProduction * (1 + 0.3 * 1.2 + 0.1) * (1 + 0.72),
  );
});

test('tide:false 时产出与点击回到无潮汐基准', () => {
  const s = defaultState();
  B.startTide(s);
  s.buildings = { mill: 1, mine: 10 };
  const base = B.production(s, { tide: false });
  approx(base, 42_000_000 + 15);
  assert.equal(B.buildingRate(byId(BUILDINGS, 'mill'), s, { tide: false }), 42_000_000);
  assert.equal(B.clickPower(s, { tide: false }).perClick, 1);
});

test('离线不推进潮段，静海只提供离线比例加成', () => {
  const s = defaultState();
  B.startTide(s);
  s.buildings = { mine: 10 };
  assert.equal(Math.round(B.offlineEarnings(s, 3600).gold), 15 * 3600 * 0.5);

  s.tideIndex = 3; // 静海 +10% 离线
  assert.equal(Math.round(B.offlineEarnings(s, 3600).gold), 15 * 3600 * 0.6);
  assert.equal(s.tideIndex, 3); // 离线结算不推进
});

test('潮汐存档字段能迁移、夹取并过滤脏数据', () => {
  const s = normalize({
    version: 5,
    tideStarted: true,
    tideIndex: 6,
    tideElapsed: 1e9,
    tideCounts: { flood: '4', ebb: -2, storm: 3, calm: 'x' },
    monsoonSeen: ['cold', 'cold', 'bogus', 42],
    monsoonChanges: -3,
    bossKills: { golem: 2, bogus: 9 },
    calmClicks: '7',
    calmPrestiges: 1,
    bossHits: '2',
  }, NOW);
  assert.equal(s.version, 6);
  assert.equal(VERSION, 6);
  assert.equal(s.tideStarted, true);
  assert.equal(s.tideIndex, 6);
  assert.equal(s.tideElapsed, B.tideDuration(s)); // 夹到当前潮段上限
  assert.deepEqual(s.tideCounts, { flood: 4, ebb: 0, storm: 3, calm: 0 });
  assert.deepEqual(s.monsoonSeen, ['cold']);
  assert.equal(s.monsoonChanges, 0);
  assert.deepEqual(s.bossKills, { golem: 2 });
  assert.equal(s.calmClicks, 7);
  assert.equal(s.calmPrestiges, 1);
  assert.equal(s.bossHits, 2);

  const old = normalize({ version: 5, gold: 10 }, NOW);
  assert.equal(old.tideStarted, false);
  assert.equal(old.tideIndex, 0);
  assert.deepEqual(old.tideCounts, { flood: 0, ebb: 0, storm: 0, calm: 0 });
  assert.deepEqual(old.bossKills, {});
});

test('保存时写入潮汐字段与存档版本 6', () => {
  const memory = memoryStorage();
  const s = defaultState();
  s.tideStarted = true;
  s.tideIndex = 2;
  s.tideElapsed = 30;
  s.tideCountedIndex = 2;
  assert.equal(save(s, NOW), true);
  const raw = JSON.parse(memory.get(SAVE_KEY));
  assert.equal(raw.version, 6);
  assert.equal(raw.tideStarted, true);
  assert.equal(raw.tideIndex, 2);
  assert.equal(raw.tideElapsed, 30);
  assert.equal(raw.tideCountedIndex, 2);
});

test('进入游戏启动潮汐并解锁首个潮段成就', () => {
  const g = new Game(defaultState());
  assert.equal(g.s.tideStarted, false);
  g.startTide();
  assert.equal(g.s.tideStarted, true);
  assert.equal(g.s.tideCounts.flood, 1);
  const unlocked = g.checkAchievements().map((a) => a.id);
  assert.ok(unlocked.includes('tide_flood'));
});

test('tick 推进潮段并按新潮段结算', () => {
  const g = new Game(defaultState());
  g.startTide();
  g.tick(B.TIDE_BASE_SECONDS);
  assert.equal(g.s.tideIndex, 1);
  assert.equal(B.tideState(g.s).phase.id, 'ebb');
  assert.ok(g.s.tideCounts.ebb >= 1);
  assert.ok(g.s.achievements.includes('tide_ebb'));

  g.tick(B.TIDE_BASE_SECONDS * 2);
  assert.equal(B.tideState(g.s).phase.id, 'calm');
  assert.ok(g.s.achievements.includes('tide_calm'));
});

test('经历 40 个潮段后解锁潮段与季风成就', () => {
  const g = new Game(defaultState());
  g.startTide();
  B.advanceTide(g.s, B.TIDE_BASE_SECONDS * 40);
  g.checkAchievements();
  for (const id of ['tide_10', 'tide_40', 'monsoon_1', 'monsoon_6']) {
    assert.ok(g.s.achievements.includes(id), `应解锁 ${id}`);
  }
  assert.ok(g.s.monsoonChanges >= 6);
  assert.deepEqual(g.s.monsoonSeen.sort(), ['cold', 'hush', 'trade', 'warm']);
});

test('盐碱傀儡每 3 次攻击切换弱点并放大对应伤害', () => {
  const g = new Game(defaultState());
  g.s.lifetimeEarned = 5e17;
  g.s.rebirths = 1;
  g.s.bossIndex = bossIndex('golem');
  g.s.bossHp = 1e6;
  g.s.buildings = { mine: 100 };

  const info = g.bossState();
  assert.equal(info.focus, 'click');
  const clickWeak = B.bossDamage(g.s, { weakness: 'click' });
  const normal = B.bossDamage(g.s);
  assert.ok(clickWeak > normal);
  const first = g.attack();
  approx(first.damage, clickWeak);

  g.attack();
  g.attack();
  assert.equal(g.bossState().focus, 'building');
  const buildingWeak = B.bossDamage(g.s, { weakness: 'building' });
  const third = g.attack();
  approx(third.damage, buildingWeak);
  assert.equal(g.s.bossHits, 4);
});

test('季风巨鲸的护盾只在风暴潮段能被击破', () => {
  const g = new Game(defaultState());
  const whale = byId(BOSSES, 'whale');
  g.s.lifetimeEarned = 3e18;
  g.s.rebirths = 1;
  g.s.bossIndex = bossIndex('whale');
  g.s.bossHp = whale.hp;
  g.s.buildings = { mine: 1e9 };
  g.startTide(); // 涨潮

  const info = g.bossState();
  assert.equal(info.stormLocked, true);
  const shieldLine = whale.hp * (1 - 0.4);
  const hit = g.attack();
  assert.equal(hit.brokeShield, false);
  assert.equal(g.s.shieldsBroken, 0);
  assert.ok(g.s.bossHp > shieldLine);

  // 压到护盾线附近也破不了
  g.s.bossHp = shieldLine + 1e9;
  g.attack();
  assert.ok(g.s.bossHp > shieldLine);
  assert.equal(g.s.shieldsBroken, 0);

  // 风暴潮段才能击穿
  g.s.tideIndex = 2;
  g.s.bossHp = shieldLine + 1e9;
  const stormHit = g.attack();
  assert.equal(g.bossState().stormLocked, false);
  assert.equal(stormHit.brokeShield, true);
  assert.equal(g.s.shieldsBroken, 1);
  assert.ok(g.s.bossHp < shieldLine);
});

test('风暴之眼的护盾会随时间回复', () => {
  const g = new Game(defaultState());
  const eye = byId(BOSSES, 'stormeye');
  g.s.lifetimeEarned = 2e19;
  g.s.rebirths = 1;
  g.s.bossIndex = bossIndex('stormeye');
  g.startTide();
  g.s.bossHp = eye.hp - 1e17;
  const before = g.s.bossHp;
  g.regenerateBossShield(1);
  approx(g.s.bossHp, before + eye.hp * 0.015);
  assert.ok(g.bossState().shielded);
  g.regenerateBossShield(3600);
  assert.equal(g.s.bossHp, eye.hp);
});

test('击败新 Boss 会记录图鉴并解锁对应成就', () => {
  const g = new Game(defaultState());
  g.s.lifetimeEarned = 5e17;
  g.s.rebirths = 1;
  g.s.bossIndex = bossIndex('golem');
  g.s.bossHp = 1;
  g.s.achievements = ACHIEVEMENTS.map((a) => a.id).filter((id) => id !== 'boss_golem');
  const result = g.attack();
  assert.equal(result.killed.id, 'golem');
  assert.equal(g.s.bossKills.golem, 1);
  assert.ok(g.s.achievements.includes('boss_golem'));
  assert.equal(g.s.bossHits, 0);
});

test('静海点击与无风转生会推进反向体验成就', () => {
  const g = new Game(defaultState());
  g.startTide();
  g.s.tideIndex = 3; // 静海
  g.s.calmClicks = 499;
  g.tap();
  g.checkAchievements();
  assert.ok(g.s.achievements.includes('calm_clicks'));

  g.s.totalEarned = 1e6;
  g.s.lifetimeEarned = 1e6;
  assert.ok(g.prestige() >= 1);
  assert.equal(g.s.calmPrestiges, 1);
  g.checkAchievements();
  assert.ok(g.s.achievements.includes('calm_prestige'));
});

test('潮汐剧情按潮段、季风、新建筑与新 Boss 解锁', () => {
  const g = new Game(defaultState());
  g.startTide();
  g.s.buildings = { salt: 10, stormtower: 10 };
  g.s.tideCounts = { flood: 24, ebb: 0, storm: 0, calm: 0 };
  g.s.monsoonSeen = ['warm', 'cold', 'trade', 'hush'];
  g.s.bossKills = { whale: 1 };
  const unlocked = g.checkStory().map((c) => c.id);
  for (const id of ['tide_timetable', 'salt_letter', 'storm_quiet', 'whale_song', 'doldrums', 'second_timetable']) {
    assert.ok(unlocked.includes(id), `应解锁 ${id}`);
  }

  const fresh = new Game(defaultState());
  fresh.startTide();
  const locked = fresh.checkStory().map((c) => c.id);
  for (const id of ['tide_timetable', 'salt_letter', 'whale_song', 'doldrums', 'second_timetable']) {
    assert.ok(!locked.includes(id), `不应解锁 ${id}`);
  }
});

test('潮汐升级有建筑数量与前置链要求', () => {
  const g = new Game(defaultState());
  g.s.gold = 1e15;
  assert.equal(g.buyUpgrade('mill1'), false);
  g.s.buildings = { mill: 5 };
  assert.equal(g.buyUpgrade('mill1'), true);
  assert.equal(B.upgradeBonus(g.s, 'mill'), 0.5);

  assert.equal(g.buyUpgrade('watch2'), false);
  assert.equal(g.buyUpgrade('watch1'), true);
  assert.equal(g.buyUpgrade('watch2'), true);
  assert.equal(B.upgradeBonus(g.s, 'watch'), 0.4);

  assert.equal(g.buyUpgrade('extend2'), false);
  assert.equal(g.buyUpgrade('extend1'), true);
  assert.equal(B.tideDuration(g.s), 22 * 60);
  assert.equal(g.buyUpgrade('extend2'), true);
  assert.equal(B.tideDuration(g.s), 24 * 60);
});
