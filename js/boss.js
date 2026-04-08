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
var bossRushActive = false;

function getDynastyBossScale() {
    if (!G) return 1;
    return 1 + ((G.dynastyLevel || 1) - 1) * 0.25;
}

function getScaledBossHp(boss) {
    var hp = Math.floor(boss.hp * getDynastyBossScale());
    if (typeof window.getChallengeBossHpModifier === 'function') {
        hp = window.getChallengeBossHpModifier(hp);
    }
    return hp;
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

        window.triggerBossAttackFlash?.();
        bossHp -= getCurrentBossDamagePerSecond();
        G.bossHp = bossHp;
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
    if (window.checkQuestProgress) window.checkQuestProgress();
    if (window.checkSeasonProgress) window.checkSeasonProgress();
    if (window.checkSeasonProgress) window.checkSeasonProgress();
    if (window.playSound) window.playSound('boss');

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

// 每周挑战Boss：随机选一个Boss，HP×2，奖励×3，每周五0点重置
function getWeekNumber() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    var yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getWeeklyChallengeBoss() {
    if (!G) return null;
    var currentWeek = getWeekNumber();
    if (G.weeklyChallengeWeek === currentWeek && G.weeklyChallengeBoss) {
        return G.weeklyChallengeBoss;
    }
    // 选一个已解锁的非隐藏Boss
    var unlocked = BOSSES.filter(function(b) {
        return G.totalEarned >= b.unlockGold && !b.hidden && (!b.rebirthRequired || (G.rebirths || 0) >= 1);
    });
    if (unlocked.length === 0) return null;
    var base = unlocked[Math.floor(Math.random() * unlocked.length)];
    var challenge = {
        id: 'challenge_' + base.id,
        baseId: base.id,
        name: '⚔️ 挑战: ' + base.name,
        icon: base.icon,
        hp: Math.floor(base.hp * 2),
        reward: Math.floor(base.reward * 3),
        isChallenge: true
    };
    G.weeklyChallengeBoss = challenge;
    G.weeklyChallengeWeek = currentWeek;
    return challenge;
}

function challengeWeeklyBoss() {
    var cb = getWeeklyChallengeBoss();
    if (!cb) return;
    currentBoss = { id: cb.id, name: cb.name, icon: cb.icon, damage: 0 };
    bossHp = cb.hp;
    bossMaxHp = cb.hp;
    G.currentBoss = cb.id;
    G.bossHp = bossHp;
    G.bossMaxHp = bossMaxHp;
    renderBoss();
    if (typeof requestUiUpdate === 'function') {
        requestUiUpdate({ heavy: true });
    } else {
        updateUI();
    }
}

function startBossRush() {
    if (!G || bossRushActive) return;
    var unlocked = BOSSES.filter(function(b) {
        return G.totalEarned >= b.unlockGold && !b.hidden && (!b.rebirthRequired || (G.rebirths || 0) >= 1);
    });
    if (unlocked.length === 0) {
        showMsg('没有可挑战的Boss', 'warning');
        return;
    }
    bossRushActive = true;
    currentBoss = unlocked[0];
    bossHp = getScaledBossHp(currentBoss);
    bossMaxHp = bossHp;
    G.currentBoss = currentBoss.id;
    G.bossHp = bossHp;
    G.bossMaxHp = bossMaxHp;
    bossRushIdx = 0;
    bossRushList = unlocked;
    showMsg('⚔️ Boss Rush 开始！连续击败 ' + unlocked.length + ' 个Boss，奖励x3！', 'success');
    startBossDamage();
    if (typeof requestUiUpdate === 'function') {
        requestUiUpdate({ heavy: true });
    } else {
        updateUI();
    }
}
var bossRushIdx = 0;
var bossRushList = [];

function defeatBoss() {
    if (!G || !currentBoss) return;

    // 发放奖励（rush模式3倍）
    var reward = getScaledBossReward(currentBoss);
    if (bossRushActive) reward = Math.floor(reward * 3);
    G.gold += reward;
    G.totalEarned += reward;
    G.bossesDefeated = (G.bossesDefeated || 0) + 1;
    if (window.checkQuestProgress) window.checkQuestProgress();
    if (window.checkSeasonProgress) window.checkSeasonProgress();

    showMsg('🎉 击杀 ' + currentBoss.name + '! +' + formatNumber(reward) + ' 金币!' + (bossRushActive ? ' (Rush)' : ''), 'success');

    // Rush模式：自动进入下一个Boss
    if (bossRushActive && bossRushIdx < bossRushList.length - 1) {
        bossRushIdx++;
        currentBoss = bossRushList[bossRushIdx];
        bossHp = getScaledBossHp(currentBoss);
        bossMaxHp = bossHp;
        G.currentBoss = currentBoss.id;
        G.bossHp = bossHp;
        G.bossMaxHp = bossMaxHp;
        renderBoss();
        if (typeof requestUiUpdate === 'function') {
            requestUiUpdate({ heavy: true });
        } else {
            updateUI();
        }
        checkAchievements();
        return;
    }

    // Rush结束
    if (bossRushActive) {
        bossRushActive = false;
        bossRushIdx = 0;
        bossRushList = [];
        showMsg('🏆 Boss Rush 完成！所有奖励已x3！', 'success');
    }

    // 下一个Boss（普通模式）
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
            bossHp = getScaledBossHp(currentBoss);
            bossMaxHp = bossHp;
            G.currentBoss = currentBoss.id;
            G.bossHp = bossHp;
            G.bossMaxHp = bossMaxHp;
        }
    }

    renderBoss();
    if (typeof requestUiUpdate === 'function') {
        requestUiUpdate({ heavy: true });
    } else {
        updateUI();
    }
    checkAchievements();
}
