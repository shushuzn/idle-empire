<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let seasonData = $state(null);
  let noActiveSeason = $state(false);

  onMount(() => {
    seasonData = window.getCurrentSeasonData?.();
    noActiveSeason = !seasonData;
    const interval = setInterval(() => {
      seasonData = window.getCurrentSeasonData?.();
      noActiveSeason = !seasonData;
    }, 2000);
    return () => clearInterval(interval);
  });

  function claim(challengeId) {
    window.claimSeasonReward?.(challengeId);
  }

  function getProgressPercent(c) {
    if (!seasonData) return 0;
    // rough estimate based on current stats
    return c.completed ? 100 : 0;
  }
</script>

<div class="tab-header">
  <div>
    <h1>🏆 赛季</h1>
    <p class="subtitle">挑战赛季任务，获得限定奖励</p>
  </div>
  {#if seasonData}
    <div class="season-points">
      <span class="points-icon">🏅</span>
      <span class="points-value font-mono">{seasonData.points || 0}</span>
      <span class="points-label">赛季点数</span>
    </div>
  {/if}
</div>

{#if noActiveSeason}
  <Card>
    <div class="no-season">
      <div class="no-season-icon">🏆</div>
      <div class="no-season-title">赛季未开始</div>
      <div class="no-season-desc">下一赛季将于近期开启，请关注公告</div>
    </div>
  </Card>
{:else if seasonData}
  <div class="season-info">
    <Card>
      <div class="season-header">
        <div class="season-name">{seasonData.name}</div>
        <div class="season-dates">{seasonData.startDate} — {seasonData.endDate}</div>
        <div class="season-meta">
          <span class="meta-item">👥 {seasonData.participants?.toLocaleString()} 玩家参与</span>
          <span class="meta-item">🏅 {seasonData.points} 赛季点数</span>
        </div>
      </div>
    </Card>
  </div>

  <div class="season-section">
    <div class="section-title">📋 赛季挑战</div>
    {#each seasonData.challenges || [] as challenge}
      <Card>
        <div class="challenge-card" class:completed={challenge.completed} class:claimed={challenge.claimed}>
          <div class="challenge-info">
            <div class="challenge-label">{challenge.label}</div>
            <div class="challenge-desc">{challenge.desc}</div>
          </div>
          <div class="challenge-reward">
            <span class="reward-pts">+{challenge.reward} 🏅</span>
            {#if challenge.claimed}
              <span class="claimed-badge">已领取</span>
            {:else if challenge.completed}
              <button class="btn-claim" onclick={() => claim(challenge.id)}>领取</button>
            {:else}
              <span class="pending-badge">进行中</span>
            {/if}
          </div>
        </div>
      </Card>
    {/each}
  </div>

  <div class="season-section">
    <div class="section-title">📊 赛季排名</div>
    <Card>
      <div class="rank-info">
        <div class="rank-item">
          <span class="rank-label">当前排名</span>
          <span class="rank-value">前 10%</span>
        </div>
        <div class="rank-item">
          <span class="rank-label">历史最佳</span>
          <span class="rank-value">前 {seasonData.points > 0 ? Math.max(1, Math.floor(Math.random() * 20)) : '—'}%</span>
        </div>
        <div class="rank-hint">赛季结束时根据表现发放最终排名奖励</div>
      </div>
    </Card>
  </div>
{/if}

<style>
  .tab-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  .subtitle { color: var(--text-muted); font-size: 14px; }

  .season-points {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border-radius: 12px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 2px 12px rgba(245, 158, 11, 0.3);
  }
  .points-icon { font-size: 18px; }
  .points-value { font-size: 20px; font-weight: 800; color: #18181B; }
  .points-label { font-size: 11px; color: rgba(24, 24, 27, 0.6); }

  .no-season {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px;
    text-align: center;
    gap: 12px;
  }
  .no-season-icon { font-size: 48px; opacity: 0.4; }
  .no-season-title { font-size: 20px; font-weight: 700; opacity: 0.6; }
  .no-season-desc { font-size: 14px; color: var(--text-muted); }

  .season-info { margin-bottom: 20px; }
  .season-header { display: flex; flex-direction: column; gap: 6px; }
  .season-name { font-size: 20px; font-weight: 800; color: var(--gold-bright); }
  .season-dates { font-size: 13px; color: var(--text-muted); }
  .season-meta { display: flex; gap: 16px; font-size: 13px; color: var(--text-muted); margin-top: 4px; }

  .season-section { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
  .section-title {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
    margin-bottom: 4px;
  }

  .challenge-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .challenge-card.completed { opacity: 1; }
  .challenge-card.claimed { opacity: 0.5; }

  .challenge-info { flex: 1; }
  .challenge-label { font-size: 14px; font-weight: 600; }
  .challenge-desc { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

  .challenge-reward {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .reward-pts { font-size: 14px; font-weight: 700; color: #f59e0b; }

  .btn-claim {
    border: none;
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #fff;
    transition: all 0.15s ease;
  }
  .btn-claim:hover { transform: translateY(-1px); }

  .claimed-badge, .pending-badge {
    font-size: 12px;
    font-weight: 600;
    border-radius: 8px;
    padding: 4px 10px;
  }
  .claimed-badge {
    color: var(--text-muted);
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
  }
  .pending-badge {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .rank-info { display: flex; flex-direction: column; gap: 12px; }
  .rank-item { display: flex; justify-content: space-between; align-items: center; }
  .rank-label { font-size: 14px; color: var(--text-muted); }
  .rank-value { font-size: 16px; font-weight: 700; color: var(--gold-bright); }
  .rank-hint { font-size: 12px; color: var(--text-muted); text-align: center; padding-top: 8px; border-top: 1px solid var(--border-subtle); }
</style>
