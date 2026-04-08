<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let achievements = $state([]);
  let shareToast = $state('');
  let toastTimer = null;

  const RARITY_COLORS = {
    common: '#9ca3af',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    legendary: '#f59e0b',
  };
  const RARITY_LABELS = {
    common: '普通',
    uncommon: '稀有',
    rare: '史诗',
    legendary: '传说',
  };

  onMount(() => {
    const poll = setInterval(() => {
      if (window.ACHIEVEMENTS_DATA?.length > 0) {
        achievements = window.ACHIEVEMENTS_DATA;
        clearInterval(poll);
      }
    }, 50);
    return () => clearInterval(poll);
  });

  function getProgress(achievement, G) {
    if (!G || achievement.unlocked) return 0;
    var cond = achievement.condition;
    if (!cond) return 0;
    var current = 0;
    switch (cond.type) {
      case 'buildings_total':
        current = Object.values(G.buildings || {}).reduce((a, b) => a + b, 0);
        break;
      case 'gold_earned':
      case 'total_earned':
        current = G.totalEarned || 0;
        break;
      case 'boss_kills':
        current = G.bossesDefeated || 0;
        break;
      case 'clicks':
        current = G.totalClicks || 0;
        break;
      case 'rebirth':
        current = G.rebirths || 0;
        break;
      default:
        current = 0;
    }
    return Math.min(1, current / (cond.target || 1));
  }

  function formatTarget(cond) {
    if (!cond || !cond.target) return '';
    if (cond.target >= 1e12) return (cond.target/1e12).toFixed(1)+'T';
    if (cond.target >= 1e9) return (cond.target/1e9).toFixed(1)+'B';
    if (cond.target >= 1e6) return (cond.target/1e6).toFixed(1)+'M';
    if (cond.target >= 1e3) return (cond.target/1e3).toFixed(1)+'K';
    return cond.target.toLocaleString();
  }

  async function shareAchievement(a) {
    const rarityLabel = RARITY_LABELS[a.rarity] || a.rarity || '';
    const rewardText = a.reward ? ` | 奖励: ${a.reward}` : '';
    const text = `🏆 ${a.name || '???'} ${rarityLabel}${rewardText}`;
    try {
      await navigator.clipboard.writeText(text);
      shareToast = '已复制到剪贴板!';
    } catch {
      shareToast = '复制失败';
    }
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { shareToast = ''; }, 2000);
  }
</script>

<div class="tab-header">
  <h1>🏆 成就</h1>
  <p class="subtitle">解锁成就获得奖励加成</p>
</div>

<div class="achievement-grid">
  {#each achievements as a (a.id)}
    <Card clickable={!a.unlocked} onclick={() => window.selectAchievement?.(a.id)}>
      <div class="achievement-card" class:unlocked={a.unlocked}>
        <div class="a-icon">{a.unlocked ? (a.icon || '🏆') : '🔒'}</div>
        <div class="a-info">
          <div class="a-name-row">
            <div class="a-name">{a.name || '???'}</div>
            {#if a.rarity}
              <span class="rarity-badge" style="color: {RARITY_COLORS[a.rarity] || '#9ca3af'}">
                {RARITY_LABELS[a.rarity] || a.rarity}
              </span>
            {/if}
          </div>
          <div class="a-desc">{a.desc || ''}</div>
          {#if a.unlocked}
            <div class="a-reward">奖励: {a.reward || ''}</div>
            <button class="share-btn" onclick={() => shareAchievement(a)}>分享</button>
          {:else}
            {@const prog = getProgress(a, window.G)}
            <div class="a-progress">
              <div class="a-progress-fill" style="width: {Math.round(prog*100)}%"></div>
            </div>
            <div class="a-progress-text">{formatTarget(a.condition)}</div>
          {/if}
        </div>
      </div>
    </Card>
  {/each}
</div>

<style>
  .tab-header { margin-bottom: 24px; }
  h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  .subtitle { color: var(--text-muted); font-size: 14px; }

  .achievement-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }

  .achievement-card {
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: 0.5;
  }

  .achievement-card.unlocked { opacity: 1; }

  .a-icon {
    font-size: 26px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-elevated);
    border-radius: 10px;
    flex-shrink: 0;
  }

  .achievement-card.unlocked .a-icon {
    background: linear-gradient(135deg, var(--gold-bright), var(--gold-muted));
  }

  .a-info { flex: 1; }
  .a-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .a-name { font-size: 14px; font-weight: 700; }
  .rarity-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 999px;
    border: 1px solid currentColor;
    opacity: 0.85;
  }
  .a-desc { font-size: 11px; color: var(--text-muted); }
  .a-reward { font-size: 11px; color: var(--emerald); margin-top: 4px; }
  .a-progress {
    height: 3px;
    background: var(--bg-elevated);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 4px;
  }
  .a-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold-muted), var(--gold-bright));
    border-radius: 2px;
    transition: width 0.3s ease;
  }
  .a-progress-text {
    font-size: 10px;
    color: var(--text-faint);
    margin-top: 2px;
  }
  .share-btn {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 6px;
    border: 1px solid var(--gold-muted);
    background: transparent;
    color: var(--gold-bright);
    cursor: pointer;
    margin-top: 4px;
  }
  .share-toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-elevated);
    border: 1px solid var(--gold-muted);
    color: var(--text);
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    z-index: 999;
  }
</style>

{#if shareToast}
  <div class="share-toast">{shareToast}</div>
{/if}
