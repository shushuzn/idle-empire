// 游戏数据表：建筑、升级、Boss、成就、永久商店

export const BUILDINGS = [
  { id: 'mine', name: '金矿', desc: '开采金矿，一切的起点', baseCost: 10, baseProduction: 1.5, icon: '⛏️' },
  { id: 'lumber', name: '伐木场', desc: '砍伐木材出售', baseCost: 100, baseProduction: 6, icon: '🪓' },
  { id: 'farm', name: '农场', desc: '种植并出售农作物', baseCost: 500, baseProduction: 22, icon: '🌾' },
  { id: 'factory', name: '工厂', desc: '批量生产商品', baseCost: 3000, baseProduction: 100, icon: '🏭' },
  { id: 'bank', name: '银行', desc: '让钱自己生钱', baseCost: 50000, baseProduction: 500, icon: '🏦' },
  { id: 'castle', name: '城堡', desc: '帝国的心脏', baseCost: 500000, baseProduction: 2500, icon: '🏰' },
  { id: 'temple', name: '神殿', desc: '祈福带来财富', baseCost: 5000000, baseProduction: 15000, icon: '🛕' },
  { id: 'station', name: '太空站', desc: '做星际贸易', baseCost: 50000000, baseProduction: 100000, icon: '🚀' },
  { id: 'quantum', name: '量子实验室', desc: '量子技术放大收益', baseCost: 800000000, baseProduction: 1200000, icon: '⚛️' },
  { id: 'dyson', name: '戴森环', desc: '围住恒星收集能量', baseCost: 12000000000, baseProduction: 15000000, icon: '☀️' },
  { id: 'time', name: '时间机器', desc: '穿越时空搬财富', baseCost: 200000000000, baseProduction: 200000000, icon: '⏰' },
  { id: 'multiverse', name: '多元宇宙门户', desc: '跨维度收割能量', baseCost: 3000000000000, baseProduction: 2700000000, icon: '🌀' },
  { id: 'research', name: '研究院', desc: '用前沿科技提效', baseCost: 50000000000000, baseProduction: 42000000000, icon: '🔬' },
  { id: 'stargate', name: '星际之门', desc: '直通遥远星系', baseCost: 500000000000000, baseProduction: 400000000000, icon: '🌠' },
  { id: 'dark', name: '暗能量采集器', desc: '收集宇宙暗能量', baseCost: 800000000000000, baseProduction: 600000000000, icon: '🌑' },
  { id: 'rift', name: '时空裂隙', desc: '连接不同时空', baseCost: 5000000000000000, baseProduction: 3500000000000, icon: '⏳' },
  { id: 'warp', name: '现实扭曲器', desc: '改写物理法则', baseCost: 50000000000000000, baseProduction: 32000000000000, icon: '🔮' },
  { id: 'infinity', name: '无限引擎', desc: '驱动无限可能（需转生）', baseCost: 500000000000000000, baseProduction: 300000000000000, icon: '♾️', rebirthRequired: true },
];

export const UPGRADES = [
  { id: 'click1', name: '点击强化 I', desc: '点击收益 +20%', cost: 500, effect: ['click', 0.2] },
  { id: 'click2', name: '点击强化 II', desc: '点击收益 +30%', cost: 5000, effect: ['click', 0.3], req: 'click1' },
  { id: 'click3', name: '点击强化 III', desc: '点击收益 +40%', cost: 50000, effect: ['click', 0.4], req: 'click2' },
  { id: 'click4', name: '点击强化 IV', desc: '点击收益 +50%', cost: 500000, effect: ['click', 0.5], req: 'click3' },
  { id: 'click5', name: '点击强化 V', desc: '点击收益 +100%', cost: 5000000, effect: ['click', 1.0], req: 'click4' },

  { id: 'speed1', name: '建筑加速 I', desc: '建筑产出 +15%', cost: 1000, effect: ['building', 0.15] },
  { id: 'speed2', name: '建筑加速 II', desc: '建筑产出 +25%', cost: 10000, effect: ['building', 0.25], req: 'speed1' },
  { id: 'speed3', name: '建筑加速 III', desc: '建筑产出 +35%', cost: 100000, effect: ['building', 0.35], req: 'speed2' },
  { id: 'speed4', name: '建筑加速 IV', desc: '建筑产出 +50%', cost: 1000000, effect: ['building', 0.5], req: 'speed3' },
  { id: 'speed5', name: '建筑加速 V', desc: '建筑产出 +100%', cost: 10000000, effect: ['building', 1.0], req: 'speed4' },

  { id: 'boss1', name: '屠戮者 I', desc: '对 Boss 伤害 +25%', cost: 2000, effect: ['boss', 0.25] },
  { id: 'boss2', name: '屠戮者 II', desc: '对 Boss 伤害 +40%', cost: 20000, effect: ['boss', 0.4], req: 'boss1' },
  { id: 'boss3', name: '屠戮者 III', desc: '对 Boss 伤害 +60%', cost: 200000, effect: ['boss', 0.6], req: 'boss2' },
  { id: 'boss4', name: '屠戮者 IV', desc: '对 Boss 伤害 +100%', cost: 2000000, effect: ['boss', 1.0], req: 'boss3' },

  { id: 'auto1', name: '自动开采 I', desc: '每秒额外获得点击收益的 50%', cost: 25000, effect: ['auto', 0.5] },
  { id: 'auto2', name: '自动开采 II', desc: '每秒额外获得点击收益的 100%', cost: 300000, effect: ['auto', 1.0], req: 'auto1' },

  { id: 'global1', name: '帝国荣耀 I', desc: '全局收益 +10%', cost: 5000000, effect: ['global', 0.1], req: 'speed5' },
  { id: 'global2', name: '帝国荣耀 II', desc: '全局收益 +20%', cost: 50000000, effect: ['global', 0.2], req: 'global1' },
  { id: 'global3', name: '帝国荣耀 III', desc: '全局收益 +30%', cost: 500000000, effect: ['global', 0.3], req: 'global2' },

  { id: 'offline1', name: '离线契约 I', desc: '离线收益从 50% 提到 70%', cost: 750000, effect: ['offline', 0.2] },
  { id: 'offline2', name: '离线契约 II', desc: '离线收益再 +20%（90%）', cost: 20000000, effect: ['offline', 0.2], req: 'offline1' },
];

export const BOSSES = [
  { id: 'goblin', name: '哥布林首领', icon: '👺', hp: 80, reward: 550, unlockAt: 1000 },
  { id: 'troll', name: '洞穴巨魔', icon: '🧌', hp: 800, reward: 5500, unlockAt: 10000 },
  { id: 'dragon', name: '远古巨龙', icon: '🐉', hp: 8000, reward: 55000, unlockAt: 100000 },
  { id: 'demon', name: '深渊恶魔', icon: '👿', hp: 80000, reward: 550000, unlockAt: 1000000 },
  { id: 'titan', name: '泰坦巨人', icon: '👽', hp: 800000, reward: 5500000, unlockAt: 10000000 },
  { id: 'void', name: '虚空领主', icon: '🌌', hp: 8000000, reward: 55000000, unlockAt: 100000000 },
  { id: 'guardian', name: '永恒守护者', icon: '⏰', hp: 80000000, reward: 550000000, unlockAt: 1000000000 },
  { id: 'god', name: '多元宇宙之神', icon: '🌀', hp: 800000000, reward: 5500000000, unlockAt: 10000000000 },
  { id: 'chaos', name: '混沌魔神', icon: '💀', hp: 10000000000, reward: 50000000000, unlockAt: 100000000000 },
  { id: 'eye', name: '全知之眼', icon: '👁️', hp: 100000000000, reward: 500000000000, unlockAt: 1000000000000, rebirthRequired: true },
  { id: 'darklord', name: '暗物质领主', icon: '🌑', hp: 1000000000000, reward: 5000000000000, unlockAt: 10000000000000 },
  { id: 'wraith', name: '时空幽灵', icon: '⏳', hp: 10000000000000, reward: 50000000000000, unlockAt: 100000000000000 },
  { id: 'shatterer', name: '现实碎裂者', icon: '💎', hp: 100000000000000, reward: 500000000000000, unlockAt: 1000000000000000 },
  { id: 'tyrant', name: '无限暴君', icon: '♾️', hp: 1000000000000000, reward: 5000000000000000, unlockAt: 10000000000000000, rebirthRequired: true },
  { id: 'emperor', name: '虚空帝王', icon: '🏛️', hp: 10000000000000000, reward: 50000000000000000, unlockAt: 100000000000000000, rebirthRequired: true },
];

export const ACHIEVEMENTS = [
  { id: 'b10', name: '初露锋芒', desc: '拥有 10 个建筑', icon: '🏗️', cond: ['buildings', 10], reward: ['gold', 1000] },
  { id: 'b50', name: '建筑大师', desc: '拥有 50 个建筑', icon: '🏗️', cond: ['buildings', 50], reward: ['gold', 10000] },
  { id: 'b100', name: '帝国建造者', desc: '拥有 100 个建筑', icon: '🏗️', cond: ['buildings', 100], reward: ['shards', 1] },
  { id: 'b250', name: '建筑大亨', desc: '拥有 250 个建筑', icon: '🏗️', cond: ['buildings', 250], reward: ['shards', 2] },

  { id: 'c100', name: '手指热身', desc: '点击 100 次', icon: '👆', cond: ['clicks', 100], reward: ['gold', 500] },
  { id: 'c1000', name: '疯狂点击', desc: '点击 1,000 次', icon: '👆', cond: ['clicks', 1000], reward: ['gold', 5000] },
  { id: 'c10000', name: '点击机器', desc: '点击 10,000 次', icon: '👆', cond: ['clicks', 10000], reward: ['shards', 1] },

  { id: 'k1', name: '新手猎人', desc: '击败 1 个 Boss', icon: '⚔️', cond: ['kills', 1], reward: ['gold', 5000] },
  { id: 'k10', name: 'Boss 杀手', desc: '击败 10 个 Boss', icon: '⚔️', cond: ['kills', 10], reward: ['gold', 50000] },
  { id: 'k50', name: '传奇屠戮者', desc: '击败 50 个 Boss', icon: '⚔️', cond: ['kills', 50], reward: ['shards', 2] },

  { id: 'g10k', name: '小有积蓄', desc: '累计获得 10K 金币', icon: '💰', cond: ['earned', 10000], reward: ['gold', 1000] },
  { id: 'g1m', name: '富翁', desc: '累计获得 1M 金币', icon: '💎', cond: ['earned', 1000000], reward: ['gold', 100000] },
  { id: 'g1b', name: '亿万富翁', desc: '累计获得 1B 金币', icon: '💎', cond: ['earned', 1000000000], reward: ['shards', 1] },
  { id: 'g1t', name: '财富传奇', desc: '累计获得 1T 金币', icon: '👑', cond: ['earned', 1000000000000], reward: ['shards', 3] },

  { id: 'u5', name: '升级爱好者', desc: '购买 5 个升级', icon: '⬆️', cond: ['upgrades', 5], reward: ['gold', 25000] },
  { id: 'u12', name: '全面强化', desc: '购买 12 个升级', icon: '⬆️', cond: ['upgrades', 12], reward: ['shards', 1] },

  { id: 'r1', name: '轮回初体验', desc: '首次转生', icon: '🔄', cond: ['rebirths', 1], reward: ['shards', 2] },
  { id: 'r5', name: '转生者', desc: '转生 5 次', icon: '🔄', cond: ['rebirths', 5], reward: ['shards', 5] },
  { id: 'r10', name: '永恒轮回', desc: '转生 10 次', icon: '🔄', cond: ['rebirths', 10], reward: ['shards', 10] },

  { id: 's10', name: '碎片收藏家', desc: '持有 10 个碎片', icon: '🔷', cond: ['shards', 10], reward: ['gold', 1000000] },
];

// 转生商店：用碎片买永久加成
export const SHOP = [
  { id: 'idle', name: '产能核心', desc: '每级建筑产出 +8%', max: 15, base: 2 },
  { id: 'click', name: '点击核心', desc: '每级点击收益 +12%', max: 15, base: 2 },
  { id: 'boss', name: '战斗核心', desc: '每级 Boss 伤害 +10%', max: 15, base: 2 },
  { id: 'offline', name: '离线核心', desc: '每级离线收益 +6%', max: 10, base: 3 },
];

export const OFFLINE_CAP_HOURS = 8;
