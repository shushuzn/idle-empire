/**
 * gameAdapter.js
 * 桥接层：将现有 js/ 模块的状态同步到 Svelte store
 * 策略：100ms 轮询 window.G，最小化改动
 */

import { writable } from 'svelte/store';

// 成就稀有度映射（基于成就难度）
const ACHIEVEMENT_RARITIES = {
  // common: 早期/简单成就
  builder_1: 'common', builder_2: 'common',
  slayer_1: 'common',
  gold_1: 'common', gold_2: 'common',
  clicker_1: 'common', clicker_2: 'common',
  rebirth_1: 'common',
  artifact_1: 'common',
  collectible_1: 'common',
  milestone_1: 'common',
  // uncommon: 中期成就
  builder_3: 'uncommon', builder_4: 'uncommon',
  slayer_2: 'uncommon',
  gold_3: 'uncommon',
  clicker_3: 'uncommon',
  rebirth_2: 'uncommon',
  collectible_2: 'uncommon',
  milestone_2: 'uncommon',
  // rare: 后期成就
  slayer_3: 'rare',
  gold_4: 'rare',
  rebirth_3: 'rare',
  season_1: 'rare',
  collectible_3: 'rare',
  milestone_3: 'rare',
  // epic: 硬核成就
  slayer_4: 'epic',
  season_2: 'epic',
  artifact_2: 'epic',
  // legendary: 终极成就
  season_3: 'legendary',
  void_1: 'legendary',
  void_2: 'legendary',
};

const RARITY_LABELS = {
  common: '普通',
  uncommon: '稀有',
  rare: '史诗',
  legendary: '传说',
};

const RARITY_COLORS = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  legendary: '#f59e0b',
};

// 成就数据（从 achievements.js 复制）
const ACHIEVEMENTS_DATA = [
  { id: 'builder_1', name: '初露锋芒', desc: '拥有 10 个建筑', icon: '🏗️', reward: '1,000 金币' },
  { id: 'builder_2', name: '建筑大师', desc: '拥有 50 个建筑', icon: '🏗️', reward: '10,000 金币' },
  { id: 'builder_3', name: '帝国建造者', desc: '拥有 100 个建筑', icon: '🏗️', reward: '1 碎片' },
  { id: 'builder_4', name: '建筑大亨', desc: '拥有 500 个建筑', icon: '🏗️', reward: '2 碎片' },
  { id: 'slayer_1', name: '新手猎人', desc: '击败 1 个 Boss', icon: '⚔️', reward: '5,000 金币' },
  { id: 'slayer_2', name: 'Boss 杀手', desc: '击败 10 个 Boss', icon: '⚔️', reward: '50,000 金币' },
  { id: 'slayer_3', name: '传奇屠戮者', desc: '击败 50 个 Boss', icon: '⚔️', reward: '2 碎片' },
  { id: 'slayer_4', name: 'Boss 终结者', desc: '击败 100 个 Boss', icon: '⚔️', reward: '3 碎片' },
  { id: 'gold_1', name: '小有积蓄', desc: '累计获得 10K 金币', icon: '💰', reward: '1,000 金币' },
  { id: 'gold_2', name: '富翁', desc: '累计获得 1M 金币', icon: '💎', reward: '100,000 金币' },
  { id: 'gold_3', name: '亿万富翁', desc: '累计获得 1B 金币', icon: '💎', reward: '1 碎片' },
  { id: 'gold_4', name: '财富传奇', desc: '累计获得 1T 金币', icon: '👑', reward: '3 碎片' },
  { id: 'clicker_1', name: '手指热身', desc: '点击 100 次', icon: '👆', reward: '500 金币' },
  { id: 'clicker_2', name: '疯狂点击', desc: '点击 1000 次', icon: '👆', reward: '5,000 金币' },
  { id: 'clicker_3', name: '点击机器', desc: '点击 10000 次', icon: '👆', reward: '1 碎片' },
  { id: 'rebirth_1', name: '轮回初体验', desc: '首次转生', icon: '🔄', reward: '神器箱 x1' },
  { id: 'rebirth_2', name: '转生者', desc: '转生 5 次', icon: '🔄', reward: '2 碎片' },
  { id: 'rebirth_3', name: '永恒轮回', desc: '转生 10 次', icon: '🔄', reward: '5 碎片' },
  { id: 'artifact_1', name: '神器收藏家', desc: '拥有 5 个神器', icon: '💠', reward: '100,000 金币' },
  { id: 'artifact_2', name: '神器大师', desc: '拥有 10 个神器', icon: '💠', reward: '2 碎片' },
  { id: 'season_1', name: '赛季参与者', desc: '参与 1 次赛季', icon: '🏆', reward: '50,000 金币' },
  { id: 'season_2', name: '赛季老将', desc: '参与 5 次赛季', icon: '🏆', reward: '1 碎片' },
  { id: 'season_3', name: '赛季冠军', desc: '赛季排名前 10', icon: '🏆', reward: '3 碎片' },
  { id: 'collectible_1', name: '收藏爱好者', desc: '收集 5 个收藏品', icon: '🎁', reward: '50,000 金币' },
  { id: 'collectible_2', name: '收藏家', desc: '收集 10 个收藏品', icon: '🎁', reward: '2 碎片' },
  { id: 'collectible_3', name: '收藏大师', desc: '收集全部收藏品', icon: '🎁', reward: '5 碎片' },
  { id: 'milestone_1', name: '里程碑新手', desc: '完成 5 个里程碑', icon: '🎯', reward: '100,000 金币' },
  { id: 'milestone_2', name: '里程碑大师', desc: '完成 10 个里程碑', icon: '🎯', reward: '2 碎片' },
  { id: 'milestone_3', name: '里程碑传奇', desc: '完成全部里程碑', icon: '🎯', reward: '5 碎片' },
  { id: 'void_1', name: '暗物质探索者', desc: '累计获得 1Q 金币', icon: '🌑', reward: '5 碎片' },
  { id: 'void_2', name: '时空旅者', desc: '累计获得 1Qa 金币', icon: '⏳', reward: '10 碎片' },
];

// 建筑数据（从 js/buildings.js 完整复制，含 unlockAt/rebirthRequired/hidden/color）
const BUILDINGS_DATA_SRC = [
  { id: 'mine',         name: '金矿',           desc: '开采珍贵的金矿',        baseCost: 10,            baseProduction: 1.5,         icon: '⛏️',  color: '#ffd700' },
  { id: 'lumber',       name: '伐木场',         desc: '砍伐木材出售',          baseCost: 100,           baseProduction: 6,           icon: '🪓',   color: '#8b4513',   unlockAt: 100 },
  { id: 'farm',         name: '农场',           desc: '种植农作物',            baseCost: 500,           baseProduction: 22,          icon: '🌾',   color: '#90ee90',   unlockAt: 500 },
  { id: 'factory',      name: '工厂',           desc: '批量生产商品',          baseCost: 3000,          baseProduction: 100,         icon: '🏭',   color: '#808080',   unlockAt: 3000 },
  { id: 'bank',         name: '银行',           desc: '钱生钱的秘诀',          baseCost: 50000,         baseProduction: 500,         icon: '🏦',   color: '#4169e1',   unlockAt: 50000 },
  { id: 'castle',       name: '城堡',           desc: '帝国的心脏',            baseCost: 500000,        baseProduction: 2500,        icon: '🏰',   color: '#9370db',   unlockAt: 500000 },
  { id: 'temple',       name: '神殿',           desc: '祈福带来财富',          baseCost: 5000000,       baseProduction: 15000,      icon: '🛕',   color: '#ffdab9',   unlockAt: 5000000 },
  { id: 'spaceship',    name: '太空站',         desc: '星际贸易帝国',          baseCost: 50000000,      baseProduction: 100000,     icon: '🚀',   color: '#00ffff',   unlockAt: 50000000 },
  { id: 'quantum_lab',  name: '量子实验室',     desc: '量子技术驱动收益爆发',   baseCost: 800000000,     baseProduction: 1200000,    icon: '⚛️',   color: '#7c3aed',   unlockAt: 500000000 },
  { id: 'dyson_ring',   name: '戴森环',         desc: '围绕恒星收集能量',      baseCost: 12000000000,   baseProduction: 15000000,   icon: '☀️',   color: '#f59e0b',   unlockAt: 8000000000 },
  { id: 'time_machine', name: '时间机器',       desc: '穿越时空获取财富',      baseCost: 200000000000,  baseProduction: 200000000,  icon: '⏰',   color: '#9f7aea',   unlockAt: 80000000000 },
  { id: 'multiverse',   name: '多元宇宙门户',    desc: '跨维度能量收集',        baseCost: 3000000000000, baseProduction: 3000000000, icon: '🌀',   color: '#667eea',   unlockAt: 2000000000000 },
  { id: 'research_lab', name: '研究院',         desc: '研究前沿科技提升效率',   baseCost: 50000000000000,baseProduction: 50000000,  icon: '🔬',   color: '#0ea5e9',   unlockAt: 10000000000000 },
  { id: 'stargate',     name: '星际之门',       desc: '连接遥远星系的通道',    baseCost: 500000000000000,baseProduction: 200000000, icon: '🌠',   color: '#8b5cf6',   unlockAt: 100000000000000 },
  { id: 'dark_matter',  name: '暗能量采集器',    desc: '收集宇宙暗能量',        baseCost: 800000000000000,baseProduction: 800000000, icon: '🌑',   color: '#1a1a2e',   unlockAt: 500000000000000 },
  { id: 'time_rift',    name: '时空裂隙',        desc: '连接不同时空的裂隙',     baseCost: 5000000000000000,baseProduction: 5000000000, icon: '⏳', color: '#e94560',  unlockAt: 3000000000000000 },
  { id: 'reality_warp', name: '现实扭曲器',     desc: '改写物理法则获取财富',  baseCost: 50000000000000000,baseProduction: 50000000000, icon: '🔮', color: '#533483', unlockAt: 20000000000000000 },
  { id: 'infinity_engine', name: '无限引擎',    desc: '驱动无限可能的终极装置',baseCost: 500000000000000000,baseProduction: 500000000000, icon: '♾️', color: '#ef4444', rebirthRequired: true },
  { id: 'void_citadel', name: '虚空要塞',       desc: '屹立于虚空的神秘城堡',  baseCost: 5000000000000000000,baseProduction: 5000000000000, icon: '🏛️', color: '#2d3436', unlockAt: 1000000000000000000, rebirthRequired: true, hidden: true },
];

// 建筑皮肤数据
const BUILDING_SKINS = {
  mine: [
    { id: 'default', icon: '⛏️', name: '默认' },
    { id: 'golden', icon: '🔨', name: '黄金镐' },
    { id: 'diamond', icon: '💎', name: '钻石镐' },
  ],
  lumber: [
    { id: 'default', icon: '🪓', name: '默认' },
    { id: 'chainsaw', icon: '🪚', name: '电锯' },
    { id: 'golden', icon: '⚒️', name: '黄金斧' },
  ],
  farm: [
    { id: 'default', icon: '🌾', name: '默认' },
    { id: 'greenhouse', icon: '🏡', name: '温室' },
    { id: 'mega', icon: '🌻', name: '向日葵' },
  ],
  factory: [
    { id: 'default', icon: '🏭', name: '默认' },
    { id: 'robot', icon: '🤖', name: '机器人' },
    { id: 'quantum', icon: '⚙️', name: '量子工厂' },
  ],
  bank: [
    { id: 'default', icon: '🏦', name: '默认' },
    { id: 'golden', icon: '🏛️', name: '黄金银行' },
    { id: 'digital', icon: '💳', name: '数字银行' },
  ],
};

export function getAvailableSkins(buildingId) {
  return BUILDING_SKINS[buildingId] || [{ id: 'default', icon: '🏗️', name: '默认' }];
}

export function getSelectedSkin(buildingId, owned) {
  if (!window.G?.buildings) return 'default';
  const skinId = window.G.buildings[`${buildingId}_skin`];
  const skins = getAvailableSkins(buildingId);
  return skins.find(s => s.id === skinId) ? skinId : 'default';
}

export function syncBuildingSkins() {
  if (!window.G) return;
  // no-op: skins are read at render time
}

// 收藏品数据（从 js/collectibles.js 复制）
const COLLECTIBLES_DATA_SRC = [
  { id: 'artifact_gold_coin', name: '黄金硬币', desc: '一枚古老的金币，散发着神秘的光芒', icon: '🪙', rarity: 'common', effect: { type: 'gold', value: 0.05 }, unlock: { type: 'gold', target: 100000 } },
  { id: 'artifact_diamond', name: '钻石', desc: '纯净的钻石，象征着财富与权力', icon: '💎', rarity: 'rare', effect: { type: 'global', value: 0.1 }, unlock: { type: 'gold', target: 1000000 } },
  { id: 'artifact_crown', name: '王者皇冠', desc: '象征统治与权威的皇冠', icon: '👑', rarity: 'epic', effect: { type: 'dynasty', value: 0.2 }, unlock: { type: 'dynasty', target: 5 } },
  { id: 'artifact_sword', name: '勇者之剑', desc: '能够轻易斩杀Boss的传奇武器', icon: '⚔️', rarity: 'rare', effect: { type: 'boss', value: 0.25 }, unlock: { type: 'boss', target: 20 } },
  { id: 'artifact_wand', name: '魔法杖', desc: '蕴含强大魔法力量的法杖', icon: '🪄', rarity: 'epic', effect: { type: 'click', value: 0.3 }, unlock: { type: 'click', target: 10000 } },
  { id: 'artifact_book', name: '知识之书', desc: '记载着古老智慧的魔法书', icon: '📚', rarity: 'common', effect: { type: 'upgrade', value: 0.15 }, unlock: { type: 'upgrade', target: 10 } },
  { id: 'artifact_ring', name: '命运之戒', desc: '能够改变命运的神奇戒指', icon: '💍', rarity: 'legendary', effect: { type: 'all', value: 0.15 }, unlock: { type: 'gold', target: 1000000000 } },
  { id: 'artifact_potion', name: '生命药水', desc: '能够恢复生命力的神奇药水', icon: '🧪', rarity: 'common', effect: { type: 'offline', value: 0.2 }, unlock: { type: 'gold', target: 500000 } },
  { id: 'artifact_scroll', name: '远古卷轴', desc: '记载着古老咒语的神秘卷轴', icon: '📜', rarity: 'rare', effect: { type: 'event', value: 0.3 }, unlock: { type: 'gold', target: 5000000 } },
  { id: 'artifact_gem', name: '能量宝石', desc: '蕴含强大能量的神秘宝石', icon: '💠', rarity: 'epic', effect: { type: 'gps', value: 0.2 }, unlock: { type: 'gps', target: 100000 } },
  { id: 'artifact_amulet', name: '守护符', desc: '能够带来好运的神秘护身符', icon: '🧿', rarity: 'legendary', effect: { type: 'lucky', value: 0.4 }, unlock: { type: 'gold', target: 5000000000 } },
  { id: 'artifact_map', name: '藏宝图', desc: '指引财富所在地的古老地图', icon: '🗺️', rarity: 'rare', effect: { type: 'gold', value: 0.1 }, unlock: { type: 'building', target: 100 } },
];

// 升级数据（适配 js/upgrades.js 的 effect 格式）
const UPGRADES_DATA_SRC = [
  { id: 'click_power_1', name: '点击强化 I', effect: { type: 'click', value: 0.20 }, icon: '👆', cost: 500 },
  { id: 'click_power_2', name: '点击强化 II', effect: { type: 'click', value: 0.30 }, icon: '👆', cost: 5000 },
  { id: 'click_power_3', name: '点击强化 III', effect: { type: 'click', value: 0.40 }, icon: '👆', cost: 50000 },
  { id: 'click_power_4', name: '点击强化 IV', effect: { type: 'click', value: 0.50 }, icon: '👆', cost: 500000 },
  { id: 'click_power_5', name: '点击强化 V', effect: { type: 'click', value: 1.00 }, icon: '👆', cost: 5000000 },
  { id: 'building_speed_1', name: '建筑加速 I', effect: { type: 'building', value: 0.15 }, icon: '🏗️', cost: 1000 },
  { id: 'building_speed_2', name: '建筑加速 II', effect: { type: 'building', value: 0.25 }, icon: '🏗️', cost: 10000 },
  { id: 'building_speed_3', name: '建筑加速 III', effect: { type: 'building', value: 0.35 }, icon: '🏗️', cost: 100000 },
  { id: 'building_speed_4', name: '建筑加速 IV', effect: { type: 'building', value: 0.50 }, icon: '🏗️', cost: 1000000 },
  { id: 'building_speed_5', name: '建筑加速 V', effect: { type: 'building', value: 1.00 }, icon: '🏗️', cost: 10000000 },
  { id: 'boss_damage_1', name: '屠戮者 I', effect: { type: 'boss', value: 0.25 }, icon: '⚔️', cost: 2000 },
  { id: 'boss_damage_2', name: '屠戮者 II', effect: { type: 'boss', value: 0.40 }, icon: '⚔️', cost: 20000 },
  { id: 'boss_damage_3', name: '屠戮者 III', effect: { type: 'boss', value: 0.60 }, icon: '⚔️', cost: 200000 },
  { id: 'boss_damage_4', name: '屠戮者 IV', effect: { type: 'boss', value: 1.00 }, icon: '⚔️', cost: 2000000 },
  { id: 'global_boost_1', name: '帝国荣耀 I', effect: { type: 'global', value: 0.10 }, icon: '👑', cost: 5000000 },
  { id: 'global_boost_2', name: '帝国荣耀 II', effect: { type: 'global', value: 0.20 }, icon: '👑', cost: 50000000 },
  { id: 'global_boost_3', name: '帝国荣耀 III', effect: { type: 'global', value: 0.30 }, icon: '👑', cost: 500000000 },
];


// 单独暴露常用字段
export const goldStore = writable(0);
export const gpsStore = writable(0);

export function syncStores() {
  if (!window.G) return;
  goldStore.set(window.G.gold || 0);
  gpsStore.set(window.G.goldPerSecond || 0);
  syncAchievements();
  syncBuildings();
  syncUpgrades();
  syncBossAndPrestige();
  syncCollectibles();
}

export function syncAchievements() {
  if (!window.G) return;
  const unlocked = window.G.achievements || {};
  window.ACHIEVEMENTS_DATA = ACHIEVEMENTS_DATA.map(a => ({
    ...a,
    unlocked: !!unlocked[a.id],
    rarity: ACHIEVEMENT_RARITIES[a.id] || 'common',
  }));
}

export function syncBuildings() {
  if (!window.G) return;
  const owned = window.G.buildings || {};
  const totalEarned = window.G.totalEarned || 0;
  const rebirths = window.G.rebirths || 0;

  window.BUILDINGS_DATA = BUILDINGS_DATA_SRC.map(b => {
    const count = owned[b.id] || 0;
    const costMultiplier = Math.pow(1.15, count);
    const cost = Math.floor(b.baseCost * costMultiplier);
    const gpsEach = b.baseProduction * (1 + count * 0.1);

    // 解锁逻辑与 js/buildings.js 的 isBuildingUnlocked 一致
    const unlocked = isBuildingUnlocked(b, totalEarned, rebirths);

    return {
      ...b,
      count,
      cost,
      gps: gpsEach,
      unlocked,
    };
  });
}

function isBuildingUnlocked(b, totalEarned, rebirths) {
  if (b.unlockAt && totalEarned < b.unlockAt) return false;
  if (b.rebirthRequired && rebirths < 1) return false;
  return true;
}

export function syncUpgrades() {
  if (!window.G) return;
  // G.upgrades 是 ID 数组（js/game.js 的真实格式），不是对象
  const purchased = Array.isArray(window.G.upgrades) ? window.G.upgrades : [];
  window.UPGRADES_DATA = UPGRADES_DATA_SRC.map(u => ({
    ...u,
    purchased: purchased.includes(u.id)
  }));
}

export function syncBossAndPrestige() {
  if (!window.G) return;
  window.G._bossHp = window.G.bossHp || 0;
  window.G._bossMaxHp = window.G.bossMaxHp || 1;
  window.G._currentBoss = window.G.currentBoss || null;
  window.G._bossesDefeated = window.G.bossesDefeated || 0;
  window.G._dynastyLevel = window.G.dynastyLevel || 1;
  window.G._dynastyPoints = window.G.dynastyPoints || 0;
  window.G._prestigeShards = window.G.prestigeShards || 0;
  window.G._prestigeResets = window.G.prestigeResets || 0;
  window.G._rebirths = window.G.rebirths || 0;
}

export function syncCollectibles() {
  if (!window.G) return;
  const raw = localStorage.getItem('idle_empire_collectibles');
  const collected = raw ? JSON.parse(raw) : [];
  const collectedIds = collected.map(c => c.id);
  window.COLLECTIBLES_DATA = COLLECTIBLES_DATA_SRC.map(c => ({
    ...c,
    collected: collectedIds.includes(c.id)
  }));
}

// 每 100ms 同步一次
let syncInterval;
export function startSync() {
  syncInterval = setInterval(syncStores, 100);

  // 成就点击处理
  window.selectAchievement = (id) => {
    console.log('selectAchievement:', id);
  };

  // 劫持 showOfflineEarnings，转为 Svelte toast
  window.showOfflineEarnings = (seconds, gold) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    let timeStr = '';
    if (hrs > 0) timeStr += hrs + '小时';
    if (mins > 0) timeStr += mins + '分钟';
    if (!timeStr) timeStr = Math.floor(seconds) + '秒';
    window.showToast?.(`离线${timeStr}，获得 ${Math.floor(gold).toLocaleString()} 金币！`, 'success', '💰');
  };
}
export function stopSync() {
  clearInterval(syncInterval);
}
