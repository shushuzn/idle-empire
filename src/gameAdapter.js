/**
 * gameAdapter.js
 * 桥接层：将现有 js/ 模块的状态同步到 Svelte store
 * 策略：100ms 轮询 window.G，最小化改动
 */

import { readable, writable } from 'svelte/store';

// 轮询辅助函数
function poll(fn, interval = 100) {
  return readable(null, (set) => {
    fn(set);
    const id = setInterval(() => fn(set), interval);
    return () => clearInterval(id);
  });
}

// 核心资源 store - 读取现有全局状态 G
export const gameState = poll((set) => {
  set(window.G || {});
});

// 单独暴露常用字段
export const goldStore = writable(0);
export const gpsStore = writable(0);

export function syncStores() {
  if (!window.G) return;
  goldStore.set(window.G.gold || 0);
  gpsStore.set(window.G.goldPerSecond || 0);
}

// 每 100ms 同步一次
let syncInterval;
export function startSync() {
  syncStores();
  syncInterval = setInterval(syncStores, 100);
}
export function stopSync() {
  clearInterval(syncInterval);
}
