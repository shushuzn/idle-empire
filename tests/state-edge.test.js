// 旧档迁移与边界数据：不崩溃、不白给收益、不把脏字段带进游戏
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, defaultState, load, save, SAVE_KEY } from '../src/game/state.js';
import { BOSSES } from '../src/game/data.js';
import { CHAPTERS } from '../src/game/story.js';
import { OFFLINE_CAP_SECONDS } from '../src/game/balance.js';

function memoryStorage() {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: (k) => (memory.has(k) ? memory.get(k) : null),
    setItem: (k, v) => memory.set(k, String(v)),
    removeItem: (k) => memory.delete(k),
  };
  return memory;
}

const NOW = 1_700_000_000_000;

test('时间戳：0、负数、非法和未来时间回落到当前', () => {
  for (const bad of [0, -1, 'oops', NaN, Infinity, -Infinity, NOW + 3600_000, null]) {
    const s = normalize({ startedAt: bad, lastSeen: bad }, NOW);
    assert.equal(s.startedAt, NOW, `startedAt 应回落到 now：${String(bad)}`);
    assert.equal(s.lastSeen, NOW, `lastSeen 应回落到 now：${String(bad)}`);
  }

  // 合法的过去时间要原样保留，数字字符串也接受
  assert.equal(normalize({ startedAt: NOW - 5000, lastSeen: NOW - 1000 }, NOW).startedAt, NOW - 5000);
  assert.equal(normalize({ lastSeen: String(NOW - 2000) }, NOW).lastSeen, NOW - 2000);
});

test('lastSeen 不可信时不给离线收益', () => {
  for (const bad of [0, -1, 'oops', NOW + 3600_000]) {
    const memory = memoryStorage();
    const s = defaultState(NOW);
    s.buildings = { mine: 10 };
    s.lastSeen = bad;
    memory.set(SAVE_KEY, JSON.stringify(s));

    const { state, offline } = load(NOW);
    assert.equal(offline, null, `lastSeen=${String(bad)} 不应结算离线`);
    assert.equal(state.gold, 0);
    assert.equal(state.lastSeen, NOW);
  }
});

test('离线时长封顶，负数与超长都按上限处理', () => {
  const memory = memoryStorage();
  const s = defaultState(NOW);
  s.buildings = { mine: 10 };
  s.lastSeen = NOW - 30 * 3600_000;
  memory.set(SAVE_KEY, JSON.stringify(s));

  const { state, offline } = load(NOW);
  assert.ok(offline);
  assert.equal(offline.seconds, OFFLINE_CAP_SECONDS);
  assert.ok(state.gold > 0);
});

test('Boss 血量：0、负数、非数字、无穷都当作未开战', () => {
  for (const bad of [0, -10, 'abc', NaN, Infinity, -Infinity, '']) {
    assert.equal(normalize({ bossHp: bad }, NOW).bossHp, null, `bossHp=${String(bad)} 应清空`);
  }
  // 明确的 null / 缺省仍保持 null
  assert.equal(normalize({ bossHp: null }, NOW).bossHp, null);
  assert.equal(normalize({}, NOW).bossHp, null);

  // 正常血量保留，超过当前 Boss 上限的按上限算
  assert.equal(normalize({ bossHp: 50, bossIndex: 0 }, NOW).bossHp, 50);
  assert.equal(normalize({ bossHp: 1e20, bossIndex: 0 }, NOW).bossHp, BOSSES[0].hp);
});

test('Boss 下标越界或不是数字时夹回合法范围', () => {
  assert.equal(normalize({ bossIndex: -3 }, NOW).bossIndex, 0);
  assert.equal(normalize({ bossIndex: 9999 }, NOW).bossIndex, BOSSES.length - 1);
  assert.equal(normalize({ bossIndex: 2.9 }, NOW).bossIndex, 2);
  assert.equal(normalize({ bossIndex: 'oops' }, NOW).bossIndex, 0);
  // 旧档只有 currentBoss 时按 id 定位
  assert.equal(normalize({ currentBoss: 'troll' }, NOW).bossIndex, 1);
  assert.equal(normalize({ currentBoss: 'removed_boss' }, NOW).bossIndex, 0);
});

test('升级、成就、剧情：去重并剔除未知条目', () => {
  const s = normalize(
    {
      upgrades: ['click1', 'click1', 'no_such_upgrade', 42],
      achievements: ['c100', 'c100', 7, null],
      story: {
        unlocked: ['prologue', 'prologue', 'first_strike', 'ghost'],
        read: ['first_strike', 'first_strike', 'ghost'],
      },
    },
    NOW,
  );
  assert.deepEqual(s.upgrades, ['click1']);
  assert.deepEqual(s.achievements, ['c100']);
  assert.deepEqual(s.story.unlocked, ['prologue', 'first_strike']);
  // 已读必须是已解锁的子集
  assert.deepEqual(s.story.read, ['first_strike']);

  const [a, b] = CHAPTERS.map((c) => c.id);
  const locked = normalize({ story: { unlocked: [a], read: [a, b] } }, NOW);
  assert.deepEqual(locked.story.read, [a]);
});

test('有存档才显示「继续」，坏档和第一次进入都不算', () => {
  const memory = memoryStorage();
  assert.equal(load(NOW).hasSave, false);

  // 金币很少也算有存档，不该再显示「开始游戏」
  memory.set(SAVE_KEY, JSON.stringify({ gold: 5, buildings: {} }));
  const resumed = load(NOW);
  assert.equal(resumed.hasSave, true);
  assert.equal(resumed.state.gold, 5);

  memory.set(SAVE_KEY, '{oops');
  const broken = load(NOW);
  assert.equal(broken.hasSave, false);
  assert.equal(broken.corrupt, true);
});

test('存储不可用时存档返回 false，读档不崩', () => {
  globalThis.localStorage = {
    getItem: () => {
      throw new Error('denied');
    },
    setItem: () => {
      throw new Error('quota');
    },
    removeItem: () => {
      throw new Error('denied');
    },
  };

  assert.equal(save(defaultState(NOW), NOW), false);
  const result = load(NOW);
  assert.equal(result.state.gold, 0);
  assert.equal(result.corrupt, false);
  assert.equal(result.hasSave, false);
});

test('空、非对象或数组存档回落到默认档', () => {
  for (const raw of [null, undefined, 0, 'save', [], true]) {
    const s = normalize(raw, NOW);
    assert.equal(s.gold, 0);
    assert.equal(s.bossHp, null);
    assert.equal(s.startedAt, NOW);
    assert.equal(s.lastSeen, NOW);
  }
});
