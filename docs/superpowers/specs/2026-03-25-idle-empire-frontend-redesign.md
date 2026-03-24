# Idle Empire 前端重设计规范

**日期:** 2026-03-25 | **范围:** 前端重构（保留所有游戏逻辑）

---

## 1. 概念与愿景

将一个「Emoji 驱动的 DOM 操作游戏」转变为「流畅响应式挂机体验」。核心玩法不变，但用户感受到的是：一个精密运转的财富机器，而不是一堆散落的卡片。视觉语言从「可爱 Casual」进化为「暗夜奢华宫廷风」。

---

## 2. 设计方向

### 色彩系统（优化版）

```css
/* 背景层次 */
--bg-void: #08080A;       /* 最深层背景 */
--bg-base: #0E0E12;       /* 主背景 */
--bg-surface: #16161C;    /* 卡片/面板背景 */
--bg-elevated: #1E1E26;   /* 悬浮/激活态 */
--bg-overlay: #262630;    /* 模态/下拉 */

/* 金色系统（去饱和，更沉稳） */
--gold-dim: #8B7355;      /* 暗淡金（锁定状态） */
--gold-muted: #C9A227;    /* 柔和金（次要强调） */
--gold-bright: #E8C547;   /* 亮金（主要高亮） */
--gold-glow: #FFD966;     /* 发光金（数字/特效） */

/* 语义色 */
--crimson: #C94040;       /* Boss/危险 */
--emerald: #3DAA6A;       /* 成功/购买力 */
--sapphire: #4A8FCC;      /* 信息/链接 */
--amethyst: #8B6FCC;      /* 转生/特殊 */

/* 文字 */
--text-bright: #F5F5F7;
--text-base: #C8C8D0;
--text-muted: #7A7A88;
--text-faint: #4A4A55;
```

### 字体

- **Display:** `Cinzel` (Google Fonts) — 标题/数字，有古典感
- **Body:** `Inter` — 清晰易读，数字友好
- **Mono:** `JetBrains Mono` — 数值显示

### 图标

保留 Emoji 作为主要图标系统（符合项目风格），但用 SVG wrapper 统一尺寸和间距。

### 动效哲学

| 交互 | 动效 |
|------|------|
| 页面切换 | 卡片 stagger 入场，100ms 间隔 |
| 数值变化 | 数字滚动（countUp 风格） |
| 购买成功 | 卡片边缘金色闪光 |
| 解锁成就 | 全屏徽章动画脉冲 |
| Boss 击杀 | 屏幕震动 + 金币雨 |
| 悬浮反馈 | scale(1.02) + 阴影加深，150ms |

---

## 3. 架构

### 技术栈

- **Svelte 5** + **Vite** — 编译时响应式，体积小
- **CSS Variables** — 继承现有设计 token
- **localStorage** — 存档（复用现有逻辑）
- **Svelte Store** — 状态管理

### 目录结构

```
idle-empire/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.js
│   ├── App.svelte
│   ├── lib/
│   │   ├── stores/
│   │   │   └── gameStore.js      # 响应式包装现有JS
│   │   ├── components/
│   │   │   ├── ResourceBar.svelte
│   │   │   ├── Navigation.svelte
│   │   │   ├── BuildingTab.svelte
│   │   │   ├── UpgradeTab.svelte
│   │   │   ├── BossTab.svelte
│   │   │   ├── ArtifactTab.svelte
│   │   │   ├── RebirthTab.svelte
│   │   │   ├── AchievementTab.svelte
│   │   │   ├── StatsTab.svelte
│   │   │   ├── BossPanel.svelte
│   │   │   ├── Toast.svelte
│   │   │   └── Settings.svelte
│   │   └── shared/
│   │       ├── Card.svelte
│   │       ├── Badge.svelte
│   │       ├── ProgressBar.svelte
│   │       └── Modal.svelte
│   └── styles/
│       ├── global.css
│       ├── theme-dark.css
│       └── theme-light.css
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-03-25-idle-empire-frontend-redesign.md
```

### 状态管理策略

现有游戏逻辑全部保留在 `js/` 中。新架构用 Svelte store 包装：

```js
// gameStore.js 伪代码
import { writable, derived } from 'svelte/store';
import { gameState } from '../js/game.js'; // 现有全局状态

export const gold = writable(gameState.gold);
export const gps = derived(gold, $gold => /* 计算每秒收益 */);

// 轮询同步：每 100ms 从 gameState 读取最新值到 store
setInterval(() => {
    gold.set(gameState.gold);
}, 100);
```

组件只和 store 通信，不直接操作 gameState。

---

## 4. 组件清单

### 基础组件

| 组件 | 描述 |
|------|------|
| `Card` | 通用水牌：hover 效果、边框色、点击反馈 |
| `Badge` | 徽章：圆形计数标签（导航栏通知数） |
| `ProgressBar` | 进度条：流光动画、颜色可配置 |
| `Modal` | 模态框：居中、背景模糊、ESC 关闭 |

### 业务组件

| 组件 | 描述 |
|------|------|
| `ResourceBar` | 顶栏：金币/GPS 双资源 + 点击区域 |
| `Navigation` | 左侧导航：7 个 tab，徽章计数 |
| `BuildingTab` | 建筑网格：12 种建筑卡片 |
| `UpgradeTab` | 升级网格：15 种升级 |
| `BossTab` | Boss 列表 + 当前 Boss 进度 |
| `BossPanel` | 左侧嵌入式 Boss 战斗条 |
| `ArtifactTab` | 神器网格 |
| `RebirthTab` | 转生系统 |
| `AchievementTab` | 成就网格 |
| `StatsTab` | 统计数据 |
| `Toast` | 通知系统 |
| `Settings` | 设置面板 |

---

## 5. 游戏数据迁移

复用 `js/` 现有模块，通过适配层接入 Svelte：

```js
// 适配层: src/lib/gameAdapter.js
// 目的：最小化改动，保留所有 js/ 逻辑

import { readable } from 'svelte/store';

// 将现有 gameState 转为 Svelte readable store
export const gameData = readable(null, (set) => {
    const update = () => set(window.gameState);
    update();
    const interval = setInterval(update, 100); // 100ms 同步
    return () => clearInterval(interval);
});
```

---

## 6. 实现顺序

1. **Vite + Svelte 项目搭建** (`npm create vite@latest`)
2. **全局样式 + CSS Variables**（继承现有设计 token，补充新色彩）
3. **gameAdapter**（桥接现有 JS → Svelte store）
4. **Layout 组件**（App.svelte + Navigation + ResourceBar）
5. **各 Tab 组件**（按依赖顺序：Buildings → Upgrades → Boss → 剩余）
6. **Toast + Settings**
7. **动画增强**（数字滚动、stagger 入场、Boss 击杀特效）
8. **响应式 + 主题切换**
9. **Build 验证**

---

## 7. 质量标准

- Lighthouse Performance ≥ 90
- First Contentful Paint < 1.5s
- 所有交互有 hover/active 反馈
- 键盘快捷键保留（1-5 切换，空格点击，S 保存）
- 移动端基础可用（768px 断点）
- 动画尊重 `prefers-reduced-motion`
