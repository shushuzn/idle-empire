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

- [2026-04-05] 📦 每日首次登录奖励 — 每天第一次打开游戏时发放随机小奖励（金币/收藏品碎片）| expected_benefit: 提升回访率，给玩家每日登录的理由 | reason: 存档已有lastLogin字段，init()比对日期后发放，奖励池5-6种 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: init()检查lastLogin是否是今天，不是则发奖励并更新lastLogin，showMsg提示获得内容

- [2026-04-05] 📦 建筑动画特效 — 购买/升级建筑时播放微缩动画（缩放弹跳+光效），增强升级反馈 | expected_benefit: 让每次购买更有成就感，减少刷建筑的枯燥感 | reason: CSS animation 3行，game.js触发时加class，building-card已有DOM结构 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: CSS加@keyframes bouncePurchase，buyBuilding成功时给对应card加bounce类，200ms后移除

- [2026-04-05] 📦 统计面板导出CSV — 统计标签页加导出按钮，把建筑数量/GPS/成就等导出为CSV | expected_benefit: 方便玩家分析进度，做游戏外记录 | reason: 游戏已有stats数据结构，生成CSV字符串用Blob下载，5行代码 | score: 2x2=4 | [brainstorm] | status: shipped
  - approach: stats标签加导出按钮，generateCSV()读取G状态，拼接Tab分隔字符串，Blob下载
