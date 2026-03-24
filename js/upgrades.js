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
