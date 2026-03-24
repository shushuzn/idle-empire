import { derived } from 'svelte/store';
import { goldStore, gpsStore } from '../gameAdapter.js';

// 派生：格式化金币显示
export const formattedGold = derived(goldStore, ($gold) =>
  formatNumber($gold)
);

export const formattedGps = derived(gpsStore, ($gps) =>
  formatNumber($gps)
);

// 数字格式化辅助
function formatNumber(num) {
  if (num >= 1e15) return (num / 1e15).toFixed(2) + 'Q';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return Math.floor(num).toString();
}

// 派生：金币是否足够购买某物品
export function canAfford(cost) {
  return derived(goldStore, ($gold) => $gold >= cost);
}
