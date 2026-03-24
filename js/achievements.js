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
