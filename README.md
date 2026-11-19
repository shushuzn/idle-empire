# 放置帝国 · Idle Empire

一个从点击开始、到无限引擎结束的放置/增量游戏。纯前端静态站点，**零运行时依赖、无构建步骤**，存档在浏览器 localStorage，装成 PWA 后离线也能继续。

[![Deploy](https://github.com/shushuzn/idle-empire/actions/workflows/pages.yml/badge.svg)](https://github.com/shushuzn/idle-empire/actions/workflows/pages.yml)
[![Version](https://img.shields.io/badge/version-0.2.0-2ea44f)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

**在线游玩**：https://shushuzn.github.io/idle-empire/

## 特性

- **完整的成长曲线**：22 座建筑（金矿 → 无限引擎）、33 个升级、18 个 Boss、32 个成就、回响系统、转生与 6 项碎片商店，数字后缀一路支持到 Dd（10^39）。
- **有结局的故事**：24 篇剧情档案随里程碑解锁，讲一个关于矿井、轮回和第十八顶王冠的故事；转生后还能读到「回响」。
- **打磨过的 Boss 战**：深井蠕虫、潮汐主教带护盾，记忆吞噬者有两段血；护盾期点击翻倍、建筑伤害减半，二阶段奖励合并结算。
- **存档能带走、也更抗丢**：导出为可读的 JSON 文件，换设备后用文件选择器导入，也兼容旧的 base64 存档码；导入前会校验文件并确认覆盖。导入或重置前自动留一份备份，误操作可在设置里恢复；坏档不会静默清空，原始内容可导出排查。进入游戏时会申请持久化存储，自动存档失败会在界面里明确提示，多个标签页同时运行也会提醒只留一个。
- **纯静态**：三个命令就能跑，不需要 npm install，也没有打包产物。
- **移动优先**：底部标签栏、吸底点击条、`100dvh` 与安全区适配、按钮不小于 44px，360px 宽无横向溢出。
- **开场页**：晨光下的矿镇插画开场，新档显示「开始游戏」，有存档时显示「继续帝国」和上次成绩；停在开场页时模拟暂停，不会偷跑进度。
- **可离线、可安装**：Service Worker 网络优先缓存，断网重载照常进入游戏；支持一键安装到桌面，iOS 给出添加步骤。
- **标签直达**：地址栏加 `#story`、`#prestige` 等锚点可直接打开对应标签，刷新和收藏都不丢；安装后长按图标还有「剧情」「转生」快捷方式。
- **轻量**：全部源码约 5700 行（含样式与 51 个自绘图标），单页 6 个标签。
- **无障碍**：语义化标签页与 roving tabindex、方向键切换、可见焦点、`prefers-reduced-motion` 支持、读屏友好的提示区。

## 快速开始

```bash
git clone https://github.com/shushuzn/idle-empire.git
cd idle-empire
npm run dev          # python3 -m http.server 5173
```

打开 http://127.0.0.1:5173 。也可以直接双击 `index.html`，但 ES module 在部分浏览器的 `file://` 下会被拦截，建议用本地服务。

```bash
npm test             # node --test tests/*.test.js，97 项
```

需要 Node.js 20+（CI 使用 22）；`npm run dev` 会用 Python 3 起一个静态文件服务。

## 玩法

| 系统 | 说明 |
|---|---|
| 点击 | 点顶部金色条获得收益。基础 1，叠加点击升级、全局升级、碎片与商店加成，`空格` 也能点。 |
| 建筑 | 22 种，成本按 1.15 倍递增，支持 ×1 / ×10 / 最大 购买；累计收益达标后解锁下一座，深井矿道、潮汐电站、反物质熔炉与档案馆还要求前置建筑数量。 |
| 升级 | 33 个一次性升级排成科技树，分点击 / 建筑 / Boss / 自动开采 / 全局 / 离线六条流派，带前置链；专属升级还要求回响等级或建筑数量。 |
| 回响 | 同一种建筑持有 25 / 50 / 100 / 200 座时升到 I–IV，单座产出 +15% / +30% / +50% / +80%；每累计 10 层全局 +2%，封顶 +30%。卡片四格刻度可长按查看进度。 |
| Boss | 18 个，伤害为「点击收益 ×4 + 当前产能」；护盾期点击伤害 ×2、建筑伤害 ×0.5，记忆吞噬者有两段血，二阶段按 60% 重算、总奖励 2.5 倍。击杀给金币，最后一个可打的 Boss 会满血重来。 |
| 成就 | 32 个，按建筑数、点击数、击杀数、累计收益、升级数、转生数、碎片数、回响、剧情、破盾与阶段解锁，奖励金币或碎片。 |
| 转生 | 本轮累计收益达 1M 后可转生，得 `floor(sqrt(累计收益 / 1M))` 个碎片，每碎片 +2% 全部收益；清空金币、建筑、升级，保留碎片、成就、剧情与商店等级。 |
| 碎片商店 | 产能 / 点击 / 战斗 / 离线 / 回响 / 档案六项永久加成，价格按等级平方增长。 |
| 离线收益 | 按离开时长结算，基础 50%，可经升级与商店提到 100%，上限 8 小时；关页面和后台挂起都算。 |
| 剧情 | 24 篇档案，按建造、Boss、回响等里程碑逐页解锁；通知条可直接跳转阅读，标签上有未读徽章。 |

底部标签上的数字是当前买得起的升级数，转生页的 `!` 表示已攒够一次转生。`1`–`6` 切换标签，`空格` 点击；地址栏锚点（如 `#story`）也能直接打开对应标签。设置里可切换主题（默认跟随系统）与振动反馈，安装到桌面，导出、导入、恢复、重置存档，清除离线缓存，也能复制诊断信息去 GitHub 提 issue。

## 裂隙纪事

矿井不是矿井，是一道裂缝；帝国不是帝国，是裂缝另一侧漏出来的光。你是第十八位醒来的人，镐柄上刻着「别停」。

剧情共 24 篇档案，随建造、Boss、回响等里程碑逐页解锁，不提供任何数值加成，也不影响放置节奏。解锁时会在底部弹出提示（可直接点「阅读」跳转），「剧情」标签上会显示未读数。没有解锁的章节只露出一条线索，读过的档案在转生后还会多出一段「回响」——同一件事，第二次看会不太一样。

## 技术结构

项目刻意保持小而直白，没有框架和状态库：

- **数值层是纯函数**（`src/game/balance.js`）：成本、产能、点击收益、回响、Boss 伤害与护盾/二阶段、离线结算、碎片计算都只依赖传入参数，公式由单元测试锁死。
- **单一状态对象 + 一个 rAF 循环**（`src/main.js`）：模拟逐帧推进，顶部数字与整页视图都按 10Hz 增量更新，写入前先比对旧值，只改真正变化的节点；切页和连点不掉帧，滚动位置也不会跳。
- **加成分类计算**：building / click / boss / global / offline 五类各自只乘一次，避免旧版重复相乘导致的数值虚高。
- **剧情是数据**（`src/game/story.js`）：每篇档案自带解锁条件，只读状态；解锁结果写进存档，转生清空进度也不会回退。
- **存档集中处理**（`src/game/state.js`）：`normalize()` 负责旧字段迁移、越界值夹取和坏档兜底；导出为带版本号的 JSON 文件，导入同时接受 JSON 与旧的 base64 存档码。覆盖类操作前把上一份写进独立备份键，解析失败的原档也会原样保留。
- **视图即函数**（`src/ui/views.js`）：每个标签页返回一段结构，内置增量刷新；图标通过 `data-icon` 占位，启动时由 `src/ui/icons.js` 统一注入 SVG。
- **主题不闪**：`<head>` 内联脚本在样式表之前定好主题，`theme-color` 跟着切换。

## 目录

```
index.html                应用外壳
assets/app.css            全部样式（深/浅双主题，移动优先）
assets/icon.svg           favicon / PWA 图标源文件
assets/icon-*.png         192 / 512 / maskable 应用图标
assets/art/               建筑、Boss、图标与场景插画（WebP，随 SW 预缓存）
assets/tex/               按钮材质：金面、石面、纸纹（WebP，随 SW 预缓存）
manifest.webmanifest      PWA 清单
sw.js                     离线缓存（网络优先，断网回落）
src/main.js               启动、标签页、主循环、设置面板、快捷键
src/game/data.js          建筑、升级、Boss、成就、商店数据表
src/game/story.js         剧情档案：24 篇文案与解锁条件
src/game/balance.js       纯函数数值层
src/game/state.js         存档结构、迁移、离线结算、导入导出、备份与坏档保留
src/ui/feedback.js        诊断信息文本（反馈用，不含存档）
src/game/engine.js        购买、攻击、转生、成就、tick
src/ui/views.js           六个页面的 DOM 构建与增量刷新
src/ui/format.js          数字 / 时间格式化
src/ui/icons.js           51 个 24×24 线性 SVG 图标
src/ui/theme.js           主题偏好（跟随系统 / 浅色 / 深色）
src/ui/floaters.js        点击 / 攻击飘字
src/ui/haptics.js         振动反馈开关
tests/                    node:test 用例（数值、存档迁移与边界、引擎、主题、格式化、剧情、反馈、页面契约、离线预缓存、版本）
```

## 部署

仓库自带 `.github/workflows/pages.yml`：推送到 `master` 后自动跑测试，把游戏本体（`index.html`、`sw.js`、`assets`、`src` 等）发布到 GitHub Pages，测试不过不会上线。首次使用在仓库 **Settings → Pages → Source** 选 **GitHub Actions**。

因为发布目录不含 `.git`、`tests` 和文档，线上访问不到源码之外的杂项文件。

## 安装到手机

用手机浏览器打开 Pages 地址。Android Chrome 会在设置里出现「添加到主屏幕」按钮，点一下即可安装；iOS Safari 用「分享」→「添加到主屏幕」。安装后全屏打开、离线可玩；长按桌面图标可直接进入「剧情」或「转生」。

进度在本地，换设备时先在设置里「导出存档」拿到 `idle-empire-日期.json`，在新设备打开游戏，用「导入存档」选中该文件即可。

## 反馈

遇到 bug 或想提建议，可以在设置里点「去 GitHub 提 issue」；旁边的「复制诊断信息」会带上版本、浏览器、屏幕、安装方式和进度计数（不含存档内容），粘贴到 issue 正文即可。也可以直接去 [Issues](https://github.com/shushuzn/idle-empire/issues)。

## 版本与文档

- [VERSIONING.md](VERSIONING.md)：版本号规则（第一位只在用户要求时改，`MINOR` / `PATCH` 怎么判定，同日 `MINOR` 最多 +1）与发布流程
- [ROADMAP.md](ROADMAP.md)：更新计划（下一个 `0.3.0` 与后续 `MINOR` 的游戏内容）
- [CHANGELOG.md](CHANGELOG.md)：完整版本记录（当前 v0.2.0）
- [CONTRIBUTING.md](CONTRIBUTING.md)：目录约定、代码风格、提交与 PR 流程
- [SECURITY.md](SECURITY.md)：漏洞报告渠道与攻击面说明
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)：协作行为准则

## 许可证

[MIT](LICENSE) © 2026 shushuzn

游戏代码、自绘图标和样式都可以自由使用、修改、分发，保留版权声明即可。
