// Idle Empire v2.2 - 建筑数据 (全面迭代版)

const BUILDINGS = [
    // 基础建筑 (common)
    { id: 'mine', name: '金矿', description: '开采珍贵的金矿', baseCost: 10, baseProduction: 1.5, icon: '⛏️', color: '#ffd700', rarity: 'common' },
    { id: 'lumber', name: '伐木场', description: '砍伐木材出售', baseCost: 100, baseProduction: 6, icon: '🪓', unlockAt: 100, color: '#8b4513', rarity: 'common' },
    { id: 'farm', name: '农场', description: '种植农作物', baseCost: 500, baseProduction: 22, icon: '🌾', unlockAt: 500, color: '#90ee90', rarity: 'common' },
    // 进阶建筑 (uncommon)
    { id: 'factory', name: '工厂', description: '批量生产商品', baseCost: 3000, baseProduction: 100, icon: '🏭', unlockAt: 3000, color: '#808080', rarity: 'uncommon' },
    { id: 'bank', name: '银行', description: '钱生钱的秘诀', baseCost: 50000, baseProduction: 500, icon: '🏦', unlockAt: 50000, color: '#4169e1', rarity: 'uncommon' },
    // 稀有建筑 (rare)
    { id: 'castle', name: '城堡', description: '帝国的心脏', baseCost: 500000, baseProduction: 2500, icon: '🏰', unlockAt: 500000, color: '#9370db', rarity: 'rare' },
    { id: 'temple', name: '神殿', description: '祈福带来财富', baseCost: 5000000, baseProduction: 15000, icon: '🛕', unlockAt: 5000000, color: '#ffdab9', rarity: 'rare' },
    { id: 'spaceship', name: '太空站', description: '星际贸易帝国', baseCost: 50000000, baseProduction: 100000, icon: '🚀', unlockAt: 50000000, color: '#00ffff', rarity: 'rare' },
    // 史诗建筑 (epic)
    { id: 'quantum_lab', name: '量子实验室', description: '量子技术驱动收益爆发', baseCost: 800000000, baseProduction: 1200000, icon: '⚛️', unlockAt: 500000000, color: '#7c3aed', rarity: 'epic' },
    { id: 'dyson_ring', name: '戴森环', description: '围绕恒星收集能量', baseCost: 12000000000, baseProduction: 15000000, icon: '☀️', unlockAt: 8000000000, color: '#f59e0b', rarity: 'epic' },
    { id: 'time_machine', name: '时间机器', description: '穿越时空获取财富', baseCost: 200000000000, baseProduction: 200000000, icon: '⏰', unlockAt: 80000000000, color: '#9f7aea', rarity: 'epic' },
    // 传说建筑 (legendary)
    { id: 'multiverse', name: '多元宇宙门户', description: '跨维度能量收集', baseCost: 3000000000000, baseProduction: 3000000000, icon: '🌀', unlockAt: 2000000000000, color: '#667eea', rarity: 'legendary' },
    // v2.0 新增建筑
    { id: 'research_lab', name: '研究院', description: '研究前沿科技提升效率', baseCost: 50000000000000, baseProduction: 50000000, icon: '🔬', unlockAt: 10000000000000, color: '#0ea5e9', rarity: 'legendary' },
    { id: 'stargate', name: '星际之门', description: '连接遥远星系的通道', baseCost: 500000000000000, baseProduction: 200000000, icon: '🌠', unlockAt: 100000000000000, color: '#8b5cf6', rarity: 'legendary' },
    // v2.1 新增建筑
    { id: 'dark_matter', name: '暗能量采集器', description: '收集宇宙暗能量', baseCost: 800000000000000, baseProduction: 800000000, icon: '🌑', unlockAt: 500000000000000, color: '#1a1a2e', rarity: 'legendary' },
    { id: 'time_rift', name: '时空裂隙', description: '连接不同时空的裂隙', baseCost: 5000000000000000, baseProduction: 5000000000, icon: '⏳', unlockAt: 3000000000000000, color: '#e94560', rarity: 'legendary' },
    { id: 'reality_warp', name: '现实扭曲器', description: '改写物理法则获取财富', baseCost: 50000000000000000, baseProduction: 50000000000, icon: '🔮', unlockAt: 20000000000000000, color: '#533483', rarity: 'legendary' },
    { id: 'infinity_engine', name: '无限引擎', description: '驱动无限可能的终极装置', baseCost: 500000000000000000, baseProduction: 500000000000, icon: '♾️', unlockAt: 100000000000000000, color: '#ef4444', rarity: 'legendary', rebirthRequired: true },
    { id: 'void_citadel', name: '虚空要塞', description: '屹立于虚空的神秘城堡', baseCost: 5000000000000000000, baseProduction: 5000000000000, icon: '🏛️', unlockAt: 1000000000000000000, color: '#2d3436', rarity: 'legendary', rebirthRequired: true, hidden: true }
];



function getTotalBuildings(state) {
    return Object.values(state.buildings || {}).reduce((a, b) => a + b, 0);
}

// 检查建筑是否可解锁
function isBuildingUnlocked(building, state) {
    // 检查解锁条件
    if (building.unlockAt && (state.totalEarned || 0) < building.unlockAt) {
        return false;
    }
    
    // 检查转生要求
    if (building.rebirthRequired && (state.rebirths || 0) < 1) {
        return false;
    }
    
    return true;
}

function getBuildingMultiplier(state, buildingId) {
    let mult = 1;
    // 基础建筑加成
    const buildingUpgradeBonus = typeof getUpgradeBonus === 'function' ? getUpgradeBonus('building') : 0;
    const globalUpgradeBonus = typeof getUpgradeBonus === 'function' ? getUpgradeBonus('global') : 0;
    mult *= (1 + buildingUpgradeBonus + globalUpgradeBonus);
    return mult;
}

function getClickMultiplier(state) {
    const clickUpgradeBonus = typeof getUpgradeBonus === 'function' ? getUpgradeBonus('click') : 0;
    const globalUpgradeBonus = typeof getUpgradeBonus === 'function' ? getUpgradeBonus('global') : 0;
    const clickTalent = state && state.dynastyTalents ? (state.dynastyTalents.click || 0) : 0;
    const collectibleBonus = typeof getCollectibleBonus === 'function' ? getCollectibleBonus('click') : 1;
    const milestoneBonus = typeof getMilestoneBonus === 'function' ? getMilestoneBonus('click') : 1;
    return (1 + clickUpgradeBonus + globalUpgradeBonus) * (1 + clickTalent * 0.25 + getPrestigeShopBonus(state, 'click')) * getPrestigeMultiplier(state) * collectibleBonus * milestoneBonus;
}

function getOfflineRate(state) {
    const base = 0.5;
    const collectibleBonus = typeof getCollectibleBonus === 'function' ? getCollectibleBonus('offline') : 1;
    return base * collectibleBonus;
}

function getBossDamageMultiplier(state) {
    const bossUpgradeBonus = typeof getUpgradeBonus === 'function' ? getUpgradeBonus('boss') : 0;
    const globalUpgradeBonus = typeof getUpgradeBonus === 'function' ? getUpgradeBonus('global') : 0;
    const bossTalent = state && state.dynastyTalents ? (state.dynastyTalents.boss || 0) : 0;
    const collectibleBonus = typeof getCollectibleBonus === 'function' ? getCollectibleBonus('boss') : 1;
    const milestoneBonus = typeof getMilestoneBonus === 'function' ? getMilestoneBonus('boss') : 1;
    return (1 + bossUpgradeBonus + globalUpgradeBonus) * (1 + bossTalent * 0.2 + getPrestigeShopBonus(state, 'boss')) * getPrestigeMultiplier(state) * collectibleBonus * milestoneBonus;
}

function getDynastyMultiplier(state) {
    var level = state && state.dynastyLevel ? state.dynastyLevel : 1;
    var idleTalent = state && state.dynastyTalents ? (state.dynastyTalents.idle || 0) : 0;
    return 1 + (level - 1) * 0.15 + idleTalent * 0.1 + getPrestigeShopBonus(state, 'idle');
}

function getPrestigeMultiplier(state) {
    var shards = state && state.prestigeShards ? state.prestigeShards : 0;
    return 1 + shards * 0.05;
}

function getPrestigeShopBonus(state, type) {
    var shop = state && state.prestigeShop ? state.prestigeShop : { idleCore: 0, clickCore: 0, bossCore: 0 };
    if (type === 'idle') return (shop.idleCore || 0) * 0.08;
    if (type === 'click') return (shop.clickCore || 0) * 0.12;
    if (type === 'boss') return (shop.bossCore || 0) * 0.1;
    return 0;
}

function getBuildingCost(building, owned) {
    return Math.floor(building.baseCost * Math.pow(1.15, owned));
}

function getTotalProduction(gameState) {
    let total = 0;
    BUILDINGS.forEach(b => {
        const count = gameState.buildings[b.id] || 0;
        total += b.baseProduction * count * getBuildingMultiplier(gameState, b.id);
    });
    const collectibleBonus = typeof getCollectibleBonus === 'function' ? getCollectibleBonus('gps') : 1;
    const milestoneBonus = typeof getMilestoneBonus === 'function' ? getMilestoneBonus('gps') : 1;
    return total * getDynastyMultiplier(gameState) * getPrestigeMultiplier(gameState) * collectibleBonus * milestoneBonus;
}

function formatNumber(num) {
    if (num >= 1e15) return (num / 1e15).toFixed(2) + 'Q';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num).toLocaleString();
}

function formatTime(seconds) {
    if (seconds < 60) return `${Math.floor(seconds)}秒`;
    if (seconds < 3600) return `${Math.floor(seconds/60)}分`;
    if (seconds < 86400) return `${Math.floor(seconds/3600)}小时`;
    return `${Math.floor(seconds/86400)}天`;
}
