# Changelog

本项目的版本记录，格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

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
