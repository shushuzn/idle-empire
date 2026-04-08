<script>
  import { onMount } from 'svelte';

  let { activeTab = $bindable('buildings') } = $props();

  const tabs = [
    { id: 'buildings', icon: '🏗️', label: '建筑' },
    { id: 'upgrades', icon: '⬆️', label: '升级' },
    { id: 'bosses', icon: '👹', label: 'Boss' },
    { id: 'artifacts', icon: '💠', label: '神器' },
    { id: 'collectibles', icon: '📦', label: '收藏' },
    { id: 'milestones', icon: '🎯', label: '成就' },
    { id: 'rebirth', icon: '🔄', label: '转生' },
    { id: 'reputation', icon: '⭐', label: '声望' },
    { id: 'season', icon: '🏆', label: '赛季' },
    { id: 'achievements', icon: '🏅', label: '荣誉' },
    { id: 'stats', icon: '📊', label: '统计' },
  ];

  let buildingBadge = $state('');

  onMount(() => {
    const updateBadge = () => {
      const data = window.BUILDINGS_DATA || [];
      const owned = data.filter(b => (window.G?.buildings?.[b.id] || 0) > 0).length;
      const total = data.length;
      buildingBadge = owned < total ? `${owned}/${total}` : '✓';
    };
    updateBadge();
    const interval = setInterval(updateBadge, 500);
    return () => clearInterval(interval);
  });
</script>

<nav class="nav">
  {#each tabs as tab}
    <button
      class="nav-tab"
      class:active={activeTab === tab.id}
      data-tab={tab.id}
      onclick={() => activeTab = tab.id}
    >
      <span class="tab-icon">{tab.icon}</span>
      <span class="tab-label">{tab.label}</span>
      {#if tab.id === 'buildings' && buildingBadge}
        <span class="tab-badge">{buildingBadge}</span>
      {/if}
    </button>
  {/each}
</nav>

<style>
  .nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .nav-tab {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-muted);
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
  }

  .nav-tab:hover {
    background: var(--bg-elevated);
    color: var(--text-base);
  }

  .nav-tab.active {
    background: linear-gradient(135deg, var(--gold-muted), var(--gold-dim));
    color: #18181B;
    font-weight: 700;
    box-shadow: var(--shadow-gold);
  }

  .tab-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .tab-label {
    flex: 1;
  }

  .tab-badge {
    font-size: 10px;
    font-weight: 700;
    background: var(--gold-muted);
    color: var(--gold-bright);
    border-radius: 999px;
    padding: 1px 6px;
    min-width: 28px;
    text-align: center;
  }

  .nav-tab.active .tab-badge {
    background: rgba(24, 24, 27, 0.3);
    color: #18181B;
  }
</style>
