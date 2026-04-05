# Idea Pool — idle-empire

> Stage: 💡 active | 📋 proposed | 🔬 running | 📦 shipped | 💀 killed | ⏸️ dormant

## Ideas

- [2026-04-05] 📦 存档加密/混淆 — 对localStorage存档做简单Base64+XOR混淆，防止普通玩家误改 | expected_benefit: 保护游戏平衡，防止作弊破坏进度 | reason: 仅在前端storage层改动，save.js加解密函数5行，不影响游戏逻辑 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: save.js的saveGame/loadGame加XOR混淆，key固定或从游戏进度hash派生

- [2026-04-05] 📦 成就解锁通知Toast — 成就解锁后弹出持久Toast，点击或手动关闭，不自动消失 | expected_benefit: 让玩家注意到成就达成，增强正反馈 | reason: 游戏已有Toast组件，直接复用，监听成就事件即可 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: game.js监听成就解锁事件，弹出不自动消失的Toast，CSS动画已有基础

- [2026-04-05] 📦 离线进度计算 — 返回游戏时计算离线时长 × GPS，发放离线收益并展示明细 | expected_benefit: 增强玩家粘性，不用每天重新打开 | reason: 游戏已有GPS计算逻辑，离线只是乘以时间；存档存lastActive时间戳 | score: 3x2=6 | [brainstorm] | status: shipped
  - approach: init()时计算(Date.now() - lastActive) × gps，发放金币/建筑收入，展示离线收益面板

- [2026-04-05] 📦 建筑等级/品质皮肤 — 给建筑加稀有度颜色边框（白/绿/蓝/紫/橙），可视化升级路径 | expected_benefit: 视觉反馈更丰富，长期目标感更强 | reason: 建筑数据已有rarity字段，只需在UI渲染层加CSS样式 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: buildings.js每建筑加rarity字段（common/rare/epic/legendary），CSS加边框颜色，App.svelte渲染时应用class
