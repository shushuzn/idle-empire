/**
 * gameAdapter.test.js — syncBuildings / syncUpgrades / isBuildingUnlocked 边界测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { syncBuildings, syncUpgrades, syncAchievements, syncBossAndPrestige } from '../src/gameAdapter.js';

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
    totalEarned: 0,
    buildings: {},
    upgrades: [],
    achievements: {},
    rebirths: 0,
    bossHp: 0,
    bossMaxHp: 1,
    currentBoss: null,
    bossesDefeated: 0,
    dynastyLevel: 1,
    dynastyPoints: 0,
    prestigeShards: 0,
    prestigeResets: 0,
    ...overrides,
  };
}

describe('syncBuildings — unlockAt filtering', () => {
  beforeEach(() => {
    window.__gameBridge = BRIDGE;
    window.BUILDINGS_DATA = [];
    window.G = makeG();
  });

  it('sets unlocked=false for buildings with unmet unlockAt', () => {
    // lumber unlockAt: 100, mine has no unlockAt
    window.G.totalEarned = 50;
    window.G.buildings = { mine: 1 };
    syncBuildings();
    const mine = window.BUILDINGS_DATA.find(b => b.id === 'mine');
    const lumber = window.BUILDINGS_DATA.find(b => b.id === 'lumber');
    expect(mine.unlocked).toBe(true);   // no unlockAt
    expect(lumber.unlocked).toBe(false); // unlockAt=100, totalEarned=50
  });

  it('sets unlocked=true when totalEarned meets unlockAt', () => {
    window.G.totalEarned = 100;
    syncBuildings();
    const lumber = window.BUILDINGS_DATA.find(b => b.id === 'lumber');
    expect(lumber.unlocked).toBe(true);
  });

  it('sets unlocked=false for rebirthRequired buildings before first rebirth', () => {
    window.G.totalEarned = 1e20;
    window.G.rebirths = 0;
    syncBuildings();
    const infinity = window.BUILDINGS_DATA.find(b => b.id === 'infinity_engine');
    expect(infinity.unlocked).toBe(false); // rebirthRequired: true
  });

  it('sets unlocked=true for rebirthRequired buildings after first rebirth', () => {
    window.G.totalEarned = 1e20;
    window.G.rebirths = 1;
    syncBuildings();
    const infinity = window.BUILDINGS_DATA.find(b => b.id === 'infinity_engine');
    expect(infinity.unlocked).toBe(true);
  });

  it('marks hidden buildings correctly (void_citadel has hidden:true but unlocked follows unlockAt/rebirth rules)', () => {
    // hidden is a UI display flag, not an unlock flag — unlocked=true when conditions met
    window.G.totalEarned = 1e30;
    window.G.rebirths = 1;
    syncBuildings();
    const voidCitadel = window.BUILDINGS_DATA.find(b => b.id === 'void_citadel');
    expect(voidCitadel.hidden).toBe(true);   // hidden flag preserved from source data
    expect(voidCitadel.unlocked).toBe(true); // unlocked follows unlockAt/rebirth rules, not hidden
  });

  it('computes correct cost after 5 purchases (1.15^5 multiplier)', () => {
    window.G.totalEarned = 100;
    window.G.buildings = { mine: 5 };
    syncBuildings();
    const mine = window.BUILDINGS_DATA.find(b => b.id === 'mine');
    const expectedCost = Math.floor(10 * Math.pow(1.15, 5));
    expect(mine.cost).toBe(expectedCost);
    expect(mine.count).toBe(5);
    expect(mine.gps).toBeCloseTo(1.5 * (1 + 5 * 0.1), 5);
  });
});

describe('syncUpgrades — G.upgrades as array', () => {
  beforeEach(() => {
    window.__gameBridge = BRIDGE;
    window.UPGRADES_DATA = [];
    window.G = makeG();
  });

  it('marks purchased upgrades from G.upgrades array', () => {
    window.G.upgrades = ['click_power_1', 'building_speed_1'];
    syncUpgrades();
    const cp1 = window.UPGRADES_DATA.find(u => u.id === 'click_power_1');
    const bs1 = window.UPGRADES_DATA.find(u => u.id === 'building_speed_1');
    const other = window.UPGRADES_DATA.find(u => u.id === 'click_power_2');
    expect(cp1.purchased).toBe(true);
    expect(bs1.purchased).toBe(true);
    expect(other.purchased).toBe(false);
  });

  it('handles empty G.upgrades array', () => {
    window.G.upgrades = [];
    syncUpgrades();
    const purchased = window.UPGRADES_DATA.filter(u => u.purchased);
    expect(purchased.length).toBe(0);
  });

  it('handles G.upgrades as empty object (edge case from v2_patch)', () => {
    window.G.upgrades = {};
    syncUpgrades();
    const purchased = window.UPGRADES_DATA.filter(u => u.purchased);
    expect(purchased.length).toBe(0);
  });

  it('handles G.upgrades as null/undefined gracefully', () => {
    window.G.upgrades = null;
    syncUpgrades();
    const purchased = window.UPGRADES_DATA.filter(u => u.purchased);
    expect(purchased.length).toBe(0);

    window.G.upgrades = undefined;
    syncUpgrades();
    const purchased2 = window.UPGRADES_DATA.filter(u => u.purchased);
    expect(purchased2.length).toBe(0);
  });
});

describe('syncAchievements', () => {
  beforeEach(() => {
    window.ACHIEVEMENTS_DATA = [];
    window.G = makeG();
  });

  it('marks unlocked achievements from G.achievements', () => {
    window.G.achievements = { builder_1: true, gold_1: true };
    syncAchievements();
    const b1 = window.ACHIEVEMENTS_DATA.find(a => a.id === 'builder_1');
    const g1 = window.ACHIEVEMENTS_DATA.find(a => a.id === 'gold_1');
    const other = window.ACHIEVEMENTS_DATA.find(a => a.id === 'slayer_1');
    expect(b1.unlocked).toBe(true);
    expect(g1.unlocked).toBe(true);
    expect(other.unlocked).toBe(false);
  });

  it('handles empty achievements', () => {
    window.G.achievements = {};
    syncAchievements();
    const unlocked = window.ACHIEVEMENTS_DATA.filter(a => a.unlocked);
    expect(unlocked.length).toBe(0);
  });
});

describe('syncBossAndPrestige', () => {
  beforeEach(() => {
    window.G = makeG();
  });

  it('syncs boss fields to G._ prefixed aliases', () => {
    window.G.bossHp = 50000;
    window.G.bossMaxHp = 100000;
    window.G.currentBoss = 3;
    syncBossAndPrestige();
    expect(window.G._bossHp).toBe(50000);
    expect(window.G._bossMaxHp).toBe(100000);
    expect(window.G._currentBoss).toBe(3);
  });

  it('syncs prestige and dynasty fields', () => {
    window.G.dynastyLevel = 5;
    window.G.dynastyPoints = 120;
    window.G.prestigeShards = 33;
    window.G.prestigeResets = 2;
    window.G.rebirths = 3;
    syncBossAndPrestige();
    expect(window.G._dynastyLevel).toBe(5);
    expect(window.G._dynastyPoints).toBe(120);
    expect(window.G._prestigeShards).toBe(33);
    expect(window.G._rebirths).toBe(3);
  });
});
