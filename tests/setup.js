// tests/setup.js
import { vi } from 'vitest';

// Mock window for Node.js jsdom environment
global.window = {
  BUILDINGS_DATA: [],
  UPGRADES_DATA: [],
  G: {
    gold: 0,
    goldPerSecond: 0,
    buildings: {},
    upgrades: [],
  },
  __gameBridge: {
    getBuildingMultiplier: () => 1.0,
    getUpgradeBonus: () => 0,
    getDynastyMultiplier: () => 1.0,
    getPrestigeMultiplier: () => 1.0,
    getPrestigeShopBonus: () => 1.0,
    getRebirthRequirement: (G) => {
      const REBIRTH_BASE = 1e9;
      const REBIRTH_MULT = 10;
      return REBIRTH_BASE * Math.pow(REBIRTH_MULT, G?.rebirths || 0);
    },
    getPrestigeGain: (G) => {
      const earned = G?.totalEarned || 0;
      if (earned < 1e6) return 0;
      return Math.max(1, Math.floor(Math.sqrt(earned / 1e6)));
    },
  },
};

// Silence console.error during tests
console.error = vi.fn();
