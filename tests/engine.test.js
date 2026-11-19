import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/engine.js';
import { defaultState } from '../src/game/state.js';
import { costOf } from '../src/game/balance.js';
import { BUILDINGS, BOSSES } from '../src/game/data.js';

const mine = BUILDINGS[0];

test('买建筑扣钱并增加数量', () => {
  const g = new Game(defaultState());
  g.s.gold = 100;
  assert.equal(g.buyBuilding('mine'), true);
  assert.equal(g.owned('mine'), 1);
  assert.equal(g.s.gold, 100 - costOf(mine, 0));
});

test('钱不够时买不了', () => {
  const g = new Game(defaultState());
  g.s.gold = 5;
  assert.equal(g.buyBuilding('mine'), false);
  assert.equal(g.owned('mine'), 0);
  assert.equal(g.s.gold, 5);
});

test('x10 一次买十座，钱不够就整单失败', () => {
  const g = new Game(defaultState());
  g.s.gold = 1000;
  assert.equal(g.buyBuilding('mine', 'x10'), true);
  assert.equal(g.owned('mine'), 10);
  const poor = new Game(defaultState());
  poor.s.gold = 50;
  assert.equal(poor.buyBuilding('mine', 'x10'), false);
  assert.equal(poor.owned('mine'), 0);
});

test('升级需要前置，买过不能重复买', () => {
  const g = new Game(defaultState());
  g.s.gold = 1e6;
  assert.equal(g.buyUpgrade('click2'), false); // 缺前置
  assert.equal(g.buyUpgrade('click1'), true);
  assert.equal(g.buyUpgrade('click1'), false);
  assert.equal(g.buyUpgrade('click2'), true);
});

test('转生清空本轮进度、保留碎片与成就', () => {
  const g = new Game(defaultState());
  g.s.gold = 5e5;
  g.s.totalEarned = 4e6;
  g.s.lifetimeEarned = 9e6;
  g.s.buildings = { mine: 40 };
  g.s.upgrades = ['click1'];
  g.s.achievements = ['c100'];

  const gain = g.prestige();
  assert.equal(gain, 2);
  assert.deepEqual(g.s.buildings, {});
  assert.deepEqual(g.s.upgrades, []);
  assert.ok(g.s.shards >= 2); // 转生本身给 2，首转成就再补
  assert.equal(g.s.rebirths, 1);
  assert.equal(g.s.achievements.includes('c100'), true);
  assert.ok(g.s.lifetimeEarned >= 9e6);
  // 转生后 totalEarned 归零，只剩成就奖励带来的少量收益
  assert.ok(g.s.totalEarned < 200000);
});

test('达不到 1M 不能转生', () => {
  const g = new Game(defaultState());
  g.s.totalEarned = 999_999;
  assert.equal(g.prestige(), 0);
});

test('未解锁的 Boss 打不了，击杀后给钱并推进', () => {
  const g = new Game(defaultState());
  g.s.lifetimeEarned = 500;
  const blocked = g.attack();
  assert.equal(blocked, null);

  const goblin = BOSSES[0];
  g.s.lifetimeEarned = 2000;
  g.s.bossHp = 1;
  const hit = g.attack();
  assert.equal(hit.killed.id, goblin.id);
  assert.equal(g.s.kills, 1);
  assert.ok(g.s.gold >= goblin.reward);
});

test('最后一个可打 Boss 击杀后原地满血重来', () => {
  const g = new Game(defaultState());
  g.s.lifetimeEarned = 2000; // 只解锁哥布林
  g.s.bossHp = 1;
  g.attack();
  assert.equal(g.s.bossIndex, 0);
  assert.equal(g.s.bossHp, BOSSES[0].hp);
});

test('成就自动发放奖励且只发一次', () => {
  const events = [];
  const g = new Game(defaultState(), { onAchievement: (list) => events.push(...list) });
  g.s.clicks = 100;
  g.checkAchievements();
  const goldAfter = g.s.gold;
  assert.ok(g.s.achievements.includes('c100'));
  assert.equal(goldAfter, 500);
  g.checkAchievements();
  assert.equal(g.s.gold, goldAfter);
  assert.equal(events.filter((a) => a.id === 'c100').length, 1);
});

test('tick 按产能加钱', () => {
  const g = new Game(defaultState());
  g.s.buildings = { mine: 9 }; // 13.5/秒，刻意停在成就门槛之下
  const before = g.s.gold;
  g.tick(2);
  assert.ok(Math.abs(g.s.gold - before - 27) < 1e-6);
});

test('商店升级扣碎片、受等级上限约束', () => {
  const g = new Game(defaultState());
  g.s.shards = 2;
  assert.equal(g.buyShop('idle'), true);
  assert.equal(g.s.shop.idle, 1);
  assert.equal(g.s.shards, 0);
  g.s.shards = 1e6;
  for (let i = 0; i < 20; i++) g.buyShop('idle');
  assert.equal(g.s.shop.idle, 20);
  assert.equal(g.buyShop('idle'), false); // 满级后不再扣碎片
});
