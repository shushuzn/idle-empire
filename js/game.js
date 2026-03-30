// Idle Empire v2.0 - Evolution Edition
// Enhanced with keyboard shortcuts, animations, and premium effects

var G = null;
var clickAnimationFrame = null;
var uiElements = null;
var cachedGps = 0;
var derivedDirty = true;
var lastHeavyRenderAt = 0;
var HEAVY_RENDER_INTERVAL = 1000;
var progressElements = null;
var renderSignatures = {
    buildings: '',
    upgrades: '',
    achievements: '',
    bosses: '',
    stats: ''
};
var buildingCardRefs = {};
var upgradeCardRefs = {};
var uiTextCache = {};
var progressCache = {
    visible: null,
    width: null,
    targetText: ''
};
var uiRafId = null;
var pendingUiOptions = { heavy: false };
var gameLoopTimer = null;
var GAME_LOOP_VISIBLE_MS = 100;
var GAME_LOOP_HIDDEN_MS = 1000;
var BUY_MODE_SEQUENCE = ['x1', 'x10', 'max'];

// Keyboard shortcuts
var KEY_SHORTCUTS = {
    '1': 'buildings',
    '2': 'upgrades',
    '3': 'bosses',
    '4': 'achievements',
    '5': 'stats',
    's': 'save',
    'r': 'prestige',
    'q': 'buy_x1',
    'w': 'buy_x10',
    'e': 'buy_max',
    'Space': 'click'
};

function init() {
    initTheme();
    G = loadGame();
    ensureEventBuffsState();
    addQuestsTabToUI();
    initQuestSystem();
    initCollectibleSystem();
    initMilestoneSystem();
    renderBuildings();
    renderUpgrades();
    renderAchievements();
    renderStats();
    renderQuests();
    renderCollectibles();
    renderMilestones();
    updateUI();
    updateStats();
    initTabs();
    initBossSystem();
    renderBossList();
    startGameLoop();
    startAutoSave(G);
    initKeyboardShortcuts();
    initClickRipple();
    cacheUiElements();
    ensureDynastyState();
    updateTabCounts();
    setBuyMode(G.buyMode || 'x1', true);
    startEventSystem();
}

function cacheUiElements() {
    uiElements = {
        goldDisplay: document.getElementById('gold-display'),
        gpsDisplay: document.getElementById('gps-display'),
        statBuildings: document.getElementById('stat-buildings'),
        statClicks: document.getElementById('stat-clicks'),
        statAchievements: document.getElementById('stat-achievements'),
        statBosses: document.getElementById('stat-bosses'),
        statDynasty: document.getElementById('stat-dynasty'),
        buyModeX1: document.getElementById('buy-mode-x1'),
        buyModeX10: document.getElementById('buy-mode-x10'),
        buyModeMax: document.getElementById('buy-mode-max'),
        tabBuildingsCount: document.getElementById('tab-buildings-count'),
        tabUpgradesCount: document.getElementById('tab-upgrades-count'),
        tabBossesCount: document.getElementById('tab-bosses-count'),
        tabAchievementsCount: document.getElementById('tab-achievements-count')
    };
    progressElements = {
        wrapper: document.getElementById('next-building-progress'),
        fill: document.getElementById('progress-fill'),
        target: document.getElementById('progress-target')
    };
}

function ensureDynastyState() {
    if (!G) return;
    if (G.dynastyLevel === undefined) G.dynastyLevel = 1;
    if (G.dynastyPoints === undefined) G.dynastyPoints = Math.max(0, G.dynastyLevel - 1);
    if (!G.dynastyTalents) G.dynastyTalents = { idle: 0, click: 0, boss: 0 };
    if (G.dynastyTalents.idle === undefined) G.dynastyTalents.idle = 0;
    if (G.dynastyTalents.click === undefined) G.dynastyTalents.click = 0;
    if (G.dynastyTalents.boss === undefined) G.dynastyTalents.boss = 0;
    if (G.prestigeShards === undefined) G.prestigeShards = 0;
    if (G.prestigeResets === undefined) G.prestigeResets = 0;
    if (!G.prestigeShop) G.prestigeShop = { idleCore: 0, clickCore: 0, bossCore: 0 };
    if (G.prestigeShop.idleCore === undefined) G.prestigeShop.idleCore = 0;
    if (G.prestigeShop.clickCore === undefined) G.prestigeShop.clickCore = 0;
    if (G.prestigeShop.bossCore === undefined) G.prestigeShop.bossCore = 0;
}

function updateTabCounts() {
    if (!uiElements) cacheUiElements();
    if (uiElements.tabBuildingsCount) uiElements.tabBuildingsCount.textContent = BUILDINGS.length;
    if (uiElements.tabUpgradesCount) uiElements.tabUpgradesCount.textContent = UPGRADES.length;
    if (uiElements.tabBossesCount) uiElements.tabBossesCount.textContent = BOSSES.length;
    if (uiElements.tabAchievementsCount) uiElements.tabAchievementsCount.textContent = ACHIEVEMENTS.length;
}

function normalizeBuyMode(mode) {
    return BUY_MODE_SEQUENCE.indexOf(mode) !== -1 ? mode : 'x1';
}

function updateBuyModeButtons() {
    if (!uiElements) cacheUiElements();
    var mode = normalizeBuyMode(G.buyMode || 'x1');
    if (uiElements.buyModeX1) uiElements.buyModeX1.classList.toggle('active', mode === 'x1');
    if (uiElements.buyModeX10) uiElements.buyModeX10.classList.toggle('active', mode === 'x10');
    if (uiElements.buyModeMax) uiElements.buyModeMax.classList.toggle('active', mode === 'max');
}

function setBuyMode(mode, silent) {
    if (!G) return;
    var nextMode = normalizeBuyMode(mode);
    if (G.buyMode === nextMode && !silent) return;
    G.buyMode = nextMode;
    updateBuyModeButtons();
    renderSignatures.buildings = '';
    requestUiUpdate({ heavy: true });
    if (!silent) showMsg('购买模式: ' + nextMode.toUpperCase(), 'info');
}

function getBulkPurchaseInfo(building, state, mode) {
    var owned = state.buildings[building.id] || 0;
    var normalizedMode = normalizeBuyMode(mode || state.buyMode || 'x1');
    
    // 对于x1和x10模式，直接计算
    if (normalizedMode === 'x1') {
        var cost = Math.floor(building.baseCost * Math.pow(1.15, owned));
        return { count: state.gold >= cost ? 1 : 0, totalCost: cost };
    }
    
    if (normalizedMode === 'x10') {
        var count = 0;
        var totalCost = 0;
        var nextOwned = owned;
        
        while (count < 10) {
            var nextCost = Math.floor(building.baseCost * Math.pow(1.15, nextOwned));
            if (state.gold < totalCost + nextCost) break;
            totalCost += nextCost;
            nextOwned += 1;
            count += 1;
        }
        
        if (count === 0) {
            return { count: 0, totalCost: Math.floor(building.baseCost * Math.pow(1.15, owned)) };
        }
        
        return { count: count, totalCost: totalCost };
    }
    
    // 对于max模式，使用二分查找优化
    if (normalizedMode === 'max') {
        var currentCost = Math.floor(building.baseCost * Math.pow(1.15, owned));
        if (state.gold < currentCost) {
            return { count: 0, totalCost: currentCost };
        }
        
        // 估算最大可能购买数量
        var maxPossible = 0;
        var tempCost = 0;
        var tempOwned = owned;
        
        // 快速估算上限
        while (tempCost < state.gold && maxPossible < 1000) {
            var cost = Math.floor(building.baseCost * Math.pow(1.15, tempOwned));
            if (tempCost + cost > state.gold) break;
            tempCost += cost;
            tempOwned += 1;
            maxPossible += 1;
        }
        
        // 精确计算
        var count = 0;
        var totalCost = 0;
        var nextOwned = owned;
        
        while (count < maxPossible) {
            var cost = Math.floor(building.baseCost * Math.pow(1.15, nextOwned));
            if (totalCost + cost > state.gold) break;
            totalCost += cost;
            nextOwned += 1;
            count += 1;
        }
        
        return { count: count, totalCost: totalCost };
    }
    
    // 默认情况
    var cost = Math.floor(building.baseCost * Math.pow(1.15, owned));
    return { count: state.gold >= cost ? 1 : 0, totalCost: cost };
}

function invalidateDerivedData() {
    derivedDirty = true;
}

function getCurrentGps() {
    if (derivedDirty) {
        cachedGps = getTotalProduction(G);
        derivedDirty = false;
    }
    return cachedGps;
}

function setTextIfChanged(el, key, value) {
    if (!el) return;
    if (uiTextCache[key] !== value) {
        el.textContent = value;
        uiTextCache[key] = value;
    }
}

function requestUiUpdate(options) {
    options = options || {};
    pendingUiOptions.heavy = pendingUiOptions.heavy || !!options.heavy;

    if (uiRafId !== null) return;

    uiRafId = requestAnimationFrame(function() {
        uiRafId = null;
        var nextOptions = { heavy: pendingUiOptions.heavy };
        pendingUiOptions.heavy = false;
        updateUI(nextOptions);
    });
}

function renderIfChanged(key, nextSignature, renderFn) {
    if (renderSignatures[key] !== nextSignature) {
        renderFn();
        renderSignatures[key] = nextSignature;
    }
}

function getBuildingsSignature() {
    var owned = [];
    for (var i = 0; i < BUILDINGS.length; i++) {
        var bid = BUILDINGS[i].id;
        owned.push(bid + ':' + (G.buildings[bid] || 0));
    }
    return [
        Math.floor(G.gold),
        Math.floor(G.totalEarned),
        G.dynastyLevel || 1,
        (G.upgrades || []).join(','),
        owned.join('|')
    ].join('#');
}

function getUpgradesSignature() {
    return [Math.floor(G.gold), Object.keys(G.upgrades || {}).sort().join(',')].join('#');
}

function getAchievementsSignature() {
    return Object.keys(G.achievements || {}).sort().join(',');
}

function getBossesSignature() {
    return [
        Math.floor(G.totalEarned),
        G.currentBoss || '',
        Math.floor(G.bossHp || 0),
        G.bossesDefeated || 0,
        G.dynastyLevel || 1
    ].join('#');
}

function getStatsSignature() {
    var elapsedSeconds = Math.floor((Date.now() - G.startTime) / 1000);
    return [
        Math.floor(G.gold),
        Math.floor(G.totalEarned),
        Math.floor(getCurrentGps()),
        getTotalBuildings(G),
        (G.achievements || []).length,
        G.bossesDefeated || 0,
        G.totalClicks || 0,
        G.dynastyLevel || 1,
        G.dynastyPoints || 0,
        G.prestigeShards || 0,
        G.prestigeResets || 0,
        JSON.stringify(G.dynastyTalents || {}),
        JSON.stringify(G.prestigeShop || {}),
        elapsedSeconds
    ].join('#');
}

function getPrestigeUpgradeCost(upgradeId, level) {
    var baseCost = 5;
    if (upgradeId === 'clickCore') baseCost = 6;
    if (upgradeId === 'bossCore') baseCost = 7;
    return Math.floor(baseCost * Math.pow(1.8, level));
}

function buyPrestigeUpgrade(upgradeId) {
    if (!G) return;
    ensureDynastyState();
    if (!G.prestigeShop || G.prestigeShop[upgradeId] === undefined) return;

    var level = G.prestigeShop[upgradeId] || 0;
    var cost = getPrestigeUpgradeCost(upgradeId, level);
    if ((G.prestigeShards || 0) < cost) {
        showMsg('重铸碎片不足', 'warning');
        return;
    }

    G.prestigeShards -= cost;
    G.prestigeShop[upgradeId] += 1;
    invalidateDerivedData();
    renderSignatures.stats = '';
    requestUiUpdate({ heavy: true });
    showMsg('重铸强化已升级', 'success');
}

function calculatePrestigeGain() {
    if (!G) return 0;
    if (G.totalEarned < 1000000) return 0;
    return Math.max(1, Math.floor(Math.sqrt(G.totalEarned / 1000000)));
}

function performPrestige() {
    if (!G) return;
    ensureDynastyState();

    var gain = calculatePrestigeGain();
    if (gain <= 0) {
        showMsg('至少累计 1M 金币才能重铸', 'warning');
        return;
    }

    var ok = confirm('重铸将重置建筑、升级、金币与Boss进度，但保留王朝与永久代币。\n本次可获得 ' + gain + ' 王朝碎片，确认执行吗？');
    if (!ok) return;

    G.prestigeShards += gain;
    G.prestigeResets += 1;

    G.gold = 0;
    G.totalEarned = 0;
    G.buildings = {};
    G.upgrades = {};
    G.currentBoss = null;
    G.bossHp = 0;
    G.bossMaxHp = 0;
    G.bossesDefeated = 0;
    G.totalClicks = 0;
    G.startTime = Date.now();

    invalidateDerivedData();
    renderSignatures.buildings = '';
    renderSignatures.upgrades = '';
    renderSignatures.bosses = '';
    renderSignatures.stats = '';

    initBossSystem();
    requestUiUpdate({ heavy: true });
    showMsg('✨ 王朝重铸成功! 获得 ' + gain + ' 碎片', 'achievement');
}

function upgradeDynastyTalent(talentId) {
    if (!G) return;
    ensureDynastyState();
    if ((G.dynastyPoints || 0) <= 0) {
        showMsg('天赋点不足', 'warning');
        return;
    }
    if (!G.dynastyTalents[talentId] && G.dynastyTalents[talentId] !== 0) return;

    G.dynastyTalents[talentId] += 1;
    G.dynastyPoints -= 1;
    invalidateDerivedData();
    renderSignatures.stats = '';
    renderSignatures.bosses = '';
    requestUiUpdate({ heavy: true });
    showMsg('王朝天赋已提升', 'success');
}

function clickGold(e) {
    var v = Math.max(1, Math.floor(getClickMultiplier(G) * getDynastyMultiplier(G)));
    G.gold += v;
    G.totalEarned += v;
    G.totalClicks = (G.totalClicks || 0) + 1;
    
    // Create floating number
    var el = document.createElement('div');
    el.className = 'click-effect gold-float';
    el.textContent = '+' + v;
    
    // Random offset for visual variety
    var offsetX = (Math.random() - 0.5) * 40;
    var offsetY = (Math.random() - 0.5) * 20;
    
    el.style.left = (e.clientX + offsetX - 15) + 'px';
    el.style.top = (e.clientY + offsetY - 15) + 'px';
    
    document.body.appendChild(el);
    setTimeout(function() { if(el.parentNode) el.parentNode.removeChild(el); }, 1000);
    
    // Spawn particle on click
    spawnClickParticle(e.clientX, e.clientY);
    
    requestUiUpdate({ heavy: false });
    checkAchievements();
}

function spawnClickParticle(x, y) {
    var particle = document.createElement('div');
    particle.className = 'mini-particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    document.body.appendChild(particle);
    setTimeout(function() { if(particle.parentNode) particle.parentNode.removeChild(particle); }, 500);
}

function initTabs() {
    var tabs = document.querySelectorAll('.nav-tab');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].onclick = function() {
            var allTabs = document.querySelectorAll('.nav-tab');
            var allContent = document.querySelectorAll('.content-section');
            for (var j = 0; j < allTabs.length; j++) allTabs[j].classList.remove('active');
            for (var k = 0; k < allContent.length; k++) allContent[k].classList.remove('active');
            this.classList.add('active');
            var tabId = this.getAttribute('data-tab');
            document.getElementById('tab-' + tabId).classList.add('active');
            // Update nav badges
            updateNavBadges();
        };
    }
}

function updateNavBadges() {
    // Can be used to show notifications on tabs
}

function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        var key = e.key;
        if (e.ctrlKey || e.metaKey) return;
        
        if (KEY_SHORTCUTS[key]) {
            e.preventDefault();
            var action = KEY_SHORTCUTS[key];
            
            if (action === 'save') {
                manualSave();
            } else if (action === 'prestige') {
                performPrestige();
            } else if (action === 'buy_x1') {
                setBuyMode('x1');
            } else if (action === 'buy_x10') {
                setBuyMode('x10');
            } else if (action === 'buy_max') {
                setBuyMode('max');
            } else if (action === 'click') {
                var goldCard = document.querySelector('.gold-card');
                if (goldCard) {
                    var rect = goldCard.getBoundingClientRect();
                    var fakeEvent = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
                    clickGold(fakeEvent);
                    goldCard.classList.add('clicking');
                    setTimeout(function() { goldCard.classList.remove('clicking'); }, 100);
                }
            } else {
                // Switch tabs
                var tab = document.querySelector('.nav-tab[data-tab="' + action + '"]');
                if (tab) tab.click();
            }
        }
    });
}

function initClickRipple() {
    var goldCard = document.querySelector('.gold-card');
    if (!goldCard) return;
    
    goldCard.addEventListener('click', function(e) {
        createRipple(e, goldCard);
    });
}

function createRipple(e, element) {
    var ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    
    var rect = element.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    
    element.appendChild(ripple);
    
    setTimeout(function() {
        ripple.remove();
    }, 600);
}

function ensureBuildingCardStructure(div, b) {
    if (div._refs) return;

    div.innerHTML = '<div class="item-icon"></div>' +
        '<div class="item-details"><div class="item-name"></div><div class="item-desc"></div>' +
        '<div class="item-stats"><span class="item-stat positive"></span></div></div>' +
        '<div class="item-count"></div>' +
        '<div class="item-cost"><div class="cost-value"></div><div class="cost-label">金币</div></div>';

    var refs = {
        icon: div.querySelector('.item-icon'),
        name: div.querySelector('.item-name'),
        desc: div.querySelector('.item-desc'),
        stat: div.querySelector('.item-stat.positive'),
        count: div.querySelector('.item-count'),
        cost: div.querySelector('.cost-value'),
        costLabel: div.querySelector('.cost-label')
    };

    refs.icon.textContent = b.icon;
    refs.icon.style.background = b.color + '20';
    refs.name.textContent = b.name;
    refs.desc.textContent = b.description;

    div._refs = refs;
    div._state = {};
}

function updateBuildingCard(div, b, owned, cost, prod, unlocked, affordable) {
    ensureBuildingCardStructure(div, b);

    var state = div._state;
    var refs = div._refs;
    var className = 'item-card' + (!unlocked ? ' locked' : '') + (owned > 0 ? ' owned' : '') + (affordable ? ' affordable' : '');

    if (state.className !== className) {
        div.className = className;
        state.className = className;
    }

    var prodText = '+' + formatNumber(prod) + '/s';
    var ownedText = String(owned);
    var costText = formatNumber(cost);
    var buyMode = normalizeBuyMode(G.buyMode || 'x1');
    var costLabelText = buyMode === 'x1' ? '金币' : (buyMode === 'x10' ? 'x10成本' : 'MAX成本');

    if (state.prodText !== prodText) {
        refs.stat.textContent = prodText;
        state.prodText = prodText;
    }
    if (state.ownedText !== ownedText) {
        refs.count.textContent = ownedText;
        state.ownedText = ownedText;
    }
    if (state.costText !== costText) {
        refs.cost.textContent = costText;
        state.costText = costText;
    }
    if (state.costLabelText !== costLabelText && refs.costLabel) {
        refs.costLabel.textContent = costLabelText;
        state.costLabelText = costLabelText;
    }

    if (state.unlocked !== unlocked) {
        div.onclick = unlocked ? function() { buyBuilding(b); } : null;
        state.unlocked = unlocked;
    }
}

function ensureUpgradeCardStructure(div, u) {
    if (div._refs) return;

    div.innerHTML = '<div class="item-icon"></div>' +
        '<div class="item-details"><div class="item-name"></div><div class="item-desc"></div></div>' +
        '<div class="item-cost"><div class="cost-value"></div><div class="cost-label">金币</div></div>';

    var refs = {
        icon: div.querySelector('.item-icon'),
        name: div.querySelector('.item-name'),
        desc: div.querySelector('.item-desc'),
        cost: div.querySelector('.cost-value')
    };

    refs.icon.textContent = u.icon;
    refs.name.textContent = u.name;
    refs.desc.textContent = u.desc;

    div._refs = refs;
    div._state = {};
}

function updateUpgradeCard(div, u, affordable) {
    ensureUpgradeCardStructure(div, u);

    var state = div._state;
    var refs = div._refs;
    var className = 'item-card' + (affordable ? ' affordable' : '');
    var costText = formatNumber(u.cost);

    if (state.className !== className) {
        div.className = className;
        state.className = className;
    }
    if (state.costText !== costText) {
        refs.cost.textContent = costText;
        state.costText = costText;
    }

    if (!state.bound) {
        div.onclick = function() { buyUpgrade(u); };
        state.bound = true;
    }
}

function renderBuildings() {
    var c = document.getElementById('building-list');
    if (!c || !G) return;
    var seen = {};

    for (var i = 0; i < BUILDINGS.length; i++) {
        var b = BUILDINGS[i];
        var owned = G.buildings[b.id] || 0;
        var bulkInfo = getBulkPurchaseInfo(b, G, G.buyMode || 'x1');
        var cost = bulkInfo.totalCost;
        var prod = b.baseProduction * owned * getBuildingMultiplier(G, b.id);
        var unlocked = isBuildingUnlocked(b, G);
        var affordable = bulkInfo.count > 0 && G.gold >= cost;

        var div = buildingCardRefs[b.id];
        if (!div) {
            div = document.createElement('div');
            buildingCardRefs[b.id] = div;
        }

        updateBuildingCard(div, b, owned, cost, prod, unlocked, affordable);
        if (div.parentNode !== c) c.appendChild(div);
        seen[b.id] = true;
    }

    for (var key in buildingCardRefs) {
        if (!seen[key]) {
            if (buildingCardRefs[key].parentNode === c) c.removeChild(buildingCardRefs[key]);
            delete buildingCardRefs[key];
        }
    }
}

function buyBuilding(b) {
    var owned = G.buildings[b.id] || 0;
    var bulkInfo = getBulkPurchaseInfo(b, G, G.buyMode || 'x1');
    if (bulkInfo.count > 0 && G.gold >= bulkInfo.totalCost) {
        G.gold -= bulkInfo.totalCost;
        G.buildings[b.id] = owned + bulkInfo.count;
        invalidateDerivedData();
        requestUiUpdate({ heavy: true });
        updateStats();
    }
}

function renderUpgrades() {
    // 使用新的升级面板渲染
    if (typeof renderUpgradesPanel === 'function') {
        renderUpgradesPanel();
    }
}

// buyUpgrade function is now defined in upgrades.js

function renderAchievements() {
    var c = document.getElementById('achievement-list');
    if (!c || !G) return;
    c.innerHTML = '';
    var unlocked = G.achievements || {};
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        var a = ACHIEVEMENTS[i];
        var isUnlocked = unlocked[a.id];
        var div = document.createElement('div');
        div.className = 'achievement-card' + (isUnlocked ? ' unlocked' : ' locked');
        div.innerHTML = '<div class="achievement-icon">' + a.icon + '</div>' +
            '<div class="achievement-info"><div class="achievement-name">' + a.name + '</div><div class="achievement-desc">' + a.desc + '</div></div>';
        c.appendChild(div);
    }
}

function renderStats() {
    var c = document.getElementById('stats-detail');
    if (!c || !G) return;
    var gps = getCurrentGps();
    var total = getTotalBuildings(G);
    var time = Math.floor((Date.now() - G.startTime) / 1000);
    var achs = (G.achievements || []).length;
    var bosses = G.bossesDefeated || 0;
    var dynasty = G.dynastyLevel || 1;
    var dynastyBonus = Math.round((getDynastyMultiplier(G) - 1) * 100);
    var dynastyPoints = G.dynastyPoints || 0;
    var prestigeShards = G.prestigeShards || 0;
    var prestigeResets = G.prestigeResets || 0;
    var prestigeBonus = Math.round((getPrestigeMultiplier(G) - 1) * 100);
    var nextPrestigeGain = calculatePrestigeGain();
    var talents = G.dynastyTalents || { idle: 0, click: 0, boss: 0 };
    var shop = G.prestigeShop || { idleCore: 0, clickCore: 0, bossCore: 0 };
    var idleCoreCost = getPrestigeUpgradeCost('idleCore', shop.idleCore || 0);
    var clickCoreCost = getPrestigeUpgradeCost('clickCore', shop.clickCore || 0);
    var bossCoreCost = getPrestigeUpgradeCost('bossCore', shop.bossCore || 0);
    c.innerHTML = 
        '<div class="stat-card"><div class="stat-card-icon">💰</div><div class="stat-card-value">' + formatNumber(G.gold) + '</div><div class="stat-card-label">当前金币</div></div>' +
        '<div class="stat-card"><div class="stat-card-icon">⚡</div><div class="stat-card-value">' + formatNumber(gps) + '</div><div class="stat-card-label">产量/秒</div></div>' +
        '<div class="stat-card"><div class="stat-card-icon">💎</div><div class="stat-card-value">' + formatNumber(G.totalEarned) + '</div><div class="stat-card-label">累计收益</div></div>' +
        '<div class="stat-card"><div class="stat-card-icon">⏱️</div><div class="stat-card-value">' + formatTime(time) + '</div><div class="stat-card-label">游戏时间</div></div>' +
        '<div class="stat-card"><div class="stat-card-icon">🏗️</div><div class="stat-card-value">' + total + '</div><div class="stat-card-label">建筑总数</div></div>' +
        '<div class="stat-card"><div class="stat-card-icon">🏆</div><div class="stat-card-value">' + achs + '/' + ACHIEVEMENTS.length + '</div><div class="stat-card-label">成就解锁</div></div>' +
        '<div class="stat-card"><div class="stat-card-icon">👹</div><div class="stat-card-value">' + bosses + '</div><div class="stat-card-label">Boss击杀</div></div>' +
        '<div class="stat-card"><div class="stat-card-icon">👑</div><div class="stat-card-value">Lv' + dynasty + ' (+' + dynastyBonus + '%)</div><div class="stat-card-label">王朝增益</div></div>' +
        '<div class="stat-card"><div class="stat-card-icon">🔮</div><div class="stat-card-value">' + prestigeShards + ' (+' + prestigeBonus + '%)</div><div class="stat-card-label">重铸碎片</div></div>' +
        '<div class="stat-card"><div class="stat-card-icon">♻️</div><div class="stat-card-value">' + prestigeResets + ' 次</div><div class="stat-card-label">重铸次数</div></div>' +
        '<div class="stat-card"><div class="stat-card-icon">✨</div><div class="stat-card-value">' + dynastyPoints + '</div><div class="stat-card-label">可用天赋点</div></div>' +
        '<div class="stat-card"><div class="stat-card-icon">👆</div><div class="stat-card-value">' + (G.totalClicks || 0) + '</div><div class="stat-card-label">点击次数</div></div>' +
        '<div class="stat-card"><div class="stat-card-icon">📈</div><div class="stat-card-value">+ ' + nextPrestigeGain + '</div><div class="stat-card-label">当前可重铸收益</div></div>' +
        '<div class="stat-card dynasty-talent-card">' +
            '<div class="stat-card-icon">⚙️</div><div class="stat-card-value">挂机专精 Lv' + talents.idle + '</div><div class="stat-card-label">每级 +10% 全局产量</div>' +
            '<button class="dynasty-btn" onclick="upgradeDynastyTalent(\'idle\')">升级</button>' +
        '</div>' +
        '<div class="stat-card dynasty-talent-card">' +
            '<div class="stat-card-icon">🖱️</div><div class="stat-card-value">点击专精 Lv' + talents.click + '</div><div class="stat-card-label">每级 +25% 点击收益</div>' +
            '<button class="dynasty-btn" onclick="upgradeDynastyTalent(\'click\')">升级</button>' +
        '</div>' +
        '<div class="stat-card dynasty-talent-card">' +
            '<div class="stat-card-icon">⚔️</div><div class="stat-card-value">战斗专精 Lv' + talents.boss + '</div><div class="stat-card-label">每级 +20% Boss伤害</div>' +
            '<button class="dynasty-btn" onclick="upgradeDynastyTalent(\'boss\')">升级</button>' +
        '</div>' +
        '<div class="stat-card dynasty-talent-card">' +
            '<div class="stat-card-icon">🧩</div><div class="stat-card-value">挂机核心 Lv' + shop.idleCore + '</div><div class="stat-card-label">每级 +8% 全局产量（重铸商店）</div>' +
            '<button class="dynasty-btn" onclick="buyPrestigeUpgrade(\'idleCore\')">购买(' + idleCoreCost + ')</button>' +
        '</div>' +
        '<div class="stat-card dynasty-talent-card">' +
            '<div class="stat-card-icon">🎯</div><div class="stat-card-value">点击核心 Lv' + shop.clickCore + '</div><div class="stat-card-label">每级 +12% 点击收益（重铸商店）</div>' +
            '<button class="dynasty-btn" onclick="buyPrestigeUpgrade(\'clickCore\')">购买(' + clickCoreCost + ')</button>' +
        '</div>' +
        '<div class="stat-card dynasty-talent-card">' +
            '<div class="stat-card-icon">🛡️</div><div class="stat-card-value">战斗核心 Lv' + shop.bossCore + '</div><div class="stat-card-label">每级 +10% Boss伤害（重铸商店）</div>' +
            '<button class="dynasty-btn" onclick="buyPrestigeUpgrade(\'bossCore\')">购买(' + bossCoreCost + ')</button>' +
        '</div>';
}

function renderBossList() {
    var c = document.getElementById('boss-list');
    if (!c || !G) return;
    c.innerHTML = '';
    var unlocked = BOSSES.filter(function(b) { return G.totalEarned >= b.unlockGold; });
    if (unlocked.length === 0) {
        c.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👹</div><div class="empty-state-text">累计获得更多金币解锁Boss!</div><div class="empty-state-hint">需要 ' + formatNumber(BOSSES[0].unlockGold) + ' 金币</div></div>';
        return;
    }
    BOSSES.forEach(function(b) {
        var isUnlocked = G.totalEarned >= b.unlockGold;
        var isCurrent = G.currentBoss === b.id;
        var div = document.createElement('div');
        div.className = 'boss-card' + (!isUnlocked ? ' locked' : '') + (isCurrent ? ' active' : '');
        div.innerHTML = '<div class="boss-card-icon">' + b.icon + '</div>' +
            '<div class="boss-card-info"><div class="boss-card-name">' + b.name + '</div>' +
            '<div class="boss-card-stats">HP: ' + formatNumber(b.hp) + ' | 奖励: ' + formatNumber(b.reward) + '</div></div>' +
            '<div class="boss-card-stats">王朝系数: x' + (1 + ((G.dynastyLevel || 1) - 1) * 0.25).toFixed(2) + '</div>' +
            '<div class="boss-card-status">' + 
            (!isUnlocked ? '<div class="boss-card-hp">🔒 需要 ' + formatNumber(b.unlockGold) + '</div>' : 
             isCurrent ? '<div class="boss-card-reward">⚔️ 进行中</div>' : '<div class="boss-card-reward">✓ 已解锁</div>') +
            '</div>';
        c.appendChild(div);
    });
}

function updateUI(options) {
    if (!G) return;
    options = options || {};
    var heavy = !!options.heavy;
    var now = Date.now();

    if (!uiElements) cacheUiElements();

    // 缓存GPS值，减少重复计算
    var gps = getCurrentGps();
    setTextIfChanged(uiElements.goldDisplay, 'goldDisplay', formatNumber(G.gold));
    setTextIfChanged(uiElements.gpsDisplay, 'gpsDisplay', formatNumber(gps));
    setTextIfChanged(uiElements.statBuildings, 'statBuildings', String(getTotalBuildings(G)));
    setTextIfChanged(uiElements.statClicks, 'statClicks', String(G.totalClicks || 0));
    var achievementsCount = G.achievements ? Object.keys(G.achievements).length : 0;
    setTextIfChanged(uiElements.statAchievements, 'statAchievements', achievementsCount + '/' + ACHIEVEMENTS.length);
    setTextIfChanged(uiElements.statBosses, 'statBosses', String(G.bossesDefeated || 0));
    setTextIfChanged(uiElements.statDynasty, 'statDynasty', 'Lv' + (G.dynastyLevel || 1));

    if (heavy || now - lastHeavyRenderAt >= HEAVY_RENDER_INTERVAL) {
        renderIfChanged('buildings', getBuildingsSignature(), renderBuildings);
        renderIfChanged('upgrades', getUpgradesSignature(), renderUpgrades);
        renderIfChanged('achievements', getAchievementsSignature(), renderAchievements);
        renderIfChanged('bosses', getBossesSignature(), renderBossList);
        renderIfChanged('stats', getStatsSignature(), renderStats);
        lastHeavyRenderAt = now;
    }

    // 定期更新进度条
    if (heavy || now - lastHeavyRenderAt < HEAVY_RENDER_INTERVAL) {
        updateProgressBar();
    }
}

function updateProgressBar() {
    if (!G) return;

    if (!progressElements) cacheUiElements();

    var progressEl = progressElements.wrapper;
    var fillEl = progressElements.fill;
    var targetEl = progressElements.target;

    if (!progressEl || !fillEl || !targetEl) return;
    
    // Find next affordable building
    var nextBuilding = null;
    for (var i = 0; i < BUILDINGS.length; i++) {
        var b = BUILDINGS[i];
        var owned = G.buildings[b.id] || 0;
        var cost = Math.floor(b.baseCost * Math.pow(1.15, owned));
        if (G.gold < cost && (!b.unlockAt || G.totalEarned >= b.unlockAt)) {
            nextBuilding = { building: b, cost: cost };
            break;
        }
    }
    
    if (nextBuilding) {
        if (progressCache.visible !== true) {
            progressEl.style.display = 'block';
            progressCache.visible = true;
        }
        var progress = Math.min(100, (G.gold / nextBuilding.cost) * 100);
        var progressWidth = progress + '%';
        if (progressCache.width !== progressWidth) {
            fillEl.style.width = progressWidth;
            progressCache.width = progressWidth;
        }
        var targetText = formatNumber(G.gold) + ' / ' + formatNumber(nextBuilding.cost);
        if (progressCache.targetText !== targetText) {
            targetEl.textContent = targetText;
            progressCache.targetText = targetText;
        }
    } else {
        if (progressCache.visible !== false) {
            progressEl.style.display = 'none';
            progressCache.visible = false;
        }
    }
}

function updateStats() {
    if (!G) return;
    setTextIfChanged(document.getElementById('stat-buildings'), 'statBuildings', String(getTotalBuildings(G)));
    renderSignatures.stats = '';
}

var lastTick = Date.now();
var lastCheckTime = Date.now();
var CHECK_INTERVAL = 2000; // 2秒检查一次成就和里程碑

function gameLoop() {
    var now = Date.now();
    var delta = (now - lastTick) / 1000;
    lastTick = now;
    if (!G) return;
    var gps = getCurrentGps();
    G.gold += gps * delta;
    G.totalEarned += gps * delta;
    requestUiUpdate({ heavy: false });
    
    // 减少成就和里程碑的检查频率
    if (now - lastCheckTime >= CHECK_INTERVAL) {
        checkAchievements();
        if (typeof updateMilestones === 'function') updateMilestones();
        lastCheckTime = now;
    }
}

function startGameLoop() {
    if (gameLoopTimer) {
        clearTimeout(gameLoopTimer);
        gameLoopTimer = null;
    }

    function scheduleNextLoop() {
        var delay = document.hidden ? GAME_LOOP_HIDDEN_MS : GAME_LOOP_VISIBLE_MS;
        gameLoopTimer = setTimeout(function() {
            gameLoop();
            scheduleNextLoop();
        }, delay);
    }

    document.addEventListener('visibilitychange', function() {
        lastTick = Date.now();

        if (!document.hidden) {
            requestUiUpdate({ heavy: true });
        }
    });

    scheduleNextLoop();
}

document.addEventListener('DOMContentLoaded', init);

// ========== 缺失的函数 ==========

function showMsg(text, type) {
    var container = document.getElementById('toast-container');
    if (!container) {
        // Fallback to old method
        var el = document.createElement('div');
        el.className = 'message ' + type;
        el.textContent = text;
        document.body.appendChild(el);
        setTimeout(function() { if(el.parentNode) el.parentNode.removeChild(el); }, 3000);
        return;
    }
    
    var icons = {
        'success': '✓',
        'error': '✗',
        'warning': '⚠',
        'info': 'ℹ',
        'achievement': '🏆'
    };
    
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<span class="toast-icon">' + (icons[type] || '') + '</span><span>' + text + '</span>';
    container.appendChild(toast);
    
    setTimeout(function() {
        if(toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
}

function checkAchievements() {
    if (!G) return;
    if (!G.achievements) G.achievements = {};
    var newlyUnlocked = [];

    var totalBuildings = 0;
    for (var b in G.buildings) totalBuildings += G.buildings[b];

    var check = function(id, condition) {
        if (G.achievements[id]) return false;
        var done = false;
        switch (condition.type) {
            case 'buildings_total': done = totalBuildings >= condition.target; break;
            case 'boss_kills': done = (G.totalBossKills || 0) >= condition.target; break;
            case 'gold_earned': done = (G.totalEarned || 0) >= condition.target; break;
            case 'clicks': done = (G.totalClicks || 0) >= condition.target; break;
            case 'rebirth': done = (G.rebirths || 0) >= condition.target; break;
            case 'artifacts': done = (G.artifacts ? Object.keys(G.artifacts).length : 0) >= condition.target; break;
            case 'seasons': done = (G.seasonsParticipated || 0) >= condition.target; break;
            case 'season_rank': done = (G.bestSeasonRank || 9999) <= condition.target; break;
            case 'collectibles': done = (G.collectibles ? Object.keys(G.collectibles).length : 0) >= condition.target; break;
            case 'milestones': done = (G.milestones ? Object.keys(G.milestones).length : 0) >= condition.target; break;
        }
        if (done) {
            G.achievements[id] = true;
            newlyUnlocked.push(id);
        }
        return done;
    };

    // 建筑相关
    check('builder_1', { type: 'buildings_total', target: 10 });
    check('builder_2', { type: 'buildings_total', target: 50 });
    check('builder_3', { type: 'buildings_total', target: 100 });
    check('builder_4', { type: 'buildings_total', target: 500 });
    // Boss相关
    check('slayer_1', { type: 'boss_kills', target: 1 });
    check('slayer_2', { type: 'boss_kills', target: 10 });
    check('slayer_3', { type: 'boss_kills', target: 50 });
    check('slayer_4', { type: 'boss_kills', target: 100 });
    // 金币相关
    check('gold_1', { type: 'gold_earned', target: 10000 });
    check('gold_2', { type: 'gold_earned', target: 1000000 });
    check('gold_3', { type: 'gold_earned', target: 1000000000 });
    check('gold_4', { type: 'gold_earned', target: 1000000000000 });
    // 点击相关
    check('clicker_1', { type: 'clicks', target: 100 });
    check('clicker_2', { type: 'clicks', target: 1000 });
    check('clicker_3', { type: 'clicks', target: 10000 });
    // 转生相关
    check('rebirth_1', { type: 'rebirth', target: 1 });
    check('rebirth_2', { type: 'rebirth', target: 5 });
    check('rebirth_3', { type: 'rebirth', target: 10 });
    // 神器相关
    check('artifact_1', { type: 'artifacts', target: 5 });
    check('artifact_2', { type: 'artifacts', target: 10 });
    // 赛季相关
    check('season_1', { type: 'seasons', target: 1 });
    check('season_2', { type: 'seasons', target: 5 });
    check('season_3', { type: 'season_rank', target: 10 });
    // 收藏品相关
    check('collectible_1', { type: 'collectibles', target: 5 });
    check('collectible_2', { type: 'collectibles', target: 10 });
    check('collectible_3', { type: 'collectibles', target: 20 });
    // 里程碑相关
    check('milestone_1', { type: 'milestones', target: 5 });
    check('milestone_2', { type: 'milestones', target: 10 });
    check('milestone_3', { type: 'milestones', target: 20 });

    if (newlyUnlocked.length > 0) {
        var names = { builder_1:'初露锋芒', builder_2:'建筑大师', builder_3:'帝国建造者', builder_4:'建筑大亨', slayer_1:'新手猎人', slayer_2:'Boss杀手', slayer_3:'传奇屠戮者', slayer_4:'Boss终结者', gold_1:'小有积蓄', gold_2:'富翁', gold_3:'亿万富翁', gold_4:'财富传奇', clicker_1:'手指热身', clicker_2:'疯狂点击', clicker_3:'点击机器', rebirth_1:'轮回初体验', rebirth_2:'转生者', rebirth_3:'永恒轮回', artifact_1:'神器收藏家', artifact_2:'神器大师', season_1:'赛季参与者', season_2:'赛季老将', season_3:'赛季冠军', collectible_1:'收藏爱好者', collectible_2:'收藏家', collectible_3:'收藏大师', milestone_1:'里程碑新手', milestone_2:'里程碑大师', milestone_3:'里程碑传奇' };
        newlyUnlocked.forEach(function(id) {
            showMsg('🏆 解锁成就：' + (names[id] || id), 'achievement');
        });
        renderSignatures.achievements = '';
        renderSignatures.stats = '';
        requestUiUpdate({ heavy: true });
        invalidateDerivedData();
        saveGame();
    }
}

function initTheme() {
    var theme = localStorage.getItem('idle_empire_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    var btn = document.getElementById('theme-btn') || document.querySelector('.theme-btn');
    if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
}

function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('idle_empire_theme', next);
    var btn = document.getElementById('theme-btn') || document.querySelector('.theme-btn');
    if (btn) btn.textContent = next === 'dark' ? '🌙' : '☀️';
}

function manualSave() {
    if (!G) return;
    if (saveGame(G)) {
        showMsg('游戏已保存! 💾', 'success');
    } else {
        showMsg('保存失败，请稍后重试', 'error');
    }
}

function toggleSettings() {
    var panel = document.getElementById('settings-panel');
    if (!panel) return;
    
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        // 同步当前设置到面板控件
        var quality = localStorage.getItem('idle_empire_quality') || 'high';
        var particles = localStorage.getItem('idle_empire_particles');
        var scanlines = localStorage.getItem('idle_empire_scanlines');
        var glow = localStorage.getItem('idle_empire_glow');
        
        var qualitySelect = document.getElementById('setting-quality');
        if (qualitySelect) qualitySelect.value = quality;
        
        var particlesCheck = document.getElementById('setting-particles');
        if (particlesCheck) particlesCheck.checked = particles !== 'false';
        
        var scanlinesCheck = document.getElementById('setting-scanlines');
        if (scanlinesCheck) scanlinesCheck.checked = scanlines !== 'false';
        
        var glowCheck = document.getElementById('setting-glow');
        if (glowCheck) glowCheck.checked = glow !== 'false';
    } else {
        panel.style.display = 'none';
    }
}

// ── Svelte bridge: expose real multiplier stack ──────────────────────────────
window.__gameBridge = {
  getBuildingMultiplier: (state, buildingId) => getBuildingMultiplier(state, buildingId),
  getUpgradeBonus:       (type)            => getUpgradeBonus(type),
  getDynastyMultiplier:  (state)           => getDynastyMultiplier(state),
  getPrestigeMultiplier: (state)           => getPrestigeMultiplier(state),
  getPrestigeShopBonus:   (state)           => getPrestigeShopBonus(state),
  // 转生 & prestige 分析
  getRebirthRequirement: (state) => {
    const REBIRTH_BASE = 1e9;
    const REBIRTH_MULT = 10;
    const rebirths = state?.rebirths || 0;
    return REBIRTH_BASE * Math.pow(REBIRTH_MULT, rebirths);
  },
  getPrestigeGain: (state) => {
    if (!state) return 0;
    const earned = state.totalEarned || 0;
    if (earned < 1e6) return 0;
    return Math.max(1, Math.floor(Math.sqrt(earned / 1e6)));
  },
};
