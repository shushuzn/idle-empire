<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let achievements = $state([]);

  onMount(() => {
    const poll = setInterval(() => {
      if (window.ACHIEVEMENTS_DATA?.length > 0) {
        achievements = window.ACHIEVEMENTS_DATA;
        clearInterval(poll);
      }
    }, 50);
    return () => clearInterval(poll);
  });
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
          <div class="a-name">{a.name || '???'}</div>
          <div class="a-desc">{a.desc || ''}</div>
          {#if a.unlocked}
            <div class="a-reward">奖励: {a.reward || ''}</div>
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
  .a-name { font-size: 14px; font-weight: 700; }
  .a-desc { font-size: 11px; color: var(--text-muted); }
  .a-reward { font-size: 11px; color: var(--emerald); margin-top: 4px; }
</style>
