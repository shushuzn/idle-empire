// Idle Empire - 存档系统
import pako from 'pako';

const SAVE_KEY = 'idle_empire_save';
const SAVE_SLOT_META = 'idle_empire_save_meta';
const THEME_KEY = 'idle_empire_theme';
const AUTO_SAVE_INTERVAL = 30000;
const SAVE_OBFUSCATE_KEY = 'idle_empire_v2'; // Changes when save format changes

let autoSaveTimer;
let lastSaveTime = Date.now();
let activeSlot = 0;

function xorObfuscate(str) {
    const key = SAVE_OBFUSCATE_KEY;
    let result = '';
    for (let i = 0; i < str.length; i++) {
        result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
}

function xorDeobfuscate(str) {
    try {
        const decoded = atob(str);
        const key = SAVE_OBFUSCATE_KEY;
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    } catch (e) {
        return null; // Invalid obfuscated data
    }
}

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
        lastLogin: null,
        totalClicks: 0,
        lastClickTime: 0,
        timeOffset: 0 // 时间校准偏移量（毫秒）
    };
}

function loadGame() {
    const slotMeta = localStorage.getItem(SAVE_SLOT_META);
    if (slotMeta) {
        try { activeSlot = JSON.parse(slotMeta).activeSlot || 0; } catch(e) { activeSlot = 0; }
    }
    const saveKey = activeSlot === 0 ? SAVE_KEY : SAVE_KEY + '_slot' + activeSlot;
    const saved = localStorage.getItem(saveKey);
        try {
            // Try obfuscated format first
            let plain = xorDeobfuscate(saved);
            let data;
            if (plain !== null) {
                data = JSON.parse(plain);
            } else {
                // Fallback to plain JSON (old saves)
                data = JSON.parse(saved);
            }
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
            if (data.timeOffset === undefined) data.timeOffset = 0;
            
            // 计算离线收益（使用校准后时间）
            const calibratedNow = Date.now() + (data.timeOffset || 0);
            const offlineTime = (calibratedNow - data.lastSave) / 1000;
            const gps = getTotalProduction(data);
            const offlineRate = getOfflineRate(data);
            const offlineEarnings = Math.floor(gps * offlineTime * offlineRate);
            
            if (offlineEarnings > 0 && offlineTime > 60) {
                let totalOffline = offlineEarnings;
                // 离线收益保护：超过24小时额外补偿50%
                if (offlineTime > 24 * 3600) {
                    const bonus = Math.floor(offlineEarnings * 0.5);
                    totalOffline += bonus;
                    data.gold += bonus;
                    data.totalEarned += bonus;
                    setTimeout(function() {
                        showMsg('🛡️ 离线保护奖励：+' + formatNumber(bonus) + ' 金币（离线超过24小时）', 'success');
                    }, 1500);
                }
                data.gold += offlineEarnings;
                data.totalEarned += offlineEarnings;
                showOfflineEarnings(offlineTime, totalOffline);
            }

            // 每日首次登录奖励
            const today = new Date().toDateString();
            if (data.lastLogin !== today) {
                const rewards = [
                    { type: 'gold', amount: 1000, label: '1000 金币' },
                    { type: 'gold', amount: 5000, label: '5000 金币' },
                    { type: 'gold', amount: 10000, label: '10000 金币' },
                    { type: 'collectible', amount: 1, label: '收藏品碎片 x1' }
                ];
                const reward = rewards[Math.floor(Math.random() * rewards.length)];
                if (reward.type === 'gold') {
                    data.gold += reward.amount;
                    data.totalEarned += reward.amount;
                }
                data.lastLogin = today;
                setTimeout(function() {
                    showMsg('🎁 每日登录奖励：' + reward.label, 'success');
                }, 1000);
            }

            lastSaveTime = data.lastSave || calibratedNow;
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
        const plain = JSON.stringify(gameState);
        const obfuscated = xorObfuscate(plain);
        const saveKey = activeSlot === 0 ? SAVE_KEY : SAVE_KEY + '_slot' + activeSlot;
        localStorage.setItem(saveKey, obfuscated);
        return true;
    } catch (e) {
        console.error('保存失败:', e);
        return false;
    }
}

function exportSave(gameState) {
    gameState.lastSave = Date.now();
    const exportData = JSON.stringify(gameState, null, 2);
    // gzip compress then base64 encode for safe download
    const compressed = pako.gzip(exportData);
    const b64 = btoa(String.fromCharCode.apply(null, Array.from(compressed)));
    const blob = new Blob([b64], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idle-empire-save-${new Date().toISOString().slice(0, 10)}-slot${activeSlot}.json.gz`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('存档已导出（gzip压缩）！', 'success');
}

function getSaveSlots() {
    var slots = [];
    for (var i = 0; i < 3; i++) {
        var key = i === 0 ? SAVE_KEY : SAVE_KEY + '_slot' + i;
        var raw = localStorage.getItem(key);
        var meta = null;
        if (raw) {
            try {
                var plain = xorDeobfuscate(raw);
                if (plain) {
                    var data = JSON.parse(plain);
                    meta = {
                        gold: data.gold || 0,
                        rebirths: data.rebirths || 0,
                        lastSave: data.lastSave || 0,
                        bossesDefeated: data.bossesDefeated || 0
                    };
                }
            } catch(e) {}
        }
        slots.push({ slot: i, name: i === 0 ? '主存档' : '存档 ' + i, meta: meta });
    }
    return slots;
}

function switchSaveSlot(slot) {
    if (slot < 0 || slot > 2) return;
    activeSlot = slot;
    localStorage.setItem(SAVE_SLOT_META, JSON.stringify({ activeSlot: slot }));
    showMessage('已切换到槽位 ' + slot + '，正在重新加载...', 'success');
    setTimeout(function() { location.reload(); }, 1000);
}

function resetGame() {
    if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
        var saveKey = activeSlot === 0 ? SAVE_KEY : SAVE_KEY + '_slot' + activeSlot;
        localStorage.removeItem(saveKey);
        location.reload();
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
    input.accept = '.json,.json.gz';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                let importedData;
                try {
                    const raw = event.target.result;
                    // Detect gzip by magic bytes (first 2 bytes: 0x1f 0x8b)
                    const bytes = new Uint8Array(raw.length);
                    for (let i = 0; i < raw.length && i < 2; i++) bytes[i] = raw.charCodeAt(i);
                    const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
                    if (isGzip) {
                        // Decode base64 then gunzip
                        const binary = atob(raw);
                        const len = binary.length;
                        const buf = new Uint8Array(len);
                        for (let i = 0; i < len; i++) buf[i] = binary.charCodeAt(i);
                        const decompressed = pako.ungzip(buf, { to: 'string' });
                        importedData = JSON.parse(decompressed);
                    } else {
                        importedData = JSON.parse(raw);
                    }
                } catch (e) {
                    showMessage('存档解析失败：文件不是有效的存档', 'error');
                    return;
                }
                const validationError = validateSaveData(importedData);
                if (validationError) {
                    showMessage('无效存档：' + validationError, 'error');
                    return;
                }
                // 备份当前存档
                const currentSaveKey = activeSlot === 0 ? SAVE_KEY : SAVE_KEY + '_slot' + activeSlot;
                const currentSave = localStorage.getItem(currentSaveKey);
                if (currentSave) {
                    localStorage.setItem(currentSaveKey + '_backup', currentSave);
                }
                if (confirm('确定要导入存档吗？当前进度将被覆盖（已自动备份）。')) {
                    localStorage.setItem(currentSaveKey, JSON.stringify(importedData));
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
        var saveKey = activeSlot === 0 ? SAVE_KEY : SAVE_KEY + '_slot' + activeSlot;
        localStorage.removeItem(saveKey);
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
