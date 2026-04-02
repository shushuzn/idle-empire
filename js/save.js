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
            if (!data.upgrades) data.upgrades = {};
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

/**
 * 验证存档数据，返回具体错误信息；通过返回 null
 * @param {object} data
 * @returns {string|null}
 */
function validateSaveData(data) {
    if (!data || typeof data !== 'object') return '存档格式无效（非对象）';
    if (typeof data.gold !== 'number' || !isFinite(data.gold)) return 'gold 字段缺失或不是有效数字';
    if (typeof data.buildings !== 'object' || data.buildings === null) return 'buildings 字段缺失或无效';
    if (!Array.isArray(data.upgrades)) return 'upgrades 字段不是数组';
    if (!Array.isArray(data.achievements)) return 'achievements 字段不是数组';
    if (typeof data.dynastyTalents !== 'object' || !data.dynastyTalents) return 'dynastyTalents 字段缺失或无效';
    if (typeof data.prestigeShop !== 'object' || !data.prestigeShop) return 'prestigeShop 字段缺失或无效';
    if (typeof data.lastSave !== 'number') return 'lastSave 字段缺失或不是时间戳';
    return null;
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
                let importedData;
                try {
                    importedData = JSON.parse(event.target.result);
                } catch (e) {
                    showMessage('存档解析失败：文件不是有效的 JSON', 'error');
                    return;
                }
                const validationError = validateSaveData(importedData);
                if (validationError) {
                    showMessage('无效存档：' + validationError, 'error');
                    return;
                }
                // 备份当前存档
                const currentSave = localStorage.getItem(SAVE_KEY);
                if (currentSave) {
                    localStorage.setItem(SAVE_KEY + '_backup', currentSave);
                }
                if (confirm('确定要导入存档吗？当前进度将被覆盖（已自动备份）。')) {
                    localStorage.setItem(SAVE_KEY, JSON.stringify(importedData));
                    showMessage('存档导入成功！正在重新加载...', 'success');
                    setTimeout(function() { location.reload(); }, 1500);
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
