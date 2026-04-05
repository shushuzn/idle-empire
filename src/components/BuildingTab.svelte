<script>
  import Card from '../shared/Card.svelte';
  import { goldStore } from '../gameAdapter.js';
  import { onMount } from 'svelte';

  let gold = $state(0);
  goldStore.subscribe(v => gold = v);

  let buildings = $state([]);
  let buyMode = $state('x1');

  onMount(() => {
    // Immediate read in case data is already available
    buildings = window.BUILDINGS_DATA || [];
    const poll = setInterval(() => {
      buildings = window.BUILDINGS_DATA || [];
    }, 100);
    return () => clearInterval(poll);
  });

  function handleBuy(building) {
    window.buyBuilding?.(building.id, buyMode);
  }

  function setBuyMode(mode) {
    buyMode = mode;
    window.setBuyMode?.(mode);
  }
</script>

<div class="tab-header">
  <div>
    <h1>🏗️ 建筑</h1>
    <p class="subtitle">购买建筑自动获得金币收益</p>
  </div>
  <div class="buy-mode">
    {#each [['x1', 'x1 (Q)'], ['x10', 'x10 (W)'], ['max', 'MAX (E)']] as [mode, label]}
      <button
        class="mode-btn"
        class:active={buyMode === mode}
        onclick={() => setBuyMode(mode)}
      >{label}</button>
    {/each}
  </div>
</div>

<div class="building-grid">
  {#each buildings as b (b.id)}
    <Card
      clickable={gold >= (b.cost || 0)}
      affordable={gold >= (b.cost || 0)}
      locked={gold < (b.cost || 0)}
      onclick={() => handleBuy(b)}
    >
      <div class="building-card rarity-{b.rarity || 'common'}">
        <div class="b-icon">{b.icon || '🏗️'}</div>
        <div class="b-info">
          <div class="b-name">{b.name || '未知建筑'}</div>
          <div class="b-desc">{b.desc || ''}</div>
          <div class="b-gps">+{(b.gps || 0).toLocaleString()}/s</div>
        </div>
        <div class="b-count">{(b.count || 0).toLocaleString()}</div>
        <div class="b-cost font-mono">
          <span class:insufficient={gold < (b.cost || 0)}>
            {Math.floor(b.cost || 0).toLocaleString()} 💰
          </span>
        </div>
      </div>
    </Card>
  {/each}
</div>

<style>
  .tab-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  h1 {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 4px;
  }

  .subtitle {
    color: var(--text-muted);
    font-size: 14px;
  }

  .buy-mode {
    display: flex;
    gap: 6px;
  }

  .mode-btn {
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
    color: var(--text-muted);
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .mode-btn:hover {
    border-color: var(--gold-bright);
    color: var(--text-base);
  }

  .mode-btn.active {
    background: linear-gradient(135deg, var(--gold-bright), var(--gold-muted));
    color: #18181B;
    border-color: transparent;
    font-weight: 700;
  }

  .building-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }

  .building-card {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .building-card.rarity-common { border-left: 3px solid #9ca3af; }
  .building-card.rarity-uncommon { border-left: 3px solid #22c55e; }
  .building-card.rarity-rare { border-left: 3px solid #3b82f6; }
  .building-card.rarity-epic { border-left: 3px solid #a855f7; }
  .building-card.rarity-legendary {
    border-left: 3px solid #f59e0b;
    background: linear-gradient(90deg, rgba(245,158,11,0.08) 0%, transparent 60%);
  }

  .b-icon {
    font-size: 28px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-elevated);
    border-radius: 10px;
    flex-shrink: 0;
  }

  .b-info { flex: 1; min-width: 0; }
  .b-name { font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .b-desc { font-size: 11px; color: var(--text-muted); }
  .b-gps { font-size: 12px; color: var(--emerald); font-weight: 600; }

  .b-count {
    font-size: 28px;
    font-weight: 800;
    color: var(--gold-glow);
    min-width: 48px;
    text-align: center;
  }

  .b-cost {
    font-size: 13px;
    color: var(--text-muted);
    min-width: 80px;
    text-align: right;
  }

  .insufficient { color: var(--crimson); }
</style>
