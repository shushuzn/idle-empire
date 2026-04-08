# Idea Pool — idle-empire

> Stage: 💡 active | 📋 proposed | 🔬 running | 📦 shipped | 💀 killed | ⏸️ dormant

## Ideas

- [2026-04-05] 📦 赛季系统 — 每月一个赛季，参与，完成挑战、排名上榜，获得赛季限定奖励 | expected_benefit: 制造周期性目标，刺激回访和竞争 | reason: 已有Boss框架，改数据+时间触发即可 | score: 2x2=4 | [brainstorm] | status: shipped
  - approach: BOSSES表加season字段，每月重置，CURRENT_SEASON状态标记

- [2026-04-05] 📦 里程碑系统 — 达到特定金币/Boss数触发里程碑节点，发放阶段奖励 | expected_benefit: 给玩家清晰阶段目标，减少成长迷茫感 | reason: game.js已有milestones变量，加UI里程碑进度条 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: js/game.js加MILESTONES配置数组，init()检查达成触发奖励，ResourceBar显示进度

- [2026-04-05] 📦 幸运事件系统 — 随机触发"暴风雨"、"金币雨"等事件，持续时间内获得加成 | expected_benefit: 惊喜感，打破刷建筑的重复节奏 | reason: setInterval每分钟roll一个random，触发时showMsg+加生效 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: js/events.js，随机事件表，触发时通知UI弹窗，加成在对应multiplier里算

- [2026-04-05] 📦 服务器时间同步 — 客户端每5分钟校准一次服务器时间，防止本地clock篡改离线奖励 | expected_benefit: 堵住离线奖励漏洞，防止本地时间作弊 | reason: 纯前端用ntpdate-like接口校准，误差±2秒内可接受 | score: 2x2=4 | [brainstorm] | status: shipped
  - approach: Date.now()校准偏移量，每次计算离线时间时用校正后时间

- [2026-04-05] 📦 成就稀有度标签 — 成就根据达成人数比例显示稀有度标签（普通/稀有/史诗/传说）| expected_benefit: 给成就增加社交攀比元素，提升刷成就动力 | reason: achievement unlock时计算全局解锁率，achievementTab显示稀有度badge | score: 1x3=3 | [brainstorm] | status: shipped
  - approach: ACHIEVEMENTS_DATA加rarity字段，解锁时showMsg显示"全球前X%玩家解锁"

- [2026-04-05] 📦 建筑等级/品质皮肤 — 给建筑加稀有度颜色边框（白/绿/蓝/紫/橙），可视化升级路径 | expected_benefit: 视觉反馈更丰富，长期目标感更强 | reason: 建筑数据已有rarity字段，只需在UI渲染层加CSS样式 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: buildings.js每建筑加rarity字段（common/rare/epic/legendary），CSS加边框颜色，App.svelte渲染时应用class

- [2026-04-05] 📦 收藏品图鉴 — 收集所有收藏品后解锁图鉴面板，可以回顾每个碎片的来源和故事 | expected_benefit: 满足收集控，增加叙事深度 | reason: collectibles.js已有所有收藏品数据，加图鉴UI即可 | score: 1x2=2 | [brainstorm] | status: shipped
  - approach: ArtifactTab旁边加收藏品图鉴Tab，循环渲染所有收藏品状态

- [2026-04-05] 💡 故事叙事碎片 — 集齐特定收藏品组合解锁帝国历史故事碎片，阅读获得背景叙事 | expected_benefit: 增加RPG深度，给收集行为赋予意义 | reason: collectibles已有组合解锁逻辑，加文本表和阅读UI | score: 1x2=2 | [brainstorm] | status: active
  - approach: js/collectibles.js加STORY_FRAGMENTS配置，解锁时showMsg提示"发现新故事"

- [2026-04-05] 💡 自定义头像框 — 玩家可选头像框装饰（对应成就解锁），在统计面板展示 | expected_benefit: 个性化展示，成就在游戏内有更多存在价值 | reason: achievements已有icon字段，头像框是纯UI层，显示在statsTab顶部 | score: 1x2=2 | [brainstorm] | status: active
  - approach: StatsTab顶部加头像框选择栏，已解锁成就关联可选头像框

- [2026-04-05] 📦 离线收益保护机制 — 超过24小时未上线玩家返回时，额外补偿离线收益损失 | expected_benefit: 照顾非每日登录玩家，减少因落后太多而流失 | reason: init()计算离线时长，超过24h补50%额外离线收益 | score: 2x2=4 | [brainstorm] | status: shipped
  - approach: init()检查lastActive，超过24h则gold += offlineEarnings × 0.5补偿

- [2026-04-05] 💡 每日签到奖励补签 — 允许用金币购买补签卡，补回遗漏的天数 | expected_benefit: 减少因偶尔遗漏导致连续签到断开的惩罚，提升留存 | reason: dailyLogin已有lastLogin逻辑，加补签卡消耗和逻辑 | score: 1x2=2 | [brainstorm] | status: active
  - approach: game.js加makeUpMissedDays()，消耗金币补全中间遗漏的天数

- [2026-04-05] 📦 声望/声望商店 — 添加声望货币，完成每日/每周挑战获得，用于购买专属外观和特权 | expected_benefit: 增加长期追求，提供外观付费点，不影响数值平衡 | reason: 新建REPUTATION状态和prestigeShop类似的管理器， ReputationTab展示 | score: 2x2=4 | [brainstorm] | status: shipped
  - approach: G.reputation + DAILY_QUESTS/WEEKLY_QUESTS配置，声望商店买头像框/皮肤/称号

- [2026-04-05] 📦 每周Boss rush模式 — 每周一次，所有Boss按顺序连续挑战，中间不暂停，奖励x3 | expected_benefit: 硬核挑战模式，给玩家高难度目标 | reason: 只需修改boss循环逻辑，加BOSSRUSH_MODE flag | score: 1x3=3 | [brainstorm] | status: shipped
  - approach: BossTab加"Rush模式"按钮，启动后连续击败所有Boss不停顿，结束后发放三倍奖励

- [2026-04-05] 📦 统计面板导出CSV — 统计标签页加导出按钮，把建筑数量/GPS/成就等导出为CSV | expected_benefit: 方便玩家分析进度，做游戏外记录 | reason: 游戏已有stats数据结构，生成CSV字符串用Blob下载，5行代码 | score: 2x2=4 | [brainstorm] | status: shipped
  - approach: stats标签加导出按钮，generateCSV()读取G状态，拼接Tab分隔字符串，Blob下载

- [2026-04-05] 📦 快捷键系统 — 键盘Q/W/E切换购买模式，Space点击，1-7切换标签页 | expected_benefit: 减少鼠标依赖，核心操作效率提升 | reason: game.js已有keydown监听，加键位映射表即可 | score: 1x3=3 | [brainstorm] | status: shipped
  - approach: game.js加keyBindings对象，handleKeydown()匹配并触发对应操作

- [2026-04-05] 📦 成就进度百分比 — 每个成就卡片上显示当前进度条，直观看到距离解锁还有多远 | expected_benefit: 减少成就达成的模糊感，提供清晰目标指引 | reason: achievements.js已有condition配置，可计算进度百分比 | score: 1x3=3 | [brainstorm] | status: shipped
  - approach: AchievementTab渲染时对每个未解锁成就加progress bar

- [2026-04-05] 📦 成就收藏品套装奖励 — 达成特定成就组合触发套装奖励，额外金币/GPS加成 | expected_benefit: 激励玩家研究所有成就，增加二周目动力 | reason: achievements数组已有，套装表加配置，checkSetBonuses()在成就解锁时调用 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: achievements.js加SET_BONUSES配置，解锁成就时检查是否达成套装条件，触发额外奖励

- [2026-04-05] 📦 每周挑战Boss — 每周随机一个Boss加2倍血量和3倍奖励，击杀后上榜 | expected_benefit: 提升回访率，给硬核玩家长期目标 | reason: boss.js已有Boss数据，加challenge字段和leaderboard数组，UI在BossTab展示 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: 每周五0点重置，从BOSSES中随机选一个，hp×2 reward×3，结果存G.challengeBoss

- [2026-04-05] 📦 转生终极天赋树 — 在现有王朝天赋外加终极天赋树，需要多次转生解锁深层强化 | expected_benefit: 给长期玩家提供深度成长路径，大幅增强RPG感 | reason: dynastyTalents已有框架，天赋树是界面+数值层，在rebirthTab加一个子面板 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: 转生Tab增加天赋树视图，每个节点消耗转生点数，前置节点解锁后续

- [2026-04-05] 📦 建筑专属皮肤 — 每种建筑可装备不同外观皮肤，稀有度越高越华丽 | expected_benefit: 丰富收集要素，增加付费点和长期目标 | reason: buildings.js已有rarity字段，皮肤只是icon映射，BuildingTab加选择器 | score: 2x2=4 | [brainstorm] | status: shipped
  - approach: G.buildings[id].skin字段，皮肤商城用金币购买，渲染时用skin.icon替换b.icon

- [2026-04-05] 📦 Boss自动攻击速度可视化 — Boss血条下方显示攻击速度条，每次攻击时闪烁，增强战斗感知 | expected_benefit: Boss战更有紧张感，打击感更强 | reason: boss.js已有attackSpeed数据，只需在UI加攻击动画 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: boss战斗面板加攻击动画class，attack时触发flash，CSS animation 50ms

- [2026-04-05] 📦 离线进度计算 — 返回游戏时计算离线时长 × GPS，发放离线收益并展示明细 | expected_benefit: 增强玩家粘性，不用每天重新打开 | reason: 游戏已有GPS计算逻辑，离线只是乘以时间；存档存lastActive时间戳 | score: 3x2=6 | [brainstorm] | status: shipped
  - approach: init()时计算(Date.now() - lastActive) × gps，发放金币/建筑收入，展示离线收益面板

- [2026-04-05] 📦 建筑数量角标 — Tab栏建筑按钮上显示已购建筑种类数角标（3/16）| expected_benefit: 直观看到收集进度，激励玩家集齐所有建筑 | reason: updateTabCounts()已存在，加一个角标逻辑2行 | score: 1x3=3 | [brainstorm] | status: shipped
  - approach: init()时计算已购建筑种类数，updateTabCounts()加角标文本到建筑Tab按钮

- [2026-04-05] 📦 每日首次登录奖励 — 每天第一次打开游戏时发放随机小奖励（金币/收藏品碎片）| expected_benefit: 提升回访率，给玩家每日登录的理由 | reason: 存档已有lastLogin字段，init()比对日期后发放，奖励池5-6种 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: init()检查lastLogin是否是今天，不是则发奖励并更新lastLogin，showMsg提示获得内容

- [2026-04-05] 📦 成就解锁通知Toast — 成就解锁后弹出持久Toast，点击或手动关闭，不自动消失 | expected_benefit: 让玩家注意到成就达成，增强正反馈 | reason: 游戏已有Toast组件，直接复用，监听成就事件即可 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: game.js监听成就解锁事件，弹出不自动消失的Toast，CSS动画已有基础

- [2026-04-05] 📦 存档加密/混淆 — 对localStorage存档做简单Base64+XOR混淆，防止普通玩家误改 | expected_benefit: 保护游戏平衡，防止作弊破坏进度 | reason: 仅在前端storage层改动，save.js加解密函数5行，不影响游戏逻辑 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: save.js的saveGame/loadGame加XOR混淆，key固定或从游戏进度hash派生

- [2026-04-05] 📦 离线挂机收益预览 — 在游戏主界面显示"离线可获得 X 金币"，离开页面时提示 | expected_benefit: 明确离线收益预期，增强回访动力 | reason: loadGame已有gps计算，加一个显示字段到status区域 | score: 1x3=3 | [brainstorm] | status: shipped
  - approach: loadGame成功后计算offlineEarnings，存到变量，init()后在status区显示"离线收益：X"

- [2026-04-05] 📦 AI游戏顾问 — 在游戏界面侧边栏显示AI建议，根据当前进度推荐最优操作 | expected_benefit: 降低新手门槛，帮助玩家找到最佳升级路径 | reason: 游戏已有GPS/Boss数据，可以推算最佳下一步 | score: 2x2=4 | [brainstorm] | status: shipped
  - approach: AiAdvisorPanel已存在，只需加推荐逻辑，计算下一个建筑的ROI

- [2026-04-05] 📦 新手引导优化 — 分步骤气泡指引首次玩家：点击→买建筑→打Boss→转生 | expected_benefit: 降低上手门槛，减少新玩家前5分钟流失 | reason: Tutorial.svelte已有框架，只需扩展步骤和数据 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: Tutorial.svelte扩展为步骤式向导，每步高亮对应UI区域，附带文字说明

- [2026-04-05] 📦 建筑动画特效 — 购买建筑时播放入场动画（缩放+光晕），增强购买反馈 | expected_benefit: 让购买更有爽感，减少刷建筑的重复感 | reason: CSS animation即可，每个建筑卡片加trigger类名 | score: 1x3=3 | [brainstorm] | status: shipped
  - approach: BuildingTab购买后给对应卡加"purchase-flash"class，CSS animation 300ms

- [2026-04-05] 📦 统计面板数据趋势图 — 在StatsTab用文字/ASCII图显示关键指标的7日趋势 | expected_benefit: 让玩家看到自己的成长曲线，增强成就感 | reason: 存档已有历史快照点（lastSave），读取过去7天数据绘图 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: StatsTab加sparkline文字图（用字符绘制），基于lastSave快照数据

- [2026-04-05] 📦 建筑对比面板 — 在建筑按钮旁显示当前建筑 vs 下一个最强建筑的效益差值 | expected_benefit: 帮助玩家决策该买哪个建筑，减少迷茫 | reason: buildings已有gps数据，计算ROI差值在BuildingTab显示即可 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: BuildingTab卡片加"效益对比"标签，显示"比当前多+X/s"或"比X建筑多+Y/s"

- [2026-04-05] 📦 转生预览面板 — 在点击"王朝"按钮后弹出预览，显示重置将失去/保留什么 | expected_benefit: 降低转生焦虑，让玩家清楚知道代价和收益 | reason: performPrestige()前加一个预览弹窗，显示保留/重置列表 | score: 2x2=4 | [brainstorm] | status: shipped
  - approach: 点击王朝按钮先弹出预览Modal，确认后再执行performPrestige()

- [2026-04-05] 📦 声音开关与音效 — 为点击、购买、Boss击杀等关键动作添加音效 | expected_benefit: 增强沉浸感，提升"爽"的反馈 | reason: Web Audio API播放简短音效，无需外部文件，可用oscillator合成 | score: 1x2=2 | [brainstorm] | status: shipped
  - approach: js/game.js加playSound(type)函数，用AudioContext合成简单音调，Settings加mute开关

- [2026-04-05] 📦 移动端适配 — 优化布局为单栏，调整按钮尺寸，优化触摸目标区域 | expected_benefit: 支持手机访问，扩大玩家覆盖面 | reason: 已有响应式断点@media (max-width: 768px)，只需微调Navigation和BuildingTab | score: 1x2=2 | [brainstorm] | status: shipped
  - approach: 重点优化Tab导航为底部栏，BuildingTab网格改为单列，增加按钮尺寸到44px+

- [2026-04-05] 📦 成就/收藏品分享 — 生成分享链接/图片，展示玩家成就/收藏进度到社交媒体 | expected_benefit: 口碑传播，带来新玩家 | reason: 生成含进度数据的短URL或Canvas截图，Clipboard API复制 | score: 1x2=2 | [brainstorm] | status: shipped
  - approach: StatsTab加"分享"按钮，生成URL参数编码进度或Canvas截图，Copy to clipboard

- [2026-04-05] 📦 云端存档备份 — 导出/导入加密存档到本地文件，防止丢档 | expected_benefit: 解决玩家丢档焦虑，是最强留存功能 | reason: save.js已有存档逻辑，JSON stringify后Blob下载，5行 | score: 3x3=9 | [brainstorm] | status: shipped
  - approach: Settings加导出/导入按钮，saveGame读出JSON，Blob下载；导入读入JSON验证后覆盖localStorage

- [2026-04-05] 📦 多存档槽位 — 3个独立存档槽位，互不影响，方便切换不同游玩路线 | expected_benefit: 让玩家敢尝试不同策略，不用担心覆盖主档 | reason: localStorage加slots字段，Settings加槽位切换UI | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: G.slots = [null, null, null]，每次save指定slot，UI加slot切换下拉框

- [2026-04-05] 💡 全球排行榜 — 每周/历史两个榜，按金币/Boss/转生次数排名，提交需要截图验证 | expected_benefit: 激活竞争氛围，排行榜本身就是内容 | reason: 纯前端无法防作弊，用提交截图+荣誉系统结合 | score: 1x2=2 | [brainstorm] | status: active
  - approach: StatsTab加排行榜入口，展示前100名（前端hardcode mock数据），后续接API

- [2026-04-05] 💡 随机世界事件 — 每小时随机触发"金色建筑打折"、"Boss血量减半"等事件 | expected_benefit: 打破固定节奏，给每次登录带来惊喜 | reason: events.js已有事件系统，加随机触发逻辑和UI提示 | score: 2x3=6 | [brainstorm] | status: active
  - approach: setInterval(hourly) roll random，0-10%概率触发，从EVENTS池选一个，showMsg通知

- [2026-04-05] 📦 建筑羁绊系统 — 特定建筑组合同时在场时触发额外加成（如：矿场+冶炼厂=+50%产量）| expected_benefit: 增加策略深度，鼓励玩家研究建筑组合 | reason: buildings已有synergy字段，只需在GPS计算时检查在场建筑组合 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: BUILDINGS加synergy字段（array of required building ids），getSynergyBonus()在getBuildingMultiplier中计算

- [2026-04-05] 💡 随机稀有商人 — 每6小时出现随机商人，贩卖稀有外观道具/收藏品碎片 | expected_benefit: 增加惊喜回访理由，每6小时有理由看一眼 | reason: 神器/收藏品已有数据结构，只需加时间和随机商人逻辑 | score: 1x3=3 | [brainstorm] | status: active
  - approach: G.lastMerchantVisit，init()检查是否超过6小时，超过则弹出MerchantPanel

- [2026-04-05] 📦 每日挑战模式 — 每天一个随机规则（如"点击不给金币"、"建筑价格x3"），完成给奖励 | expected_benefit: 每日小目标，降低刷刷刷的重复感 | reason: CHALLENGES配置数组，init()选一个，应用到对应计算函数 | score: 2x3=6 | [brainstorm] | status: shipped
  - approach: DAILY_CHALLENGES配置，ensureChallengeState()初始化，clickGold/getBulkPurchaseInfo/getScaledBossHp/getCurrentGps应用修饰符

- [2026-04-05] 💡 收藏品交易系统 — 玩家之间可以交换收藏品碎片，需要双方确认 | expected_benefit: 社交维度，让游戏成为话题载体 | reason: 生成交易码（Base64编码），通过聊天/分享传输，Pairing逻辑 | score: 1x2=2 | [brainstorm] | status: active
  - approach: 生成交易offer（offer碎片 + request碎片），encode为交易码，Clipboard复制分享

- [2026-04-05] 💡 天气系统 — 不同天气影响不同建筑的产出（雨天=矿场+30%，晴天=农场+20%）| expected_benefit: 增加变化和策略感，引导玩家均衡发展 | reason: 天气随机生成（sunny/rainy/stormy/cloudy），每个计算乘以天气系数 | score: 1x3=3 | [brainstorm] | status: active
  - approach: G.weather随机setInterval(6h)，BuildingTab加天气图标和建筑加成显示

- [2026-04-05] 💡 建筑升级突破 — 建筑满级后可以用收藏品碎片突破，解锁更高等级上限 | expected_benefit: 给收藏品找到用途，提供长期数值天花板 | reason: collectibles已有碎片系统，buildings.js加breakthroughLevel字段 | score: 2x3=6 | [brainstorm] | status: active
  - approach: 每个建筑maxLevel，正常满级后消耗N个碎片突破，突破后继续升级

- [2026-04-05] 💡 暗金/传说品质专属特效 — 暗金和传说建筑有独特入场动画和持续特效（光环/粒子）| expected_benefit: 高稀有度建筑更有成就感，视觉反馈更强 | reason: CSS animation + JS classList切换，BuildingTab已有rarity边框可复用 | score: 1x3=3 | [brainstorm] | status: active
  - approach: rarity=legendary/darkgold的建筑卡加独特粒子CSS动画，purchase时触发
