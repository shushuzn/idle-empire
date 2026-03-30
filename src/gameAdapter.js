/**
 * gameAdapter.js
 * 桥接层：将现有 js/ 模块的状态同步到 Svelte store
 * 策略：100ms 轮询 window.G，最小化改动
 */

import { writable } from 'svelte/store';

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
}

export function syncAchievements() {
  if (!window.G) return;
  const unlocked = window.G.achievements || {};
  window.ACHIEVEMENTS_DATA = ACHIEVEMENTS_DATA.map(a => ({
    ...a,
    unlocked: !!unlocked[a.id]
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
