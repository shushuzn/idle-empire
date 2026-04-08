<script>
  import { onMount } from 'svelte';

  let achievements = $state([]);
  let unlockedCount = $state(0);
  let totalCount = $state(0);
  let showcaseEl = $state(null);
  let copied = $state(false);

  onMount(() => {
    const poll = setInterval(() => {
      if (window.ACHIEVEMENTS_DATA?.length > 0) {
        achievements = window.ACHIEVEMENTS_DATA;
        unlockedCount = achievements.filter(a => a.unlocked).length;
        totalCount = achievements.length;
        clearInterval(poll);
      }
    }, 50);
    return () => clearInterval(poll);
  });

  const RARITY_COLORS = {
    common: '#9ca3af',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    legendary: '#f59e0b',
  };

  async function shareScreenshot() {
    try {
      // Dynamically import html2canvas
      const { default: html2canvas } = await import('html2canvas');

      if (!showcaseEl) return;

      const canvas = await html2canvas(showcaseEl, {
        backgroundColor: '#0f0f23',
        scale: 2,
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            const file = new File([blob], 'achievements.png', { type: 'image/png' });
            const item = new ClipboardItem({ 'image/png': file });
            await navigator.clipboard.write([item]);
            copied = true;
            setTimeout(() => (copied = false), 2000);
          } catch {
            // Fallback: download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'achievements.png';
            a.click();
            URL.revokeObjectURL(url);
          }
        }
      });
    } catch (e) {
      console.error('Screenshot failed:', e);
    }
  }

  let unlockedSorted = $derived(
    [...achievements].filter(a => a.unlocked).sort((a, b) => {
      const order = { legendary: 0, rare: 1, uncommon: 2, common: 3 };
      return (order[a.rarity] ?? 4) - (order[b.rarity] ?? 4);
    })
  );
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="showcase-wrapper">
  <div class="showcase" bind:this={showcaseEl}>
    <div class="showcase-header">
      <h2>🏆 我的成就</h2>
      <div class="stats-row">
        <span class="stat">
          <span class="stat-num">{unlockedCount}</span>
          <span class="stat-label">/ {totalCount} 已解锁</span>
        </span>
        <span class="progress-pct">{totalCount > 0 ? Math.round(unlockedCount / totalCount * 100) : 0}%</span>
      </div>
    </div>

    {#if unlockedSorted.length > 0}
      <div class="featured">
        {#each unlockedSorted.slice(0, 3) as a, i}
          <div class="featured-card" style="--rarity-color: {RARITY_COLORS[a.rarity] || '#9ca3af'}">
            <div class="fc-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
            <div class="fc-icon">{a.icon || '🏆'}</div>
            <div class="fc-info">
              <div class="fc-name">{a.name}</div>
              <div class="fc-rarity" style="color: {RARITY_COLORS[a.rarity] || '#9ca3af'}">
                {a.rarity === 'legendary' ? '传说' : a.rarity === 'rare' ? '史诗' : a.rarity === 'uncommon' ? '稀有' : '普通'}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <div class="unlocked-grid">
      {#each unlockedSorted.slice(3) as a}
        <div class="mini-badge" title="{a.name}">
          <span>{a.icon || '🏆'}</span>
        </div>
      {/each}
    </div>

    {#if unlockedSorted.length === 0}
      <div class="empty">还没有解锁任何成就，继续加油！</div>
    {/if}
  </div>

  <div class="share-section">
    <button class="share-btn" onclick={shareScreenshot}>
      {copied ? '✅ 已复制!' : '📸 分享截图'}
    </button>
  </div>
</div>

<style>
  .showcase-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .showcase {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 20px;
    min-width: 280px;
    max-width: 400px;
  }

  .showcase-header h2 {
    font-size: 18px;
    margin-bottom: 8px;
  }

  .stats-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .stat { display: flex; align-items: baseline; gap: 4px; }
  .stat-num { font-size: 24px; font-weight: 800; color: #f59e0b; }
  .stat-label { font-size: 12px; color: #9ca3af; }
  .progress-pct { font-size: 14px; color: #22c55e; font-weight: 600; }

  .featured {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .featured-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--rarity-color, #9ca3af);
    border-radius: 10px;
    padding: 10px 14px;
  }

  .fc-rank { font-size: 18px; }
  .fc-icon { font-size: 22px; }
  .fc-info { flex: 1; }
  .fc-name { font-size: 13px; font-weight: 700; }
  .fc-rarity { font-size: 10px; font-weight: 600; text-transform: uppercase; }

  .unlocked-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .mini-badge {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.06);
    border-radius: 8px;
    font-size: 16px;
    cursor: default;
  }

  .empty {
    text-align: center;
    padding: 24px;
    color: #6b7280;
    font-size: 13px;
  }

  .share-section {
    display: flex;
    gap: 8px;
  }

  .share-btn {
    flex: 1;
    padding: 10px 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .share-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  }
</style>
