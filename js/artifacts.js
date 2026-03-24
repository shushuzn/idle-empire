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
