# Changelog

本项目的版本记录，格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

- `ROADMAP.md`：短期 `0.2.0` 与长期五个 `MINOR` 的游戏内容计划。

### Changed

- 画风重做：矿灯暖金与裂隙紫的配色、衬线标题、岩层质感卡片、金锭点击条与更克制的阴影；浅色改为暖纸墨色。
- 重绘应用图标（城堡与裂隙），并补上标题标线、Boss 场裂隙光环等装饰细节。
- 主题色同步到 `theme-color` 与 `manifest.webmanifest`。
- `VERSIONING.md` 增加「版本只随计划版本完成而升」规则：当前规划版本完成并通过验收后才升版本。

## [0.1.0] - 2026-11-18

### Added

- 放置玩法：点击挖矿、18 座建筑、升级、Boss、成就、转生与碎片商店。
- 剧情档案「裂隙纪事」18 篇，随建造、点击、Boss、转生等里程碑解锁。
- 移动端界面：6 个标签、吸底点击条、浅色/深色主题、振动反馈、键盘快捷键与 `#story` / `#prestige` 锚点直达。
- PWA：安装引导、离线缓存、断网续玩与恢复网络提示。
- 存档：自动保存、JSON 导出导入、导入校验与覆盖确认、覆盖前备份、恢复上一份、坏档原文保留与导出。
- 设置与反馈：诊断信息复制、GitHub issue 入口。
- 工程：零依赖静态站点、版本规范、56 项 `node --test` 用例与 GitHub Pages 自动部署。
