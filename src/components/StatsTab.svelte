<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let stats = $state({});
  let gpsHistory = $state([]);

  // GPS趋势图：用字符绘制
  function getSparkline(history) {
    if (!history || history.length < 2) return '数据不足';
    const vals = history.map(h => h.gps);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const range = max - min || 1;
    const bars = ['▁','▂','▃','▄','▅','▆','▇','█'];
    return vals.map(v => {
      const idx = Math.min(bars.length - 1, Math.floor((v - min) / range * (bars.length - 1)));
      return bars[idx];
    }).join('');
  }

  onMount(() => {
    window.updateStatsUI?.();
    let lastGps = 0;
    const interval = setInterval(() => {
      stats = window.getStats?.() || {};
      const gps = window.G?.goldPerSecond || 0;
      if (gps !== lastGps) {
        lastGps = gps;
        gpsHistory = [...(gpsHistory.length >= 30 ? gpsHistory.slice(1) : gpsHistory), { gps, ts: Date.now() }];
      }
    }, 500);
    return () => clearInterval(interval);
  });

  function shareStats() {
    if (!window.G) return;
    const G = window.G;
    const text = `🏰 Idle Empire 统计\n💰 金币: ${Math.floor(G.gold || 0).toLocaleString()}\n⚡ GPS: ${(G.goldPerSecond || 0).toLocaleString()}\n👹 Boss击杀: ${G.bossesDefeated || 0}\n🏆 成就: ${Object.keys(G.achievements || {}).length}\n🔄 转生: ${G.rebirths || 0}`;
    navigator.clipboard?.writeText(text).then(() => {
      window.showMsg?.('📋 统计已复制到剪贴板！', 'success');
    }).catch(() => {});
  }

  const statIcons = {
    buildings: '🏗️', clicks: '👆', achievements: '🏆',
    bosses: '👹', gold: '💰', gps: '⚡',
    totalGold: '💎', playTime: '⏱️', rebirths: '🔄'
  };
</script>

<div class="tab-header">
  <div>
    <h1>📊 游戏统计</h1>
    <p class="subtitle">查看你的游戏数据</p>
  </div>
  <button class="share-btn" onclick={shareStats}>📋 分享</button>
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

  <!-- GPS趋势图 -->
  <Card>
    <div class="stat-card">
      <div class="stat-icon">📈</div>
      <div class="sparkline font-mono">{getSparkline(gpsHistory)}</div>
      <div class="stat-label">GPS 趋势</div>
    </div>
  </Card>
</div>

<style>
  .tab-header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
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
  .sparkline { font-size: 20px; font-weight: 800; color: var(--gold-bright); letter-spacing: 2px; }
  .share-btn {
    background: linear-gradient(135deg, var(--gold-bright), var(--gold-muted));
    color: #18181B;
    border: none;
    border-radius: 999px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(232, 197, 71, 0.3);
  }
  .share-btn:hover { transform: translateY(-1px); }
</style>
