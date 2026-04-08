<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let bosses = $state([]);
  let weeklyChallenge = $state(null);

  onMount(() => {
    bosses = window.BOSSES_DATA || [];
    window.updateBossList?.();
    weeklyChallenge = window.getWeeklyChallengeBoss?.() || null;
  });

  function handleWeeklyChallenge() {
    window.challengeWeeklyBoss?.();
    weeklyChallenge = null; // hide after challenge started
  }
</script>

<div class="tab-header">
  <h1>👹 Boss 列表</h1>
  <p class="subtitle">挑战强大的 Boss 获得丰厚奖励</p>
</div>

{#if weeklyChallenge}
  <div class="challenge-banner" onclick={handleWeeklyChallenge} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && handleWeeklyChallenge()}>
    <span class="challenge-icon">{weeklyChallenge.icon}</span>
    <div class="challenge-info">
      <div class="challenge-title">⚔️ 本周挑战 Boss</div>
      <div class="challenge-name">{weeklyChallenge.name}</div>
      <div class="challenge-stats">HP: {weeklyChallenge.hp.toLocaleString()} | 奖励: {weeklyChallenge.reward.toLocaleString()} 💰</div>
    </div>
    <div class="challenge-cta">挑战!</div>
  </div>
{/if}

<div class="boss-grid">
  {#each bosses as boss (boss.id)}
    <Card clickable onclick={() => window.challengeBoss?.(boss.id)}>
      <div class="boss-card">
        <span class="boss-icon">{boss.icon || '👹'}</span>
        <div class="boss-info">
          <div class="boss-name">{boss.name || '未知 Boss'}</div>
          <div class="boss-hp">HP: {(boss.maxHp || 0).toLocaleString()}</div>
        </div>
        <div class="boss-reward">奖励: {boss.reward || '???'}</div>
      </div>
    </Card>
  {/each}
</div>

<style>
  .tab-header { margin-bottom: 24px; }
  h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  .subtitle { color: var(--text-muted); font-size: 14px; }

  .boss-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }

  .boss-card {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .boss-icon { font-size: 28px; flex-shrink: 0; }
  .boss-info { flex: 1; }
  .boss-name { font-size: 14px; font-weight: 700; }
  .boss-hp { font-size: 11px; color: var(--crimson); }
  .boss-reward { font-size: 12px; color: var(--gold-bright); }

  .challenge-banner {
    display: flex;
    align-items: center;
    gap: 14px;
    background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,179,8,0.08));
    border: 2px solid var(--gold-bright);
    border-radius: 14px;
    padding: 14px 18px;
    margin-bottom: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .challenge-banner:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 20px rgba(245,158,11,0.3);
  }

  .challenge-icon { font-size: 36px; flex-shrink: 0; }
  .challenge-info { flex: 1; }
  .challenge-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--gold-bright); font-weight: 700; }
  .challenge-name { font-size: 16px; font-weight: 800; color: var(--gold-glow); }
  .challenge-stats { font-size: 12px; color: var(--text-muted); }
  .challenge-cta {
    font-size: 14px;
    font-weight: 800;
    color: #18181B;
    background: linear-gradient(135deg, var(--gold-bright), var(--gold-muted));
    border-radius: 999px;
    padding: 8px 18px;
    box-shadow: var(--shadow-gold);
  }
</style>
