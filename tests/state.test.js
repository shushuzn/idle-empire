import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, defaultState, load, save, exportSave, exportSaveText, importSave, SAVE_KEY } from '../src/game/state.js';

test('旧版存档能迁到新结构', () => {
  const now = Date.now();
  const legacy = {
    gold: 5000,
    totalEarned: 8000,
    buildings: { mine: 5, lumber: 2, removed_building: 9 },
    upgrades: ['click1', 'gone'],
    achievements: ['c100', 42],
    prestigeShards: 7,
    prestigeResets: 2,
    prestigeShop: { idleCore: 3, clickCore: 1 },
    totalClicks: 42,
    currentBoss: 'troll',
    bossHp: 500,
    lastSave: now - 3600_000,
    buyMode: 'x10',
  };
  const s = normalize(legacy, now);
  assert.equal(s.version, 4);
  assert.equal(s.gold, 5000);
  assert.deepEqual(s.buildings, { mine: 5, lumber: 2 });
  assert.deepEqual(s.upgrades, ['click1']);
  assert.deepEqual(s.achievements, ['c100']);
  assert.equal(s.shards, 7);
  assert.equal(s.rebirths, 2);
  assert.equal(s.shop.idle, 3);
  assert.equal(s.shop.click, 1);
  assert.equal(s.clicks, 42);
  assert.equal(s.bossIndex, 1);
  assert.equal(s.bossHp, 500);
  assert.equal(s.buyMode, 'x10');
  assert.equal(s.lastSeen, legacy.lastSave);
});

test('脏数据被夹到合法范围', () => {
  const s = normalize({ gold: -5, shards: -2, buildings: { mine: -3, lumber: 2.7 }, shop: { click: 999 }, buyMode: 'hack' });
  assert.equal(s.gold, 0);
  assert.equal(s.shards, 0);
  assert.equal(s.buildings.mine, undefined);
  assert.equal(s.buildings.lumber, 2);
  assert.equal(s.shop.click, 15); // 不超过 max
  assert.equal(s.buyMode, 'x1');
});

test('空存档给默认值', () => {
  const s = normalize(null);
  const d = defaultState();
  assert.equal(s.gold, d.gold);
  assert.equal(s.buildings.mine, undefined);
});

test('存档读写与导出导入往返一致', () => {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: (k) => (memory.has(k) ? memory.get(k) : null),
    setItem: (k, v) => memory.set(k, String(v)),
    removeItem: (k) => memory.delete(k),
  };
  const s = defaultState();
  s.gold = 12345;
  s.buildings = { mine: 3 };
  s.shards = 4;

  assert.equal(save(s), true);
  assert.ok(memory.get(SAVE_KEY).includes('12345'));

  const loaded = load(Date.now());
  assert.equal(loaded.state.gold, 12345);
  assert.deepEqual(loaded.state.buildings, { mine: 3 });

  const text = exportSave(s);
  const round = importSave(text);
  assert.equal(round.gold, 12345);
  assert.equal(round.shards, 4);
});

test('JSON 存档文件与旧版 base64 存档码都能导入', () => {
  const s = defaultState();
  s.gold = 9876;
  s.story = { unlocked: ['prologue'], read: ['prologue'] };

  const json = exportSaveText(s);
  assert.ok(json.trimStart().startsWith('{'));
  assert.equal(JSON.parse(json).gold, 9876);

  const fromJson = importSave(`\n  ${json}\n`);
  assert.equal(fromJson.gold, 9876);
  assert.deepEqual(fromJson.story.unlocked, ['prologue']);
  // 有些编辑器保存的 JSON 带 BOM
  assert.equal(importSave(`\uFEFF${json}`).gold, 9876);

  // 上一版导出的 base64 存档码仍要能读
  const fromBase64 = importSave(exportSave(s));
  assert.equal(fromBase64.gold, 9876);
  assert.equal(fromBase64.version, 4);

  assert.throws(() => importSave('not a save'));
});

test('离线收益：超过 60 秒才结算，且有上限', () => {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: (k) => (memory.has(k) ? memory.get(k) : null),
    setItem: (k, v) => memory.set(k, String(v)),
    removeItem: (k) => memory.delete(k),
  };
  const s = defaultState();
  s.buildings = { mine: 10 };
  s.lastSeen = Date.now() - 2 * 3600_000;
  memory.set(SAVE_KEY, JSON.stringify(s));

  const { state, offline } = load(Date.now());
  assert.ok(offline);
  assert.ok(offline.seconds <= 8 * 3600);
  assert.ok(state.gold > 0);
});
