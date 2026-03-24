<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let upgrades = $state([]);

  onMount(() => {
    upgrades = window.UPGRADES_DATA || [];
  });

  function handleBuy(upgrade) {
    window.buyUpgrade?.(upgrade.id);
  }
</script>

<div class="tab-header">
  <h1>⬆️ 升级</h1>
  <p class="subtitle">购买升级获得永久强化</p>
</div>

<div class="upgrade-grid">
  {#each upgrades as u (u.id)}
    <Card clickable onclick={() => handleBuy(u)}>
      <div class="upgrade-card">
        <div class="u-icon">{u.icon || '⬆️'}</div>
        <div class="u-info">
          <div class="u-name">{u.name || '未知升级'}</div>
          <div class="u-desc">{u.desc || ''}</div>
        </div>
        <div class="u-cost font-mono">{(u.cost || 0).toLocaleString()} 💰</div>
      </div>
    </Card>
  {/each}
</div>

<style>
  .tab-header { margin-bottom: 24px; }
  h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  .subtitle { color: var(--text-muted); font-size: 14px; }

  .upgrade-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }

  .upgrade-card {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .u-icon {
    font-size: 26px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-elevated);
    border-radius: 10px;
    flex-shrink: 0;
  }

  .u-info { flex: 1; min-width: 0; }
  .u-name { font-size: 14px; font-weight: 700; }
  .u-desc { font-size: 11px; color: var(--text-muted); }
  .u-cost { font-size: 12px; color: var(--gold-bright); }
</style>
