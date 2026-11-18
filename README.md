# 放置帝国 · Idle Empire

纯前端的放置/增量游戏：点矿攒金币，买建筑自动产出，打 Boss 拿奖励，攒够 1M 转生换永久碎片。无后端、无构建步骤、无运行时依赖，存档放在浏览器 localStorage。

## 怎么跑

```bash
python3 -m http.server 5173
# 打开 http://127.0.0.1:5173
```

也可以直接双击 `index.html`（ES module 在部分浏览器下会被 file:// 拦住，建议还是起个本地服务）。

## 部署

仓库已带 GitHub Actions 工作流 `.github/workflows/pages.yml`：推送到 `master` / `main` 后自动跑测试、把仓库根目录发布到 GitHub Pages。仓库设置里把 Pages 的 Source 选成 **GitHub Actions** 即可。

## 玩法

- **点击**：点顶部金色条，获得点击收益（基础 1，吃点击类升级、全局升级、碎片和商店加成）。
- **建筑**：18 种，成本按 1.15 倍递增；可切 ×1 / ×10 / 最大 购买。下一座建筑在累计收益达到门槛后出现。
- **升级**：22 个一次性升级，分点击、建筑、Boss、自动开采、全局、离线六类，有前置链。
- **Boss**：15 个，点击攻击造成「点击收益 ×4 + 当前产能」的伤害；击杀给金币，最后一个可打的 Boss 会满血重来，可以持续刷。
- **成就**：20 个，按建筑数、点击数、击杀数、累计收益、升级数、转生数、持碎片数解锁，奖励金币或碎片。
- **转生**：本轮累计收益达到 1M 后可转生，得到 `floor(sqrt(累计收益 / 1M))` 个碎片；每 1 碎片 +2% 全部收益。清空金币、建筑、升级，保留碎片、成就和商店等级。
- **碎片商店**：产能 / 点击 / 战斗 / 离线四个永久加成，价格按等级平方增长。
- **离线收益**：回来时按离线时长结算，默认 50%，有「离线契约」升级和商店加成，最多结算 8 小时。
- **快捷键**：`1`–`5` 切页，`空格` 点击。

## 目录

```
index.html                应用外壳
assets/app.css            全部样式（深/浅两套主题，移动优先）
assets/icon.svg           favicon / PWA 图标
manifest.webmanifest      PWA 清单
src/game/data.js          建筑、升级、Boss、成就、商店的数据表
src/game/balance.js       纯函数数值层（成本、产能、点击、Boss 伤害、离线、碎片）
src/game/state.js         存档结构、旧档迁移、离线结算、导出/导入
src/game/engine.js        购买、攻击、转生、成就、tick
src/ui/views.js           五个页面的 DOM 构建与增量刷新
src/ui/format.js          数字 / 时间格式化
src/main.js               启动、标签页、主循环、设置面板、快捷键
tests/*.test.js           node:test 用例（数值、存档、引擎）
```

```bash
npm test        # node --test tests/*.test.js，24 项
```

## v3 重写说明

旧版（v2.2）的问题和这次的处理：

| 旧问题 | 现在 |
|---|---|
| 仓库里没有 `index.html`，Svelte 版也缺入口，拉下来打不开 | 重写为静态站点，`index.html` 直接可用，不需要装依赖或构建 |
| 游戏逻辑是全局 `var G`，Svelte 适配层每 100ms 轮询 `window.G` 同步，切页/连点都掉帧 | 统一状态对象 + 单次 `requestAnimationFrame` 循环，视图只更新自己那几个节点 |
| 全局加成在建筑和点击里被重复相乘，数值虚高 | 加成拆成 building / click / boss / global / offline 五类，各算一次，测试锁死公式 |
| 数字格式化只到 `1e15`，再往上显示成 `Infinity` 或原样长串 | 支持 K→Dd 十四级后缀，`Infinity` 兜底为 `∞` |
| 离线收益无上限，隔几天回来直接通关 | 最多 8 小时，并可用升级/商店把比例从 50% 提到 100% |
| Boss 血量与索引分两处存，转生后容易对不上、出现血量超过上限 | 索引 + 血量统一在 `bossState()` 里收敛，越界自动回退 |
| 旧存档字段散乱（`prestigeShards`/`prestigeResets`/`prestigeShop.*Core`），坏档直接白屏 | `normalize()` 迁移旧字段、夹住负数与非法值，坏档退回默认值 |
| 移动端：hover 才能看到的操作、固定像素宽度、`100vh` 在 iOS 上被地址栏顶穿、按钮小于 44px | 底部标签栏 + 吸底点击条、`100dvh` + `env(safe-area-inset-*)`、所有按钮 ≥ 46px，360px 宽无横向溢出 |
| 每次操作整块 `innerHTML` 重建列表，手机上滚动位置会跳 | 卡片只建一次，按帧改 `textContent` 和 class |

删掉了 v2 里没有玩法的几个半成品系统（收藏品、神器、赛季、随机事件、每日任务、王朝天赋），Boss 与转生保留。数据表沿用旧版的金矿→无限引擎、哥布林→虚空帝王这条曲线。

存档键沿用 `idle_empire_save`，旧档第一次打开会自动迁移并提示，迁移后仍是同一份进度。
