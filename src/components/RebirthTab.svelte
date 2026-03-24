<script>
  import Card from '../shared/Card.svelte';
  import ProgressBar from '../shared/ProgressBar.svelte';
  import { onMount } from 'svelte';

  let rebirthData = $state({ currentPoints: 0, multiplier: 1, nextCost: 1000 });

  onMount(() => {
    window.updateRebirthUI?.();
    const interval = setInterval(() => {
      rebirthData = window.getRebirthData?.() || rebirthData;
    }, 500);
    return () => clearInterval(interval);
  });
</script>

<div class="tab-header">
  <h1>🔄 转生</h1>
  <p class="subtitle">转生获得永久强化</p>
</div>

<div class="rebirth-container">
  <Card>
    <div class="rebirth-card">
      <div class="r-icon">🔄</div>
      <div class="r-info">
        <div class="r-title">转生点数</div>
        <div class="r-points font-mono">{rebirthData.currentPoints}</div>
        <div class="r-mult">当前倍数: x{rebirthData.multiplier}</div>
      </div>
    </div>
    <div class="r-progress">
      <ProgressBar value={rebirthData.currentPoints} max={rebirthData.nextCost} color="amethyst" showLabel />
    </div>
    <button class="btn btn-purple" onclick={() => window.performRebirth?.()}>
      转生 (需要 {rebirthData.nextCost.toLocaleString()} 点)
    </button>
  </Card>
</div>

<style>
  .tab-header { margin-bottom: 24px; }
  h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  .subtitle { color: var(--text-muted); font-size: 14px; }

  .rebirth-container { max-width: 480px; }

  .rebirth-card {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }

  .r-icon { font-size: 36px; }
  .r-title { font-size: 12px; color: var(--text-muted); text-transform: uppercase; }
  .r-points { font-size: 32px; font-weight: 800; color: var(--amethyst); }
  .r-mult { font-size: 12px; color: var(--text-muted); }

  .r-progress { margin: 16px 0; }

  .btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-purple {
    background: linear-gradient(135deg, var(--amethyst), #6B4FC0);
    color: #fff;
  }

  .btn-purple:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 20px rgba(139, 111, 204, 0.4);
  }
</style>
