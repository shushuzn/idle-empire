<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let stats = $state({});

  onMount(() => {
    window.updateStatsUI?.();
    const interval = setInterval(() => {
      stats = window.getStats?.() || {};
    }, 500);
    return () => clearInterval(interval);
  });

  const statIcons = {
    buildings: '🏗️', clicks: '👆', achievements: '🏆',
    bosses: '👹', gold: '💰', gps: '⚡',
    totalGold: '💎', playTime: '⏱️', rebirths: '🔄'
  };
</script>

<div class="tab-header">
  <h1>📊 游戏统计</h1>
  <p class="subtitle">查看你的游戏数据</p>
</div>

<div class="stats-grid">
  {#each Object.entries(stats) as [key, value] (key)}
    <Card>
      <div class="stat-card">
        <div class="stat-icon">{statIcons[key] || '📈'}</div>
        <div class="stat-value font-mono">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <div class="stat-label">{key}</div>
      </div>
    </Card>
  {/each}
</div>

<style>
  .tab-header { margin-bottom: 24px; }
  h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  .subtitle { color: var(--text-muted); font-size: 14px; }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 6px;
  }

  .stat-icon { font-size: 24px; }
  .stat-value { font-size: 22px; font-weight: 800; color: var(--gold-bright); }
  .stat-label { font-size: 11px; color: var(--text-muted); text-transform: capitalize; }
</style>
