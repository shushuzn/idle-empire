<script>
  let { activeTab = $bindable('buildings') } = $props();

  const tabs = [
    { id: 'buildings', icon: '🏗️', label: '建筑' },
    { id: 'upgrades', icon: '⬆️', label: '升级' },
    { id: 'bosses', icon: '👹', label: 'Boss' },
    { id: 'artifacts', icon: '💠', label: '神器' },
    { id: 'rebirth', icon: '🔄', label: '转生' },
    { id: 'achievements', icon: '🏆', label: '成就' },
    { id: 'stats', icon: '📊', label: '统计' },
  ];
</script>

<nav class="nav">
  {#each tabs as tab}
    <button
      class="nav-tab"
      class:active={activeTab === tab.id}
      onclick={() => activeTab = tab.id}
    >
      <span class="tab-icon">{tab.icon}</span>
      <span class="tab-label">{tab.label}</span>
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
</style>
