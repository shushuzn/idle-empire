import './styles/global.css';
import './styles/theme-dark.css';
import { mount } from 'svelte';
import App from './App.svelte';

// Achievement data
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

// Building data
const BUILDINGS_DATA_SRC = [
  { id: 'mine', name: '金矿', desc: '开采珍贵的金矿', baseCost: 10, baseProduction: 1.5, icon: '⛏️' },
  { id: 'lumber', name: '伐木场', desc: '砍伐木材出售', baseCost: 100, baseProduction: 6, icon: '🪓' },
  { id: 'farm', name: '农场', desc: '种植农作物', baseCost: 500, baseProduction: 22, icon: '🌾' },
  { id: 'factory', name: '工厂', desc: '批量生产商品', baseCost: 3000, baseProduction: 100, icon: '🏭' },
  { id: 'bank', name: '银行', desc: '钱生钱的秘诀', baseCost: 50000, baseProduction: 500, icon: '🏦' },
  { id: 'castle', name: '城堡', desc: '帝国的心脏', baseCost: 500000, baseProduction: 2500, icon: '🏰' },
  { id: 'temple', name: '神殿', desc: '祈福带来财富', baseCost: 5000000, baseProduction: 15000, icon: '🛕' },
  { id: 'spaceship', name: '太空站', desc: '星际贸易帝国', baseCost: 50000000, baseProduction: 100000, icon: '🚀' },
  { id: 'quantum_lab', name: '量子实验室', desc: '量子技术驱动收益爆发', baseCost: 800000000, baseProduction: 1200000, icon: '⚛️' },
  { id: 'dyson_ring', name: '戴森环', desc: '围绕恒星收集能量', baseCost: 12000000000, baseProduction: 15000000, icon: '☀️' },
  { id: 'time_machine', name: '时间机器', desc: '穿越时空获取财富', baseCost: 200000000000, baseProduction: 200000000, icon: '⏰' },
  { id: 'multiverse', name: '多元宇宙门户', desc: '跨维度能量收集', baseCost: 3000000000000, baseProduction: 3000000000, icon: '🌀' },
  { id: 'research_lab', name: '研究院', desc: '研究前沿科技提升效率', baseCost: 50000000000000, baseProduction: 50000000, icon: '🔬' },
  { id: 'stargate', name: '星际之门', desc: '连接遥远星系的通道', baseCost: 500000000000000, baseProduction: 200000000, icon: '🌠' },
  { id: 'dark_matter', name: '暗能量采集器', desc: '收集宇宙暗能量', baseCost: 800000000000000, baseProduction: 800000000, icon: '🌑' },
  { id: 'time_rift', name: '时空裂隙', desc: '连接不同时空的裂隙', baseCost: 5000000000000000, baseProduction: 5000000000, icon: '⏳' },
  { id: 'reality_warp', name: '现实扭曲器', desc: '改写物理法则获取财富', baseCost: 50000000000000000, baseProduction: 50000000000, icon: '🔮' },
  { id: 'infinity_engine', name: '无限引擎', desc: '驱动无限可能的终极装置', baseCost: 500000000000000000, baseProduction: 500000000000, icon: '♾️' },
  { id: 'void_citadel', name: '虚空要塞', desc: '屹立于虚空的神秘城堡', baseCost: 5000000000000000000, baseProduction: 5000000000000, icon: '🏛️' },
];

// Upgrade data
const UPGRADES_DATA_SRC = [
  { id: 'click_power_1', name: '点击强化 I', desc: '点击伤害 +20%', icon: '👆', cost: 500 },
  { id: 'click_power_2', name: '点击强化 II', desc: '点击伤害 +30%', icon: '👆', cost: 5000 },
  { id: 'click_power_3', name: '点击强化 III', desc: '点击伤害 +40%', icon: '👆', cost: 50000 },
  { id: 'click_power_4', name: '点击强化 IV', desc: '点击伤害 +50%', icon: '👆', cost: 500000 },
  { id: 'click_power_5', name: '点击强化 V', desc: '点击伤害 +100%', icon: '👆', cost: 5000000 },
  { id: 'building_speed_1', name: '建筑加速 I', desc: '建筑产出 +15%', icon: '🏗️', cost: 1000 },
  { id: 'building_speed_2', name: '建筑加速 II', desc: '建筑产出 +25%', icon: '🏗️', cost: 10000 },
  { id: 'building_speed_3', name: '建筑加速 III', desc: '建筑产出 +35%', icon: '🏗️', cost: 100000 },
  { id: 'building_speed_4', name: '建筑加速 IV', desc: '建筑产出 +50%', icon: '🏗️', cost: 1000000 },
  { id: 'building_speed_5', name: '建筑加速 V', desc: '建筑产出 +100%', icon: '🏗️', cost: 10000000 },
  { id: 'boss_damage_1', name: '屠戮者 I', desc: 'Boss 伤害 +25%', icon: '⚔️', cost: 2000 },
  { id: 'boss_damage_2', name: '屠戮者 II', desc: 'Boss 伤害 +40%', icon: '⚔️', cost: 20000 },
  { id: 'boss_damage_3', name: '屠戮者 III', desc: 'Boss 伤害 +60%', icon: '⚔️', cost: 200000 },
  { id: 'boss_damage_4', name: '屠戮者 IV', desc: 'Boss 伤害 +100%', icon: '⚔️', cost: 2000000 },
  { id: 'global_boost_1', name: '帝国荣耀 I', desc: '全局收益 +10%', icon: '👑', cost: 5000000 },
  { id: 'global_boost_2', name: '帝国荣耀 II', desc: '全局收益 +20%', icon: '👑', cost: 50000000 },
  { id: 'global_boost_3', name: '帝国荣耀 III', desc: '全局收益 +30%', icon: '👑', cost: 500000000 },
];

// All state lives here — set by original game, read by Svelte components
window.BUILDINGS_DATA = [];
window.ACHIEVEMENTS_DATA = ACHIEVEMENTS_DATA.map(a => ({ ...a, unlocked: false }));
window.UPGRADES_DATA = UPGRADES_DATA_SRC.map(u => ({ ...u, purchased: false }));

// Sync functions — called whenever original game state changes
function syncFromGame() {
  if (!window.G) return;

  // Sync gold
  window.goldStore = window.G.gold || 0;
  window.gpsStore = window.G.goldPerSecond || 0;

  // Sync buildings
  const owned = window.G.buildings || {};
  window.BUILDINGS_DATA = BUILDINGS_DATA_SRC.map(b => {
    const count = owned[b.id] || 0;
    const cost = Math.floor(b.baseCost * Math.pow(1.15, count));
    const gps = b.baseProduction * (1 + count * 0.1);
    return { ...b, count, cost, gps };
  });

  // Sync achievements
  const ach = window.G.achievements || {};
  window.ACHIEVEMENTS_DATA = ACHIEVEMENTS_DATA.map(a => ({
    ...a,
    unlocked: !!ach[a.id]
  }));

  // Sync upgrades
  const upg = window.G.upgrades || {};
  window.UPGRADES_DATA = UPGRADES_DATA_SRC.map(u => ({
    ...u,
    purchased: !!upg[u.id]
  }));
}

// Expose sync function for original game to call on state changes
window.__syncFromGame = syncFromGame;

// Patch original game's buy/upgrade functions to trigger sync
const origBuyBuilding = window.buyBuilding;
window.buyBuilding = function(id, mode) {
  if (origBuyBuilding) origBuyBuilding.call(this, id, mode);
  setTimeout(syncFromGame, 0);
};

const origBuyUpgrade = window.buyUpgrade;
window.buyUpgrade = function(id) {
  if (origBuyUpgrade) origBuyUpgrade.call(this, id);
  setTimeout(syncFromGame, 0);
};

// Initial sync once game is ready
function waitForGame() {
  if (window.G) {
    syncFromGame();
  } else {
    setTimeout(waitForGame, 50);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  mount(App, { target: document.getElementById('app') });
  waitForGame();
});
