// Idle Empire v2.2 - 建筑数据 (全面迭代版)

const BUILDINGS = [
    // 基础建筑
    { id: 'mine', name: '金矿', description: '开采珍贵的金矿', baseCost: 10, baseProduction: 1.5, icon: '⛏️', color: '#ffd700' },
    { id: 'lumber', name: '伐木场', description: '砍伐木材出售', baseCost: 100, baseProduction: 6, icon: '🪓', unlockAt: 100, color: '#8b4513' },
    { id: 'farm', name: '农场', description: '种植农作物', baseCost: 500, baseProduction: 22, icon: '🌾', unlockAt: 500, color: '#90ee90' },
    { id: 'factory', name: '工厂', description: '批量生产商品', baseCost: 3000, baseProduction: 100, icon: '🏭', unlockAt: 3000, color: '#808080' },
    { id: 'bank', name: '银行', description: '钱生钱的秘诀', baseCost: 50000, baseProduction: 500, icon: '🏦', unlockAt: 50000, color: '#4169e1' },
    { id: 'castle', name: '城堡', description: '帝国的心脏', baseCost: 500000, baseProduction: 2500, icon: '🏰', unlockAt: 500000, color: '#9370db' },
    { id: 'temple', name: '神殿', description: '祈福带来财富', baseCost: 5000000, baseProduction: 15000, icon: '🛕', unlockAt: 5000000, color: '#ffdab9' },
    { id: 'spaceship', name: '太空站', description: '星际贸易帝国', baseCost: 50000000, baseProduction: 100000, icon: '🚀', unlockAt: 50000000, color: '#00ffff' },
    { id: 'quantum_lab', name: '量子实验室', description: '量子技术驱动收益爆发', baseCost: 800000000, baseProduction: 1200000, icon: '⚛️', unlockAt: 500000000, color: '#7c3aed' },
    { id: 'dyson_ring', name: '戴森环', description: '围绕恒星收集能量', baseCost: 12000000000, baseProduction: 15000000, icon: '☀️', unlockAt: 8000000000, color: '#f59e0b' },
    { id: 'time_machine', name: '时间机器', description: '穿越时空获取财富', baseCost: 200000000000, baseProduction: 200000000, icon: '⏰', unlockAt: 80000000000, color: '#9f7aea' },
    { id: 'multiverse', name: '多元宇宙门户', description: '跨维度能量收集', baseCost: 3000000000000, baseProduction: 3000000000, icon: '🌀', unlockAt: 2000000000000, color: '#667eea' },
    // v2.0 新增建筑
    { id: 'research_lab', name: '研究院', description: '研究前沿科技提升效率', baseCost: 50000000000000, baseProduction: 50000000, icon: '🔬', unlockAt: 10000000000000, color: '#0ea5e9' },
    { id: 'stargate', name: '星际之门', description: '连接遥远星系的通道', baseCost: 500000000000000, baseProduction: 200000000, icon: '🌠', unlockAt: 100000000000000, color: '#8b5cf6' },
    // v2.1 新增建筑
    { id: 'dark_matter', name: '暗能量采集器', description: '收集宇宙暗能量', baseCost: 800000000000000, baseProduction: 800000000, icon: '🌑', unlockAt: 500000000000000, color: '#1a1a2e' },
    { id: 'time_rift', name: '时空裂隙', description: '连接不同时空的裂隙', baseCost: 5000000000000000, baseProduction: 5000000000, icon: '⏳', unlockAt: 3000000000000000, color: '#e94560' },
    { id: 'reality_warp', name: '现实扭曲器', description: '改写物理法则获取财富', baseCost: 50000000000000000, baseProduction: 50000000000, icon: '🔮', unlockAt: 20000000000000000, color: '#533483' },
    { id: 'infinity_engine', name: '无限引擎', description: '驱动无限可能的终极装置', baseCost: 500000000000000000, baseProduction: 500000000000, icon: '♾️', unlockAt: 100000000000000000, color: '#ef4444', rebirthRequired: true },
    { id: 'void_citadel', name: '虚空要塞', description: '屹立于虚空的神秘城堡', baseCost: 5000000000000000000, baseProduction: 5000000000000, icon: '🏛️', unlockAt: 1000000000000000000, color: '#2d3436', rebirthRequired: true, hidden: true }
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
// Idle Empire v2.0 - 升级系统 (全面进化版)

const UPGRADES = [
    // 点击强化系列
    { id: 'click_power_1', name: '点击强化 I', description: '点击伤害 +20%', icon: '👆', cost: 500, effect: { type: 'click', value: 0.2 }, prerequisite: null },
    { id: 'click_power_2', name: '点击强化 II', description: '点击伤害 +30%', icon: '👆', cost: 5000, effect: { type: 'click', value: 0.3 }, prerequisite: 'click_power_1' },
    { id: 'click_power_3', name: '点击强化 III', description: '点击伤害 +40%', icon: '👆', cost: 50000, effect: { type: 'click', value: 0.4 }, prerequisite: 'click_power_2' },
    { id: 'click_power_4', name: '点击强化 IV', description: '点击伤害 +50%', icon: '👆', cost: 500000, effect: { type: 'click', value: 0.5 }, prerequisite: 'click_power_3' },
    { id: 'click_power_5', name: '点击强化 V', description: '点击伤害 +100%', icon: '👆', cost: 5000000, effect: { type: 'click', value: 1.0 }, prerequisite: 'click_power_4' },
    
    // 建筑加速系列
    { id: 'building_speed_1', name: '建筑加速 I', description: '建筑产出 +15%', icon: '🏗️', cost: 1000, effect: { type: 'building', value: 0.15 }, prerequisite: null },
    { id: 'building_speed_2', name: '建筑加速 II', description: '建筑产出 +25%', icon: '🏗️', cost: 10000, effect: { type: 'building', value: 0.25 }, prerequisite: 'building_speed_1' },
    { id: 'building_speed_3', name: '建筑加速 III', description: '建筑产出 +35%', icon: '🏗️', cost: 100000, effect: { type: 'building', value: 0.35 }, prerequisite: 'building_speed_2' },
    { id: 'building_speed_4', name: '建筑加速 IV', description: '建筑产出 +50%', icon: '🏗️', cost: 1000000, effect: { type: 'building', value: 0.5 }, prerequisite: 'building_speed_3' },
    { id: 'building_speed_5', name: '建筑加速 V', description: '建筑产出 +100%', icon: '🏗️', cost: 10000000, effect: { type: 'building', value: 1.0 }, prerequisite: 'building_speed_4' },
    
    // Boss 伤害系列
    { id: 'boss_damage_1', name: '屠戮者 I', description: 'Boss 伤害 +25%', icon: '⚔️', cost: 2000, effect: { type: 'boss', value: 0.25 }, prerequisite: null },
    { id: 'boss_damage_2', name: '屠戮者 II', description: 'Boss 伤害 +40%', icon: '⚔️', cost: 20000, effect: { type: 'boss', value: 0.4 }, prerequisite: 'boss_damage_1' },
    { id: 'boss_damage_3', name: '屠戮者 III', description: 'Boss 伤害 +60%', icon: '⚔️', cost: 200000, effect: { type: 'boss', value: 0.6 }, prerequisite: 'boss_damage_2' },
    { id: 'boss_damage_4', name: '屠戮者 IV', description: 'Boss 伤害 +100%', icon: '⚔️', cost: 2000000, effect: { type: 'boss', value: 1.0 }, prerequisite: 'boss_damage_3' },
    
    // v2.0 新增：神器相关升级
    { id: 'artifact_master_1', name: '神器大师 I', description: '神器效果 +20%', icon: '💠', cost: 1000000, effect: { type: 'artifact', value: 0.2 }, prerequisite: null, requirement: { type: 'artifacts', count: 5 } },
    { id: 'artifact_master_2', name: '神器大师 II', description: '神器效果 +30%', icon: '💠', cost: 10000000, effect: { type: 'artifact', value: 0.3 }, prerequisite: 'artifact_master_1', requirement: { type: 'artifacts', count: 10 } },
    
    // v2.0 新增：转生相关升级
    { id: 'rebirth_bonus_1', name: '转生增益 I', description: '转生奖励 +10%', icon: '🔄', cost: 100000000, effect: { type: 'rebirth', value: 0.1 }, prerequisite: null, requirement: { type: 'rebirth', count: 1 } },
    { id: 'rebirth_bonus_2', name: '转生增益 II', description: '转生奖励 +20%', icon: '🔄', cost: 1000000000, effect: { type: 'rebirth', value: 0.2 }, prerequisite: 'rebirth_bonus_1', requirement: { type: 'rebirth', count: 2 } },
    
    // v2.0 新增：赛季相关升级
    { id: 'season_reward', name: '赛季奖励', description: '赛季点数 +25%', icon: '🏆', cost: 500000, effect: { type: 'season', value: 0.25 }, prerequisite: null, requirement: { type: 'season_participate', count: 1 } },
    
    // 全局加成系列
    { id: 'global_boost_1', name: '帝国荣耀 I', description: '全局收益 +10%', icon: '👑', cost: 5000000, effect: { type: 'global', value: 0.1 }, prerequisite: 'building_speed_5' },
    { id: 'global_boost_2', name: '帝国荣耀 II', description: '全局收益 +20%', icon: '👑', cost: 50000000, effect: { type: 'global', value: 0.2 }, prerequisite: 'global_boost_1' },
    { id: 'global_boost_3', name: '帝国荣耀 III', description: '全局收益 +30%', icon: '👑', cost: 500000000, effect: { type: 'global', value: 0.3 }, prerequisite: 'global_boost_2' }
];

// 检查升级是否可购买
function canBuyUpgrade(upgradeId) {
    var upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return false;
    
    // 检查是否已购买
    if (G.upgrades && G.upgrades[upgradeId]) return false;
    
    // 检查前置条件
    if (upgrade.prerequisite && (!G.upgrades || !G.upgrades[upgrade.prerequisite])) {
        return false;
    }
    
    // 检查特殊要求
    if (upgrade.requirement) {
        switch(upgrade.requirement.type) {
            case 'artifacts':
                var artifactCount = G.artifacts ? Object.keys(G.artifacts).length : 0;
                if (artifactCount < upgrade.requirement.count) return false;
                break;
            case 'rebirth':
                if ((G.rebirths || 0) < upgrade.requirement.count) return false;
                break;
            case 'season_participate':
                if ((G.seasonsParticipated || 0) < upgrade.requirement.count) return false;
                break;
        }
    }
    
    // 检查金币
    if (G.gold < upgrade.cost) return false;
    
    return true;
}

// 购买升级
function buyUpgrade(upgradeId) {
    if (!canBuyUpgrade(upgradeId)) return false;
    
    var upgrade = UPGRADES.find(u => u.id === upgradeId);
    
    G.gold -= upgrade.cost;
    
    if (!G.upgrades) G.upgrades = {};
    G.upgrades[upgradeId] = true;
    
    showMsg('✨ 购买升级：' + upgrade.name, 'success');
    
    invalidateDerivedData();
    requestUiUpdate({ heavy: true });
    saveGame();
    
    return true;
}

// 计算升级总加成
function getUpgradeBonus(type) {
    if (!G.upgrades) return 0;
    
    var bonus = 0;
    
    UPGRADES.forEach(function(upgrade) {
        if (!G.upgrades[upgrade.id]) return;
        
        var matches = false;
        switch(type) {
            case 'click':
                matches = upgrade.effect.type === 'click' || upgrade.effect.type === 'global';
                break;
            case 'building':
                matches = upgrade.effect.type === 'building' || upgrade.effect.type === 'global';
                break;
            case 'boss':
                matches = upgrade.effect.type === 'boss' || upgrade.effect.type === 'global';
                break;
            case 'artifact':
                matches = upgrade.effect.type === 'artifact' || upgrade.effect.type === 'global';
                break;
            case 'rebirth':
                matches = upgrade.effect.type === 'rebirth' || upgrade.effect.type === 'global';
                break;
            case 'season':
                matches = upgrade.effect.type === 'season' || upgrade.effect.type === 'global';
                break;
            case 'global':
                matches = upgrade.effect.type === 'global';
                break;
        }
        
        if (matches) {
            bonus += upgrade.effect.value;
        }
    });
    
    return bonus;
}

// 渲染升级面板
function renderUpgradesPanel() {
    var container = document.getElementById('upgrades-panel');
    if (!container) return;
    
    if (!G.upgrades) G.upgrades = {};
    
    var html = '<div class="upgrades-grid">';
    
    UPGRADES.forEach(function(upgrade) {
        var purchased = G.upgrades[upgrade.id];
        var canBuy = canBuyUpgrade(upgrade.id);
        var locked = upgrade.prerequisite && (!G.upgrades || !G.upgrades[upgrade.prerequisite]);
        var hasRequirement = !upgrade.requirement || (
            (upgrade.requirement.type === 'artifacts' && (G.artifacts ? Object.keys(G.artifacts).length : 0) >= upgrade.requirement.count) ||
            (upgrade.requirement.type === 'rebirth' && (G.rebirths || 0) >= upgrade.requirement.count) ||
            (upgrade.requirement.type === 'season_participate' && (G.seasonsParticipated || 0) >= upgrade.requirement.count)
        );
        
        var cardClass = 'upgrade-card';
        if (purchased) cardClass += ' purchased';
        else if (locked || !hasRequirement) cardClass += ' locked';
        else if (canBuy) cardClass += ' available';
        
        html += '<div class="' + cardClass + '">';
        html += '<div class="upgrade-icon">' + upgrade.icon + '</div>';
        html += '<div class="upgrade-name">' + upgrade.name + '</div>';
        html += '<div class="upgrade-desc">' + upgrade.description + '</div>';
        
        if (purchased) {
            html += '<div class="upgrade-status owned">已拥有</div>';
        } else {
            if (locked) {
                var prereq = UPGRADES.find(u => u.id === upgrade.prerequisite);
                html += '<div class="upgrade-status locked">需要：' + (prereq ? prereq.name : '???') + '</div>';
            } else if (!hasRequirement && upgrade.requirement) {
                html += '<div class="upgrade-status locked">需要：' + formatRequirement(upgrade.requirement) + '</div>';
            } else {
                html += '<button class="btn-buy-upgrade" onclick="buyUpgrade(\'' + upgrade.id + '\')" ' + (canBuy ? '' : 'disabled') + '>';
                html += formatNumber(upgrade.cost) + ' 金币';
                html += '</button>';
            }
        }
        
        html += '</div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// 格式化需求描述
function formatRequirement(req) {
    switch(req.type) {
        case 'artifacts': return '拥有 ' + req.count + ' 个神器';
        case 'rebirth': return '转生 ' + req.count + ' 次';
        case 'season_participate': return '参与 ' + req.count + ' 次赛季';
        default: return '未知需求';
    }
}
// Idle Empire v2.1 - 成就系统 (全面迭代版)

const ACHIEVEMENTS = [
    // 建筑相关成就
    { id: 'builder_1', name: '初露锋芒', desc: '拥有 10 个建筑', icon: '🏗️', condition: { type: 'buildings_total', target: 10 }, reward: { type: 'gold', amount: 1000 } },
    { id: 'builder_2', name: '建筑大师', desc: '拥有 50 个建筑', icon: '🏗️', condition: { type: 'buildings_total', target: 50 }, reward: { type: 'gold', amount: 10000 } },
    { id: 'builder_3', name: '帝国建造者', desc: '拥有 100 个建筑', icon: '🏗️', condition: { type: 'buildings_total', target: 100 }, reward: { type: 'shard', amount: 1 } },
    { id: 'builder_4', name: '建筑大亨', desc: '拥有 500 个建筑', icon: '🏗️', condition: { type: 'buildings_total', target: 500 }, reward: { type: 'shard', amount: 2 } },
    
    // Boss 相关成就
    { id: 'slayer_1', name: '新手猎人', desc: '击败 1 个 Boss', icon: '⚔️', condition: { type: 'boss_kills', target: 1 }, reward: { type: 'gold', amount: 5000 } },
    { id: 'slayer_2', name: 'Boss 杀手', desc: '击败 10 个 Boss', icon: '⚔️', condition: { type: 'boss_kills', target: 10 }, reward: { type: 'gold', amount: 50000 } },
    { id: 'slayer_3', name: '传奇屠戮者', desc: '击败 50 个 Boss', icon: '⚔️', condition: { type: 'boss_kills', target: 50 }, reward: { type: 'shard', amount: 2 } },
    { id: 'slayer_4', name: 'Boss 终结者', desc: '击败 100 个 Boss', icon: '⚔️', condition: { type: 'boss_kills', target: 100 }, reward: { type: 'shard', amount: 3 } },
    
    // 金币相关成就
    { id: 'gold_1', name: '小有积蓄', desc: '累计获得 10K 金币', icon: '💰', condition: { type: 'gold_earned', target: 10000 }, reward: { type: 'gold', amount: 1000 } },
    { id: 'gold_2', name: '富翁', desc: '累计获得 1M 金币', icon: '💎', condition: { type: 'gold_earned', target: 1000000 }, reward: { type: 'gold', amount: 100000 } },
    { id: 'gold_3', name: '亿万富翁', desc: '累计获得 1B 金币', icon: '💎', condition: { type: 'gold_earned', target: 1000000000 }, reward: { type: 'shard', amount: 1 } },
    { id: 'gold_4', name: '财富传奇', desc: '累计获得 1T 金币', icon: '👑', condition: { type: 'gold_earned', target: 1000000000000 }, reward: { type: 'shard', amount: 3 } },
    
    // 点击相关成就
    { id: 'clicker_1', name: '手指热身', desc: '点击 100 次', icon: '👆', condition: { type: 'clicks', target: 100 }, reward: { type: 'gold', amount: 500 } },
    { id: 'clicker_2', name: '疯狂点击', desc: '点击 1000 次', icon: '👆', condition: { type: 'clicks', target: 1000 }, reward: { type: 'gold', amount: 5000 } },
    { id: 'clicker_3', name: '点击机器', desc: '点击 10000 次', icon: '👆', condition: { type: 'clicks', target: 10000 }, reward: { type: 'shard', amount: 1 } },
    
    // 转生相关成就 (v2.0 新增)
    { id: 'rebirth_1', name: '轮回初体验', desc: '首次转生', icon: '🔄', condition: { type: 'rebirth', target: 1 }, reward: { type: 'artifact_box', amount: 1 } },
    { id: 'rebirth_2', name: '转生者', desc: '转生 5 次', icon: '🔄', condition: { type: 'rebirth', target: 5 }, reward: { type: 'shard', amount: 2 } },
    { id: 'rebirth_3', name: '永恒轮回', desc: '转生 10 次', icon: '🔄', condition: { type: 'rebirth', target: 10 }, reward: { type: 'shard', amount: 5 } },
    
    // 神器相关成就 (v2.0 新增)
    { id: 'artifact_1', name: '神器收藏家', desc: '拥有 5 个神器', icon: '💠', condition: { type: 'artifacts', target: 5 }, reward: { type: 'gold', amount: 100000 } },
    { id: 'artifact_2', name: '神器大师', desc: '拥有 10 个神器', icon: '💠', condition: { type: 'artifacts', target: 10 }, reward: { type: 'shard', amount: 2 } },
    
    // 赛季相关成就 (v2.0 新增)
    { id: 'season_1', name: '赛季参与者', desc: '参与 1 次赛季', icon: '🏆', condition: { type: 'seasons', target: 1 }, reward: { type: 'gold', amount: 50000 } },
    { id: 'season_2', name: '赛季老将', desc: '参与 5 次赛季', icon: '🏆', condition: { type: 'seasons', target: 5 }, reward: { type: 'shard', amount: 1 } },
    { id: 'season_3', name: '赛季冠军', desc: '赛季排名前 10', icon: '🏆', condition: { type: 'season_rank', target: 10 }, reward: { type: 'shard', amount: 3 } },
    
    // 收藏品相关成就
    { id: 'collectible_1', name: '收藏爱好者', desc: '收集 5 个收藏品', icon: '🎁', condition: { type: 'collectibles', target: 5 }, reward: { type: 'gold', amount: 50000 } },
    { id: 'collectible_2', name: '收藏家', desc: '收集 10 个收藏品', icon: '🎁', condition: { type: 'collectibles', target: 10 }, reward: { type: 'shard', amount: 2 } },
    { id: 'collectible_3', name: '收藏大师', desc: '收集全部收藏品', icon: '🎁', condition: { type: 'collectibles', target: 20 }, reward: { type: 'shard', amount: 5 } },
    
    // 里程碑相关成就
    { id: 'milestone_1', name: '里程碑新手', desc: '完成 5 个里程碑', icon: '🎯', condition: { type: 'milestones', target: 5 }, reward: { type: 'gold', amount: 100000 } },
    { id: 'milestone_2', name: '里程碑大师', desc: '完成 10 个里程碑', icon: '🎯', condition: { type: 'milestones', target: 10 }, reward: { type: 'shard', amount: 2 } },
    { id: 'milestone_3', name: '里程碑传奇', desc: '完成全部里程碑', icon: '🎯', condition: { type: 'milestones', target: 20 }, reward: { type: 'shard', amount: 5 } },
    
    // 特殊成就
    { id: 'special_1', name: '永恒帝国', desc: '所有建筑达到 100 级', icon: '🌟', condition: { type: 'buildings_max_level', target: 100 }, reward: { type: 'special_skin', amount: 1 } },
    { id: 'special_2', name: '速通王者', desc: '1 小时内达到 1M 金币', icon: '⚡', condition: { type: 'speedrun', target: 3600 }, reward: { type: 'special_title', amount: 1 } },
    { id: 'special_3', name: '点击狂魔', desc: '1 分钟内点击 500 次', icon: '🔥', condition: { type: 'click_speed', target: 500 }, reward: { type: 'special_title', amount: 1 } },
    
    // v2.1 虚空系列成就
    { id: 'void_1', name: '暗物质探索者', desc: '累计获得 1Q 金币', icon: '🌑', condition: { type: 'gold_earned', target: 1000000000000000 }, reward: { type: 'shard', amount: 5 } },
    { id: 'void_2', name: '时空旅者', desc: '累计获得 1Qa 金币', icon: '⏳', condition: { type: 'gold_earned', target: 1000000000000000000 }, reward: { type: 'shard', amount: 10 } },
    { id: 'void_3', name: '现实行者', desc: '累计获得 1Qb 金币', icon: '💎', condition: { type: 'gold_earned', target: 1000000000000000000000 }, reward: { type: 'shard', amount: 15 } },
    { id: 'void_4', name: '无限征服者', desc: '累计获得 1Qi 金币', icon: '♾️', condition: { type: 'gold_earned', target: 1000000000000000000000000 }, reward: { type: 'shard', amount: 20 } },
    { id: 'void_5', name: '虚空帝王', desc: '累计获得 1Qid 金币', icon: '🏛️', condition: { type: 'gold_earned', target: 1000000000000000000000000000 }, reward: { type: 'shard', amount: 30 } },
    
    // v2.1 Boss挑战成就
    { id: 'boss_challenge_1', name: '虚空猎人', desc: '击败虚空帝王', icon: '🌌', condition: { type: 'boss_defeated', target: 'void_emperor' }, reward: { type: 'shard', amount: 50 } },
    { id: 'boss_challenge_2', name: '全Boss克星', desc: '击败所有Boss', icon: '👹', condition: { type: 'boss_kills', target: 15 }, reward: { type: 'shard', amount: 100 } },
    
    // v2.1 建筑挑战成就
    { id: 'building_challenge_1', name: '虚空建设者', desc: '拥有虚空要塞', icon: '🏛️', condition: { type: 'building_owned', target: 'void_citadel', count: 1 }, reward: { type: 'gold_multiplier', amount: 0.1 } },
    { id: 'building_challenge_2', name: '无限工程师', desc: '拥有无限引擎满级', icon: '♾️', condition: { type: 'building_owned', target: 'infinity_engine', count: 100 }, reward: { type: 'gold_multiplier', amount: 0.2 } }
];

// 检查成就完成度
function checkAchievements() {
    if (!G.achievements) G.achievements = {};
    
    var newlyUnlocked = [];
    
    ACHIEVEMENTS.forEach(function(achievement) {
        if (G.achievements[achievement.id]) return; // 已完成
        
        var completed = false;
        var cond = achievement.condition;
        
        switch(cond.type) {
            case 'buildings_total':
                var total = 0;
                for (var b in G.buildings) total += G.buildings[b];
                completed = total >= cond.target;
                break;
            case 'boss_kills':
                completed = (G.totalBossKills || 0) >= cond.target;
                break;
            case 'gold_earned':
                completed = (G.totalEarned || 0) >= cond.target;
                break;
            case 'clicks':
                completed = (G.totalClicks || 0) >= cond.target;
                break;
            case 'rebirth':
                completed = (G.rebirths || 0) >= cond.target;
                break;
            case 'artifacts':
                completed = (G.artifacts ? Object.keys(G.artifacts).length : 0) >= cond.target;
                break;
            case 'seasons':
                completed = (G.seasonsParticipated || 0) >= cond.target;
                break;
            case 'season_rank':
                completed = (G.bestSeasonRank || 9999) <= cond.target;
                break;
            case 'collectibles':
                completed = (G.collectibles ? Object.keys(G.collectibles).length : 0) >= cond.target;
                break;
            case 'milestones':
                completed = (G.milestones ? Object.keys(G.milestones).length : 0) >= cond.target;
                break;
            case 'buildings_max_level':
                var allMaxed = true;
                for (var b in G.buildings) {
                    if (G.buildings[b] < cond.target) {
                        allMaxed = false;
                        break;
                    }
                }
                completed = allMaxed;
                break;
        }
        
        if (completed) {
            G.achievements[achievement.id] = true;
            newlyUnlocked.push(achievement);
            
            // 发放奖励
            giveAchievementReward(achievement.reward);
        }
    });
    
    if (newlyUnlocked.length > 0) {
        newlyUnlocked.forEach(function(achievement) {
            showMsg('🏆 解锁成就：' + achievement.icon + ' ' + achievement.name + '! 奖励：' + formatReward(achievement.reward), 'success');
        });
        requestUiUpdate({ heavy: true });
        saveGame();
    }
    
    return newlyUnlocked;
}

// 发放成就奖励
function giveAchievementReward(reward) {
    switch(reward.type) {
        case 'gold':
            G.gold += reward.amount;
            G.totalEarned = (G.totalEarned || 0) + reward.amount;
            break;
        case 'shard':
            G.shards = (G.shards || 0) + reward.amount;
            break;
        case 'artifact_box':
            // 神器箱逻辑（简化版：随机获得一个未拥有的神器）
            break;
        case 'special_skin':
            G.unlockedSkins = G.unlockedSkins || [];
            G.unlockedSkins.push('legendary_empire');
            break;
        case 'special_title':
            G.unlockedTitles = G.unlockedTitles || [];
            G.unlockedTitles.push(achievement.id);
            break;
    }
    invalidateDerivedData();
}

// 格式化奖励显示
function formatReward(reward) {
    switch(reward.type) {
        case 'gold': return formatNumber(reward.amount) + ' 金币';
        case 'shard': return reward.amount + ' 碎片';
        case 'artifact_box': return reward.amount + ' 神器箱';
        case 'special_skin': return '限定皮肤';
        case 'special_title': return '限定称号';
        default: return '未知奖励';
    }
}

// 渲染成就面板
function renderAchievementsPanel() {
    var container = document.getElementById('achievements-panel');
    if (!container) return;
    
    if (!G.achievements) G.achievements = {};
    
    var total = ACHIEVEMENTS.length;
    var unlocked = Object.keys(G.achievements).length;
    var percent = Math.round((unlocked / total) * 100);
    
    var html = '<div class="achievements-header">';
    html += '<h3>🏆 成就系统</h3>';
    html += '<div class="achievements-progress">';
    html += '<div class="progress-info">进度：' + unlocked + '/' + total + ' (' + percent + '%)</div>';
    html += '<div class="progress-bar"><div class="progress-fill" style="width: ' + percent + '%"></div></div>';
    html += '</div></div>';
    
    html += '<div class="achievements-grid">';
    
    ACHIEVEMENTS.forEach(function(achievement) {
        var unlocked = G.achievements[achievement.id];
        
        html += '<div class="achievement-card' + (unlocked ? ' unlocked' : ' locked') + '">';
        html += '<div class="achievement-icon">' + (unlocked ? achievement.icon : '🔒') + '</div>';
        html += '<div class="achievement-info">';
        html += '<div class="achievement-name">' + (unlocked ? achievement.name : '???') + '</div>';
        html += '<div class="achievement-desc">' + (unlocked ? achievement.desc : '完成条件未知') + '</div>';
        if (unlocked) {
            html += '<div class="achievement-reward">奖励：' + formatReward(achievement.reward) + '</div>';
        }
        html += '</div></div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
}
// Idle Empire v2.2 - Boss 战斗系统 (全面迭代版)

const BOSSES = [
    // 基础 Boss（v2.0 平衡调整：HP -20%, 奖励 +10%）
    { id: 'goblin', name: '哥布林首领', icon: '👺', hp: 80, reward: 550, unlockGold: 1000, damage: 1 },
    { id: 'troll', name: '洞穴巨魔', icon: '🧌', hp: 800, reward: 5500, unlockGold: 10000, damage: 5 },
    { id: 'dragon', name: '远古巨龙', icon: '🐉', hp: 8000, reward: 55000, unlockGold: 100000, damage: 25 },
    { id: 'demon', name: '深渊恶魔', icon: '👿', hp: 80000, reward: 550000, unlockGold: 1000000, damage: 100 },
    { id: 'titan', name: '泰坦巨人', icon: '👽', hp: 800000, reward: 5500000, unlockGold: 10000000, damage: 500 },
    { id: 'void_lord', name: '虚空领主', icon: '🌌', hp: 8000000, reward: 55000000, unlockGold: 100000000, damage: 2500 },
    { id: 'eternal_guardian', name: '永恒守护者', icon: '⏰', hp: 80000000, reward: 550000000, unlockGold: 1000000000, damage: 10000 },
    { id: 'multiverse_god', name: '多元宇宙之神', icon: '🌀', hp: 800000000, reward: 5500000000, unlockGold: 10000000000, damage: 50000 },
    // v2.0 新增 Boss
    { id: 'chaos_demon', name: '混沌魔神', icon: '💀', hp: 10000000000, reward: 50000000000, unlockGold: 100000000000, damage: 500000, hidden: false },
    { id: 'void_eye', name: '全知之眼', icon: '👁️', hp: 100000000000, reward: 500000000000, unlockGold: 1000000000000, damage: 5000000, hidden: true, rebirthRequired: true },
    // v2.1 新增 Boss
    { id: 'dark_matter_lord', name: '暗物质领主', icon: '🌑', hp: 1000000000000, reward: 5000000000000, unlockGold: 10000000000000, damage: 50000000, hidden: false },
    { id: 'time_wraith', name: '时空幽灵', icon: '⏳', hp: 10000000000000, reward: 50000000000000, unlockGold: 100000000000000, damage: 500000000, hidden: false },
    { id: 'reality_shatterer', name: '现实碎裂者', icon: '💎', hp: 100000000000000, reward: 500000000000000, unlockGold: 1000000000000000, damage: 5000000000, hidden: false },
    { id: 'infinity_tyrant', name: '无限暴君', icon: '♾️', hp: 1000000000000000, reward: 5000000000000000, unlockGold: 10000000000000000, damage: 50000000000, hidden: true, rebirthRequired: true },
    { id: 'void_emperor', name: '虚空帝王', icon: '🏛️', hp: 10000000000000000, reward: 50000000000000000, unlockGold: 100000000000000000, damage: 500000000000, hidden: true, rebirthRequired: true }
];

var currentBoss = null;
var bossHp = 0;
var bossMaxHp = 0;
var bossDamageTimer = null;

function getDynastyBossScale() {
    if (!G) return 1;
    return 1 + ((G.dynastyLevel || 1) - 1) * 0.25;
}

function getScaledBossHp(boss) {
    return Math.floor(boss.hp * getDynastyBossScale());
}

function getScaledBossReward(boss) {
    return Math.floor(boss.reward * getDynastyBossScale());
}

function initBossSystem() {
    if (!G) return;
    
    // 检查解锁
    var unlockedBosses = BOSSES.filter(function(b) {
        return G.totalEarned >= b.unlockGold && (!b.rebirthRequired || (G.rebirths || 0) >= 1);
    });
    
    if (unlockedBosses.length === 0) return;
    
    // 随机选择或继续当前Boss
    if (!G.currentBoss || !BOSSES.find(function(b) { return b.id === G.currentBoss; })) {
        G.currentBoss = unlockedBosses[0].id;
    }
    
    if (!G.bossHp) G.bossHp = getScaledBossHp(getBossById(G.currentBoss));
    if (!G.bossMaxHp) G.bossMaxHp = getScaledBossHp(getBossById(G.currentBoss));
    
    currentBoss = getBossById(G.currentBoss);
    bossHp = G.bossHp;
    bossMaxHp = G.bossMaxHp;
    
    renderBoss();
    startBossDamage();
}

function getBossById(id) {
    for (var i = 0; i < BOSSES.length; i++) {
        if (BOSSES[i].id === id) return BOSSES[i];
    }
    return null;
}

function renderBoss() {
    if (!currentBoss || !G) return;
    
    var hpPercent = bossMaxHp > 0 ? (bossHp / bossMaxHp) * 100 : 0;
    
    // Update existing elements in left panel
    var iconEl = document.getElementById('current-boss-icon');
    var nameEl = document.getElementById('current-boss-name');
    var hpBar = document.getElementById('boss-hp-bar');
    var hpText = document.getElementById('boss-hp-text');
    var rewardEl = document.getElementById('boss-reward');
    var damageInfoEl = document.querySelector('.boss-damage-info');
    
    if (iconEl) iconEl.textContent = currentBoss.icon;
    if (nameEl) nameEl.textContent = currentBoss.name;
    if (hpBar) hpBar.style.width = hpPercent + '%';
    if (hpText) hpText.textContent = formatNumber(Math.max(0, bossHp)) + ' / ' + formatNumber(bossMaxHp);
    if (rewardEl) rewardEl.textContent = '击杀奖励: ' + formatNumber(getScaledBossReward(currentBoss)) + ' 💰';
    if (damageInfoEl) damageInfoEl.textContent = '伤害/秒: ' + formatNumber(getCurrentBossDamagePerSecond());
}

function getCurrentBossDamagePerSecond() {
    if (!G || !currentBoss) return 0;

    var gps = getTotalProduction(G);
    var growthDamage = Math.sqrt(Math.max(0, gps)) / 10;
    var rawDamage = (currentBoss.damage + growthDamage) * getBossDamageMultiplier(G);
    return Math.max(1, rawDamage);
}

function startBossDamage() {
    if (bossDamageTimer) clearInterval(bossDamageTimer);
    
    bossDamageTimer = setInterval(function() {
        if (!G || !currentBoss) return;
        
        bossHp -= getCurrentBossDamagePerSecond();
        G.bossHp = bossHp;
        
        if (bossHp <= 0) {
            // Boss被击杀
            defeatBoss();
        } else {
            renderBoss();
        }
    }, 1000);
}

function defeatBoss() {
    if (!G || !currentBoss) return;
    
    // 发放奖励
    var reward = getScaledBossReward(currentBoss);
    G.gold += reward;
    G.totalEarned += reward;
    G.bossesDefeated = (G.bossesDefeated || 0) + 1;
    
    showMsg('🎉 击杀 ' + currentBoss.name + '! +' + formatNumber(reward) + ' 金币!', 'success');
    
    // 下一个Boss
    var unlocked = BOSSES.filter(function(b) { return G.totalEarned >= b.unlockGold && (!b.rebirthRequired || (G.rebirths || 0) >= 1); });
    var idx = BOSSES.indexOf(currentBoss);
    
    if (idx < BOSSES.length - 1 && unlocked.length > idx + 1) {
        currentBoss = BOSSES[idx + 1];
        bossHp = getScaledBossHp(currentBoss);
        bossMaxHp = getScaledBossHp(currentBoss);
        G.currentBoss = currentBoss.id;
        G.bossHp = bossHp;
        G.bossMaxHp = bossMaxHp;
    } else {
        // 最终Boss后提升王朝等级并循环
        if (currentBoss.id === BOSSES[BOSSES.length - 1].id) {
            G.dynastyLevel = (G.dynastyLevel || 1) + 1;
            G.dynastyPoints = (G.dynastyPoints || 0) + 1;
            showMsg('👑 王朝晋升! 进入 Lv' + G.dynastyLevel + '，获得 1 天赋点', 'achievement');
            currentBoss = BOSSES[0];
            G.currentBoss = currentBoss.id;
        }

        bossHp = getScaledBossHp(currentBoss);
        bossMaxHp = getScaledBossHp(currentBoss);
        G.bossHp = bossHp;
        G.bossMaxHp = bossMaxHp;
    }
    
    renderBoss();
    if (typeof requestUiUpdate === 'function') {
        requestUiUpdate({ heavy: true });
    } else {
        updateUI();
    }
    checkAchievements();
}

function getBossHpPercent() {
    return bossMaxHp > 0 ? (bossHp / bossMaxHp) * 100 : 0;
}
// Idle Empire - 存档系统

const SAVE_KEY = 'idle_empire_save';
const THEME_KEY = 'idle_empire_theme';
const AUTO_SAVE_INTERVAL = 30000;

let autoSaveTimer;
let lastSaveTime = Date.now();

function createNewGame() {
    return {
        gold: 0,
        buildings: {},
        upgrades: [],
        buyMode: 'x1',
        dynastyLevel: 1,
        dynastyPoints: 0,
        dynastyTalents: { idle: 0, click: 0, boss: 0 },
        prestigeShards: 0,
        prestigeResets: 0,
        prestigeShop: { idleCore: 0, clickCore: 0, bossCore: 0 },
        achievements: [],
        startTime: Date.now(),
        lastSave: Date.now(),
        totalClicks: 0,
        lastClickTime: 0
    };
}

function loadGame() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (!data.totalEarned) data.totalEarned = 0;
            if (!data.buildings) data.buildings = {};
            if (!data.achievements) data.achievements = [];
            if (!data.upgrades) data.upgrades = [];
            if (!data.buyMode) data.buyMode = 'x1';
            if (!data.dynastyLevel) data.dynastyLevel = 1;
            if (data.dynastyPoints === undefined) data.dynastyPoints = Math.max(0, data.dynastyLevel - 1);
            if (!data.dynastyTalents) data.dynastyTalents = { idle: 0, click: 0, boss: 0 };
            if (data.dynastyTalents.idle === undefined) data.dynastyTalents.idle = 0;
            if (data.dynastyTalents.click === undefined) data.dynastyTalents.click = 0;
            if (data.dynastyTalents.boss === undefined) data.dynastyTalents.boss = 0;
            if (data.prestigeShards === undefined) data.prestigeShards = 0;
            if (data.prestigeResets === undefined) data.prestigeResets = 0;
            if (!data.prestigeShop) data.prestigeShop = { idleCore: 0, clickCore: 0, bossCore: 0 };
            if (data.prestigeShop.idleCore === undefined) data.prestigeShop.idleCore = 0;
            if (data.prestigeShop.clickCore === undefined) data.prestigeShop.clickCore = 0;
            if (data.prestigeShop.bossCore === undefined) data.prestigeShop.bossCore = 0;
            if (!data.totalClicks) data.totalClicks = 0;
            
            // 计算离线收益
            const offlineTime = (Date.now() - data.lastSave) / 1000;
            const gps = getTotalProduction(data);
            const offlineRate = getOfflineRate(data);
            const offlineEarnings = Math.floor(gps * offlineTime * offlineRate);
            
            if (offlineEarnings > 0 && offlineTime > 60) {
                data.gold += offlineEarnings;
                data.totalEarned += offlineEarnings;
                showOfflineEarnings(offlineTime, offlineEarnings);
            }
            
            lastSaveTime = data.lastSave || Date.now();
            return data;
        } catch (e) {
            console.error('存档损坏，创建新游戏');
        }
    }
    return createNewGame();
}

function saveGame(gameState) {
    gameState.lastSave = Date.now();
    lastSaveTime = Date.now();
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
        return true;
    } catch (e) {
        console.error('保存失败:', e);
        return false;
    }
}

function exportSave(gameState) {
    gameState.lastSave = Date.now();
    const exportData = JSON.stringify(gameState, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idle-empire-save-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('存档已导出！', 'success');
}

function importSave() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const importedData = JSON.parse(event.target.result);
                    // 验证存档格式
                    if (importedData && typeof importedData.gold === 'number') {
                        if (confirm('确定要导入存档吗？当前进度将被覆盖！')) {
                            localStorage.setItem(SAVE_KEY, JSON.stringify(importedData));
                            showMessage('存档导入成功！正在重新加载...', 'success');
                            setTimeout(function() { location.reload(); }, 1500);
                        }
                    } else {
                        showMessage('无效的存档文件！', 'error');
                    }
                } catch (e) {
                    showMessage('存档解析失败！', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function showOfflineEarnings(seconds, gold) {
    const status = document.getElementById('status');
    if (status) {
        status.innerHTML = '<span class="offline-popup">离线' + formatTime(seconds) + '，获得 ' + formatNumber(gold) + ' 金币！</span>';
        setTimeout(function() { status.innerHTML = ''; }, 5000);
    }
}

function showMessage(text, type) {
    type = type || 'info';
    const status = document.getElementById('status');
    if (status) {
        status.innerHTML = '<span class="message ' + type + '">' + text + '</span>';
        setTimeout(function() { status.innerHTML = ''; }, 3000);
    }
}

function showAchievementPopup(achievements) {
    achievements.forEach(function(a, i) {
        setTimeout(function() {
            showMessage(a.icon + ' ' + a.name, 'achievement');
        }, i * 1500);
    });
}

function resetGame() {
    if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
        localStorage.removeItem(SAVE_KEY);
        location.reload();
    }
}

function startAutoSave(gameState) {
    saveGame(gameState);
    autoSaveTimer = setInterval(function() { saveGame(gameState); }, AUTO_SAVE_INTERVAL);
    
    window.addEventListener('beforeunload', function() { saveGame(gameState); });
    startSaveStatusUpdate();
}

function updateSaveStatus() {
    const status = document.getElementById('save-status');
    if (status) {
        const elapsed = Math.floor((Date.now() - lastSaveTime) / 1000);
        status.textContent = elapsed < 5 ? '已保存' : formatTime(elapsed) + '前保存';
    }
}

function startSaveStatusUpdate() {
    updateSaveStatus();
    setInterval(updateSaveStatus, 1000);
}

function initTheme() {
    if (localStorage.getItem(THEME_KEY) === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    updateThemeButton();
}

function toggleTheme() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem(THEME_KEY, 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem(THEME_KEY, 'light');
    }
    updateThemeButton();
}

function updateThemeButton() {
    const btn = document.getElementById('theme-btn');
    if (btn) {
        btn.textContent = document.documentElement.getAttribute('data-theme') === 'light' ? '☀️' : '🌙';
    }
}
// Idle Empire v2.0 - 转生系统

const REBIRTH_CONFIG = {
    baseRequirement: 1e9, // 1B 金币首次转生
    requirementMultiplier: 10, // 每次转生要求 x10
    baseSoulGemReward: 1, // 基础灵魂宝石奖励
    bonusPerBuilding: 0.01, // 每个建筑额外 +1% 灵魂宝石
    bonusPerBoss: 0.05, // 每个 Boss 额外 +5% 灵魂宝石
    maxSoulGemBonus: 10 // 最大灵魂宝石加成上限
};

// 计算转生所需金币
function getRebirthRequirement() {
    var rebirths = G.rebirths || 0;
    return REBIRTH_CONFIG.baseRequirement * Math.pow(REBIRTH_CONFIG.requirementMultiplier, rebirths);
}

// 计算转生可获得灵魂宝石
function calculateSoulGemReward() {
    var rebirths = G.rebirths || 0;
    var base = REBIRTH_CONFIG.baseSoulGemReward * (rebirths + 1);
    
    // 建筑加成
    var totalBuildings = 0;
    for (var b in G.buildings) {
        totalBuildings += G.buildings[b];
    }
    var buildingBonus = Math.min(totalBuildings * REBIRTH_CONFIG.bonusPerBuilding, REBIRTH_CONFIG.maxSoulGemBonus);
    
    // Boss 加成
    var bossKills = G.totalBossKills || 0;
    var bossBonus = Math.min(bossKills * REBIRTH_CONFIG.bonusPerBoss, REBIRTH_CONFIG.maxSoulGemBonus);
    
    // 神器加成
    var artifactBonus = getArtifactBonus('rebirth') || 0;
    
    var total = base * (1 + buildingBonus + bossBonus + artifactBonus);
    return Math.floor(total);
}

// 检查是否可以转生
function canRebirth() {
    return G.gold >= getRebirthRequirement();
}

// 执行转生
function doRebirth() {
    if (!canRebirth()) {
        showMsg('❌ 金币不足，无法转生！需要 ' + formatNumber(getRebirthRequirement()) + ' 金币', 'error');
        return false;
    }
    
    var soulGems = calculateSoulGemReward();
    var currentRebirths = G.rebirths || 0;
    
    // 保存永久进度
    var permanentData = {
        rebirths: currentRebirths + 1,
        totalSoulGems: (G.totalSoulGems || 0) + soulGems,
        lifetimeGold: G.lifetimeGold || G.totalEarned || 0,
        lifetimeBossKills: G.totalBossKills || 0,
        startTime: Date.now(),
        
        // 保留收藏品和里程碑
        collectibles: G.collectibles || {},
        milestones: G.milestones || {},
        artifacts: G.artifacts || {},
        artifactLevels: G.artifactLevels || {},
        
        // 赛季数据保留
        seasonPoints: G.seasonPoints || 0,
        bestSeasonRank: G.bestSeasonRank || 9999,
        challengesCompleted: G.challengesCompleted || 0,
        
        // 统计保留
        totalClicks: G.totalClicks || 0,
        totalEvents: G.eventsTriggered || 0,
        playTime: (Date.now() - G.startTime) / 1000
    };
    
    // 重置游戏数据
    G = createInitialState();
    
    // 恢复永久数据
    Object.assign(G, permanentData);
    
    // 应用转生加成
    applyRebirthBonuses();
    
    showMsg('✨ 转生成功！获得 ' + soulGems + ' 个灵魂宝石！当前转生次数：' + (currentRebirths + 1), 'success');
    
    saveGame();
    requestUiUpdate({ heavy: true });
    
    return true;
}

// 应用转生永久加成
function applyRebirthBonuses() {
    // 灵魂宝石加成（每颗 +1% 全局收益）
    var soulGemBonus = (G.totalSoulGems || 0) * 0.01;
    G.rebirthBonus = soulGemBonus;
    
    // 解锁新内容
    if (G.rebirths >= 1) {
        // 解锁无限引擎建筑
        var infinityEngine = BUILDINGS.find(b => b.id === 'infinity_engine');
        if (infinityEngine) {
            infinityEngine.hidden = false;
        }
    }
    
    if (G.rebirths >= 2) {
        // 解锁新 Boss
        var voidBoss = BOSSES.find(b => b.id === 'void_eye');
        if (voidBoss) {
            voidBoss.hidden = false;
        }
    }
}

// 灵魂宝石商店
const SOUL_SHOP_ITEMS = [
    {
        id: 'permanent_gold',
        name: '永恒财富',
        desc: '永久 +5% 金币收益',
        icon: '💰',
        cost: 5,
        maxLevel: 20,
        effect: function(level) { return { type: 'gold', value: level * 0.05 }; }
    },
    {
        id: 'permanent_click',
        name: '永恒之力',
        desc: '永久 +10% 点击伤害',
        icon: '👆',
        cost: 3,
        maxLevel: 10,
        effect: function(level) { return { type: 'click', value: level * 0.1 }; }
    },
    {
        id: 'permanent_building',
        name: '永恒建造',
        desc: '永久 +5% 建筑产出',
        icon: '🏗️',
        cost: 5,
        maxLevel: 20,
        effect: function(level) { return { type: 'building', value: level * 0.05 }; }
    },
    {
        id: 'permanent_boss',
        name: '永恒屠戮',
        desc: '永久 +10% Boss 伤害',
        icon: '⚔️',
        cost: 3,
        maxLevel: 10,
        effect: function(level) { return { type: 'boss', value: level * 0.1 }; }
    },
    {
        id: 'permanent_rebirth',
        name: '永恒轮回',
        desc: '永久 +10% 转生奖励',
        icon: '🔄',
        cost: 10,
        maxLevel: 5,
        effect: function(level) { return { type: 'rebirth', value: level * 0.1 }; }
    },
    {
        id: 'unlock_slot',
        name: '神器槽位',
        desc: '解锁一个额外神器槽位',
        icon: '🔓',
        cost: 20,
        maxLevel: 12,
        effect: function(level) { return { type: 'artifact_slot', value: level }; }
    }
];

// 购买灵魂商店物品
function buySoulShopItem(itemId) {
    var item = SOUL_SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return false;
    
    var currentLevel = G.soulShopLevels ? (G.soulShopLevels[itemId] || 0) : 0;
    
    if (currentLevel >= item.maxLevel) {
        showMsg('❌ 已达到最大等级', 'error');
        return false;
    }
    
    var cost = item.cost * (currentLevel + 1); // 每级成本递增
    
    if (G.totalSoulGems >= cost) {
        G.totalSoulGems -= cost;
        
        if (!G.soulShopLevels) G.soulShopLevels = {};
        G.soulShopLevels[itemId] = currentLevel + 1;
        
        showMsg(`✨ 购买成功：${item.name} Lv.${currentLevel + 1}`, 'success');
        
        applyRebirthBonuses();
        invalidateDerivedData();
        requestUiUpdate({ heavy: true });
        saveGame();
        
        return true;
    }
    
    showMsg('❌ 灵魂宝石不足', 'error');
    return false;
}

// 渲染转生界面
function renderRebirthPanel() {
    var container = document.getElementById('rebirth-panel');
    if (!container) return;
    
    var requirement = getRebirthRequirement();
    var canDo = canRebirth();
    var soulGemReward = calculateSoulGemReward();
    var rebirths = G.rebirths || 0;
    var totalSoulGems = G.totalSoulGems || 0;
    
    var html = '<div class="rebirth-container">';
    
    // 转生信息
    html += '<div class="rebirth-info">';
    html += '<h3>🔄 转生系统</h3>';
    html += '<div class="rebirth-stat">当前转生次数：<strong>' + rebirths + '</strong></div>';
    html += '<div class="rebirth-stat">灵魂宝石：<strong style="color: #A855F7">' + totalSoulGems + '</strong></div>';
    html += '<div class="rebirth-stat">全局加成：<strong style="color: #22C55E">+' + Math.round((G.rebirthBonus || 0) * 100) + '%</strong></div>';
    html += '</div>';
    
    // 转生按钮
    html += '<div class="rebirth-action">';
    html += '<div class="rebirth-requirement">需要金币：<strong>' + formatNumber(requirement) + '</strong></div>';
    html += '<div class="rebirth-reward">将获得灵魂宝石：<strong>' + soulGemReward + '</strong></div>';
    html += '<button class="btn-rebirth ' + (canDo ? 'ready' : '') + '" onclick="doRebirth()" ' + (canDo ? '' : 'disabled') + '>';
    html += canDo ? '✨ 执行转生' : '🔒 金币不足';
    html += '</button>';
    html += '<p class="rebirth-hint">转生将重置金币和建筑，但保留收藏品、里程碑、神器和灵魂宝石</p>';
    html += '</div>';
    
    // 灵魂商店
    html += '<div class="soul-shop">';
    html += '<h4>💎 灵魂商店</h4>';
    html += '<div class="soul-shop-items">';
    
    SOUL_SHOP_ITEMS.forEach(function(item) {
        var currentLevel = G.soulShopLevels ? (G.soulShopLevels[item.id] || 0) : 0;
        var cost = item.cost * (currentLevel + 1);
        var canAfford = totalSoulGems >= cost;
        var isMaxed = currentLevel >= item.maxLevel;
        
        html += '<div class="soul-shop-item">';
        html += '<div class="soul-item-icon">' + item.icon + '</div>';
        html += '<div class="soul-item-info">';
        html += '<div class="soul-item-name">' + item.name + ' <span class="soul-item-level">Lv.' + currentLevel + '/' + item.maxLevel + '</span></div>';
        html += '<div class="soul-item-desc">' + item.desc + '</div>';
        html += '<div class="soul-item-cost">' + cost + ' 灵魂宝石</div>';
        html += '</div>';
        html += '<button class="btn-buy-soul" onclick="buySoulShopItem(\'' + item.id + '\')" ' + (canAfford && !isMaxed ? '' : 'disabled') + '>';
        html += isMaxed ? 'MAX' : '购买';
        html += '</button>';
        html += '</div>';
    });
    
    html += '</div></div>';
    html += '</div>';
    
    container.innerHTML = html;
}

// 获取永久加成总和
function getPermanentBonus(type) {
    if (!G.soulShopLevels) return 0;
    
    var bonus = 0;
    
    SOUL_SHOP_ITEMS.forEach(function(item) {
        var level = G.soulShopLevels[item.id] || 0;
        if (level === 0) return;
        
        var effect = item.effect(level);
        
        var matches = false;
        switch(type) {
            case 'gold':
                matches = effect.type === 'gold' || effect.type === 'global';
                break;
            case 'click':
                matches = effect.type === 'click' || effect.type === 'global';
                break;
            case 'building':
                matches = effect.type === 'building' || effect.type === 'global';
                break;
            case 'boss':
                matches = effect.type === 'boss' || effect.type === 'global';
                break;
            case 'rebirth':
                matches = effect.type === 'rebirth' || effect.type === 'global';
                break;
        }
        
        if (matches) {
            bonus += effect.value;
        }
    });
    
    return bonus;
}
// Idle Empire v2.0 - 神器系统

const ARTIFACTS = [
    // 基础神器
    {
        id: 'artifact_power_crystal',
        name: '力量水晶',
        desc: '蕴含强大力量的神秘水晶',
        icon: '💠',
        rarity: 'rare',
        effect: { type: 'click', value: 0.2 },
        unlock: { type: 'click_total', target: 10000 },
        slot: 1
    },
    {
        id: 'artifact_wisdom_tome',
        name: '智慧之书',
        desc: '记录着古老智慧的魔法书',
        icon: '📕',
        rarity: 'rare',
        effect: { type: 'building_all', value: 0.15 },
        unlock: { type: 'buildings_total', target: 100 },
        slot: 2
    },
    {
        id: 'artifact_time_sand',
        name: '时之沙',
        desc: '能够操控时间的魔法沙漏',
        icon: '⏳',
        rarity: 'epic',
        effect: { type: 'global', value: 0.1 },
        unlock: { type: 'play_time', target: 3600 }, // 1 小时
        slot: 3
    },
    
    // 转生神器
    {
        id: 'artifact_soul_gem',
        name: '灵魂宝石',
        desc: '储存着转生力量的宝石',
        icon: '🔮',
        rarity: 'legendary',
        effect: { type: 'rebirth', value: 0.1 },
        unlock: { type: 'rebirth', target: 1 },
        slot: 4
    },
    {
        id: 'artifact_phoenix_feather',
        name: '凤凰之羽',
        desc: '不死凤凰的羽毛，象征重生',
        icon: '🪶',
        rarity: 'legendary',
        effect: { type: 'rebirth_bonus', value: 0.15 },
        unlock: { type: 'rebirth', target: 3 },
        slot: 5
    },
    
    // 神器系统专属
    {
        id: 'artifact_core',
        name: '神器核心',
        desc: '所有神器的力量源泉',
        icon: '🌟',
        rarity: 'legendary',
        effect: { type: 'artifact_boost', value: 0.2 },
        unlock: { type: 'artifacts_count', target: 10 },
        slot: 6
    },
    {
        id: 'artifact_void_eye',
        name: '虚空之眼',
        desc: '能够看穿一切的神秘之眼',
        icon: '👁️',
        rarity: 'epic',
        effect: { type: 'boss_damage', value: 0.3 },
        unlock: { type: 'boss_kills', target: 50 },
        slot: 7
    },
    {
        id: 'artifact_fortune_coin',
        name: '幸运金币',
        desc: '带来好运的传说金币',
        icon: '🪙',
        rarity: 'rare',
        effect: { type: 'event_chance', value: 0.25 },
        unlock: { type: 'events_triggered', target: 20 },
        slot: 8
    },
    
    // 赛季神器
    {
        id: 'artifact_season_trophy',
        name: '赛季奖杯',
        desc: '赛季优胜者的荣耀证明',
        icon: '🏆',
        rarity: 'epic',
        effect: { type: 'season_points', value: 0.2 },
        unlock: { type: 'season_rank', target: 100 },
        slot: 9
    },
    {
        id: 'artifact_challenge_badge',
        name: '挑战徽章',
        desc: '完成挑战的荣誉徽章',
        icon: '🎖️',
        rarity: 'epic',
        effect: { type: 'challenge_reward', value: 0.25 },
        unlock: { type: 'challenges_completed', target: 5 },
        slot: 10
    },
    
    // 终极神器
    {
        id: 'artifact_infinity_engine',
        name: '无限引擎核心',
        desc: '驱动无限引擎的核心',
        icon: '⚙️',
        rarity: 'mythic',
        effect: { type: 'global', value: 0.25 },
        unlock: { type: 'building_owned', building: 'infinity_engine', target: 1 },
        slot: 11
    },
    {
        id: 'artifact_multiverse_key',
        name: '多元宇宙钥匙',
        desc: '打开通往多元宇宙的钥匙',
        icon: '🗝️',
        rarity: 'mythic',
        effect: { type: 'all', value: 0.15 },
        unlock: { type: 'gold', target: 1e15 },
        slot: 12
    }
];

// 神器稀有度配置
const ARTIFACT_RARITY = {
    common: { color: '#9CA3AF', multiplier: 1, name: '普通' },
    rare: { color: '#3B82F6', multiplier: 1.2, name: '稀有' },
    epic: { color: '#A855F7', multiplier: 1.5, name: '史诗' },
    legendary: { color: '#F59E0B', multiplier: 2, name: '传说' },
    mythic: { color: '#EF4444', multiplier: 3, name: '神话' }
};

// 神器升级系统
function getArtifactUpgradeCost(artifact, level) {
    var baseCost = 100000;
    var rarityMult = ARTIFACT_RARITY[artifact.rarity].multiplier;
    return Math.floor(baseCost * rarityMult * Math.pow(1.5, level));
}

function upgradeArtifact(artifactId) {
    if (!G.artifacts) G.artifacts = {};
    if (!G.artifactLevels) G.artifactLevels = {};
    
    var artifact = ARTIFACTS.find(a => a.id === artifactId);
    if (!artifact) return false;
    
    var currentLevel = G.artifactLevels[artifactId] || 0;
    var cost = getArtifactUpgradeCost(artifact, currentLevel);
    
    if (G.gold >= cost) {
        G.gold -= cost;
        G.artifactLevels[artifactId] = currentLevel + 1;
        
        var bonus = (currentLevel + 1) * 0.1; // 每级 +10%
        showMsg(`✨ ${artifact.name} 升级到 Lv.${currentLevel + 1}! 效果提升 ${Math.round(bonus * 100)}%`, 'success');
        
        invalidateDerivedData();
        requestUiUpdate({ heavy: true });
        return true;
    }
    
    return false;
}

// 检查神器解锁
function checkArtifactUnlocks() {
    if (!G.artifacts) G.artifacts = {};
    
    ARTIFACTS.forEach(function(artifact) {
        if (G.artifacts[artifact.id]) return; // 已解锁
        
        var unlocked = false;
        var unlock = artifact.unlock;
        
        switch(unlock.type) {
            case 'gold':
                unlocked = G.totalEarned >= unlock.target;
                break;
            case 'click_total':
                unlocked = (G.totalClicks || 0) >= unlock.target;
                break;
            case 'buildings_total':
                var total = 0;
                for (var b in G.buildings) total += G.buildings[b];
                unlocked = total >= unlock.target;
                break;
            case 'play_time':
                unlocked = ((Date.now() - G.startTime) / 1000) >= unlock.target;
                break;
            case 'rebirth':
                unlocked = (G.rebirths || 0) >= unlock.target;
                break;
            case 'artifacts_count':
                var count = Object.keys(G.artifacts).length;
                unlocked = count >= unlock.target;
                break;
            case 'boss_kills':
                unlocked = (G.bossesDefeated || 0) >= unlock.target;
                break;
            case 'events_triggered':
                unlocked = (G.eventsTriggered || 0) >= unlock.target;
                break;
            case 'season_rank':
                unlocked = (G.bestSeasonRank || 9999) <= unlock.target;
                break;
            case 'challenges_completed':
                unlocked = (G.challengesCompleted || 0) >= unlock.target;
                break;
            case 'building_owned':
                unlocked = (G.buildings[unlock.building] || 0) >= unlock.target;
                break;
        }
        
        if (unlocked) {
            G.artifacts[artifact.id] = true;
            showMsg(`🌟 解锁新神器：${artifact.icon} ${artifact.name}!`, 'success');
            requestUiUpdate({ heavy: true });
        }
    });
}

// 计算神器总加成
function getArtifactBonus(type) {
    if (!G.artifacts) return 0;
    
    var bonus = 0;
    var artifactBoost = 1;
    
    // 先计算神器核心加成
    if (G.artifacts['artifact_core']) {
        var core = ARTIFACTS.find(a => a.id === 'artifact_core');
        var level = G.artifactLevels['artifact_core'] || 0;
        artifactBoost += core.effect.value + (level * 0.1);
    }
    
    for (var id in G.artifacts) {
        if (!G.artifacts[id]) continue;
        
        var artifact = ARTIFACTS.find(a => a.id === id);
        if (!artifact) continue;
        
        var level = G.artifactLevels[id] || 0;
        var effectValue = artifact.effect.value + (level * 0.1);
        var rarityMult = ARTIFACT_RARITY[artifact.rarity].multiplier;
        
        var matches = false;
        switch(type) {
            case 'click':
                matches = artifact.effect.type === 'click' || artifact.effect.type === 'all';
                break;
            case 'building_all':
                matches = artifact.effect.type === 'building_all' || artifact.effect.type === 'global' || artifact.effect.type === 'all';
                break;
            case 'global':
                matches = artifact.effect.type === 'global' || artifact.effect.type === 'all';
                break;
            case 'rebirth':
                matches = artifact.effect.type === 'rebirth' || artifact.effect.type === 'rebirth_bonus' || artifact.effect.type === 'all';
                break;
            case 'boss_damage':
                matches = artifact.effect.type === 'boss_damage' || artifact.effect.type === 'all';
                break;
            case 'event_chance':
                matches = artifact.effect.type === 'event_chance' || artifact.effect.type === 'all';
                break;
            case 'season_points':
                matches = artifact.effect.type === 'season_points' || artifact.effect.type === 'all';
                break;
            case 'challenge_reward':
                matches = artifact.effect.type === 'challenge_reward' || artifact.effect.type === 'all';
                break;
        }
        
        if (matches) {
            bonus += effectValue * rarityMult * artifactBoost;
        }
    }
    
    return bonus;
}

// 渲染神器面板
function renderArtifactsPanel() {
    var container = document.getElementById('artifacts-panel');
    if (!container) return;
    
    if (!G.artifacts) G.artifacts = {};
    if (!G.artifactLevels) G.artifactLevels = {};
    
    var html = '<div class="artifacts-grid">';
    
    ARTIFACTS.forEach(function(artifact) {
        var unlocked = G.artifacts[artifact.id];
        var level = G.artifactLevels[artifact.id] || 0;
        var rarity = ARTIFACT_RARITY[artifact.rarity];
        
        html += '<div class="artifact-card' + (unlocked ? ' unlocked' : ' locked') + '" style="border-color: ' + rarity.color + ';">';
        html += '<div class="artifact-icon">' + (unlocked ? artifact.icon : '🔒') + '</div>';
        html += '<div class="artifact-name">' + (unlocked ? artifact.name : '???') + '</div>';
        
        if (unlocked) {
            html += '<div class="artifact-rarity" style="color: ' + rarity.color + ';">' + rarity.name + '</div>';
            html += '<div class="artifact-level">Lv.' + level + '</div>';
            html += '<div class="artifact-effect">效果：+' + Math.round((artifact.effect.value + level * 0.1) * 100) + '%</div>';
            
            var upgradeCost = getArtifactUpgradeCost(artifact, level);
            html += '<button class="btn-upgrade-artifact" onclick="upgradeArtifact(\'' + artifact.id + '\')" ' + (G.gold >= upgradeCost ? '' : 'disabled') + '>';
            html += '升级 (' + formatNumber(upgradeCost) + ' 金币)';
            html += '</button>';
        } else {
            // 显示解锁条件
            html += '<div class="artifact-lock-reason">';
            switch(artifact.unlock.type) {
                case 'gold':
                    html += '解锁：累计 ' + formatNumber(artifact.unlock.target) + ' 金币';
                    break;
                case 'click_total':
                    html += '解锁：累计 ' + formatNumber(artifact.unlock.target) + ' 次点击';
                    break;
                case 'buildings_total':
                    html += '解锁：拥有 ' + artifact.unlock.target + ' 个建筑';
                    break;
                case 'play_time':
                    html += '解锁：游戏时长 ' + Math.floor(artifact.unlock.target / 3600) + ' 小时';
                    break;
                case 'rebirth':
                    html += '解锁：转生 ' + artifact.unlock.target + ' 次';
                    break;
                case 'artifacts_count':
                    html += '解锁：拥有 ' + artifact.unlock.target + ' 个神器';
                    break;
                case 'boss_kills':
                    html += '解锁：击败 ' + artifact.unlock.target + ' 个 Boss';
                    break;
                case 'events_triggered':
                    html += '解锁：触发 ' + artifact.unlock.target + ' 次事件';
                    break;
                case 'season_rank':
                    html += '解锁：赛季排名进入前 ' + artifact.unlock.target;
                    break;
                case 'challenges_completed':
                    html += '解锁：完成 ' + artifact.unlock.target + ' 次挑战';
                    break;
                case 'building_owned':
                    var building = BUILDINGS.find(b => b.id === artifact.unlock.building);
                    html += '解锁：拥有 ' + (building ? building.name : artifact.unlock.building);
                    break;
            }
            html += '</div>';
        }
        
        html += '</div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
}
// Idle Empire - 收藏品系统 v1.0

const COLLECTIBLES = [
    {
        id: 'artifact_gold_coin',
        name: '黄金硬币',
        desc: '一枚古老的金币，散发着神秘的光芒',
        icon: '🪙',
        rarity: 'common',
        effect: { type: 'gold', value: 0.05 },
        unlock: { type: 'gold', target: 100000 }
    },
    {
        id: 'artifact_diamond',
        name: '钻石',
        desc: '纯净的钻石，象征着财富与权力',
        icon: '💎',
        rarity: 'rare',
        effect: { type: 'global', value: 0.1 },
        unlock: { type: 'gold', target: 1000000 }
    },
    {
        id: 'artifact_crown',
        name: '王者皇冠',
        desc: '象征统治与权威的皇冠',
        icon: '👑',
        rarity: 'epic',
        effect: { type: 'dynasty', value: 0.2 },
        unlock: { type: 'dynasty', target: 5 }
    },
    {
        id: 'artifact_sword',
        name: '勇者之剑',
        desc: '能够轻易斩杀Boss的传奇武器',
        icon: '⚔️',
        rarity: 'rare',
        effect: { type: 'boss', value: 0.25 },
        unlock: { type: 'boss', target: 20 }
    },
    {
        id: 'artifact_wand',
        name: '魔法杖',
        desc: '蕴含强大魔法力量的法杖',
        icon: '🪄',
        rarity: 'epic',
        effect: { type: 'click', value: 0.3 },
        unlock: { type: 'click', target: 10000 }
    },
    {
        id: 'artifact_book',
        name: '知识之书',
        desc: '记载着古老智慧的魔法书',
        icon: '📚',
        rarity: 'common',
        effect: { type: 'upgrade', value: 0.15 },
        unlock: { type: 'upgrade', target: 10 }
    },
    {
        id: 'artifact_ring',
        name: '命运之戒',
        desc: '能够改变命运的神奇戒指',
        icon: '💍',
        rarity: 'legendary',
        effect: { type: 'all', value: 0.15 },
        unlock: { type: 'gold', target: 1000000000 }
    },
    {
        id: 'artifact_potion',
        name: '生命药水',
        desc: '能够恢复生命力的神奇药水',
        icon: '🧪',
        rarity: 'common',
        effect: { type: 'offline', value: 0.2 },
        unlock: { type: 'gold', target: 500000 }
    },
    {
        id: 'artifact_scroll',
        name: '远古卷轴',
        desc: '记载着古老咒语的神秘卷轴',
        icon: '📜',
        rarity: 'rare',
        effect: { type: 'event', value: 0.3 },
        unlock: { type: 'gold', target: 5000000 }
    },
    {
        id: 'artifact_gem',
        name: '能量宝石',
        desc: '蕴含强大能量的神秘宝石',
        icon: '💎',
        rarity: 'epic',
        effect: { type: 'gps', value: 0.2 },
        unlock: { type: 'gps', target: 100000 }
    },
    {
        id: 'artifact_amulet',
        name: '守护符',
        desc: '能够带来好运的神秘护身符',
        icon: '🧿',
        rarity: 'legendary',
        effect: { type: 'lucky', value: 0.4 },
        unlock: { type: 'gold', target: 5000000000 }
    },
    {
        id: 'artifact_map',
        name: '藏宝图',
        desc: '指引财富所在地的古老地图',
        icon: '🗺️',
        rarity: 'rare',
        effect: { type: 'gold', value: 0.1 },
        unlock: { type: 'building', target: 100 }
    }
];

var collectibles = [];
var collectiblesDisplay = null;

function getCollectibleData() {
    var data = localStorage.getItem('idle_empire_collectibles');
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }
    return [];
}

function saveCollectibleData() {
    localStorage.setItem('idle_empire_collectibles', JSON.stringify(collectibles));
}

function checkCollectibleUnlock() {
    if (!G) return;
    
    var changed = false;
    COLLECTIBLES.forEach(function(collectible) {
        if (collectibles.find(c => c.id === collectible.id)) return;
        
        var unlocked = false;
        switch (collectible.unlock.type) {
            case 'gold':
                unlocked = G.totalEarned >= collectible.unlock.target;
                break;
            case 'boss':
                unlocked = (G.bossesDefeated || 0) >= collectible.unlock.target;
                break;
            case 'building':
                unlocked = getTotalBuildings(G) >= collectible.unlock.target;
                break;
            case 'click':
                unlocked = (G.totalClicks || 0) >= collectible.unlock.target;
                break;
            case 'upgrade':
                unlocked = (G.upgrades || []).length >= collectible.unlock.target;
                break;
            case 'dynasty':
                unlocked = (G.dynastyLevel || 1) >= collectible.unlock.target;
                break;
            case 'gps':
                unlocked = getCurrentGps() >= collectible.unlock.target;
                break;
        }
        
        if (unlocked) {
            collectibles.push({
                id: collectible.id,
                collected: Date.now()
            });
            changed = true;
            showMsg('✨ 收藏品解锁: ' + collectible.name, 'achievement');
        }
    });
    
    if (changed) {
        saveCollectibleData();
        renderCollectibles();
        invalidateDerivedData();
    }
}

function getCollectibleById(id) {
    return COLLECTIBLES.find(c => c.id === id);
}

function getCollectibleEffectMultiplier() {
    var multipliers = {
        gold: 1,
        global: 1,
        dynasty: 1,
        boss: 1,
        click: 1,
        upgrade: 1,
        offline: 1,
        event: 1,
        gps: 1,
        lucky: 1,
        all: 1
    };
    
    collectibles.forEach(function(c) {
        var collectible = getCollectibleById(c.id);
        if (collectible) {
            if (collectible.effect.type === 'all') {
                for (var key in multipliers) {
                    multipliers[key] *= (1 + collectible.effect.value);
                }
            } else if (multipliers[collectible.effect.type] !== undefined) {
                multipliers[collectible.effect.type] *= (1 + collectible.effect.value);
            }
        }
    });
    
    return multipliers;
}

function getCollectibleBonus(type) {
    var multipliers = getCollectibleEffectMultiplier();
    return multipliers[type] || 1;
}

function initCollectibleSystem() {
    collectibles = getCollectibleData();
    checkCollectibleUnlock();
    addCollectiblesTabToUI();
    renderCollectibles();
}

function addCollectiblesTabToUI() {
    var mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    var existingTab = document.getElementById('tab-collectibles');
    if (existingTab) return;
    
    var tabsNav = document.querySelector('.nav-tabs');
    if (!tabsNav) return;
    
    var collectiblesTab = document.createElement('button');
    collectiblesTab.className = 'nav-tab';
    collectiblesTab.setAttribute('data-tab', 'collectibles');
    collectiblesTab.innerHTML = '<span class="nav-tab-icon">📦</span><span class="nav-tab-text">收藏</span>';
    tabsNav.appendChild(collectiblesTab);
    
    var collectiblesSection = document.createElement('section');
    collectiblesSection.id = 'tab-collectibles';
    collectiblesSection.className = 'content-section';
    collectiblesSection.innerHTML = '<div class="section-header"><h1 class="section-title">📦 收藏品</h1><p class="section-subtitle">收集稀有物品获得永久加成</p></div><div id="collectibles-list" class="collectibles-grid"></div>';
    mainContent.appendChild(collectiblesSection);
    
    collectiblesTab.onclick = function() {
        var allTabs = document.querySelectorAll('.nav-tab');
        var allContent = document.querySelectorAll('.content-section');
        for (var j = 0; j < allTabs.length; j++) allTabs[j].classList.remove('active');
        for (var k = 0; k < allContent.length; k++) allContent[k].classList.remove('active');
        this.classList.add('active');
        document.getElementById('tab-collectibles').classList.add('active');
    };
}

function renderCollectibles() {
    var container = document.getElementById('collectibles-list');
    if (!container) return;
    
    var html = '';
    var collectedCount = collectibles.length;
    var totalCount = COLLECTIBLES.length;
    
    html += '<div class="collectibles-header">';
    html += '<div class="collectibles-progress">已收集: ' + collectedCount + ' / ' + totalCount + '</div>';
    html += '<div class="collectibles-bonus">总加成: ' + Math.round((getCollectibleBonus('all') - 1) * 100) + '%</div>';
    html += '</div>';
    
    COLLECTIBLES.forEach(function(collectible) {
        var collected = collectibles.find(c => c.id === collectible.id);
        var rarityClass = 'rarity-' + collectible.rarity;
        var statusClass = collected ? 'collected' : 'locked';
        
        var effectText = '';
        switch (collectible.effect.type) {
            case 'gold':
                effectText = '+5% 金币收益';
                break;
            case 'global':
                effectText = '+10% 全局收益';
                break;
            case 'dynasty':
                effectText = '+20% 王朝增益';
                break;
            case 'boss':
                effectText = '+25% Boss伤害';
                break;
            case 'click':
                effectText = '+30% 点击收益';
                break;
            case 'upgrade':
                effectText = '+15% 升级效果';
                break;
            case 'offline':
                effectText = '+20% 离线收益';
                break;
            case 'event':
                effectText = '+30% 事件收益';
                break;
            case 'gps':
                effectText = '+20% 产量';
                break;
            case 'lucky':
                effectText = '+40% 幸运值';
                break;
            case 'all':
                effectText = '+15% 所有收益';
                break;
        }
        
        var unlockText = '';
        switch (collectible.unlock.type) {
            case 'gold':
                unlockText = '需要 ' + formatNumber(collectible.unlock.target) + ' 金币';
                break;
            case 'boss':
                unlockText = '需要击败 ' + collectible.unlock.target + ' 个Boss';
                break;
            case 'building':
                unlockText = '需要购买 ' + collectible.unlock.target + ' 个建筑';
                break;
            case 'click':
                unlockText = '需要点击 ' + collectible.unlock.target + ' 次';
                break;
            case 'upgrade':
                unlockText = '需要购买 ' + collectible.unlock.target + ' 个升级';
                break;
            case 'dynasty':
                unlockText = '需要王朝 Lv' + collectible.unlock.target;
                break;
            case 'gps':
                unlockText = '需要达到 ' + formatNumber(collectible.unlock.target) + '/s';
                break;
        }
        
        html += '<div class="collectible-card ' + statusClass + ' ' + rarityClass + '">';
        html += '<div class="collectible-icon">' + collectible.icon + '</div>';
        html += '<div class="collectible-info">';
        html += '<div class="collectible-name">' + collectible.name + '</div>';
        html += '<div class="collectible-desc">' + collectible.desc + '</div>';
        html += '<div class="collectible-effect">' + effectText + '</div>';
        if (!collected) {
            html += '<div class="collectible-unlock">' + unlockText + '</div>';
        }
        html += '</div>';
        html += '<div class="collectible-rarity ' + rarityClass + '">' + getRarityText(collectible.rarity) + '</div>';
        if (collected) {
            html += '<div class="collectible-date">收集于: ' + new Date(collected.collected).toLocaleDateString() + '</div>';
        }
        html += '</div>';
    });
    
    container.innerHTML = html;
}

function getRarityText(rarity) {
    switch (rarity) {
        case 'common': return '普通';
        case 'rare': return '稀有';
        case 'epic': return '史诗';
        case 'legendary': return '传说';
        default: return '未知';
    }
}

function updateCollectibles() {
    checkCollectibleUnlock();
    renderCollectibles();
}
// Idle Empire - 里程碑系统 v1.0

const MILESTONES = [
    {
        id: 'gold_100k',
        name: '财富积累',
        desc: '累计获得100K金币',
        icon: '💰',
        target: { type: 'gold', value: 100000 },
        reward: { type: 'permanent', effect: 'gold', value: 0.1 },
        tier: 1
    },
    {
        id: 'gold_1m',
        name: '百万富翁',
        desc: '累计获得1M金币',
        icon: '💎',
        target: { type: 'gold', value: 1000000 },
        reward: { type: 'permanent', effect: 'gold', value: 0.15 },
        tier: 2
    },
    {
        id: 'gold_10m',
        name: '千万富翁',
        desc: '累计获得10M金币',
        icon: '👑',
        target: { type: 'gold', value: 10000000 },
        reward: { type: 'permanent', effect: 'gold', value: 0.2 },
        tier: 3
    },
    {
        id: 'gold_100m',
        name: '亿万富翁',
        desc: '累计获得100M金币',
        icon: '🏆',
        target: { type: 'gold', value: 100000000 },
        reward: { type: 'permanent', effect: 'gold', value: 0.25 },
        tier: 4
    },
    {
        id: 'gold_1b',
        name: '财富神话',
        desc: '累计获得1B金币',
        icon: '🌟',
        target: { type: 'gold', value: 1000000000 },
        reward: { type: 'permanent', effect: 'all', value: 0.3 },
        tier: 5
    },
    {
        id: 'buildings_50',
        name: '建筑大师',
        desc: '拥有50个建筑',
        icon: '🏗️',
        target: { type: 'buildings', value: 50 },
        reward: { type: 'permanent', effect: 'gps', value: 0.2 },
        tier: 2
    },
    {
        id: 'buildings_100',
        name: '建筑帝国',
        desc: '拥有100个建筑',
        icon: '🏛️',
        target: { type: 'buildings', value: 100 },
        reward: { type: 'permanent', effect: 'gps', value: 0.3 },
        tier: 4
    },
    {
        id: 'buildings_200',
        name: '建筑传奇',
        desc: '拥有200个建筑',
        icon: '🏰',
        target: { type: 'buildings', value: 200 },
        reward: { type: 'permanent', effect: 'gps', value: 0.4 },
        tier: 5
    },
    {
        id: 'clicks_10k',
        name: '点金之手',
        desc: '累计点击10K次',
        icon: '🖱️',
        target: { type: 'clicks', value: 10000 },
        reward: { type: 'permanent', effect: 'click', value: 0.25 },
        tier: 3
    },
    {
        id: 'clicks_50k',
        name: '点击大师',
        desc: '累计点击50K次',
        icon: '👆',
        target: { type: 'clicks', value: 50000 },
        reward: { type: 'permanent', effect: 'click', value: 0.4 },
        tier: 5
    },
    {
        id: 'bosses_10',
        name: 'Boss猎手',
        desc: '击败10个Boss',
        icon: '⚔️',
        target: { type: 'bosses', value: 10 },
        reward: { type: 'permanent', effect: 'boss', value: 0.3 },
        tier: 3
    },
    {
        id: 'bosses_50',
        name: 'Boss克星',
        desc: '击败50个Boss',
        icon: '💀',
        target: { type: 'bosses', value: 50 },
        reward: { type: 'permanent', effect: 'boss', value: 0.5 },
        tier: 5
    },
    {
        id: 'upgrades_10',
        name: '升级达人',
        desc: '购买10个升级',
        icon: '⬆️',
        target: { type: 'upgrades', value: 10 },
        reward: { type: 'permanent', effect: 'upgrade', value: 0.2 },
        tier: 2
    },
    {
        id: 'upgrades_20',
        name: '升级大师',
        desc: '购买20个升级',
        icon: '🔝',
        target: { type: 'upgrades', value: 20 },
        reward: { type: 'permanent', effect: 'upgrade', value: 0.35 },
        tier: 4
    },
    {
        id: 'dynasty_5',
        name: '王朝崛起',
        desc: '达到王朝5级',
        icon: '👑',
        target: { type: 'dynasty', value: 5 },
        reward: { type: 'permanent', effect: 'dynasty', value: 0.3 },
        tier: 3
    },
    {
        id: 'dynasty_10',
        name: '王朝传奇',
        desc: '达到王朝10级',
        icon: '🌟',
        target: { type: 'dynasty', value: 10 },
        reward: { type: 'permanent', effect: 'dynasty', value: 0.5 },
        tier: 5
    },
    {
        id: 'gps_10k',
        name: '产能爆发',
        desc: '达到10K/s的产量',
        icon: '⚡',
        target: { type: 'gps', value: 10000 },
        reward: { type: 'permanent', effect: 'gps', value: 0.25 },
        tier: 3
    },
    {
        id: 'gps_100k',
        name: '产能神话',
        desc: '达到100K/s的产量',
        icon: '🌊',
        target: { type: 'gps', value: 100000 },
        reward: { type: 'permanent', effect: 'gps', value: 0.4 },
        tier: 5
    }
];

var milestones = [];

function getMilestoneData() {
    var data = localStorage.getItem('idle_empire_milestones');
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }
    return [];
}

function saveMilestoneData() {
    localStorage.setItem('idle_empire_milestones', JSON.stringify(milestones));
}

function checkMilestoneUnlock() {
    if (!G) return;
    
    var changed = false;
    MILESTONES.forEach(function(milestone) {
        if (milestones.find(m => m.id === milestone.id)) return;
        
        var unlocked = false;
        switch (milestone.target.type) {
            case 'gold':
                unlocked = G.totalEarned >= milestone.target.value;
                break;
            case 'buildings':
                unlocked = getTotalBuildings(G) >= milestone.target.value;
                break;
            case 'clicks':
                unlocked = (G.totalClicks || 0) >= milestone.target.value;
                break;
            case 'bosses':
                unlocked = (G.bossesDefeated || 0) >= milestone.target.value;
                break;
            case 'upgrades':
                unlocked = (G.upgrades || []).length >= milestone.target.value;
                break;
            case 'dynasty':
                unlocked = (G.dynastyLevel || 1) >= milestone.target.value;
                break;
            case 'gps':
                unlocked = getCurrentGps() >= milestone.target.value;
                break;
        }
        
        if (unlocked) {
            milestones.push({
                id: milestone.id,
                unlocked: Date.now()
            });
            changed = true;
            showMsg('🏆 里程碑达成: ' + milestone.name, 'achievement');
        }
    });
    
    if (changed) {
        saveMilestoneData();
        renderMilestones();
        invalidateDerivedData();
    }
}

function getMilestoneById(id) {
    return MILESTONES.find(m => m.id === id);
}

function getMilestoneBonus(type) {
    var bonus = 1;
    milestones.forEach(function(m) {
        var milestone = getMilestoneById(m.id);
        if (milestone) {
            if (milestone.reward.effect === 'all') {
                bonus *= (1 + milestone.reward.value);
            } else if (milestone.reward.effect === type) {
                bonus *= (1 + milestone.reward.value);
            }
        }
    });
    return bonus;
}

function initMilestoneSystem() {
    milestones = getMilestoneData();
    checkMilestoneUnlock();
    addMilestonesTabToUI();
    renderMilestones();
}

function addMilestonesTabToUI() {
    var mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    var existingTab = document.getElementById('tab-milestones');
    if (existingTab) return;
    
    var tabsNav = document.querySelector('.nav-tabs');
    if (!tabsNav) return;
    
    var milestonesTab = document.createElement('button');
    milestonesTab.className = 'nav-tab';
    milestonesTab.setAttribute('data-tab', 'milestones');
    milestonesTab.innerHTML = '<span class="nav-tab-icon">🏆</span><span class="nav-tab-text">里程碑</span>';
    tabsNav.appendChild(milestonesTab);
    
    var milestonesSection = document.createElement('section');
    milestonesSection.id = 'tab-milestones';
    milestonesSection.className = 'content-section';
    milestonesSection.innerHTML = '<div class="section-header"><h1 class="section-title">🏆 里程碑</h1><p class="section-subtitle">达成长期目标获得永久奖励</p></div><div id="milestones-list" class="milestones-grid"></div>';
    mainContent.appendChild(milestonesSection);
    
    milestonesTab.onclick = function() {
        var allTabs = document.querySelectorAll('.nav-tab');
        var allContent = document.querySelectorAll('.content-section');
        for (var j = 0; j < allTabs.length; j++) allTabs[j].classList.remove('active');
        for (var k = 0; k < allContent.length; k++) allContent[k].classList.remove('active');
        this.classList.add('active');
        document.getElementById('tab-milestones').classList.add('active');
    };
}

function renderMilestones() {
    var container = document.getElementById('milestones-list');
    if (!container) return;
    
    var html = '';
    var unlockedCount = milestones.length;
    var totalCount = MILESTONES.length;
    
    html += '<div class="milestones-header">';
    html += '<div class="milestones-progress">已达成: ' + unlockedCount + ' / ' + totalCount + '</div>';
    html += '<div class="milestones-bonus">总奖励: ' + Math.round((getMilestoneBonus('all') - 1) * 100) + '%</div>';
    html += '</div>';
    
    MILESTONES.forEach(function(milestone) {
        var unlocked = milestones.find(m => m.id === milestone.id);
        var tierClass = 'tier-' + milestone.tier;
        var statusClass = unlocked ? 'unlocked' : 'locked';
        
        var targetText = '';
        switch (milestone.target.type) {
            case 'gold':
                targetText = '需要 ' + formatNumber(milestone.target.value) + ' 金币';
                break;
            case 'buildings':
                targetText = '需要 ' + milestone.target.value + ' 个建筑';
                break;
            case 'clicks':
                targetText = '需要 ' + milestone.target.value + ' 次点击';
                break;
            case 'bosses':
                targetText = '需要击败 ' + milestone.target.value + ' 个Boss';
                break;
            case 'upgrades':
                targetText = '需要购买 ' + milestone.target.value + ' 个升级';
                break;
            case 'dynasty':
                targetText = '需要王朝 Lv' + milestone.target.value;
                break;
            case 'gps':
                targetText = '需要达到 ' + formatNumber(milestone.target.value) + '/s';
                break;
        }
        
        var rewardText = '';
        switch (milestone.reward.effect) {
            case 'gold':
                rewardText = '+10% 金币收益';
                break;
            case 'gps':
                rewardText = '+' + (milestone.reward.value * 100) + '% 产量';
                break;
            case 'click':
                rewardText = '+' + (milestone.reward.value * 100) + '% 点击收益';
                break;
            case 'boss':
                rewardText = '+' + (milestone.reward.value * 100) + '% Boss伤害';
                break;
            case 'upgrade':
                rewardText = '+' + (milestone.reward.value * 100) + '% 升级效果';
                break;
            case 'dynasty':
                rewardText = '+' + (milestone.reward.value * 100) + '% 王朝增益';
                break;
            case 'all':
                rewardText = '+' + (milestone.reward.value * 100) + '% 所有收益';
                break;
        }
        
        html += '<div class="milestone-card ' + statusClass + ' ' + tierClass + '">';
        html += '<div class="milestone-icon">' + milestone.icon + '</div>';
        html += '<div class="milestone-info">';
        html += '<div class="milestone-name">' + milestone.name + '</div>';
        html += '<div class="milestone-desc">' + milestone.desc + '</div>';
        html += '<div class="milestone-target">' + targetText + '</div>';
        html += '<div class="milestone-reward">奖励: ' + rewardText + '</div>';
        html += '</div>';
        html += '<div class="milestone-tier ' + tierClass + '">Tier ' + milestone.tier + '</div>';
        if (unlocked) {
            html += '<div class="milestone-date">达成于: ' + new Date(unlocked.unlocked).toLocaleDateString() + '</div>';
        }
        html += '</div>';
    });
    
    container.innerHTML = html;
}

function updateMilestones() {
    checkMilestoneUnlock();
    renderMilestones();
}
// Idle Empire - 随机事件系统 v1.0

const RANDOM_EVENTS = [
    {
        id: 'gold_rain',
        name: '金币雨',
        icon: '💰',
        desc: '天降金币！',
        duration: 10,
        effect: function() {
            var bonus = Math.floor(G.totalEarned * 0.01);
            if (bonus < 100) bonus = 100;
            G.gold += bonus;
            G.totalEarned += bonus;
            showMsg('💰 金币雨降临！获得 ' + formatNumber(bonus) + ' 金币！', 'success');
            invalidateDerivedData();
            requestUiUpdate({ heavy: true });
        }
    },
    {
        id: 'double_production',
        name: '产量翻倍',
        icon: '⬆️',
        desc: '产量提升100%',
        duration: 30,
        effect: function() {
            if (!G.eventBuffs) G.eventBuffs = {};
            G.eventBuffs.doubleProduction = Date.now() + this.duration * 1000;
            showMsg('⬆️ 产量翻倍！持续 ' + this.duration + ' 秒', 'info');
            invalidateDerivedData();
            requestUiUpdate({ heavy: true });
        }
    },
    {
        id: 'click_crit',
        name: '点击暴击',
        icon: '💥',
        desc: '点击伤害x5',
        duration: 20,
        effect: function() {
            if (!G.eventBuffs) G.eventBuffs = {};
            G.eventBuffs.clickCrit = Date.now() + this.duration * 1000;
            showMsg('💥 点击暴击！持续 ' + this.duration + ' 秒', 'info');
            invalidateDerivedData();
            requestUiUpdate({ heavy: true });
        }
    },
    {
        id: 'boss_weak',
        name: 'Boss虚弱',
        icon: '😈',
        desc: 'Boss伤害降低50%',
        duration: 45,
        effect: function() {
            if (!G.eventBuffs) G.eventBuffs = {};
            G.eventBuffs.bossWeak = Date.now() + this.duration * 1000;
            showMsg('😈 Boss虚弱！持续 ' + this.duration + ' 秒', 'info');
            invalidateDerivedData();
            requestUiUpdate({ heavy: true });
        }
    },
    {
        id: 'lucky_day',
        name: '幸运降临',
        icon: '🍀',
        desc: '所有收益+25%',
        duration: 60,
        effect: function() {
            if (!G.eventBuffs) G.eventBuffs = {};
            G.eventBuffs.luckyDay = Date.now() + this.duration * 1000;
            showMsg('🍀 幸运降临！持续 ' + this.duration + ' 秒', 'info');
            invalidateDerivedData();
            requestUiUpdate({ heavy: true });
        }
    },
    {
        id: 'building_bonus',
        name: '建筑祝福',
        icon: '🏗️',
        desc: '随机建筑收益+50%',
        duration: 40,
        effect: function() {
            var randomBuilding = BUILDINGS[Math.floor(Math.random() * BUILDINGS.length)];
            if (!G.eventBuffs) G.eventBuffs = {};
            if (!G.eventBuffs.buildingBonus) G.eventBuffs.buildingBonus = {};
            G.eventBuffs.buildingBonus[randomBuilding.id] = {
                endTime: Date.now() + this.duration * 1000,
                multiplier: 1.5
            };
            showMsg('🏗️ ' + randomBuilding.name + ' 收益+50%！持续 ' + this.duration + ' 秒', 'info');
            invalidateDerivedData();
            requestUiUpdate({ heavy: true });
        }
    },
    {
        id: 'instant_gold',
        name: '意外之财',
        icon: '💎',
        desc: '获得大量金币',
        duration: 0,
        effect: function() {
            var bonus = Math.floor(Math.sqrt(G.totalEarned) * 10);
            if (bonus < 1000) bonus = 1000;
            G.gold += bonus;
            G.totalEarned += bonus;
            showMsg('💎 意外之财！获得 ' + formatNumber(bonus) + ' 金币！', 'success');
            invalidateDerivedData();
            requestUiUpdate({ heavy: true });
        }
    },
    {
        id: 'boss_rush',
        name: 'Boss来袭',
        icon: '👹',
        desc: '连续击败3个Boss',
        duration: 0,
        effect: function() {
            if (typeof defeatBoss === 'function') {
                var reward1 = getScaledBossReward(currentBoss);
                G.gold += reward1;
                G.totalEarned += reward1;
                G.bossesDefeated = (G.bossesDefeated || 0) + 1;
                showMsg('👹 Boss来袭！击杀获得 ' + formatNumber(reward1) + ' 金币！', 'success');
                defeatBoss();
                invalidateDerivedData();
                requestUiUpdate({ heavy: true });
            }
        }
    }
];

var eventCooldown = 120000;
var lastEventTime = 0;
var eventTimer = null;
var activeBuffsDisplay = null;

function getEventBonusMultiplier(state) {
    var mult = 1;
    if (state.eventBuffs) {
        if (state.eventBuffs.doubleProduction && Date.now() < state.eventBuffs.doubleProduction) {
            mult *= 2;
        }
        if (state.eventBuffs.luckyDay && Date.now() < state.eventBuffs.luckyDay) {
            mult *= 1.25;
        }
        if (state.eventBuffs.buildingBonus) {
            var now = Date.now();
            for (var bid in state.eventBuffs.buildingBonus) {
                if (state.eventBuffs.buildingBonus[bid].endTime > now) {
                    var building = BUILDINGS.find(b => b.id === bid);
                    if (building) {
                        var count = state.buildings[bid] || 0;
                        var baseProduction = building.baseProduction * count * getBuildingMultiplier(state, bid);
                        mult += (state.eventBuffs.buildingBonus[bid].multiplier - 1) * baseProduction / (getBaseTotalProduction(state) || 1);
                    }
                }
            }
        }
    }
    return mult;
}

function getBaseTotalProduction(gameState) {
    let total = 0;
    BUILDINGS.forEach(b => {
        const count = gameState.buildings[b.id] || 0;
        total += b.baseProduction * count * getBuildingMultiplier(gameState, b.id);
    });
    return total * getDynastyMultiplier(gameState) * getPrestigeMultiplier(gameState);
}

var originalGetTotalProduction = getTotalProduction;
getTotalProduction = function(gameState) {
    var base = originalGetTotalProduction(gameState);
    return base * getEventBonusMultiplier(gameState);
};

function getClickCritMultiplier(state) {
    if (state.eventBuffs && state.eventBuffs.clickCrit && Date.now() < state.eventBuffs.clickCrit) {
        return 5;
    }
    return 1;
}

function getBossDamageModifier(state) {
    if (state.eventBuffs && state.eventBuffs.bossWeak && Date.now() < state.eventBuffs.bossWeak) {
        return 0.5;
    }
    return 1;
}

function triggerRandomEvent() {
    if (!G) return;
    if (Date.now() - lastEventTime < eventCooldown) return;
    if (G.totalEarned < 10000) return;

    lastEventTime = Date.now();
    var availableEvents = RANDOM_EVENTS.filter(function(e) {
        if (e.id === 'boss_rush' && (!currentBoss || typeof defeatBoss !== 'function')) return false;
        return true;
    });

    if (availableEvents.length === 0) return;

    var event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    event.effect();

    updateActiveBuffsDisplay();
}

function updateActiveBuffsDisplay() {
    if (!G || !G.eventBuffs) return;

    var buffs = [];
    var now = Date.now();

    if (G.eventBuffs.doubleProduction && now < G.eventBuffs.doubleProduction) {
        var remaining = Math.ceil((G.eventBuffs.doubleProduction - now) / 1000);
        buffs.push({ icon: '⬆️', name: '产量翻倍', remaining: remaining });
    }
    if (G.eventBuffs.clickCrit && now < G.eventBuffs.clickCrit) {
        var remaining = Math.ceil((G.eventBuffs.clickCrit - now) / 1000);
        buffs.push({ icon: '💥', name: '点击暴击', remaining: remaining });
    }
    if (G.eventBuffs.bossWeak && now < G.eventBuffs.bossWeak) {
        var remaining = Math.ceil((G.eventBuffs.bossWeak - now) / 1000);
        buffs.push({ icon: '😈', name: 'Boss虚弱', remaining: remaining });
    }
    if (G.eventBuffs.luckyDay && now < G.eventBuffs.luckyDay) {
        var remaining = Math.ceil((G.eventBuffs.luckyDay - now) / 1000);
        buffs.push({ icon: '🍀', name: '幸运降临', remaining: remaining });
    }
    if (G.eventBuffs.buildingBonus) {
        for (var bid in G.eventBuffs.buildingBonus) {
            if (now < G.eventBuffs.buildingBonus[bid].endTime) {
                var building = BUILDINGS.find(b => b.id === bid);
                var remaining = Math.ceil((G.eventBuffs.buildingBonus[bid].endTime - now) / 1000);
                buffs.push({ icon: building ? building.icon : '🏗️', name: (building ? building.name : '建筑') + '+50%', remaining: remaining });
            }
        }
    }

    if (buffs.length === 0) {
        if (activeBuffsDisplay) {
            activeBuffsDisplay.style.display = 'none';
        }
        return;
    }

    if (!activeBuffsDisplay) {
        activeBuffsDisplay = document.createElement('div');
        activeBuffsDisplay.className = 'active-buffs';
        activeBuffsDisplay.id = 'active-buffs';
        var bossSection = document.querySelector('.boss-section');
        if (bossSection) {
            bossSection.parentNode.insertBefore(activeBuffsDisplay, bossSection.nextSibling);
        }
    }

    var html = '<div class="buffs-title">🎁 活动增益</div>';
    buffs.forEach(function(buff) {
        html += '<div class="buff-item"><span class="buff-icon">' + buff.icon + '</span><span class="buff-name">' + buff.name + '</span><span class="buff-time">' + buff.remaining + 's</span></div>';
    });
    activeBuffsDisplay.innerHTML = html;
    activeBuffsDisplay.style.display = 'block';
}

function startEventSystem() {
    if (eventTimer) clearInterval(eventTimer);

    eventTimer = setInterval(function() {
        triggerRandomEvent();
        updateActiveBuffsDisplay();
    }, 60000);

    setTimeout(triggerRandomEvent, 30000);
}

function ensureEventBuffsState() {
    if (!G) return;
    if (!G.eventBuffs) G.eventBuffs = {};

    var now = Date.now();
    var changed = false;

    if (G.eventBuffs.doubleProduction && now >= G.eventBuffs.doubleProduction) {
        delete G.eventBuffs.doubleProduction;
        changed = true;
    }
    if (G.eventBuffs.clickCrit && now >= G.eventBuffs.clickCrit) {
        delete G.eventBuffs.clickCrit;
        changed = true;
    }
    if (G.eventBuffs.bossWeak && now >= G.eventBuffs.bossWeak) {
        delete G.eventBuffs.bossWeak;
        changed = true;
    }
    if (G.eventBuffs.luckyDay && now >= G.eventBuffs.luckyDay) {
        delete G.eventBuffs.luckyDay;
        changed = true;
    }
    if (G.eventBuffs.buildingBonus) {
        for (var bid in G.eventBuffs.buildingBonus) {
            if (now >= G.eventBuffs.buildingBonus[bid].endTime) {
                delete G.eventBuffs.buildingBonus[bid];
                changed = true;
            }
        }
    }

    if (changed) {
        invalidateDerivedData();
        requestUiUpdate({ heavy: true });
    }
}
// Idle Empire - 每日任务系统 v1.0

const QUEST_TEMPLATES = [
    {
        id: 'quest_gold_1k',
        name: '金币收集者',
        desc: '累计获得 1K 金币',
        icon: '💰',
        type: 'gold',
        target: 1000,
        reward: { type: 'gold', amount: 5000 },
        difficulty: 'easy'
    },
    {
        id: 'quest_gold_100k',
        name: '金币大亨',
        desc: '累计获得 100K 金币',
        icon: '💎',
        type: 'gold',
        target: 100000,
        reward: { type: 'gold', amount: 50000 },
        difficulty: 'medium'
    },
    {
        id: 'quest_gold_1m',
        name: '百万梦想',
        desc: '累计获得 1M 金币',
        icon: '👑',
        type: 'gold',
        target: 1000000,
        reward: { type: 'shard', amount: 1 },
        difficulty: 'hard'
    },
    {
        id: 'quest_boss_1',
        name: 'Boss猎人',
        desc: '击败 1 个 Boss',
        icon: '🗡️',
        type: 'boss',
        target: 1,
        reward: { type: 'gold', amount: 10000 },
        difficulty: 'easy'
    },
    {
        id: 'quest_boss_5',
        name: 'Boss杀手',
        desc: '击败 5 个 Boss',
        icon: '💀',
        type: 'boss',
        target: 5,
        reward: { type: 'gold', amount: 100000 },
        difficulty: 'medium'
    },
    {
        id: 'quest_building_10',
        name: '初具规模',
        desc: '购买 10 个建筑',
        icon: '🏗️',
        type: 'building',
        target: 10,
        reward: { type: 'gold', amount: 10000 },
        difficulty: 'easy'
    },
    {
        id: 'quest_building_50',
        name: '建筑大亨',
        desc: '购买 50 个建筑',
        icon: '🏢',
        type: 'building',
        target: 50,
        reward: { type: 'shard', amount: 1 },
        difficulty: 'medium'
    },
    {
        id: 'quest_click_100',
        name: '点击达人',
        desc: '点击 100 次',
        icon: '🖱️',
        type: 'click',
        target: 100,
        reward: { type: 'gold', amount: 5000 },
        difficulty: 'easy'
    },
    {
        id: 'quest_click_500',
        name: '点击狂人',
        desc: '点击 500 次',
        icon: '💥',
        type: 'click',
        target: 500,
        reward: { type: 'gold', amount: 25000 },
        difficulty: 'medium'
    },
    {
        id: 'quest_gps_1k',
        name: '日进斗金',
        desc: '达到 1K/s 产量',
        icon: '⚡',
        type: 'gps',
        target: 1000,
        reward: { type: 'gold', amount: 50000 },
        difficulty: 'medium'
    },
    {
        id: 'quest_gps_100k',
        name: '财源滚滚',
        desc: '达到 100K/s 产量',
        icon: '🌊',
        type: 'gps',
        target: 100000,
        reward: { type: 'shard', amount: 2 },
        difficulty: 'hard'
    },
    {
        id: 'quest_upgrade_3',
        name: '升级新手',
        desc: '购买 3 个升级',
        icon: '⬆️',
        type: 'upgrade',
        target: 3,
        reward: { type: 'gold', amount: 15000 },
        difficulty: 'easy'
    }
];

var questList = [];
var questTimer = null;

function getDailyQuestSeed() {
    var now = new Date();
    var seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    return seed;
}

function generateDailyQuests() {
    var seed = getDailyQuestSeed();
    var random = seededRandom(seed);
    
    var quests = [];
    var usedIndices = {};
    
    while (quests.length < 4) {
        var idx = Math.floor(random() * QUEST_TEMPLATES.length);
        if (!usedIndices[idx]) {
            usedIndices[idx] = true;
            var template = QUEST_TEMPLATES[idx];
            quests.push({
                id: template.id + '_' + Date.now(),
                templateId: template.id,
                name: template.name,
                desc: template.desc,
                icon: template.icon,
                type: template.type,
                target: template.target,
                reward: template.reward,
                difficulty: template.difficulty,
                progress: 0,
                completed: false,
                claimed: false
            });
        }
    }
    
    return quests;
}

function seededRandom(seed) {
    var m = 0x80000000;
    var a = 1103515245;
    var c = 12345;
    var state = seed;
    
    return function() {
        state = (a * state + c) % m;
        return state / m;
    };
}

function getQuestProgress(quest) {
    if (!G) return 0;
    
    switch (quest.type) {
        case 'gold':
            return G.totalEarned || 0;
        case 'boss':
            return G.bossesDefeated || 0;
        case 'building':
            return getTotalBuildings(G) || 0;
        case 'click':
            return G.totalClicks || 0;
        case 'gps':
            return getCurrentGps() || 0;
        case 'upgrade':
            return (G.upgrades || []).length;
        default:
            return 0;
    }
}

function checkQuestCompletion() {
    if (!G) return;
    
    var changed = false;
    questList.forEach(function(quest) {
        if (quest.completed || quest.claimed) return;
        
        var progress = getQuestProgress(quest);
        quest.progress = Math.min(progress, quest.target);
        
        if (progress >= quest.target && !quest.completed) {
            quest.completed = true;
            changed = true;
            showMsg('🎯 任务完成: ' + quest.name, 'achievement');
        }
    });
    
    if (changed) {
        saveQuestData();
        renderQuests();
        updateQuestTabBadge();
    }
}

function claimQuestReward(questIndex) {
    if (!G) return;
    if (questIndex < 0 || questIndex >= questList.length) return;
    
    var quest = questList[questIndex];
    if (!quest.completed || quest.claimed) return;
    
    if (quest.reward.type === 'gold') {
        G.gold += quest.reward.amount;
        G.totalEarned += quest.reward.amount;
        showMsg('💰 获得 ' + formatNumber(quest.reward.amount) + ' 金币！', 'success');
    } else if (quest.reward.type === 'shard') {
        G.prestigeShards = (G.prestigeShards || 0) + quest.reward.amount;
        showMsg('🔮 获得 ' + quest.reward.amount + ' 重铸碎片！', 'success');
    }
    
    quest.claimed = true;
    changed = true;
    saveQuestData();
    renderQuests();
    invalidateDerivedData();
    requestUiUpdate({ heavy: true });
}

function getQuestData() {
    var data = localStorage.getItem('idle_empire_quests');
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    }
    return null;
}

function saveQuestData() {
    var data = {
        date: getDailyQuestSeed(),
        quests: questList
    };
    localStorage.setItem('idle_empire_quests', JSON.stringify(data));
}

function initQuestSystem() {
    var savedData = getQuestData();
    var today = getDailyQuestSeed();
    
    if (savedData && savedData.date === today) {
        questList = savedData.quests;
    } else {
        questList = generateDailyQuests();
        saveQuestData();
    }
    
    updateQuestTabBadge();
    
    if (questTimer) clearInterval(questTimer);
    questTimer = setInterval(checkQuestCompletion, 5000);
}

function updateQuestTabBadge() {
    if (!G) return;
    
    var incomplete = questList.filter(function(q) {
        return q.completed && !q.claimed;
    }).length;
    
    var badge = document.getElementById('tab-quests-count');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-tab-badge';
        badge.id = 'tab-quests-count';
        var tab = document.querySelector('.nav-tab[data-tab="quests"]');
        if (tab) tab.appendChild(badge);
    }
    
    if (incomplete > 0) {
        badge.textContent = incomplete;
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

function renderQuests() {
    var container = document.getElementById('quest-list');
    if (!container) return;
    
    var html = '';
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    var msUntilReset = tomorrow.getTime() - Date.now();
    var hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
    var minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    
    html += '<div class="quest-header">';
    html += '<div class="quest-timer">⏰ 重置于 ' + hoursUntilReset + '小时' + minutesUntilReset + '分后</div>';
    html += '</div>';
    
    questList.forEach(function(quest, index) {
        var progress = getQuestProgress(quest);
        var percent = Math.min(100, (progress / quest.target) * 100);
        var statusClass = quest.claimed ? 'claimed' : (quest.completed ? 'ready' : 'progress');
        var rewardText = quest.reward.type === 'gold' ? formatNumber(quest.reward.amount) + ' 💰' : quest.reward.amount + ' 🔮';
        
        html += '<div class="quest-card ' + statusClass + '">';
        html += '<div class="quest-icon">' + quest.icon + '</div>';
        html += '<div class="quest-info">';
        html += '<div class="quest-name">' + quest.name + '</div>';
        html += '<div class="quest-desc">' + quest.desc + '</div>';
        html += '<div class="quest-progress-bar">';
        html += '<div class="quest-progress-fill" style="width: ' + percent + '%"></div>';
        html += '</div>';
        html += '<div class="quest-progress-text">' + formatNumber(Math.min(progress, quest.target)) + ' / ' + formatNumber(quest.target) + '</div>';
        html += '</div>';
        html += '<div class="quest-reward">' + rewardText + '</div>';
        
        if (quest.claimed) {
            html += '<div class="quest-claimed-badge">已领取</div>';
        } else if (quest.completed) {
            html += '<button class="quest-claim-btn" onclick="claimQuestReward(' + index + ')">领取</button>';
        } else {
            html += '<div class="quest-locked">进行中</div>';
        }
        
        html += '</div>';
    });
    
    container.innerHTML = html;
}

function addQuestsTabToUI() {
    var mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    var existingTab = document.getElementById('tab-quests');
    if (existingTab) return;
    
    var tabsNav = document.querySelector('.nav-tabs');
    if (!tabsNav) return;
    
    var questTab = document.createElement('button');
    questTab.className = 'nav-tab';
    questTab.setAttribute('data-tab', 'quests');
    questTab.innerHTML = '<span class="nav-tab-icon">📋</span><span class="nav-tab-text">任务</span>';
    tabsNav.appendChild(questTab);
    
    var questSection = document.createElement('section');
    questSection.id = 'tab-quests';
    questSection.className = 'content-section';
    questSection.innerHTML = '<div class="section-header"><h1 class="section-title">📋 每日任务</h1><p class="section-subtitle">完成每日任务获得丰厚奖励</p></div><div id="quest-list" class="quest-grid"></div>';
    mainContent.appendChild(questSection);
    
    questTab.onclick = function() {
        var allTabs = document.querySelectorAll('.nav-tab');
        var allContent = document.querySelectorAll('.content-section');
        for (var j = 0; j < allTabs.length; j++) allTabs[j].classList.remove('active');
        for (var k = 0; k < allContent.length; k++) allContent[k].classList.remove('active');
        this.classList.add('active');
        document.getElementById('tab-quests').classList.add('active');
    };
}
// Idle Empire - 粒子背景效果 (优化版 v5.0)
// 性能优化：空间哈希、对象池、批量绘制、LOD、自适应帧率、可见性裁剪

(function() {
    var canvas, ctx, particles = [];
    var particleCount = 80;
    var colors = ['#FFD700', '#FFA500', '#FF8C00', '#FFB347', '#FFE066', '#FFF0B3', '#FFCC00', '#FFEC8B', '#FFF8DC', '#FFFAF0', '#FFDAB9', '#F5DEB3', '#FF6B6B', '#4ECDC4', '#45B7D1'];
    var initialized = false;
    var time = 0;
    var animationId = null;
    
    // 帧率自适应
    var frameCount = 0;
    var lastFpsCheck = 0;
    var currentFps = 60;
    var autoQualityDown = false;
    var frameSkipCounter = 0;
    var skipFrames = 0; // 每N帧跳过绘制
    
    // 空间哈希网格
    var gridSize = 150;
    var grid = {};
    
    // 对象池 - 避免频繁创建/销毁对象
    var trailPool = [];
    var supernovaPool = [];
    var cometPool = [];
    
    // 预计算静态渐变
    var staticGradients = {};
    
    // 绘制批处理
    var connectionBatch = [];
    
    // 质量等级配置
    var QUALITY_LEVELS = {
        low: { 
            particles: 25, connectionDistance: 60, meteorChance: 0.002, glowLayers: 1, starDensity: 0.2, 
            trails: false, aurora: false, particles: false, connections: true, blackhole: false, comet: false,
            supernova: false, nebula: false, lensflare: false, planets: false, wormhole: false,
            _priority: 0, skipFrames: 3
        },
        medium: { 
            particles: 40, connectionDistance: 90, meteorChance: 0.004, glowLayers: 2, starDensity: 0.35, 
            trails: false, aurora: false, particles: true, connections: true, blackhole: false, comet: false,
            supernova: false, nebula: false, lensflare: false, planets: false, wormhole: false,
            _priority: 1, skipFrames: 2
        },
        high: { 
            particles: 60, connectionDistance: 120, meteorChance: 0.007, glowLayers: 3, starDensity: 0.5, 
            trails: true, aurora: false, particles: true, connections: true, blackhole: true, comet: true,
            supernova: true, nebula: true, lensflare: false, planets: true, wormhole: false,
            _priority: 2, skipFrames: 0
        },
        ultra: { 
            particles: 100, connectionDistance: 150, meteorChance: 0.012, glowLayers: 4, starDensity: 0.7, 
            trails: true, aurora: true, particles: true, connections: true, blackhole: true, comet: true,
            supernova: true, nebula: true, lensflare: true, planets: true, wormhole: true,
            _priority: 3, skipFrames: 0
        }
    };
    
    // 当前设置
    var currentQuality = 'high';
    var particlesEnabled = true;
    var scanlinesEnabled = true;
    var glowEnabled = true;
    var starsEnabled = true;
    
    // 背景星星
    var stars = [];
    var starCount = 400;
    
    // 粒子簇
    var clusters = [];
    var clusterCount = 6;
    
    // 黑洞
    var blackhole = { x: 0, y: 0, radius: 80, rotation: 0 };
    
    // 彗星
    var comets = [];
    var maxComets = 4;
    
    // 超新星
    var supernovas = [];
    var maxSupernovas = 2;
    
    // 星云
    var nebulaClouds = [];
    
    // 行星
    var planets = [];
    
    // 虫洞
    var wormholes = [];
    
    var auroraPhase = 0;
    
    // 视口边界
    var viewport = { x: 0, y: 0, width: 0, height: 0 };
    
    // ========== 对象池 ==========
    
    function getFromPool(pool) {
        return pool.length > 0 ? pool.pop() : null;
    }
    
    function returnToPool(pool, obj) {
        if (pool.length < 50) pool.push(obj);
    }
    
    // ========== 空间哈希网格 ==========
    
    function getGridKey(x, y) {
        return (Math.floor(x / gridSize) | 0) + ',' + (Math.floor(y / gridSize) | 0);
    }
    
    function buildGrid() {
        grid = {};
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var key = getGridKey(p.x, p.y);
            if (!grid[key]) grid[key] = [];
            grid[key].push(i);
        }
    }
    
    function getNeighborIndices(x, y) {
        var gx = Math.floor(x / gridSize);
        var gy = Math.floor(y / gridSize);
        var result = [];
        for (var dx = -1; dx <= 1; dx++) {
            for (var dy = -1; dy <= 1; dy++) {
                var key = (gx + dx) + ',' + (gy + dy);
                if (grid[key]) {
                    var cell = grid[key];
                    for (var i = 0; i < cell.length; i++) {
                        result.push(cell[i]);
                    }
                }
            }
        }
        return result;
    }
    
    // ========== 可见性裁剪 ==========
    
    function isInViewport(x, y, margin) {
        margin = margin || 50;
        return x >= -margin && x <= viewport.width + margin &&
               y >= -margin && y <= viewport.height + margin;
    }
    
    function updateViewport() {
        viewport.width = canvas.width;
        viewport.height = canvas.height;
    }
    
    // ========== 初始化 ==========
    
    function init() {
        if (initialized) return;
        if (!document.getElementById('particles-container')) return;
        initialized = true;
        
        canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:-1;opacity:0.95;';
        document.body.insertBefore(canvas, document.body.firstChild);
        
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
        
        for (var i = 0; i < particleCount; i++) {
            particles.push(createParticle());
        }
        
        for (var i = 0; i < starCount; i++) {
            stars.push(createStar());
        }
        
        for (var i = 0; i < clusterCount; i++) {
            clusters.push(createCluster());
        }
        
        for (var i = 0; i < 3; i++) {
            nebulaClouds.push(createNebulaCloud(i));
        }
        
        planets.push(createPlanet(0.3, 0.7, 25, '#4ECDC4'));
        planets.push(createPlanet(0.75, 0.4, 18, '#FF6B6B'));
        
        wormholes.push(createWormhole(0.2, 0.3));
        wormholes.push(createWormhole(0.8, 0.7));
        
        updateViewport();
        buildGrid();
        animate();
    }
    
    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        blackhole.x = canvas.width * 0.85;
        blackhole.y = canvas.height * 0.15;
        updateViewport();
    }
    
    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1.5,
            baseSize: Math.random() * 3 + 1.5,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: Math.random() * 0.4 + 0.6,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.012 + 0.006,
            twinklePhase: Math.random() * Math.PI * 2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            trail: [],
            maxTrail: 10,
            shimmerPhase: Math.random() * Math.PI * 2
        };
    }
    
    function createStar() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.3,
            twinkleSpeed: Math.random() * 0.025 + 0.008,
            twinklePhase: Math.random() * Math.PI * 2,
            color: ['#FFD700', '#FFFFFF', '#FFFACD', '#F0E68C', '#87CEEB'][Math.floor(Math.random() * 5)]
        };
    }
    
    function createCluster() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 80 + 40,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.01,
            color: colors[Math.floor(Math.random() * colors.length)]
        };
    }
    
    function createComet() {
        return {
            x: Math.random() * canvas.width * 0.5,
            y: Math.random() * canvas.height * 0.3,
            speedX: Math.random() * 4 + 2,
            speedY: Math.random() * 3 + 1,
            size: Math.random() * 3 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
            trail: []
        };
    }
    
    function createSupernova() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.5,
            phase: 0,
            maxPhase: 120,
            size: Math.random() * 30 + 20,
            color: ['#FF6B6B', '#FFD700', '#FF4500'][Math.floor(Math.random() * 3)]
        };
    }
    
    function createNebulaCloud(index) {
        return {
            x: canvas.width * (0.2 + index * 0.3),
            y: canvas.height * (0.3 + index * 0.2),
            radius: 150 + index * 30,
            rotation: index * 0.5,
            rotationSpeed: 0.002 + index * 0.001,
            colors: [
                ['rgba(255,100,150,0.03)', 'rgba(150,50,200,0.02)'],
                ['rgba(100,150,255,0.03)', 'rgba(50,200,200,0.02)'],
                ['rgba(255,200,100,0.03)', 'rgba(200,100,50,0.02)']
            ][index]
        };
    }
    
    function createPlanet(xRatio, yRatio, size, color) {
        return {
            x: canvas.width * xRatio,
            y: canvas.height * yRatio,
            size: size,
            color: color,
            rotation: 0,
            hasRing: Math.random() > 0.5,
            ringColor: 'rgba(255,255,255,0.2)'
        };
    }
    
    function createWormhole(xRatio, yRatio) {
        return {
            x: canvas.width * xRatio,
            y: canvas.height * yRatio,
            radius: 40,
            rotation: 0,
            pulsePhase: Math.random() * Math.PI * 2,
            particles: []
        };
    }
    
    function adjustParticleCount(targetCount) {
        var currentCount = particles.length;
        if (targetCount > currentCount) {
            for (var i = currentCount; i < targetCount; i++) {
                particles.push(createParticle());
            }
        } else if (targetCount < currentCount) {
            particles.length = targetCount;
        }
        particleCount = targetCount;
        buildGrid();
    }
    
    // ========== 绘制函数 ==========
    
    function drawBackgroundStars() {
        if (!starsEnabled) return;
        var settings = QUALITY_LEVELS[currentQuality];
        var visibleStars = Math.floor(starCount * settings.starDensity);
        
        ctx.save();
        for (var i = 0; i < visibleStars; i++) {
            var star = stars[i];
            star.twinklePhase += star.twinkleSpeed;
            var twinkle = Math.sin(star.twinklePhase) * 0.4 + 0.6;
            
            if (settings.glowLayers >= 2 && isInViewport(star.x, star.y, 20)) {
                ctx.globalAlpha = twinkle * 0.2;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
                ctx.fillStyle = star.color;
                ctx.fill();
            }
            
            ctx.globalAlpha = twinkle;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.fill();
        }
        ctx.restore();
    }
    
    function drawNebula() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.nebula) return;
        
        for (var n = 0; n < nebulaClouds.length; n++) {
            var cloud = nebulaClouds[n];
            cloud.rotation += cloud.rotationSpeed;
            
            ctx.save();
            ctx.translate(cloud.x, cloud.y);
            ctx.rotate(cloud.rotation);
            
            for (var c = 0; c < 2; c++) {
                var gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cloud.radius * (0.8 + c * 0.4));
                gradient.addColorStop(0, cloud.colors[c]);
                gradient.addColorStop(1, 'transparent');
                
                ctx.beginPath();
                ctx.arc(0, 0, cloud.radius * (0.8 + c * 0.4), 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    function drawPlanets() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.planets) return;
        
        for (var p = 0; p < planets.length; p++) {
            var planet = planets[p];
            planet.rotation += 0.005;
            
            // 行星本体
            var planetGlow = ctx.createRadialGradient(
                planet.x - planet.size * 0.3, planet.y - planet.size * 0.3, 0,
                planet.x, planet.y, planet.size
            );
            planetGlow.addColorStop(0, planet.color);
            planetGlow.addColorStop(0.7, planet.color.replace(')', ', 0.8)').replace('rgb', 'rgba'));
            planetGlow.addColorStop(1, 'rgba(0,0,0,0.8)');
            
            ctx.beginPath();
            ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
            ctx.fillStyle = planetGlow;
            ctx.fill();
            
            // 光照效果
            var light = ctx.createRadialGradient(
                planet.x - planet.size * 0.3, planet.y - planet.size * 0.3, 0,
                planet.x - planet.size * 0.3, planet.y - planet.size * 0.3, planet.size * 0.5
            );
            light.addColorStop(0, 'rgba(255,255,255,0.4)');
            light.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(planet.x - planet.size * 0.3, planet.y - planet.size * 0.3, planet.size * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = light;
            ctx.fill();
            
            // 行星环
            if (planet.hasRing) {
                ctx.save();
                ctx.translate(planet.x, planet.y);
                ctx.rotate(planet.rotation * 0.3);
                ctx.scale(1, 0.3);
                ctx.beginPath();
                ctx.arc(0, 0, planet.size * 1.8, 0, Math.PI * 2);
                ctx.strokeStyle = planet.ringColor;
                ctx.lineWidth = planet.size * 0.15;
                ctx.stroke();
                ctx.restore();
            }
        }
    }
    
    function drawWormholes() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.wormhole) return;
        
        for (var w = 0; w < wormholes.length; w++) {
            var wormhole = wormholes[w];
            wormhole.rotation += 0.03;
            wormhole.pulsePhase += 0.05;
            
            var pulse = Math.sin(wormhole.pulsePhase) * 0.3 + 0.7;
            var radius = wormhole.radius * pulse;
            
            // 外层螺旋
            ctx.save();
            ctx.translate(wormhole.x, wormhole.y);
            for (var s = 0; s < 4; s++) {
                ctx.rotate(Math.PI / 2);
                ctx.beginPath();
                ctx.moveTo(-radius * 2, 0);
                ctx.quadraticCurveTo(0, radius * 0.5, radius * 2, 0);
                ctx.strokeStyle = 'rgba(100,50,200,0.5)';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            ctx.restore();
            
            // 中心漩涡
            var centerGradient = ctx.createRadialGradient(wormhole.x, wormhole.y, 0, wormhole.x, wormhole.y, radius);
            centerGradient.addColorStop(0, 'rgba(0,0,0,0.9)');
            centerGradient.addColorStop(0.5, 'rgba(100,50,200,0.4)');
            centerGradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.arc(wormhole.x, wormhole.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = centerGradient;
            ctx.fill();
        }
    }
    
    function drawBlackhole() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.blackhole) return;
        
        blackhole.rotation += 0.01;
        
        // 引力场
        var fieldGradient = ctx.createRadialGradient(
            blackhole.x, blackhole.y, 0,
            blackhole.x, blackhole.y, blackhole.radius * 3
        );
        fieldGradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        fieldGradient.addColorStop(0.3, 'rgba(60, 0, 80, 0.3)');
        fieldGradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(blackhole.x, blackhole.y, blackhole.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = fieldGradient;
        ctx.fill();
        
        // 事件视界
        var coreGradient = ctx.createRadialGradient(
            blackhole.x, blackhole.y, 0,
            blackhole.x, blackhole.y, blackhole.radius
        );
        coreGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        coreGradient.addColorStop(1, 'rgba(60, 0, 80, 0.5)');
        
        ctx.beginPath();
        ctx.arc(blackhole.x, blackhole.y, blackhole.radius, 0, Math.PI * 2);
        ctx.fillStyle = coreGradient;
        ctx.fill();
        
        // 吸积盘
        ctx.save();
        ctx.translate(blackhole.x, blackhole.y);
        ctx.rotate(blackhole.rotation);
        
        var diskColors = ['rgba(255,150,50,0.2)', 'rgba(255,100,100,0.16)', 'rgba(255,200,100,0.12)', 'rgba(200,100,255,0.08)'];
        for (var r = 0; r < 4; r++) {
            ctx.beginPath();
            ctx.ellipse(0, 0, blackhole.radius * (1.4 + r * 0.25) * 1.6, blackhole.radius * (1.4 + r * 0.25) * 0.35, 0, 0, Math.PI * 2);
            ctx.strokeStyle = diskColors[r];
            ctx.lineWidth = 3 - r * 0.5;
            ctx.stroke();
        }
        ctx.restore();
        
        // 引力透镜优化：平方距离比较
        var bhRadiusSq = blackhole.radius * 4;
        bhRadiusSq *= bhRadiusSq;
        var innerRadiusSq = blackhole.radius;
        innerRadiusSq *= innerRadiusSq;
        
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var dx = blackhole.x - p.x;
            var dy = blackhole.y - p.y;
            var distSq = dx * dx + dy * dy;
            
            if (distSq < bhRadiusSq && distSq > innerRadiusSq) {
                var dist = Math.sqrt(distSq);
                var force = (blackhole.radius * 2) / dist;
                p.speedX += dx / dist * force * 0.015;
                p.speedY += dy / dist * force * 0.015;
            }
        }
    }
    
    function drawSupernovas() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.supernova) return;
        
        if (supernovas.length < maxSupernovas && Math.random() < 0.002) {
            supernovas.push(createSupernova());
        }
        
        // 从后往前遍历
        for (var i = supernovas.length - 1; i >= 0; i--) {
            var sup = supernovas[i];
            sup.phase++;
            
            var progress = sup.phase / sup.maxPhase;
            var alpha = progress < 0.1 ? progress * 10 : (1 - (progress - 0.1) / 0.9);
            var size = sup.size * (1 + progress * 3);
            
            // 爆发光环
            var burstGradient = ctx.createRadialGradient(sup.x, sup.y, 0, sup.x, sup.y, size * 2);
            burstGradient.addColorStop(0, sup.color);
            burstGradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
            burstGradient.addColorStop(1, 'transparent');
            
            ctx.globalAlpha = alpha * 0.8;
            ctx.beginPath();
            ctx.arc(sup.x, sup.y, size * 2, 0, Math.PI * 2);
            ctx.fillStyle = burstGradient;
            ctx.fill();
            
            // 核心
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(sup.x, sup.y, size * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            
            // 射线批量绘制
            ctx.globalAlpha = alpha * 0.5;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            var rayAngle = sup.phase * 0.1;
            var rayLength = size * (1 + progress);
            for (var r = 0; r < 8; r++) {
                var angle = (r / 8) * Math.PI * 2 + rayAngle;
                ctx.moveTo(sup.x, sup.y);
                ctx.lineTo(sup.x + Math.cos(angle) * rayLength, sup.y + Math.sin(angle) * rayLength);
            }
            ctx.stroke();
            
            ctx.globalAlpha = 1;
            
            if (sup.phase >= sup.maxPhase) {
                supernovas.splice(i, 1);
            }
        }
    }
    
    function drawComets() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.comet) return;
        
        if (comets.length < maxComets && Math.random() < 0.006) {
            comets.push(createComet());
        }
        
        for (var i = comets.length - 1; i >= 0; i--) {
            var comet = comets[i];
            
            comet.x += comet.speedX;
            comet.y += comet.speedY;
            
            comet.trail.push({ x: comet.x, y: comet.y });
            if (comet.trail.length > 25) comet.trail.shift();
            
            // 尾迹
            var trailLen = comet.trail.length;
            for (var t = 0; t < trailLen; t++) {
                var tp = comet.trail[t];
                var trailAlpha = (t / trailLen) * 0.7;
                var trailSize = comet.size * (t / trailLen) * 0.9;
                
                ctx.globalAlpha = trailAlpha;
                ctx.beginPath();
                ctx.arc(tp.x, tp.y, trailSize, 0, Math.PI * 2);
                ctx.fillStyle = comet.color;
                ctx.fill();
            }
            
            // 头部光晕
            var headGlow = ctx.createRadialGradient(comet.x, comet.y, 0, comet.x, comet.y, comet.size * 5);
            headGlow.addColorStop(0, '#FFFFFF');
            headGlow.addColorStop(0.2, comet.color);
            headGlow.addColorStop(1, 'transparent');
            
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(comet.x, comet.y, comet.size * 5, 0, Math.PI * 2);
            ctx.fillStyle = headGlow;
            ctx.fill();
            
            // 核心
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(comet.x, comet.y, comet.size, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            
            if (comet.x > canvas.width + 150 || comet.y > canvas.height + 150) {
                comets.splice(i, 1);
            }
        }
    }
    
    function drawLensflare() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.lensflare) return;
        
        var sunX = canvas.width * 0.15;
        var sunY = canvas.height * 0.12;
        
        var sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 60);
        sunGlow.addColorStop(0, 'rgba(255,255,255,1)');
        sunGlow.addColorStop(0.5, 'rgba(255,200,100,0.3)');
        sunGlow.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(sunX, sunY, 60, 0, Math.PI * 2);
        ctx.fillStyle = sunGlow;
        ctx.fill();
    }
    
    function drawAmbientGlow() {
        if (!glowEnabled) return;
        
        var g1 = ctx.createRadialGradient(
            canvas.width * 0.1, canvas.height * 0.1, 0,
            canvas.width * 0.1, canvas.height * 0.1, canvas.width * 0.5
        );
        g1.addColorStop(0, 'rgba(255, 215, 0, 0.12)');
        g1.addColorStop(1, 'transparent');
        
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function drawParticles() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.particles) return;
        
        ctx.save();
        
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            
            p.x += p.speedX;
            p.y += p.speedY;
            p.rotation += p.rotationSpeed;
            
            if (p.x < 0) p.x = canvas.width;
            else if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            else if (p.y > canvas.height) p.y = 0;
            
            p.pulsePhase += p.pulseSpeed;
            p.twinklePhase += 0.03;
            p.shimmerPhase += 0.02;
            
            var pulse = Math.sin(p.pulsePhase) * 0.25 + 0.75;
            var twinkle = Math.sin(p.twinklePhase) * 0.2 + 0.8;
            var shimmer = Math.sin(p.shimmerPhase) * 0.1 + 0.9;
            
            p.size = p.baseSize * pulse;
            var finalAlpha = p.alpha * pulse * twinkle * shimmer;
            
            // 拖尾
            if (settings.trails) {
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > p.maxTrail) p.trail.shift();
                
                var trailLen = p.trail.length;
                for (var t = 0; t < trailLen; t++) {
                    var tp = p.trail[t];
                    ctx.globalAlpha = (t / trailLen) * 0.3 * p.alpha;
                    ctx.beginPath();
                    ctx.arc(tp.x, tp.y, p.size * (t / trailLen) * 0.7, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                }
            }
            
            // 光晕
            if (glowEnabled && settings.glowLayers > 0) {
                ctx.globalAlpha = finalAlpha * 0.15;
                var glowSize = p.size * (9 - settings.glowLayers);
                var glowGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
                glowGradient.addColorStop(0, p.color);
                glowGradient.addColorStop(1, 'transparent');
                ctx.beginPath();
                ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
                ctx.fillStyle = glowGradient;
                ctx.fill();
            }
            
            // 核心
            ctx.globalAlpha = finalAlpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            
            // 高光
            ctx.globalAlpha = finalAlpha * 0.8;
            ctx.beginPath();
            ctx.arc(p.x - p.size * 0.25, p.y - p.size * 0.25, p.size * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
        ctx.restore();
    }
    
    // ========== 空间哈希连接线 ==========
    
    function drawConnections() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.connections) return;
        
        var maxDist = settings.connectionDistance;
        var maxDistSq = maxDist * maxDist;
        
        buildGrid();
        ctx.save();
        ctx.lineWidth = 1;
        
        for (var i = 0; i < particles.length; i++) {
            var p1 = particles[i];
            var neighbors = getNeighborIndices(p1.x, p1.y);
            
            for (var j = 0; j < neighbors.length; j++) {
                var idx = neighbors[j];
                if (idx <= i) continue;
                
                var p2 = particles[idx];
                var dx = p2.x - p1.x;
                var dy = p2.y - p1.y;
                var distSq = dx * dx + dy * dy;
                
                if (distSq < maxDistSq) {
                    var alpha = (1 - Math.sqrt(distSq) / maxDist) * 0.3;
                    
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        
        ctx.globalAlpha = 1;
        ctx.restore();
    }
    
    function drawMeteors() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!glowEnabled || settings.meteorChance === 0) return;
        
        if (Math.random() < settings.meteorChance) {
            var startX = Math.random() * canvas.width;
            var startY = Math.random() * canvas.height * 0.2;
            var length = Math.random() * 120 + 60;
            var angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
            
            var gradient = ctx.createLinearGradient(
                startX, startY,
                startX - length * Math.cos(angle), startY + length * Math.sin(angle)
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.5)');
            gradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX - length * Math.cos(angle), startY + length * Math.sin(angle));
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.95;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
    
    function drawAurora() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.aurora) return;
        
        auroraPhase += 0.003;
        
        var baseY = canvas.height * 0.2;
        var auroraColors = ['rgba(0, 255, 150, 0.03)', 'rgba(50, 200, 255, 0.025)', 'rgba(150, 100, 255, 0.02)'];
        
        for (var i = 0; i < 3; i++) {
            var waveOffset = Math.sin(auroraPhase + i * 0.5) * 50;
            
            ctx.beginPath();
            ctx.moveTo(0, baseY + waveOffset);
            
            for (var x = 0; x <= canvas.width; x += 20) {
                var wx = x / canvas.width;
                var wy = Math.sin(wx * 6 + auroraPhase + i) * 35;
                ctx.lineTo(x, baseY + waveOffset + wy);
            }
            
            ctx.lineTo(canvas.width, canvas.height * 0.4);
            ctx.lineTo(0, canvas.height * 0.4);
            ctx.closePath();
            
            ctx.fillStyle = auroraColors[i];
            ctx.fill();
        }
    }
    
    // ========== 帧率自适应 ==========
    
    function checkPerformance() {
        frameCount++;
        var now = Date.now();
        
        if (now - lastFpsCheck >= 1000) {
            currentFps = frameCount;
            frameCount = 0;
            lastFpsCheck = now;
            
            var settings = QUALITY_LEVELS[currentQuality];
            skipFrames = settings.skipFrames || 0;
            
            if (currentFps < 30 && !autoQualityDown) {
                autoQualityDown = true;
                var levels = ['low', 'medium', 'high', 'ultra'];
                var idx = levels.indexOf(currentQuality);
                if (idx > 0) {
                    setGraphicsQuality(levels[idx - 1]);
                }
            }
            
            if (currentFps > 55 && autoQualityDown) {
                autoQualityDown = false;
            }
        }
    }
    
    // ========== 主循环 ==========
    
    function animate() {
        if (!ctx) return;
        
        // 帧率自适应跳过
        frameSkipCounter++;
        if (frameSkipCounter <= skipFrames) {
            animationId = requestAnimationFrame(animate);
            return;
        }
        frameSkipCounter = 0;
        
        time += 0.016;
        checkPerformance();
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawBackgroundStars();
        drawNebula();
        drawPlanets();
        
        if (glowEnabled) {
            drawAmbientGlow();
        }
        
        if (particlesEnabled) {
            drawParticles();
            drawConnections();
        }
        
        drawBlackhole();
        drawWormholes();
        drawSupernovas();
        drawComets();
        drawLensflare();
        drawMeteors();
        drawAurora();
        
        animationId = requestAnimationFrame(animate);
    }
    
    // ========== API ==========
    
    window.setGraphicsQuality = function(level) {
        if (!QUALITY_LEVELS[level]) level = 'high';
        currentQuality = level;
        var settings = QUALITY_LEVELS[level];
        adjustParticleCount(settings.particles);
        skipFrames = settings.skipFrames || 0;
        localStorage.setItem('idle_empire_quality', level);
    };
    
    window.toggleParticles = function(enabled) {
        particlesEnabled = !!enabled;
        localStorage.setItem('idle_empire_particles', particlesEnabled);
    };
    
    window.toggleScanlines = function(enabled) {
        scanlinesEnabled = !!enabled;
        var scanline = document.querySelector('.scan-line');
        if (scanline) scanline.style.display = scanlinesEnabled ? 'block' : 'none';
        localStorage.setItem('idle_empire_scanlines', scanlinesEnabled);
    };
    
    window.toggleGlow = function(enabled) {
        glowEnabled = !!enabled;
        localStorage.setItem('idle_empire_glow', glowEnabled);
    };
    
    window.toggleStars = function(enabled) {
        starsEnabled = !!enabled;
        localStorage.setItem('idle_empire_stars', starsEnabled);
    };
    
    function loadSettings() {
        var saved = localStorage.getItem('idle_empire_quality');
        if (saved && QUALITY_LEVELS[saved]) {
            setGraphicsQuality(saved);
            var select = document.getElementById('setting-quality');
            if (select) select.value = saved;
        }
        
        ['particles', 'scanlines', 'glow', 'stars'].forEach(function(key) {
            var val = localStorage.getItem('idle_empire_' + key);
            if (val !== null) {
                var fn = key === 'particles' ? toggleParticles : 
                         key === 'scanlines' ? toggleScanlines :
                         key === 'glow' ? toggleGlow : toggleStars;
                fn(val === 'true');
                var el = document.getElementById('setting-' + key);
                if (el) el.checked = val === 'true';
            }
        });
    }
    
    window.initParticles = function() {
        init();
        setTimeout(loadSettings, 100);
    };
    
    window.getParticlePerformance = function() {
        return {
            fps: currentFps,
            particleCount: particles.length,
            quality: currentQuality,
            skipFrames: skipFrames,
            autoDowngraded: autoQualityDown
        };
    };
})();
// Idle Empire v2.0 - 游戏初始化补丁
// 此文件需要在 game.js 之后加载，用于初始化 v2.0 新系统

// 扩展初始化函数 - 在原有 init 函数之后调用
function initV2Systems() {
    console.log('[v2.0] 初始化新系统...');
    
    // 初始化神器系统
    if (G && !G.artifacts) G.artifacts = {};
    if (G && !G.artifactLevels) G.artifactLevels = {};
    
    // 初始化转生系统
    if (G && G.rebirths === undefined) G.rebirths = 0;
    if (G && G.totalSoulGems === undefined) G.totalSoulGems = 0;
    if (G && !G.soulShopLevels) G.soulShopLevels = {};
    
    // 初始化升级系统（使用对象而不是数组）
    if (G && !G.upgrades) G.upgrades = {};
    
    // 初始化成就系统（使用对象而不是数组）
    if (G && !G.achievements) G.achievements = {};
    
    // 初始化 v2 统计
    if (G && G.seasonsParticipated === undefined) G.seasonsParticipated = 0;
    if (G && G.bestSeasonRank === undefined) G.bestSeasonRank = 9999;
    if (G && G.challengesCompleted === undefined) G.challengesCompleted = 0;
    if (G && G.eventsTriggered === undefined) G.eventsTriggered = 0;
    
    // 应用转生加成
    if (G && G.rebirths > 0) {
        applyRebirthBonuses();
    }
    
    // 检查神器解锁
    checkArtifactUnlocks();
    
    // 检查成就
    checkAchievements();
    
    console.log('[v2.0] 新系统初始化完成');
}

// 更新 Tab 切换逻辑
function initV2Tabs() {
    // 添加新 Tab 的事件监听
    document.querySelectorAll('.nav-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            var tabName = this.getAttribute('data-tab');
            
            // 切换 Tab 内容
            document.querySelectorAll('.content-section').forEach(function(section) {
                section.classList.remove('active');
            });
            
            var targetSection = document.getElementById('tab-' + tabName);
            if (targetSection) {
                targetSection.classList.add('active');
                
                // 渲染对应面板
                switch(tabName) {
                    case 'artifacts':
                        renderArtifactsPanel();
                        break;
                    case 'rebirth':
                        renderRebirthPanel();
                        break;
                    case 'upgrades':
                        renderUpgradesPanel();
                        break;
                    case 'achievements':
                        renderAchievementsPanel();
                        break;
                }
            }
            
            // 更新 Tab 激活状态
            document.querySelectorAll('.nav-tab').forEach(function(t) {
                t.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
}

// 更新 Tab 计数
function updateV2TabCounts() {
    if (!G) return;
    
    // 神器计数
    var artifactCount = G.artifacts ? Object.keys(G.artifacts).length : 0;
    var artifactTab = document.getElementById('tab-artifacts-count');
    if (artifactTab) {
        artifactTab.textContent = artifactCount;
        artifactTab.style.display = artifactCount > 0 ? 'inline-block' : 'none';
    }
    
    // 转生计数
    var rebirthTab = document.getElementById('tab-rebirth-count');
    if (rebirthTab) {
        rebirthTab.textContent = G.rebirths || 0;
        rebirthTab.style.display = (G.rebirths || 0) > 0 ? 'inline-block' : 'none';
    }
    
    // 升级可购买计数
    var availableUpgrades = UPGRADES.filter(function(u) {
        return canBuyUpgrade(u.id);
    }).length;
    var upgradesTab = document.getElementById('tab-upgrades-count');
    if (upgradesTab) {
        upgradesTab.textContent = availableUpgrades;
        upgradesTab.style.display = availableUpgrades > 0 ? 'inline-block' : 'none';
    }
}

// 扩展游戏循环
function v2GameLoop() {
    if (!G) return;
    
    // 检查神器解锁
    checkArtifactUnlocks();
    
    // 检查成就
    checkAchievements();
    
    // 更新 Tab 计数（每 5 秒）
    if (Date.now() % 5000 < 100) {
        updateV2TabCounts();
    }
}

// 扩展示例保存数据结构
function getV2SaveData() {
    return {
        artifacts: G.artifacts || {},
        artifactLevels: G.artifactLevels || {},
        rebirths: G.rebirths || 0,
        totalSoulGems: G.totalSoulGems || 0,
        soulShopLevels: G.soulShopLevels || {},
        upgrades: G.upgrades || {},
        achievements: G.achievements || {},
        rebirthBonus: G.rebirthBonus || 0
    };
}

// 加载 v2 存档数据
function loadV2SaveData(data) {
    if (!data) return;
    
    G.artifacts = data.artifacts || {};
    G.artifactLevels = data.artifactLevels || {};
    G.rebirths = data.rebirths || 0;
    G.totalSoulGems = data.totalSoulGems || 0;
    G.soulShopLevels = data.soulShopLevels || {};
    G.upgrades = data.upgrades || {};
    G.achievements = data.achievements || {};
    G.rebirthBonus = data.rebirthBonus || 0;
}

// 监听游戏加载完成
window.addEventListener('load', function() {
    setTimeout(function() {
        if (G) {
            initV2Systems();
            initV2Tabs();
            updateV2TabCounts();
            
            // 将 v2GameLoop 集成到现有游戏循环中
            var originalGameLoop = window.gameLoop;
            if (originalGameLoop) {
                window.gameLoop = function() {
                    originalGameLoop();
                    v2GameLoop();
                };
            }
        }
    }, 1000);
});

console.log('[v2.0] 补丁已加载，等待游戏初始化...');
