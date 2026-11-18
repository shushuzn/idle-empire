# 放置帝国 · Idle Empire

一个从点击开始、到无限引擎结束的放置/增量游戏。纯前端静态站点，**零运行时依赖、无构建步骤**，存档在浏览器 localStorage，装成 PWA 后离线也能继续。

[![Deploy](https://github.com/shushuzn/idle-empire/actions/workflows/pages.yml/badge.svg)](https://github.com/shushuzn/idle-empire/actions/workflows/pages.yml)
[![Version](https://img.shields.io/badge/version-3.4.0-2ea44f)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

**在线游玩**：https://shushuzn.github.io/idle-empire/

## 特性

- **完整的成长曲线**：18 座建筑（金矿 → 无限引擎）、21 个升级、15 个 Boss、20 个成就、转生与碎片商店，数字后缀一路支持到 Dd（10^33）。
- **纯静态**：三个命令就能跑，不需要 npm install，也没有打包产物。
- **移动优先**：底部标签栏、吸底点击条、`100dvh` 与安全区适配、按钮不小于 46px，360px 宽无横向溢出。
- **可离线**：Service Worker 网络优先缓存，断网重载照常进入游戏，进度留在本地。
- **轻量**：全部源码约 2500 行（含样式与 50 个自绘图标），单页 5 个标签。
- **无障碍**：语义化标签页与 roving tabindex、方向键切换、可见焦点、`prefers-reduced-motion` 支持、读屏友好的提示区。

## 快速开始

```bash
git clone https://github.com/shushuzn/idle-empire.git
cd idle-empire
npm run dev          # python3 -m http.server 5173
```

打开 http://127.0.0.1:5173 。也可以直接双击 `index.html`，但 ES module 在部分浏览器的 `file://` 下会被拦截，建议用本地服务。

```bash
npm test             # node --test tests/*.test.js，35 项
```

需要 Node.js 20+（CI 使用 22）。

## 玩法

| 系统 | 说明 |
|---|---|
| 点击 | 点顶部金色条获得收益。基础 1，叠加点击升级、全局升级、碎片与商店加成，`空格` 也能点。 |
| 建筑 | 18 种，成本按 1.15 倍递增，支持 ×1 / ×10 / 最大 购买；累计收益达标后解锁下一座。 |
| 升级 | 21 个一次性升级，分点击 / 建筑 / Boss / 自动开采 / 全局 / 离线六类，带前置链。 |
| Boss | 15 个，伤害为「点击收益 ×4 + 当前产能」；击杀给金币，最后一个可打的 Boss 会满血重来。 |
| 成就 | 20 个，按建筑数、点击数、击杀数、累计收益、升级数、转生数、碎片数解锁，奖励金币或碎片。 |
| 转生 | 本轮累计收益达 1M 后可转生，得 `floor(sqrt(累计收益 / 1M))` 个碎片，每碎片 +2% 全部收益；清空金币、建筑、升级，保留碎片、成就与商店等级。 |
| 碎片商店 | 产能 / 点击 / 战斗 / 离线四个永久加成，价格按等级平方增长。 |
| 离线收益 | 按离开时长结算，基础 50%，可经升级与商店提到 100%，上限 8 小时；关页面和后台挂起都算。 |

底部标签上的数字是当前买得起的升级数，转生页的 `!` 表示已攒够一次转生。`1`–`5` 切换标签，`空格` 点击。设置里可切换主题（默认跟随系统）与振动反馈，以及导出、导入、重置存档。

## 技术结构

项目刻意保持小而直白，没有框架和状态库：

- **数值层是纯函数**（`src/game/balance.js`）：成本、产能、点击收益、Boss 伤害、离线结算、碎片计算都只依赖传入参数，公式由单元测试锁死。
- **单一状态对象 + 一个 rAF 循环**（`src/main.js`）：每帧只更新视图里那几个节点，不重建 DOM，切页和连点不掉帧，滚动位置也不会跳。
- **加成分类计算**：building / click / boss / global / offline 五类各自只乘一次，避免旧版重复相乘导致的数值虚高。
- **存档集中处理**（`src/game/state.js`）：`normalize()` 负责旧字段迁移、越界值夹取和坏档兜底，导出为带版本号的 JSON。
- **视图即函数**（`src/ui/views.js`）：每个标签页返回一段结构，内置增量刷新；图标通过 `data-icon` 占位，启动时由 `src/ui/icons.js` 统一注入 SVG。
- **主题不闪**：`<head>` 内联脚本在样式表之前定好主题，`theme-color` 跟着切换。

## 目录

```
index.html                应用外壳
assets/app.css            全部样式（深/浅双主题，移动优先）
assets/icon.svg           favicon / PWA 图标源文件
assets/icon-*.png         192 / 512 / maskable 应用图标
manifest.webmanifest      PWA 清单
sw.js                     离线缓存（网络优先，断网回落）
src/main.js               启动、标签页、主循环、设置面板、快捷键
src/game/data.js          建筑、升级、Boss、成就、商店数据表
src/game/balance.js       纯函数数值层
src/game/state.js         存档结构、迁移、离线结算、导入导出
src/game/engine.js        购买、攻击、转生、成就、tick
src/ui/views.js           五个页面的 DOM 构建与增量刷新
src/ui/format.js          数字 / 时间格式化
src/ui/icons.js           50 个 24×24 线性 SVG 图标
src/ui/theme.js           主题偏好（跟随系统 / 浅色 / 深色）
src/ui/floaters.js        点击 / 攻击飘字
src/ui/haptics.js         振动反馈开关
tests/                    node:test 用例（数值、存档、引擎、主题、格式化）
```

## 部署

仓库自带 `.github/workflows/pages.yml`：推送到 `master` / `main` 后自动跑测试，把游戏本体（`index.html`、`sw.js`、`assets`、`src` 等）发布到 GitHub Pages，测试不过不会上线。首次使用在仓库 **Settings → Pages → Source** 选 **GitHub Actions**。

因为发布目录不含 `.git`、`tests` 和文档，线上访问不到源码之外的杂项文件。

## 安装到手机

用手机浏览器打开 Pages 地址：Android Chrome 会提示「安装应用」，iOS Safari 用「添加到主屏幕」。安装后离线可玩，进度在本地，换设备请先在设置里导出存档。

## 版本与文档

- [CHANGELOG.md](CHANGELOG.md)：完整版本记录（当前 v3.4.0）
- [CONTRIBUTING.md](CONTRIBUTING.md)：目录约定、代码风格、提交与 PR 流程
- [SECURITY.md](SECURITY.md)：漏洞报告渠道与攻击面说明
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)：协作行为准则

## 许可证

[MIT](LICENSE) © 2026 shushuzn

游戏代码、自绘图标和样式都可以自由使用、修改、分发，保留版权声明即可。
