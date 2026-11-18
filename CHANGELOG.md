# Changelog

本项目的版本记录，格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [3.9.0] - 2026-11-18

### Added

- 存档安全：导入或重置前自动留一份上一份进度，设置里可查看备份金币与时间并一键恢复；恢复不会覆盖备份本身。
- 存档解析失败时不再静默清空：原始内容会单独保留，启动提示条可直接导出为文本文件，设置里也会出现「导出损坏存档」。
- `tests/state.test.js` 新增备份往返、损坏备份、进度判定、坏档保留与重置边界用例（总计 54 项）。

### Changed

- 设置面板新增「存档安全」区块，空存档不占用备份位。
- Service Worker 缓存升到 `idle-empire-v3.9.0`。

## [3.8.0] - 2026-11-18

### Added

- 设置面板新增「反馈与建议」：一键复制版本、页面、浏览器、屏幕、安装方式与进度计数，并提供 GitHub issue 入口，不包含存档内容。
- `tests/feedback.test.js`：诊断信息格式用例（2 项，总计 48 项）。

### Changed

- Service Worker 缓存升到 `idle-empire-v3.8.0`。

## [3.7.0] - 2026-11-18

### Added

- 标签页与地址栏锚点同步：`#story`、`#prestige` 等可直接打开，刷新后停在原标签。
- 应用清单新增「裂隙纪事」「轮回转生」快捷方式，安装后长按图标可直达。
- 导入存档前先校验文件并确认覆盖，提示当前与存档内金币；非存档 JSON 不再清空进度（新增测试，总计 46 项）。
- `VERSIONING.md`：`MAJOR` / `MINOR` / `PATCH` 的判定标准、五处版本落点与发布流程。
- `tests/version.test.js`：校验 `package.json`、`sw.js`、`index.html`、`README.md`、`CHANGELOG.md` 的版本一致。

### Changed

- 带操作按钮的提示条停留时间由 12 秒缩短到 8 秒。
- 标签栏支持 `Home` / `End` 键；空格在按钮上不再误触挖矿。
- CONTRIBUTING 增加版本规则入口，修正视图页面数量描述。
- Service Worker 缓存升到 `idle-empire-v3.7.0`。

### Fixed

- 误选普通 JSON 文件导入会清空进度。
- 焦点在按钮上按空格会触发挖矿，而不是激活按钮。
- 设置弹窗打开时提示条被压在弹窗下面，存档、导出、导入的结果看不见；改为面板内状态行，带操作的提示等关闭后再弹。

## [3.6.0] - 2026-11-18

### Added

- 设置面板新增「安装到桌面」：支持 `beforeinstallprompt` 的浏览器可一键安装，iOS 给出手动添加到主屏幕的步骤。
- 存档导出现在会下载 `idle-empire-YYYY-MM-DD.json` 文件；导入支持选择 JSON 文件，也兼容上一版的 base64 存档码。
- 断网 / 恢复网络时给出轻提示，断网期间游戏照常运行。
- 应用清单补充 `lang`、`dir`、`categories`、`display_override` 等字段。
- 存档测试新增 JSON 与 base64 双格式导入用例（总计 44 项）。

### Changed

- 设置里「导出存档 / 导入存档」从剪贴板与 `prompt` 改为文件下载与文件选择。
- Service Worker 缓存版本升到 `idle-empire-v3.6.0`。

### Fixed

- 存档文件换设备后无法直接导入的问题；JSON 文本即使带首尾空白也能识别。

## [3.5.0] - 2026-11-18

### Added

- 剧情档案「裂隙纪事」：18 篇短文，随建造、点击、Boss、转生等里程碑逐页解锁。
- 新增「剧情」标签页：未读徽章、解锁提示条（可直接跳转阅读）、未解锁章节的线索提示。
- 转生后，读过的档案会多出一段「回响」，补全轮回视角。
- 设置面板新增「剧情档案」统计；重置进度会一并清空档案。
- `tests/story.test.js`：解锁、去重、迁移、已读逻辑用例（8 项，总计 43 项）。

### Changed

- 底部标签栏扩为 6 个标签，快捷键增加 `6` 打开剧情。
- 存档结构升到 v4，新增 `story.unlocked` / `story.read`，旧档自动补默认值。
- Service Worker 缓存版本升到 `idle_empire-v3.5.0`，预缓存加入 `story.js`。

## [3.4.0] - 2026-11-18

### Added

- 主循环每 20 秒自动存档，崩溃时最多丢 20 秒进度。
- Service Worker 更新提示（「新版本已就绪 / 刷新」），回到前台主动检查更新。
- 每个标签页记住自己的滚动位置。
- 标签栏支持左右方向键切换（roving tabindex）。
- 设置底部显示版本号、MIT 许可与源码链接。
- `tests/format.test.js`：数字、时间、百分比格式化用例（6 项，总计 35 项）。

### Changed

- 切后台 1–5 秒的收益不再丢弃，超过 1 秒即按离线规则补算。
- 数字格式化去掉多余尾零（`1.50` → `1.5`，`1.50B` → `1.5B`）。

### Fixed

- 常驻刷新区域带 `aria-live`，导致读屏器持续朗读数字变化。
- 弹窗缺少 `aria-labelledby` / `aria-describedby` 标注。
- 系统开启「减少动态效果」时飘字仍会播放。

## [3.3.0] - 2026-11-18

### Added

- 自绘 24×24 线性 SVG 图标集（50 个，`src/ui/icons.js`），界面不再使用 emoji。
- 图标按分类上色：6 组色调，深色/浅色主题各一套。
- HTML 支持 `data-icon` 占位，启动时统一注入 SVG。
- 工程文件：LICENSE、CHANGELOG、CONTRIBUTING、SECURITY、CODE_OF_CONDUCT、
  `.editorconfig`、`.gitattributes`、`.nvmrc` 与 GitHub issue/PR 模板。

### Changed

- 重画 favicon / PWA 图标（金色城堡），192/512/maskable 三张 PNG 由同一份 SVG 渲染。
- Service Worker 缓存版本升到 `idle_empire-v3.3.0`，预缓存加入 `icons.js`。

### Fixed

- 已购买的升级仍显示购买按钮（`.buy[hidden]` 被 `display: grid` 覆盖）。

## [3.2.0]

### Added

- 主题默认跟随系统，设置里可锁定浅色 / 深色。
- 监听 `prefers-color-scheme`，系统切换时实时换肤。

### Changed

- 浅色主题由 `<head>` 内联脚本在样式表之前确定，刷新不闪黑屏。
- `theme-color` 随主题切换。

## [3.1.0]

### Added

- 后台回前台补算收益，离开超过 5 分钟用弹窗结算。
- PWA：安装清单、192/512/maskable 图标、`sw.js` 离线缓存。
- 点击 / 攻击飘字与振动反馈（可关）、标签徽章、无障碍标注。

### Changed

- 第 13–18 座建筑重新定价，按回本时间平滑重排。

### Fixed

- 视图派发的 `toast` 事件没人接，Boss 击杀、转生、商店升级没有提示。

## [3.0.0]

### Added

- 无依赖静态重写：`src/game`（数据、数值、存档、引擎）+ `src/ui`（视图、格式化、反馈）。
- 单 rAF 主循环、卡片只建一次、按帧增量更新。
- 存档 v3 结构与旧版存档自动迁移。

### Changed

- 移动端布局：底部标签栏、吸底点击条、`100dvh` 与安全区适配，360px 宽无横向溢出。

### Removed

- 收藏品、神器、赛季、随机事件、每日任务、王朝天赋等半成品系统。
