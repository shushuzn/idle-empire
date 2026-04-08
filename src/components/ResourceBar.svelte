<script>
  import { goldStore, gpsStore, startSync, stopSync } from '../gameAdapter.js';
  import { formattedGold, formattedGps } from '../stores/gameStore.js';
  import { onMount, onDestroy } from 'svelte';

  let gold = $state(0);
  let gps = $state(0);
  const unsubGold = goldStore.subscribe(v => gold = v);
  const unsubGps = gpsStore.subscribe(v => gps = v);

  // 离线挂机收益预览：按离线8小时计算
  const OFFLINE_HOURS = 8;
  const OFFLINE_RATE = 0.5;
  let offlinePreview = $derived(gps > 0 ? Math.floor(gps * OFFLINE_HOURS * 3600 * OFFLINE_RATE) : 0);
  let offlineHint = $derived(offlinePreview > 0 ? `离线约 +${formatNum(offlinePreview)} 💰` : '点击获取 | 空格');
  function formatNum(n) {
    if (n >= 1e12) return (n/1e12).toFixed(1)+'T';
    if (n >= 1e9) return (n/1e9).toFixed(1)+'B';
    if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
    if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
    return n.toLocaleString();
  }

  onMount(() => startSync());
  onDestroy(() => {
    unsubGold();
    unsubGps();
    stopSync();
  });

  function handleClick() {
    window.clickGold?.();
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.clickGold?.();
    }
  }
</script>

<div class="resource-bar">
  <div class="gold-card" onclick={handleClick} onkeydown={handleKeydown} role="button" tabindex="0">
    <div class="gold-icon">💰</div>
    <div class="gold-info">
      <span class="label">当前金币</span>
      <span class="gold-value font-mono">{$formattedGold}</span>
      <span class="hint">{offlineHint}</span>
    </div>
  </div>
  <div class="gps-card">
    <div class="gps-icon">⚡</div>
    <div class="gps-info">
      <span class="label">产量/秒</span>
      <span class="gps-value font-mono">{$formattedGps}</span>
    </div>
  </div>
</div>

<style>
  .resource-bar {
    display: flex;
    gap: 12px;
  }

  .gold-card {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    background: var(--bg-surface);
    border: 1px solid rgba(232, 197, 71, 0.2);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .gold-card:hover {
    border-color: var(--gold-bright);
    box-shadow: var(--shadow-gold);
    transform: translateY(-1px);
  }

  .gold-card:active {
    transform: scale(0.98);
  }

  .gold-icon {
    font-size: 32px;
  }

  .gold-info {
    display: flex;
    flex-direction: column;
  }

  .label {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .gold-value {
    font-size: 26px;
    font-weight: 800;
    color: var(--gold-glow);
    line-height: 1.2;
  }

  .hint {
    font-size: 11px;
    color: var(--text-faint);
  }

  .gps-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
  }

  .gps-icon {
    font-size: 24px;
  }

  .gps-info {
    display: flex;
    flex-direction: column;
  }

  .gps-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--emerald);
  }
</style>
