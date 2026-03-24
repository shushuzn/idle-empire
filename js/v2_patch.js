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
