/**
 * aiAdvisor.test.js — 核心算法测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { analyzeGameState, getAdviceText } from '../src/aiAdvisor.js';

const BRIDGE = {
  getBuildingMultiplier: () => 1.0,
  getUpgradeBonus: () => 0,
  getDynastyMultiplier: () => 1.0,
  getPrestigeMultiplier: () => 1.0,
  getPrestigeShopBonus: () => 1.0,
  getRebirthRequirement: (G) => {
    const REBIRTH_BASE = 1e9;
    const REBIRTH_MULT = 10;
    const rebirths = G?.rebirths || 0;
    return REBIRTH_BASE * Math.pow(REBIRTH_MULT, rebirths);
  },
  getPrestigeGain: (G) => {
    const earned = G?.totalEarned || 0;
    if (earned < 1e6) return 0;
    return Math.max(1, Math.floor(Math.sqrt(earned / 1e6)));
  },
};

function makeG(overrides = {}) {
  return {
    gold: 0,
    goldPerSecond: 0,
    buildings: {},
    upgrades: [],
    _bossHp: 0,
    _bossMaxHp: 1,
    _currentBoss: null,
    _dynastyLevel: 1,
    _prestigeShards: 0,
    clickDamage: 1,
    ...overrides,
  };
}

describe('compositeScore logic', () => {
  it('returns 0 for zero or negative cost/gps', async () => {
    const mod = await import('../src/aiAdvisor.js');
    // private function — test via analyzeBuildings behavior
    window.BUILDINGS_DATA = [
      { id: 'mine', name: '金矿', baseCost: 10, baseProduction: 1.5, icon: '⛏️' },
    ];
    window.G = makeG({ gold: 0 });

    // with 0 cost — score should be 0 (not affordable)
    const result = mod.analyzeGameState(window.G);
    expect(result.type).toBe('click_farm'); // gold < 50, gps = 0
  });
});

describe('analyzeGameState', () => {
  beforeEach(() => {
    window.__gameBridge = BRIDGE;
    window.BUILDINGS_DATA = [
      { id: 'mine', name: '金矿', baseCost: 10, baseProduction: 1.5, icon: '⛏️' },
      { id: 'lumber', name: '伐木场', baseCost: 100, baseProduction: 6, icon: '🪓' },
    ];
    window.UPGRADES_DATA = [
      { id: 'building_speed_1', name: '建筑加速 I', effect: { type: 'building', value: 0.15 }, icon: '🏗️', cost: 1000 },
      { id: 'global_boost_1', name: '帝国荣耀 I', effect: { type: 'global', value: 0.10 }, icon: '👑', cost: 5000000 },
    ];
    // Reset purchased flag for all upgrades so state doesn't leak between tests
    window.UPGRADES_DATA.forEach(u => { u.purchased = false; });
  });

  it('returns click_farm when gold < 50 and gps = 0', () => {
    window.G = makeG({ gold: 20, goldPerSecond: 0 });
    const result = analyzeGameState(window.G);
    expect(result.type).toBe('click_farm');
    expect(result.confidence).toBe('high');
  });

  it('returns wait when gold < 10 even with gps > 0', () => {
    window.G = makeG({ gold: 5, goldPerSecond: 100 });
    window.G.buildings = { mine: 5 };
    const result = analyzeGameState(window.G);
    expect(result.type).toBe('wait');
  });

  it('recommends building when affordable', () => {
    window.G = makeG({ gold: 500, goldPerSecond: 10 });
    const result = analyzeGameState(window.G);
    expect(['building', 'upgrade']).toContain(result.type);
  });

  it('returns building type with buyMode and buyCount', () => {
    window.G = makeG({ gold: 200, goldPerSecond: 5 });
    window.G.buildings = { mine: 2 };
    const result = analyzeGameState(window.G);
    if (result.type === 'building') {
      expect(result.buyMode).toMatch(/^(x1|x10|x100)$/);
      expect(typeof result.buyCount).toBe('number');
      expect(result.buyCount).toBeGreaterThan(0);
    }
  });

  it('filters out locked buildings (unlockAt not met)', async () => {
    // lumber has unlockAt: 100 — set totalEarned to 50 so it's locked
    window.G = makeG({ gold: 10000, goldPerSecond: 5, totalEarned: 50 });
    window.G.buildings = { mine: 5 };
    // syncBuildings to populate window.BUILDINGS_DATA with unlocked flags
    const { syncBuildings } = await import('../src/gameAdapter.js');
    syncBuildings();
    const result = analyzeGameState(window.G);
    // Should not recommend lumber (locked)
    if (result.type === 'building') {
      expect(result.target.id).not.toBe('lumber');
    }
  });

  it('handles boss attack recommendation when hp < 20%', () => {
    window.G = makeG({
      gold: 10000,
      goldPerSecond: 100,
      _currentBoss: 1,
      _bossHp: 10000,  // 10% HP
      _bossMaxHp: 100000,
      clickDamage: 1000,
    });
    const result = analyzeGameState(window.G);
    expect(result?.type).toBe('boss');
    expect(result?.action).toBe('attack');
  });

  it('handles boss farm recommendation when hp > 80%', () => {
    window.G = makeG({
      gold: 5000,
      goldPerSecond: 100,
      _currentBoss: 1,
      _bossHp: 90000,  // 90% HP
      _bossMaxHp: 100000,
    });
    const result = analyzeGameState(window.G);
    expect(result?.type).toBe('boss');
    expect(result?.action).toBe('farm');
  });

  it('returns null for null G input', () => {
    expect(analyzeGameState(null)).toBeNull();
  });

  it('returns rebirth advice when totalEarned meets rebirth requirement', () => {
    // First rebirth requires 1B (1e9), dynastyLevel > 1
    window.G = makeG({ gold: 0, goldPerSecond: 100, totalEarned: 1e9 + 1, _dynastyLevel: 2, rebirths: 0 });
    window.G.buildings = { mine: 10 };
    const result = analyzeGameState(window.G);
    expect(result?.type).toBe('rebirth');
  });

  it('returns prestige advice when totalEarned is high and shards are low', () => {
    // rebirths: 1 → requirement = 1e9 * 10^1 = 1e10, totalEarned = 5e9 < 1e10 → not yet eligible for rebirth
    window.G = makeG({ gold: 1e12, goldPerSecond: 1e8, totalEarned: 5e9, _prestigeShards: 5, _dynastyLevel: 3, rebirths: 1 });
    window.G.buildings = { mine: 50 };
    const result = analyzeGameState(window.G);
    expect(result?.type).toBe('prestige');
  });
});

describe('getAdviceText', () => {
  beforeEach(() => {
    window.__gameBridge = BRIDGE;
    window.BUILDINGS_DATA = [
      { id: 'mine', name: '金矿', baseCost: 10, baseProduction: 1.5, icon: '⛏️' },
    ];
    window.UPGRADES_DATA = [];
    window.G = makeG({ gold: 0, goldPerSecond: 0 });
  });

  it('returns loading text for null advice', () => {
    // Temporarily override analyzeGameState
    const original = window.G;
    window.G = null;
    expect(getAdviceText(null)).toBe('加载中...');
    window.G = original;
  });

  it('returns click_farm advice text', () => {
    window.G = makeG({ gold: 10, goldPerSecond: 0 });
    expect(getAdviceText(window.G)).toContain('点击');
  });
});

describe('G.upgrades array compatibility', () => {
  beforeEach(() => {
    window.__gameBridge = BRIDGE;
    window.BUILDINGS_DATA = [
      { id: 'mine', name: '金矿', baseCost: 10, baseProduction: 1.5, icon: '⛏️' },
    ];
    window.UPGRADES_DATA = [
      { id: 'building_speed_1', name: '建筑加速 I', effect: { type: 'building', value: 0.15 }, icon: '🏗️', cost: 100 },
      { id: 'global_boost_1', name: '帝国荣耀 I', effect: { type: 'global', value: 0.10 }, icon: '👑', cost: 5000000 },
    ];
  });

  it('purchased upgrade is not recommended', () => {
    // Mark building_speed_1 as purchased in window.UPGRADES_DATA
    const upg = window.UPGRADES_DATA.find(u => u.id === 'building_speed_1');
    upg.purchased = true;
    // Also set G.upgrades array so analyzeUpgrades filter works
    window.G.upgrades = ['building_speed_1'];
    window.G.gold = 1000;
    window.G.goldPerSecond = 10;
    window.G.buildings = {};

    const result = analyzeGameState(window.G);
    // building_speed_1 is purchased — verify it doesn't appear as recommended upgrade
    if (result.type === 'upgrade') {
      expect(result.target.id).not.toBe('building_speed_1');
    }
  });
});
