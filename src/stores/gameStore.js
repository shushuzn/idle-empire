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

// 数字动画辅助 - 创建一个平滑过渡的响应式数值
export function createAnimatedNumber(store, duration = 300) {
  let current = 0;
  let animValue = $state(0);

  store.subscribe(v => {
    animateTo(v);
  });

  function animateTo(target) {
    const start = current;
    const diff = target - start;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out 缓动
      const eased = 1 - Math.pow(1 - progress, 3);
      current = start + diff * eased;
      animValue = current;
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  return {
    get value() { return animValue; }
  };
}
