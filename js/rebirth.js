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
