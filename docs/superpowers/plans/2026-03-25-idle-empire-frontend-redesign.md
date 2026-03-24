# Idle Empire 前端重设计实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Idle Empire 的前端从 Vanilla JS + 巨型 index.html 重构为 Svelte 5 + Vite 模块化架构，保留所有现有游戏逻辑。

**Architecture:** 用 Vite 作为构建工具，Svelte 5 编写组件，通过适配层包装现有 `js/` 模块的状态为 Svelte store，保持 100ms 轮询同步。CSS Variables 继承并扩展现有设计 token，新色彩系统替换旧的金色渐变。

**Tech Stack:** Svelte 5, Vite 5, CSS Variables

---

## 文件结构

```
idle-empire/
├── package.json                    # npm 依赖 + scripts
├── vite.config.js                  # Vite 配置
├── index.html                      # 入口 HTML（精简版）
├── src/
│   ├── main.js                     # Svelte 挂载
│   ├── App.svelte                  # 根组件（Layout）
│   ├── gameAdapter.js              # 桥接层：js/ → Svelte store
│   ├── stores/
│   │   └── gameStore.js            # 响应式状态包装
│   ├── components/
│   │   ├── ResourceBar.svelte
│   │   ├── Navigation.svelte
│   │   ├── BuildingTab.svelte
│   │   ├── UpgradeTab.svelte
│   │   ├── BossTab.svelte
│   │   ├── BossPanel.svelte
│   │   ├── ArtifactTab.svelte
│   │   ├── RebirthTab.svelte
│   │   ├── AchievementTab.svelte
│   │   ├── StatsTab.svelte
│   │   ├── Toast.svelte
│   │   └── Settings.svelte
│   ├── shared/
│   │   ├── Card.svelte
│   │   ├── Badge.svelte
│   │   ├── ProgressBar.svelte
│   │   └── Modal.svelte
│   └── styles/
│       ├── global.css
│       ├── theme-dark.css
│       └── theme-light.css
└── docs/
    └── superpowers/
        ├── specs/2026-03-25-idle-empire-frontend-redesign.md
        └── plans/2026-03-25-idle-empire-frontend-redesign.md
```

---

## Task 1: 项目脚手架搭建

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "idle-empire",
  "private": true,
  "version": "2.2.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "svelte": "^5.0.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.js**

```js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
```

- [ ] **Step 3: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏰 Idle Empire v2.2 - 挂机帝国</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏰</text></svg>">
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: 创建 src/main.js**

```js
import './styles/global.css';
import App from './App.svelte';
import { mount } from 'svelte';

const app = mount(App, {
  target: document.getElementById('app'),
});

export default app;
```

- [ ] **Step 5: 安装依赖**

Run: `cd D:\OpenClaw\workspace\80-PROJECTS\idle-empire && npm install`
Expected: node_modules 创建成功

---

## Task 2: 全局样式 + CSS Variables

**Files:**
- Create: `src/styles/global.css`
- Create: `src/styles/theme-dark.css`
- Create: `src/styles/theme-light.css`

- [ ] **Step 1: 创建 src/styles/global.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');

*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: 'Inter', 'Microsoft YaHei', system-ui, sans-serif;
  background: var(--bg-void);
  color: var(--text-base);
  min-height: 100vh;
  line-height: 1.6;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

#app {
  min-height: 100vh;
}

/* 数字字体 */
.font-display {
  font-family: 'Cinzel', serif;
}

.font-mono {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
}

/* 动画 */
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: 创建 src/styles/theme-dark.css**

```css
[data-theme="dark"] {
  /* 背景 */
  --bg-void: #08080A;
  --bg-base: #0E0E12;
  --bg-surface: #16161C;
  --bg-elevated: #1E1E26;
  --bg-overlay: #262630;

  /* 金色 */
  --gold-dim: #8B7355;
  --gold-muted: #C9A227;
  --gold-bright: #E8C547;
  --gold-glow: #FFD966;

  /* 语义色 */
  --crimson: #C94040;
  --crimson-bg: rgba(201, 64, 64, 0.12);
  --emerald: #3DAA6A;
  --emerald-bg: rgba(61, 170, 106, 0.12);
  --sapphire: #4A8FCC;
  --sapphire-bg: rgba(74, 143, 204, 0.12);
  --amethyst: #8B6FCC;
  --amethyst-bg: rgba(139, 111, 204, 0.12);

  /* 文字 */
  --text-bright: #F5F5F7;
  --text-base: #C8C8D0;
  --text-muted: #7A7A88;
  --text-faint: #4A4A55;

  /* 边框 */
  --border-subtle: rgba(255, 255, 255, 0.05);
  --border-default: rgba(255, 255, 255, 0.1);
  --border-strong: rgba(255, 255, 255, 0.18);

  /* 阴影 */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);
  --shadow-gold: 0 0 24px rgba(232, 197, 71, 0.25);
}
```

- [ ] **Step 3: 创建 src/styles/theme-light.css**

```css
[data-theme="light"] {
  --bg-void: #F0F0F2;
  --bg-base: #F5F5F7;
  --bg-surface: #FFFFFF;
  --bg-elevated: #ECECEF;
  --bg-overlay: #E4E4E8;

  --gold-dim: #A08040;
  --gold-muted: #C9A227;
  --gold-bright: #B8860B;
  --gold-glow: #8B6914;

  --crimson: #B83030;
  --crimson-bg: rgba(184, 48, 48, 0.1);
  --emerald: #2D8A50;
  --emerald-bg: rgba(45, 138, 80, 0.1);
  --sapphire: #3870A8;
  --sapphire-bg: rgba(56, 112, 168, 0.1);
  --amethyst: #6B50CC;
  --amethyst-bg: rgba(107, 80, 204, 0.1);

  --text-bright: #18181B;
  --text-base: #3D3D45;
  --text-muted: #6E6E78;
  --text-faint: #AEAEB2;

  --border-subtle: rgba(0, 0, 0, 0.06);
  --border-default: rgba(0, 0, 0, 0.1);
  --border-strong: rgba(0, 0, 0, 0.18);

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.15);
  --shadow-gold: 0 0 24px rgba(184, 134, 11, 0.2);
}
```

- [ ] **Step 4: 提交**

```bash
git add package.json vite.config.js index.html src/main.js src/styles/
git commit -m "feat(scaffold): Svelte 5 + Vite 项目脚手架 + CSS Variables 主题系统"
```

---

## Task 3: 游戏适配层

**Files:**
- Create: `src/gameAdapter.js`
- Create: `src/stores/gameStore.js`

- [ ] **Step 1: 创建 src/gameAdapter.js（桥接现有 JS 模块）**

```js
/**
 * gameAdapter.js
 * 桥接层：将现有 js/ 模块的状态同步到 Svelte store
 * 策略：100ms 轮询 window.gameState，最小化改动
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

// 核心资源 store
export const gameState = poll((set) => {
  set(window.G || {});  // 现有代码全局状态为 G
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
```

- [ ] **Step 2: 创建 src/stores/gameStore.js**

```js
import { derived } from 'svelte/store';
import { goldStore, gpsStore, gameState } from '../gameAdapter.js';

// 派生：金币是否足够购买某物品
export function canAfford(cost) {
  return derived(goldStore, ($gold) => $gold >= cost);
}

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
```

- [ ] **Step 3: 提交**

```bash
git add src/gameAdapter.js src/stores/gameStore.js
git commit -m "feat(adapter): 桥接层同步现有 JS gameState 到 Svelte store"
```

---

## Task 4: 基础共享组件

**Files:**
- Create: `src/shared/Card.svelte`
- Create: `src/shared/Badge.svelte`
- Create: `src/shared/ProgressBar.svelte`
- Create: `src/shared/Modal.svelte`

- [ ] **Step 1: 创建 src/shared/Card.svelte**

```svelte
<script>
  let {
    clickable = false,
    affordable = false,
    locked = false,
    onclick,
    children
  } = $props();
</script>

<div
  class="card"
  class:clickable
  class:affordable
  class:locked
  role={clickable ? 'button' : undefined}
  tabindex={clickable ? 0 : undefined}
  {onclick}
>
  {@render children()}
</div>

<style>
  .card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 18px;
    transition: all 0.2s ease;
  }

  .card.clickable {
    cursor: pointer;
  }

  .card.clickable:hover {
    background: var(--bg-elevated);
    border-color: var(--border-default);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .card.affordable {
    border-color: rgba(232, 197, 71, 0.3);
  }

  .card.affordable:hover {
    border-color: var(--gold-bright);
    box-shadow: var(--shadow-gold);
  }

  .card.locked {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .card.locked:hover {
    transform: none;
    box-shadow: none;
  }
</style>
```

- [ ] **Step 2: 创建 src/shared/Badge.svelte**

```svelte
<script>
  let { count = 0, variant = 'default' } = $props();
</script>

{#if count > 0}
  <span class="badge" class:variant>{count > 99 ? '99+' : count}</span>
{/if}

<style>
  .badge {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    background: var(--bg-overlay);
    border-radius: 999px;
    color: var(--text-muted);
    min-width: 20px;
    text-align: center;
  }

  .variant {
    background: linear-gradient(135deg, var(--gold-bright), var(--gold-muted));
    color: #18181B;
  }
</style>
```

- [ ] **Step 3: 创建 src/shared/ProgressBar.svelte**

```svelte
<script>
  let { value = 0, max = 100, color = 'gold', showLabel = false } = $props();
  let pct = $derived(Math.min(100, (value / max) * 100));
</script>

<div class="progress-track">
  <div class="progress-fill {color}" style="width: {pct}%"></div>
</div>
{#if showLabel}
  <span class="progress-label">{Math.floor(value)} / {Math.floor(max)}</span>
{/if}

<style>
  .progress-track {
    height: 10px;
    background: var(--bg-overlay);
    border-radius: 5px;
    overflow: hidden;
    border: 1px solid var(--border-subtle);
  }

  .progress-fill {
    height: 100%;
    border-radius: 5px;
    transition: width 0.3s ease;
  }

  .progress-fill.gold {
    background: linear-gradient(90deg, var(--gold-muted), var(--gold-bright));
  }

  .progress-fill.crimson {
    background: linear-gradient(90deg, var(--crimson), #E05555);
  }

  .progress-fill.emerald {
    background: linear-gradient(90deg, var(--emerald), #4DC87A);
  }

  .progress-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 4px;
    display: block;
    text-align: right;
  }
</style>
```

- [ ] **Step 4: 创建 src/shared/Modal.svelte**

```svelte
<script>
  let { open = false, title = '', onclose, children } = $props();

  function handleKeydown(e) {
    if (e.key === 'Escape' && open) onclose?.();
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onclose?.();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="modal-backdrop" onclick={handleBackdrop} role="dialog">
    <div class="modal-panel">
      <div class="modal-header">
        <h3>{title}</h3>
        <button class="close-btn" onclick={onclose}>✕</button>
      </div>
      <div class="modal-body">
        {@render children()}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  .modal-panel {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 16px;
    width: 420px;
    max-width: 90vw;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
    animation: scaleIn 0.2s ease;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 20px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .modal-header h3 {
    font-size: 18px;
    font-weight: 700;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    background: var(--bg-elevated);
    color: var(--text-bright);
  }

  .modal-body {
    padding: 20px;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>
```

- [ ] **Step 5: 提交**

```bash
git add src/shared/
git commit -m "feat(components): 基础共享组件 Card, Badge, ProgressBar, Modal"
```

---

## Task 5: App.svelte 根组件 + ResourceBar

**Files:**
- Create: `src/App.svelte`
- Create: `src/components/ResourceBar.svelte`
- Create: `src/components/Navigation.svelte`

- [ ] **Step 1: 创建 src/components/ResourceBar.svelte**

```svelte
<script>
  import { goldStore, gpsStore, startSync, stopSync } from '../gameAdapter.js';
  import { formattedGold, formattedGps } from '../stores/gameStore.js';
  import { onMount, onDestroy } from 'svelte';

  let gold = $state(0);
  let gps = $state(0);
  const unsubGold = goldStore.subscribe(v => gold = v);
  const unsubGps = gpsStore.subscribe(v => gps = v);

  onMount(() => startSync());
  onDestroy(() => {
    unsubGold();
    unsubGps();
    stopSync();
  });

  function handleClick() {
    window.clickGold?.();
  }
</script>

<div class="resource-bar">
  <div class="gold-card" onclick={handleClick} role="button" tabindex="0">
    <div class="gold-icon">💰</div>
    <div class="gold-info">
      <span class="label">当前金币</span>
      <span class="gold-value font-mono">{$formattedGold}</span>
      <span class="hint">点击获取 | 空格</span>
    </div>
  </div>
  <div class="gps-card">
    <div class="gps-icon">⚡</div>
    <div class="gps-info">
      <span class="label">产量/秒</span>
      <span class="gps-value font-mono">{$formattedGps}</span>
    </div>
  </div>
</div>

<style>
  .resource-bar {
    display: flex;
    gap: 12px;
  }

  .gold-card {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    background: var(--bg-surface);
    border: 1px solid rgba(232, 197, 71, 0.2);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .gold-card:hover {
    border-color: var(--gold-bright);
    box-shadow: var(--shadow-gold);
    transform: translateY(-1px);
  }

  .gold-card:active {
    transform: scale(0.98);
  }

  .gold-icon {
    font-size: 32px;
  }

  .gold-info {
    display: flex;
    flex-direction: column;
  }

  .label {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .gold-value {
    font-size: 26px;
    font-weight: 800;
    color: var(--gold-glow);
    line-height: 1.2;
  }

  .hint {
    font-size: 11px;
    color: var(--text-faint);
  }

  .gps-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
  }

  .gps-icon {
    font-size: 24px;
  }

  .gps-info {
    display: flex;
    flex-direction: column;
  }

  .gps-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--emerald);
  }
</style>
```

- [ ] **Step 2: 创建 src/components/Navigation.svelte**

```svelte
<script>
  let { activeTab = $bindable('buildings') } = $props();

  const tabs = [
    { id: 'buildings', icon: '🏗️', label: '建筑', badge: 'tab-buildings-count' },
    { id: 'upgrades', icon: '⬆️', label: '升级', badge: 'tab-upgrades-count' },
    { id: 'bosses', icon: '👹', label: 'Boss', badge: 'tab-bosses-count' },
    { id: 'artifacts', icon: '💠', label: '神器', badge: 'tab-artifacts-count' },
    { id: 'rebirth', icon: '🔄', label: '转生', badge: 'tab-rebirth-count' },
    { id: 'achievements', icon: '🏆', label: '成就', badge: 'tab-achievements-count' },
    { id: 'stats', icon: '📊', label: '统计', badge: null },
  ];
</script>

<nav class="nav">
  {#each tabs as tab}
    <button
      class="nav-tab"
      class:active={activeTab === tab.id}
      onclick={() => activeTab = tab.id}
    >
      <span class="tab-icon">{tab.icon}</span>
      <span class="tab-label">{tab.label}</span>
      {#if tab.badge}
        <span class="tab-badge" id={tab.badge}>0</span>
      {/if}
    </button>
  {/each}
</nav>

<style>
  .nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .nav-tab {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-muted);
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
  }

  .nav-tab:hover {
    background: var(--bg-elevated);
    color: var(--text-base);
  }

  .nav-tab.active {
    background: linear-gradient(135deg, var(--gold-muted), var(--gold-dim));
    color: #18181B;
    font-weight: 700;
    box-shadow: var(--shadow-gold);
  }

  .tab-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .tab-label {
    flex: 1;
  }

  .tab-badge {
    font-size: 10px;
    padding: 2px 8px;
    background: var(--bg-overlay);
    border-radius: 999px;
    color: var(--text-faint);
  }

  .nav-tab.active .tab-badge {
    background: rgba(0, 0, 0, 0.2);
    color: #18181B;
  }
</style>
```

- [ ] **Step 3: 创建 src/App.svelte**

```svelte
<script>
  import ResourceBar from './components/ResourceBar.svelte';
  import Navigation from './components/Navigation.svelte';
  import BuildingTab from './components/BuildingTab.svelte';
  import UpgradeTab from './components/UpgradeTab.svelte';
  import BossTab from './components/BossTab.svelte';
  import BossPanel from './components/BossPanel.svelte';
  import AchievementTab from './components/AchievementTab.svelte';
  import StatsTab from './components/StatsTab.svelte';
  import ArtifactTab from './components/ArtifactTab.svelte';
  import RebirthTab from './components/RebirthTab.svelte';
  import Toast from './components/Toast.svelte';
  import Settings from './components/Settings.svelte';

  let activeTab = $state('buildings');
  let settingsOpen = $state(false);
  let theme = $state('dark');

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }

  // 键盘快捷键
  function handleKeydown(e) {
    const map = {
      '1': 'buildings', '2': 'upgrades', '3': 'bosses',
      '4': 'artifacts', '5': 'rebirth', '6': 'achievements', '7': 'stats',
      's': () => window.manualSave?.(),
      'r': () => window.performPrestige?.(),
      'q': () => window.setBuyMode?.('x1'),
      'w': () => window.setBuyMode?.('x10'),
      'e': () => window.setBuyMode?.('max'),
      ' ': () => window.clickGold?.(),
    };
    const action = map[e.key];
    if (typeof action === 'function') {
      e.preventDefault();
      action();
    } else if (action) {
      activeTab = action;
    }
  }
</script>

<div class="app-layout">
  <aside class="sidebar">
    <div class="logo-section">
      <div class="logo">
        <div class="logo-icon">🏰</div>
        <div class="logo-text">
          <span class="logo-title">Idle Empire</span>
          <span class="logo-sub">挂机帝国 v2.2</span>
        </div>
      </div>
      <div class="logo-actions">
        <button class="icon-btn" onclick={toggleTheme}>🌙</button>
        <button class="icon-btn" onclick={() => settingsOpen = true}>⚙️</button>
      </div>
    </div>

    <ResourceBar />

    <div class="boss-mini">
      <BossPanel />
    </div>

    <Navigation bind:activeTab />

    <div class="footer-actions">
      <button class="btn btn-gold" onclick={() => window.manualSave?.()}>💾 保存</button>
      <button class="btn btn-purple" onclick={() => window.performPrestige?.()}>👑 王朝</button>
      <button class="btn btn-ghost" onclick={() => {
        if (confirm('确定重置？所有进度丢失！')) window.resetGame?.();
      }}>🔄 重置</button>
    </div>
  </aside>

  <main class="content">
    {#if activeTab === 'buildings'}
      <BuildingTab />
    {:else if activeTab === 'upgrades'}
      <UpgradeTab />
    {:else if activeTab === 'bosses'}
      <BossTab />
    {:else if activeTab === 'artifacts'}
      <ArtifactTab />
    {:else if activeTab === 'rebirth'}
      <RebirthTab />
    {:else if activeTab === 'achievements'}
      <AchievementTab />
    {:else if activeTab === 'stats'}
      <StatsTab />
    {/if}
  </main>
</div>

<Toast />
<Settings open={settingsOpen} onclose={() => settingsOpen = false} />

<style>
  .app-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    min-height: 100vh;
  }

  .sidebar {
    background: var(--bg-base);
    border-right: 1px solid var(--border-subtle);
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
    max-height: 100vh;
    position: sticky;
    top: 0;
  }

  .logo-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo-icon {
    font-size: 28px;
  }

  .logo-title {
    display: block;
    font-size: 18px;
    font-weight: 800;
    font-family: 'Cinzel', serif;
    color: var(--gold-bright);
  }

  .logo-sub {
    display: block;
    font-size: 10px;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .logo-actions {
    display: flex;
    gap: 6px;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .icon-btn:hover {
    background: var(--bg-elevated);
    border-color: var(--border-default);
  }

  .boss-mini {
    display: none;
  }

  .footer-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: auto;
  }

  .btn {
    padding: 12px 16px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
  }

  .btn-gold {
    background: linear-gradient(135deg, var(--gold-bright), var(--gold-muted));
    color: #18181B;
    box-shadow: var(--shadow-gold);
  }

  .btn-gold:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 20px rgba(232, 197, 71, 0.4);
  }

  .btn-purple {
    background: linear-gradient(135deg, var(--amethyst), #6B4FC0);
    color: #fff;
  }

  .btn-purple:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 20px rgba(139, 111, 204, 0.4);
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-muted);
    border: 1px solid var(--border-subtle);
  }

  .btn-ghost:hover {
    background: var(--bg-elevated);
    color: var(--crimson);
    border-color: var(--crimson);
  }

  .content {
    padding: 28px 36px;
    overflow-y: auto;
    max-height: 100vh;
  }

  @media (max-width: 768px) {
    .app-layout {
      grid-template-columns: 1fr;
    }

    .sidebar {
      max-height: none;
      position: relative;
      border-right: none;
      border-bottom: 1px solid var(--border-subtle);
    }

    .content {
      padding: 16px;
    }
  }
</style>
```

- [ ] **Step 4: 提交**

```bash
git add src/App.svelte src/components/ResourceBar.svelte src/components/Navigation.svelte
git commit -m "feat(app): App 根组件 + ResourceBar + Navigation"
```

---

## Task 6: Tab 组件

**Files:**
- Create: `src/components/BuildingTab.svelte`
- Create: `src/components/UpgradeTab.svelte`
- Create: `src/components/BossTab.svelte`
- Create: `src/components/BossPanel.svelte`
- Create: `src/components/AchievementTab.svelte`
- Create: `src/components/StatsTab.svelte`
- Create: `src/components/ArtifactTab.svelte`
- Create: `src/components/RebirthTab.svelte`

- [ ] **Step 1: 创建 src/components/BuildingTab.svelte**

```svelte
<script>
  import Card from '../shared/Card.svelte';
  import Badge from '../shared/Badge.svelte';
  import { goldStore } from '../gameAdapter.js';
  import { onMount } from 'svelte';

  let gold = $state(0);
  goldStore.subscribe(v => gold = v);

  let buildings = $state([]);
  let buyMode = $state('x1');

  onMount(() => {
    buildings = window.BUILDINGS_DATA || [];
    window.updateBuildingList?.();
  });

  function handleBuy(building) {
    window.buyBuilding?.(building.id, buyMode);
  }

  function setBuyMode(mode) {
    buyMode = mode;
    window.setBuyMode?.(mode);
  }
</script>

<div class="tab-header">
  <div>
    <h1>🏗️ 建筑</h1>
    <p class="subtitle">购买建筑自动获得金币收益</p>
  </div>
  <div class="buy-mode">
    {#each [['x1', 'x1 (Q)'], ['x10', 'x10 (W)'], ['max', 'MAX (E)']] as [mode, label]}
      <button
        class="mode-btn"
        class:active={buyMode === mode}
        onclick={() => setBuyMode(mode)}
      >{label}</button>
    {/each}
  </div>
</div>

<div class="building-grid">
  {#each buildings as b (b.id)}
    <Card
      clickable={gold >= b.cost}
      affordable={gold >= b.cost}
      locked={gold < b.cost}
      onclick={() => handleBuy(b)}
    >
      <div class="building-card">
        <div class="b-icon">{b.icon}</div>
        <div class="b-info">
          <div class="b-name">{b.name}</div>
          <div class="b-desc">{b.desc}</div>
          <div class="b-gps">+{b.gps}/s</div>
        </div>
        <div class="b-count">{b.count || 0}</div>
        <div class="b-cost font-mono">
          <span class:insufficient={gold < b.cost}>
            {Math.floor(b.cost).toLocaleString()} 💰
          </span>
        </div>
      </div>
    </Card>
  {/each}
</div>

<style>
  .tab-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  h1 {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 4px;
  }

  .subtitle {
    color: var(--text-muted);
    font-size: 14px;
  }

  .buy-mode {
    display: flex;
    gap: 6px;
  }

  .mode-btn {
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
    color: var(--text-muted);
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .mode-btn:hover {
    border-color: var(--gold-bright);
    color: var(--text-base);
  }

  .mode-btn.active {
    background: linear-gradient(135deg, var(--gold-bright), var(--gold-muted));
    color: #18181B;
    border-color: transparent;
    font-weight: 700;
  }

  .building-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }

  .building-card {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .b-icon {
    font-size: 28px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-elevated);
    border-radius: 10px;
    flex-shrink: 0;
  }

  .b-info {
    flex: 1;
    min-width: 0;
  }

  .b-name {
    font-size: 15px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .b-desc {
    font-size: 11px;
    color: var(--text-muted);
  }

  .b-gps {
    font-size: 12px;
    color: var(--emerald);
    font-weight: 600;
  }

  .b-count {
    font-size: 28px;
    font-weight: 800;
    color: var(--gold-glow);
    min-width: 48px;
    text-align: center;
  }

  .b-cost {
    font-size: 13px;
    color: var(--text-muted);
    min-width: 80px;
    text-align: right;
  }

  .insufficient {
    color: var(--crimson);
  }
</style>
```

- [ ] **Step 2: 创建 src/components/BossPanel.svelte**

```svelte
<script>
  import ProgressBar from '../shared/ProgressBar.svelte';
  import { onMount } from 'svelte';

  let bossHp = $state(100);
  let bossMaxHp = $state(100);
  let bossName = $state('哥布林首领');
  let bossIcon = $state('👺');
  let bossReward = $state('500 💰');

  onMount(() => {
    window.updateBossUI?.();
  });
</script>

<div class="boss-panel">
  <div class="boss-header">
    <span class="boss-icon">{bossIcon}</span>
    <div>
      <div class="boss-name">{bossName}</div>
      <div class="boss-sub">Boss 战斗中</div>
    </div>
  </div>
  <ProgressBar value={bossHp} max={bossMaxHp} color="crimson" showLabel />
  <div class="boss-reward">{bossReward}</div>
</div>

<style>
  .boss-panel {
    background: var(--crimson-bg);
    border: 1px solid rgba(201, 64, 64, 0.3);
    border-radius: 14px;
    padding: 14px;
  }

  .boss-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .boss-icon {
    font-size: 28px;
    animation: pulse 2s ease-in-out infinite;
  }

  .boss-name {
    font-size: 14px;
    font-weight: 700;
  }

  .boss-sub {
    font-size: 11px;
    color: var(--text-muted);
  }

  .boss-reward {
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    color: var(--gold-bright);
    margin-top: 8px;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
</style>
```

- [ ] **Step 3: 创建 src/components/UpgradeTab.svelte**

```svelte
<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let upgrades = $state([]);

  onMount(() => {
    upgrades = window.UPGRADES_DATA || [];
    window.updateUpgradesUI?.();
  });

  function handleBuy(upgrade) {
    window.buyUpgrade?.(upgrade.id);
  }
</script>

<div class="tab-header">
  <h1>⬆️ 升级</h1>
  <p class="subtitle">购买升级获得永久强化</p>
</div>

<div class="upgrade-grid">
  {#each upgrades as u (u.id)}
    <Card clickable onclick={() => handleBuy(u)}>
      <div class="upgrade-card">
        <div class="u-icon">{u.icon}</div>
        <div class="u-info">
          <div class="u-name">{u.name}</div>
          <div class="u-desc">{u.desc}</div>
        </div>
        <div class="u-cost font-mono">{u.cost} 💰</div>
      </div>
    </Card>
  {/each}
</div>

<style>
  .upgrade-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }

  .upgrade-card {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .u-icon {
    font-size: 26px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-elevated);
    border-radius: 10px;
    flex-shrink: 0;
  }

  .u-info { flex: 1; min-width: 0; }
  .u-name { font-size: 14px; font-weight: 700; }
  .u-desc { font-size: 11px; color: var(--text-muted); }
  .u-cost { font-size: 12px; color: var(--gold-bright); }
</style>
```

- [ ] **Step 4: 创建 src/components/BossTab.svelte**

```svelte
<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let bosses = $state([]);

  onMount(() => {
    bosses = window.BOSSES_DATA || [];
    window.updateBossList?.();
  });
</script>

<div class="tab-header">
  <h1>👹 Boss 列表</h1>
  <p class="subtitle">挑战强大的 Boss 获得丰厚奖励</p>
</div>

<div class="boss-grid">
  {#each bosses as boss (boss.id)}
    <Card clickable onclick={() => window.challengeBoss?.(boss.id)}>
      <div class="boss-card">
        <span class="boss-icon">{boss.icon}</span>
        <div class="boss-info">
          <div class="boss-name">{boss.name}</div>
          <div class="boss-hp">HP: {boss.maxHp?.toLocaleString()}</div>
        </div>
        <div class="boss-reward">奖励: {boss.reward}</div>
      </div>
    </Card>
  {/each}
</div>

<style>
  .boss-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }

  .boss-card {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .boss-icon { font-size: 28px; flex-shrink: 0; }
  .boss-info { flex: 1; }
  .boss-name { font-size: 14px; font-weight: 700; }
  .boss-hp { font-size: 11px; color: var(--crimson); }
  .boss-reward { font-size: 12px; color: var(--gold-bright); }
</style>
```

- [ ] **Step 5: 创建 src/components/AchievementTab.svelte**

```svelte
<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let achievements = $state([]);

  onMount(() => {
    achievements = window.ACHIEVEMENTS_DATA || [];
    window.updateAchievementsUI?.();
  });
</script>

<div class="tab-header">
  <h1>🏆 成就</h1>
  <p class="subtitle">解锁成就获得奖励加成</p>
</div>

<div class="achievement-grid">
  {#each achievements as a (a.id)}
    <Card clickable={!a.unlocked} onclick={() => window.selectAchievement?.(a.id)}>
      <div class="achievement-card" class:unlocked={a.unlocked}>
        <div class="a-icon">{a.unlocked ? a.icon : '🔒'}</div>
        <div class="a-info">
          <div class="a-name">{a.name}</div>
          <div class="a-desc">{a.desc}</div>
          {#if a.unlocked}
            <div class="a-reward">奖励: {a.reward}</div>
          {/if}
        </div>
      </div>
    </Card>
  {/each}
</div>

<style>
  .achievement-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }

  .achievement-card {
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: 0.5;
  }

  .achievement-card.unlocked { opacity: 1; }

  .a-icon { font-size: 26px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated); border-radius: 10px; flex-shrink: 0; }
  .achievement-card.unlocked .a-icon { background: linear-gradient(135deg, var(--gold-bright), var(--gold-muted)); }
  .a-info { flex: 1; }
  .a-name { font-size: 14px; font-weight: 700; }
  .a-desc { font-size: 11px; color: var(--text-muted); }
  .a-reward { font-size: 11px; color: var(--emerald); margin-top: 4px; }
</style>
```

- [ ] **Step 6: 创建 src/components/StatsTab.svelte**

```svelte
<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let stats = $state({});

  onMount(() => {
    window.updateStatsUI?.();
    // 轮询读取 stats 数据
    const interval = setInterval(() => {
      stats = window.getStats?.() || {};
    }, 500);
    return () => clearInterval(interval);
  });
</script>

<div class="tab-header">
  <h1>📊 游戏统计</h1>
  <p class="subtitle">查看你的游戏数据</p>
</div>

<div class="stats-grid">
  {#each Object.entries(stats) as [key, value] (key)}
    <Card>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-value font-mono">{value}</div>
        <div class="stat-label">{key}</div>
      </div>
    </Card>
  {/each}
</div>

<style>
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 6px;
  }

  .stat-icon { font-size: 24px; }
  .stat-value { font-size: 22px; font-weight: 800; color: var(--gold-bright); }
  .stat-label { font-size: 11px; color: var(--text-muted); }
</style>
```

- [ ] **Step 7: 创建 src/components/ArtifactTab.svelte**

```svelte
<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let artifacts = $state([]);

  onMount(() => {
    artifacts = window.ARTIFACTS_DATA || [];
    window.updateArtifactsUI?.();
  });
</script>

<div class="tab-header">
  <h1>💠 神器</h1>
  <p class="subtitle">收集神器获得强大加成</p>
</div>

<div class="artifact-grid">
  {#each artifacts as a (a.id)}
    <Card clickable={a.unlocked} onclick={() => window.collectArtifact?.(a.id)}>
      <div class="artifact-card" class:unlocked={a.unlocked}>
        <div class="a-icon">{a.unlocked ? a.icon : '❓'}</div>
        <div class="a-info">
          <div class="a-name">{a.name}</div>
          <div class="a-bonus">{a.bonus}</div>
        </div>
        <div class="a-tier">{a.tier}</div>
      </div>
    </Card>
  {/each}
</div>

<style>
  .artifact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }

  .artifact-card {
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: 0.5;
  }

  .artifact-card.unlocked { opacity: 1; border-color: var(--amethyst); }

  .a-icon { font-size: 26px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated); border-radius: 10px; flex-shrink: 0; }
  .a-info { flex: 1; }
  .a-name { font-size: 14px; font-weight: 700; }
  .a-bonus { font-size: 11px; color: var(--amethyst); }
  .a-tier { font-size: 10px; padding: 2px 8px; background: var(--bg-overlay); border-radius: 999px; color: var(--text-faint); }
</style>
```

- [ ] **Step 8: 创建 src/components/RebirthTab.svelte**

```svelte
<script>
  import Card from '../shared/Card.svelte';
  import ProgressBar from '../shared/ProgressBar.svelte';
  import { onMount } from 'svelte';

  let rebirthData = $state({ currentPoints: 0, multiplier: 1, nextCost: 1000 });

  onMount(() => {
    window.updateRebirthUI?.();
    const interval = setInterval(() => {
      rebirthData = window.getRebirthData?.() || rebirthData;
    }, 500);
    return () => clearInterval(interval);
  });
</script>

<div class="tab-header">
  <h1>🔄 转生</h1>
  <p class="subtitle">转生获得永久强化</p>
</div>

<div class="rebirth-container">
  <Card>
    <div class="rebirth-card">
      <div class="r-icon">🔄</div>
      <div class="r-info">
        <div class="r-title">转生点数</div>
        <div class="r-points font-mono">{rebirthData.currentPoints}</div>
        <div class="r-mult">当前倍数: x{rebirthData.multiplier}</div>
      </div>
    </div>
    <div class="r-progress">
      <ProgressBar value={rebirthData.currentPoints} max={rebirthData.nextCost} color="amethyst" showLabel />
    </div>
    <button class="btn btn-purple" onclick={() => window.performRebirth?.()}>
      转生 (需要 {rebirthData.nextCost} 点)
    </button>
  </Card>
</div>

<style>
  .rebirth-container { max-width: 480px; }

  .rebirth-card {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }

  .r-icon { font-size: 36px; }
  .r-title { font-size: 12px; color: var(--text-muted); text-transform: uppercase; }
  .r-points { font-size: 32px; font-weight: 800; color: var(--amethyst); }
  .r-mult { font-size: 12px; color: var(--text-muted); }

  .r-progress { margin: 16px 0; }

  .btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-purple {
    background: linear-gradient(135deg, var(--amethyst), #6B4FC0);
    color: #fff;
  }

  .btn-purple:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 20px rgba(139, 111, 204, 0.4);
  }
</style>
```

- [ ] **Step 4: 提交**

```bash
git add src/components/BuildingTab.svelte src/components/BossTab.svelte src/components/BossPanel.svelte src/components/UpgradeTab.svelte src/components/AchievementTab.svelte src/components/StatsTab.svelte src/components/ArtifactTab.svelte src/components/RebirthTab.svelte
git commit -m "feat(tabs): 7 个 Tab 组件 (Building, Upgrade, Boss, Artifact, Rebirth, Achievement, Stats)"
```

---

## Task 7: Toast + Settings

**Files:**
- Create: `src/components/Toast.svelte`
- Create: `src/components/Settings.svelte`

- [ ] **Step 1: 创建 Toast 通知组件**

```svelte
<script>
  import { onMount } from 'svelte';

  let toasts = $state([]);

  onMount(() => {
    window.showToast = (msg, type = 'info', icon = '💡') => {
      const id = Date.now();
      toasts = [...toasts, { id, msg, type, icon }];
      setTimeout(() => {
        toasts = toasts.filter(t => t.id !== id);
      }, 4000);
    };
  });
</script>

<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <div class="toast {toast.type}">
      <span class="toast-icon">{toast.icon}</span>
      <span class="toast-msg">{toast.msg}</span>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 9999;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    animation: slideIn 0.3s ease;
    min-width: 260px;
    pointer-events: auto;
  }

  .toast.success { border-left: 4px solid var(--emerald); }
  .toast.warning { border-left: 4px solid var(--crimson); }
  .toast.info { border-left: 4px solid var(--sapphire); }

  .toast-icon { font-size: 20px; }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(40px); }
    to { opacity: 1; transform: translateX(0); }
  }
</style>
```

- [ ] **Step 2: 创建 Settings.svelte**

```svelte
<script>
  import Modal from '../shared/Modal.svelte';
  let { open = false, onclose } = $props();

  let quality = $state('high');
  let particles = $state(true);
  let scanlines = $state(true);
  let autoSave = $state(true);

  function onQualityChange(v) {
    window.setGraphicsQuality?.(v);
  }
  function onParticlesChange(v) {
    window.toggleParticles?.(v);
  }
  function onScanlinesChange(v) {
    window.toggleScanlines?.(v);
  }
</script>

<Modal {open} title="游戏设置" {onclose}>
  <div class="settings-body">
    <div class="settings-group">
      <h4>显示</h4>
      <label>
        <span>画质</span>
        <select value={quality} onchange={(e) => onQualityChange(e.target.value)}>
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
          <option value="ultra">极高</option>
        </select>
      </label>
      <label class="toggle">
        <span>粒子效果</span>
        <input type="checkbox" checked={particles} onchange={(e) => onParticlesChange(e.target.checked)} />
      </label>
      <label class="toggle">
        <span>扫描线</span>
        <input type="checkbox" checked={scanlines} onchange={(e) => onScanlinesChange(e.target.checked)} />
      </label>
    </div>
    <div class="settings-group">
      <h4>游戏</h4>
      <label class="toggle">
        <span>自动保存</span>
        <input type="checkbox" bind:checked={autoSave} />
      </label>
    </div>
  </div>
</Modal>

<style>
  .settings-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .settings-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .settings-group h4 {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: var(--bg-elevated);
    border-radius: 8px;
    font-size: 14px;
  }

  label.toggle {
    cursor: pointer;
  }

  select {
    padding: 4px 10px;
    background: var(--bg-overlay);
    border: 1px solid var(--border-default);
    border-radius: 6px;
    color: var(--text-base);
    font-size: 13px;
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--gold-bright);
    cursor: pointer;
  }
</style>
```

- [ ] **Step 3: 提交**

```bash
git add src/components/Toast.svelte src/components/Settings.svelte
git commit -m "feat(ui): Toast 通知系统 + Settings 设置面板"
```

---

## Task 8: 数字滚动动画 + Boss 击杀特效

**Files:**
- Modify: `src/stores/gameStore.js`
- Modify: `src/components/ResourceBar.svelte`

- [ ] **Step 1: 数字滚动动画（countUp 风格）**

在 `gameStore.js` 添加响应式数字动画辅助：

```js
// 数字动画辅助
export function createAnimatedNumber(store, duration = 500) {
  let current = 0;
  let target = 0;
  let rafId;

  store.subscribe(v => {
    target = v;
    animate();
  });

  function animate() {
    const diff = target - current;
    if (Math.abs(diff) < 1) {
      current = target;
      cancelAnimationFrame(rafId);
      return;
    }
    current += diff * 0.15;
    rafId = requestAnimationFrame(animate);
  }

  return { value: () => current };
}
```

- [ ] **Step 2: Boss 击杀特效**

在 `App.svelte` 中添加屏幕震动和金币雨：

```svelte
<!-- App.svelte 添加 -->
<script>
  let shaking = $state(false);

  window.onBossKill = () => {
    shaking = true;
    setTimeout(() => shaking = false, 500);
    // 金币雨动画触发
    window.spawnCoinRain?.();
  };
</script>

<div class="app-layout" class:shake={shaking}>
  ...
</div>

<style>
  .shake {
    animation: screenShake 0.5s ease;
  }

  @keyframes screenShake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
</style>
```

- [ ] **Step 3: 提交**

```bash
git add src/stores/gameStore.js src/components/ResourceBar.svelte
git commit -m "feat(animation): 数字滚动动画 + Boss 击杀屏幕震动特效"
```

---

## Task 9: 入口脚本 + 验证构建

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: 修改 src/main.js 挂载游戏循环**

```js
import './styles/global.css';
import './styles/theme-dark.css';
import App from './App.svelte';
import { mount } from 'svelte';
import { startSync } from './gameAdapter.js';

// 等待 DOM 就绪
document.addEventListener('DOMContentLoaded', () => {
  mount(App, { target: document.getElementById('app') });

  // 启动状态同步
  startSync();

  // 初始化游戏（如果需要）
  if (window.initGame) {
    window.initGame();
  }
});
```

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: `dist/` 目录生成，index.html + assets/

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: 完成 Svelte 前端重构所有任务"
```

---

## 任务依赖图

```
Task 1 (脚手架) ← 独立
    ↓
Task 2 (全局样式) ← 依赖 Task 1
    ↓
Task 3 (适配层) ← 依赖 Task 1
    ↓
Task 4 (基础组件) ← 依赖 Task 1
    ↓
Task 5 (App + ResourceBar + Navigation) ← 依赖 Task 2, 3, 4
    ↓
Task 6 (Tab 组件 x7) ← 依赖 Task 5
    ↓
Task 7 (Toast + Settings) ← 依赖 Task 5
    ↓
Task 8 (动画增强) ← 依赖 Task 6
    ↓
Task 9 (构建验证) ← 依赖所有
```

**总任务数:** 9 个
**预计提交:** 9 次
**Task 6 步骤数:** 8 步（含所有 Tab）
