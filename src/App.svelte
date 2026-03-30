<script>
  import ResourceBar from './components/ResourceBar.svelte';
  import Navigation from './components/Navigation.svelte';
  import BuildingTab from './components/BuildingTab.svelte';
  import UpgradeTab from './components/UpgradeTab.svelte';
  import BossTab from './components/BossTab.svelte';
  import BossPanel from './components/BossPanel.svelte';
  import AchievementTab from './components/AchievementTab.svelte';
  import StatsTab from './components/StatsTab.svelte';
  import ArtifactTab from './components/ArtifactTab.svelte';
  import RebirthTab from './components/RebirthTab.svelte';
  import Toast from './components/Toast.svelte';
  import Settings from './components/Settings.svelte';
  import Tutorial from './components/Tutorial.svelte';
  import AiAdvisorPanel from './components/AiAdvisorPanel.svelte';
  let activeTab = $state('buildings');
  let settingsOpen = $state(false);
  let aiPanelOpen = $state(false);
  let theme = $state('dark');
  let tutorialDone = $state(false);

  const STORAGE_KEY = 'idle_empire_tutorial_done';

  function handleTutorialComplete() {
    tutorialDone = true;
  }

  // Check tutorial state on mount
  $effect(() => {
    if (typeof window !== 'undefined') {
      tutorialDone = !!localStorage.getItem(STORAGE_KEY);
    }
  });

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }

  // 键盘快捷键
  function handleKeydown(e) {
    const map = {
      '1': 'buildings', '2': 'upgrades', '3': 'bosses',
      '4': 'artifacts', '5': 'rebirth', '6': 'achievements', '7': 'stats',
      's': () => window.manualSave?.(),
      'r': () => window.performPrestige?.(),
      'q': () => window.setBuyMode?.('x1'),
      'w': () => window.setBuyMode?.('x10'),
      'e': () => window.setBuyMode?.('max'),
      ' ': () => window.clickGold?.(),
    };
    const action = map[e.key];
    if (typeof action === 'function') {
      e.preventDefault();
      action();
    } else if (action) {
      activeTab = action;
    }
  }

  let shaking = $state(false);
  window.onBossKill = () => {
    shaking = true;
    setTimeout(() => shaking = false, 500);
  };
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app-layout" class:shake={shaking}>
  <aside class="sidebar">
    <div class="logo-section">
      <div class="logo">
        <div class="logo-icon">🏰</div>
        <div class="logo-text">
          <span class="logo-title">Idle Empire</span>
          <span class="logo-sub">挂机帝国 v2.2</span>
        </div>
      </div>
      <div class="logo-actions">
        <button class="icon-btn" onclick={toggleTheme}>🌙</button>
        <button class="icon-btn" onclick={() => settingsOpen = true}>⚙️</button>
      <button class="icon-btn ai-btn" onclick={() => aiPanelOpen = !aiPanelOpen}>🤖</button>
      </div>
    </div>

    <ResourceBar />

    <div class="boss-mini">
      <BossPanel />
    </div>

    <Navigation bind:activeTab />

    <div class="footer-actions">
      <button class="btn btn-gold" onclick={() => window.manualSave?.()}>💾 保存</button>
      <button class="btn btn-purple" onclick={() => window.performPrestige?.()}>👑 王朝</button>
      <button class="btn btn-ghost" onclick={() => {
        if (confirm('确定重置？所有进度丢失！')) window.resetGame?.();
      }}>🔄 重置</button>
    </div>

    {#if aiPanelOpen}
      <AiAdvisorPanel />
    {/if}
  </aside>

  <main class="content">
    {#if activeTab === 'buildings'}
      <BuildingTab />
    {:else if activeTab === 'upgrades'}
      <UpgradeTab />
    {:else if activeTab === 'bosses'}
      <BossTab />
    {:else if activeTab === 'artifacts'}
      <ArtifactTab />
    {:else if activeTab === 'rebirth'}
      <RebirthTab />
    {:else if activeTab === 'achievements'}
      <AchievementTab />
    {:else if activeTab === 'stats'}
      <StatsTab />
    {/if}
  </main>
</div>

<Toast />
<Settings open={settingsOpen} onclose={() => settingsOpen = false} />
{#if !tutorialDone}
  <Tutorial onComplete={handleTutorialComplete} />
{/if}

<style>
  .app-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    min-height: 100vh;
  }

  .app-layout.shake {
    animation: screenShake 0.5s ease;
  }

  @keyframes screenShake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }

  .sidebar {
    background: var(--bg-base);
    border-right: 1px solid var(--border-subtle);
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
    max-height: 100vh;
    position: sticky;
    top: 0;
  }

  .logo-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo-icon {
    font-size: 28px;
  }

  .logo-title {
    display: block;
    font-size: 18px;
    font-weight: 800;
    font-family: 'Cinzel', serif;
    color: var(--gold-bright);
  }

  .logo-sub {
    display: block;
    font-size: 10px;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .logo-actions {
    display: flex;
    gap: 6px;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .icon-btn:hover {
    background: var(--bg-elevated);
    border-color: var(--border-default);
  }

  .ai-btn:hover {
    background: rgba(74, 222, 128, 0.15);
    border-color: #4ade80;
  }

  .boss-mini {
    display: none;
  }

  .footer-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: auto;
  }

  .btn {
    padding: 12px 16px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
  }

  .btn-gold {
    background: linear-gradient(135deg, var(--gold-bright), var(--gold-muted));
    color: #18181B;
    box-shadow: var(--shadow-gold);
  }

  .btn-gold:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 20px rgba(232, 197, 71, 0.4);
  }

  .btn-purple {
    background: linear-gradient(135deg, var(--amethyst), #6B4FC0);
    color: #fff;
  }

  .btn-purple:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 20px rgba(139, 111, 204, 0.4);
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-muted);
    border: 1px solid var(--border-subtle);
  }

  .btn-ghost:hover {
    background: var(--bg-elevated);
    color: var(--crimson);
    border-color: var(--crimson);
  }

  .content {
    padding: 28px 36px;
    overflow-y: auto;
    max-height: 100vh;
  }

  @media (max-width: 768px) {
    .app-layout {
      grid-template-columns: 1fr;
    }

    .sidebar {
      max-height: none;
      position: relative;
      border-right: none;
      border-bottom: 1px solid var(--border-subtle);
    }

    .content {
      padding: 16px;
    }
  }
</style>
