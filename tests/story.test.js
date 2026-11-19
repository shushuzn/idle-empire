import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/engine.js';
import { normalize, defaultState } from '../src/game/state.js';
import { CHAPTERS } from '../src/game/story.js';
import { costOf } from '../src/game/balance.js';
import { BUILDINGS } from '../src/game/data.js';

const mine = BUILDINGS[0];

test('序章在第一次检查时解锁，且只解锁一次', () => {
  const events = [];
  const g = new Game(defaultState(), { onStory: (list) => events.push(...list) });
  assert.deepEqual(g.s.story.unlocked, []);

  const first = g.checkStory();
  assert.deepEqual(first.map((c) => c.id), ['prologue']);
  assert.deepEqual(events.map((c) => c.id), ['prologue']);

  const again = g.checkStory();
  assert.deepEqual(again, []);
  assert.equal(g.s.story.unlocked.length, 1);
});

test('建造第一座金矿解锁「第一镐」', () => {
  const g = new Game(defaultState());
  g.s.gold = costOf(mine, 0);
  assert.equal(g.buyBuilding('mine'), true);
  const unlocked = g.checkStory().map((c) => c.id);
  assert.ok(unlocked.includes('first_strike'));
});

test('达成里程碑会按进度一次解锁多篇', () => {
  const g = new Game(defaultState());
  g.s.buildings = { mine: 10, lumber: 10, farm: 10, factory: 5, bank: 1, castle: 1, temple: 1, station: 1 };
  g.s.totalEarned = 6e6;
  g.s.rebirths = 2;
  g.s.bossIndex = 17;
  g.checkStory();
  for (const id of ['mine_breath', 'lumber_echo', 'farm_letter', 'factory_log', 'bank_ledger', 'throne', 'temple', 'orbit', 'first_loop', 'emperor']) {
    assert.ok(g.s.story.unlocked.includes(id), `应解锁 ${id}`);
  }
});

test('解锁后的章节不会因转生清空进度而消失', () => {
  const g = new Game(defaultState());
  g.s.buildings = { mine: 10 };
  g.s.totalEarned = 2e6;
  g.s.lifetimeEarned = 2e6;
  g.checkStory();
  assert.ok(g.s.story.unlocked.includes('mine_breath'));
  g.prestige();
  assert.deepEqual(g.s.buildings, {});
  assert.ok(g.s.story.unlocked.includes('mine_breath'));
  assert.ok(g.s.story.unlocked.includes('first_loop'));
});

test('未读与已读：打开剧情页后徽章清零', () => {
  const g = new Game(defaultState());
  g.s.buildings = { mine: 10 };
  g.checkStory();
  const unread = g.unreadStory();
  assert.deepEqual(unread, ['prologue', 'first_strike', 'mine_breath']);

  g.markStoryRead();
  assert.deepEqual(g.unreadStory(), []);
  assert.deepEqual([...g.s.story.read].sort(), [...g.s.story.unlocked].sort());
});

test('存档迁移只保留已知章节，已读必须是已解锁的子集', () => {
  const s = normalize({
    story: {
      unlocked: ['prologue', 'first_strike', 'first_strike', 'bogus', 42],
      read: ['prologue', 'mine_breath', null],
    },
  });
  assert.deepEqual(s.story.unlocked, ['prologue', 'first_strike']);
  assert.deepEqual(s.story.read, ['prologue']);
});

test('旧存档没有 story 字段时补默认值', () => {
  const s = normalize({ gold: 10 });
  assert.deepEqual(s.story, { unlocked: [], read: [] });
  assert.equal(s.version, 5);
});

test('章节 id 唯一且都有文案与解锁条件', () => {
  const ids = new Set();
  for (const c of CHAPTERS) {
    assert.equal(ids.has(c.id), false, `重复 id: ${c.id}`);
    ids.add(c.id);
    assert.ok(c.title && c.text && c.need && c.source, `${c.id} 缺字段`);
    assert.equal(typeof c.check, 'function');
  }
  assert.ok(CHAPTERS.length >= 15);
});
