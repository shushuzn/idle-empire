<script>
  import Card from '../shared/Card.svelte';
  import { goldStore } from '../gameAdapter.js';
  import { onMount } from 'svelte';

  let gold = $state(0);
  goldStore.subscribe(v => gold = v);

  let buildings = $state([]);
  let buyMode = $state('x1');
  let skinPickerBuilding = $state(null);
  let flashingBuilding = $state(null);

  const SKINS = {
    mine: [{ id: 'default', icon: '⛏️', name: '默认' }, { id: 'golden', icon: '🔨', name: '黄金镐' }, { id: 'diamond', icon: '💎', name: '钻石镐' }],
    lumber: [{ id: 'default', icon: '🪓', name: '默认' }, { id: 'chainsaw', icon: '🪚', name: '电锯' }, { id: 'golden', icon: '⚒️', name: '黄金斧' }],
    farm: [{ id: 'default', icon: '🌾', name: '默认' }, { id: 'greenhouse', icon: '🏡', name: '温室' }, { id: 'mega', icon: '🌻', name: '向日葵' }],
    factory: [{ id: 'default', icon: '🏭', name: '默认' }, { id: 'robot', icon: '🤖', name: '机器人' }, { id: 'quantum', icon: '⚙️', name: '量子工厂' }],
    bank: [{ id: 'default', icon: '🏦', name: '默认' }, { id: 'golden', icon: '🏛️', name: '黄金银行' }, { id: 'digital', icon: '💳', name: '数字银行' }],
  };

  function getSkin(buildingId) {
    if (!window.G?.buildings) return 'default';
    return window.G.buildings[buildingId + '_skin'] || 'default';
  }

  function getSkinIcon(buildingId) {
    const skins = SKINS[buildingId] || [{ id: 'default', icon: '🏗️' }];
    const id = getSkin(buildingId);
    return skins.find(s => s.id === id)?.icon || '🏗️';
  }

  function selectSkin(buildingId, skinId) {
    window.setBuildingSkin?.(buildingId, skinId);
    skinPickerBuilding = null;
  }

  onMount(() => {
    buildings = window.BUILDINGS_DATA || [];
    const poll = setInterval(() => {
      buildings = window.BUILDINGS_DATA || [];
    }, 100);
    return () => clearInterval(poll);
  });

  function handleBuy(building) {
    window.buyBuilding?.(building.id, buyMode);
    flashingBuilding = building.id;
    setTimeout(() => flashingBuilding = null, 400);
  }

  function setBuyMode(mode) {
    buyMode = mode;
    window.setBuyMode?.(mode);
  }

  // 计算建筑的"效益值"：每花费1万金币获得多少 GPS
  // 效益值越高 = 越值得买
  function getEfficiency(b) {
    if (!b || b.gps <= 0) return 0;
    // 用 baseCost（不随数量涨价的基础价格）来计算效益，排除数量积累的影响
    return b.baseProduction / Math.log10(b.baseCost + 1);
  }

  function getBestBuildingId() {
    if (!buildings.length) return null;
    return buildings.reduce((best, b) => getEfficiency(b) > getEfficiency(best) ? b : best, buildings[0]).id;
  }

  function getEfficiencyLabel(b, bestId) {
    if (!b.gps || b.gps <= 0) return '';
    const ratio = Math.floor(b.cost / b.gps);
    if (ratio <= 100) return '超值得';
    if (ratio <= 1000) return '值得';
    if (ratio <= 10000) return '一般';
    return '昂贵';
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
      <div class="building-card rarity-{b.rarity || 'common'}" class:purchase-flash={flashingBuilding === b.id}>
        <div class="b-icon" onclick={() => skinPickerBuilding = skinPickerBuilding === b.id ? null : b.id} role="button" tabindex="0">{getSkinIcon(b.id)}</div>
        <div class="b-info">
          <div class="b-name">{b.name || '未知建筑'}</div>
          <div class="b-desc">{b.desc || ''}</div>
          <div class="b-gps">+{(b.gps || 0).toLocaleString()}/s</div>
          {#if b.unlocked && b.gps > 0}
            <div class="b-efficiency" class:best={b.id === getBestBuildingId()}>{getEfficiencyLabel(b, getBestBuildingId())}</div>
          {/if}
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

{#if skinPickerBuilding}
  {@const skins = SKINS[skinPickerBuilding] || []}
  {@const currentSkin = getSkin(skinPickerBuilding)}
  <div class="skin-picker-overlay" onclick={() => skinPickerBuilding = null} role="presentation">
    <div class="skin-picker" onclick={(e) => e.stopPropagation()}>
      <div class="skin-picker-header">
        <span>选择皮肤</span>
        <button class="close-btn" onclick={() => skinPickerBuilding = null}>✕</button>
      </div>
      <div class="skin-options">
        {#each skins as skin}
          <button
            class="skin-option"
            class:selected={skin.id === currentSkin}
            onclick={() => selectSkin(skinPickerBuilding, skin.id)}
          >
            <span class="skin-icon">{skin.icon}</span>
            <span class="skin-name">{skin.name}</span>
            {#if skin.id === currentSkin}<span class="skin-check">✓</span>{/if}
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}

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

  @keyframes purchaseFlash {
    0%   { box-shadow: 0 0 0 0 rgba(232, 197, 71, 0.7); transform: scale(1); }
    50%  { box-shadow: 0 0 20px 6px rgba(232, 197, 71, 0.4); transform: scale(1.03); }
    100% { box-shadow: 0 0 0 0 rgba(232, 197, 71, 0); transform: scale(1); }
  }

  .purchase-flash {
    animation: purchaseFlash 0.4s ease-out;
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
  .b-efficiency {
    font-size: 10px;
    color: var(--text-faint);
    margin-top: 2px;
  }
  .b-efficiency.best {
    color: var(--gold-bright);
    font-weight: 700;
  }

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

  .skin-picker-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .skin-picker {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 16px;
    padding: 20px;
    min-width: 280px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }

  .skin-picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 700;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 18px;
  }

  .skin-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .skin-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.15s ease;
  }

  .skin-option:hover { border-color: var(--gold-muted); }
  .skin-option.selected { border-color: var(--gold-bright); background: color-mix(in srgb, var(--gold-muted) 15%, transparent); }
  .skin-icon { font-size: 22px; }
  .skin-name { flex: 1; text-align: left; }
  .skin-check { color: var(--gold-bright); font-weight: 700; }
</style>
