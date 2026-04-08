<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let repData = $state({ reputation: 0, dailyQuests: [], weeklyQuests: [], items: [] });

  onMount(() => {
    repData = window.getReputationData?.() || repData;
    const interval = setInterval(() => {
      repData = window.getReputationData?.() || repData;
    }, 1000);
    return () => clearInterval(interval);
  });

  function claimQuest(quest) {
    window.completeQuest?.(quest);
  }

  function buyItem(item) {
    window.buyReputationItem?.(item.id);
  }
</script>

<div class="tab-header">
  <div>
    <h1>⭐ 声望</h1>
    <p class="subtitle">完成任务获得声望，解锁专属奖励</p>
  </div>
  <div class="rep-display">
    <span class="rep-icon">⭐</span>
    <span class="rep-value font-mono">{repData.reputation || 0}</span>
  </div>
</div>

<div class="rep-container">
  <div class="rep-section">
    <div class="section-title">📅 每日任务</div>
    {#each repData.dailyQuests || [] as quest}
      <Card>
        <div class="quest-card" class:completed={quest.completed}>
          <div class="quest-info">
            <div class="quest-label">{quest.label}</div>
            <div class="quest-desc">{quest.desc}</div>
          </div>
          <div class="quest-reward">
            <span class="rep-cost">+{quest.rep}</span>
            {#if quest.completed}
              <span class="done-badge">✓</span>
            {:else}
              <button class="btn-claim" onclick={() => claimQuest(quest)}>领取</button>
            {/if}
          </div>
        </div>
      </Card>
    {/each}
  </div>

  <div class="rep-section">
    <div class="section-title">📆 每周任务</div>
    {#each repData.weeklyQuests || [] as quest}
      <Card>
        <div class="quest-card" class:completed={quest.completed}>
          <div class="quest-info">
            <div class="quest-label">{quest.label}</div>
            <div class="quest-desc">{quest.desc}</div>
          </div>
          <div class="quest-reward">
            <span class="rep-cost">+{quest.rep}</span>
            {#if quest.completed}
              <span class="done-badge">✓</span>
            {:else}
              <button class="btn-claim" onclick={() => claimQuest(quest)}>领取</button>
            {/if}
          </div>
        </div>
      </Card>
    {/each}
  </div>

  <div class="rep-section">
    <div class="section-title">🛒 声望商店</div>
    {#each repData.items || [] as item}
      <Card>
        <div class="shop-card" class:owned={item.owned}>
          <div class="shop-info">
            <div class="shop-label">{item.label}</div>
            <div class="shop-desc">{item.desc}</div>
          </div>
          <div class="shop-action">
            {#if item.owned}
              <span class="owned-badge">已拥有</span>
            {:else}
              <span class="rep-cost">{item.rep} ⭐</span>
              <button class="btn-buy" onclick={() => buyItem(item)}>购买</button>
            {/if}
          </div>
        </div>
      </Card>
    {/each}
  </div>
</div>

<style>
  .tab-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  .subtitle { color: var(--text-muted); font-size: 14px; }

  .rep-display {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border-radius: 12px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 12px rgba(245, 158, 11, 0.3);
  }

  .rep-icon { font-size: 20px; }
  .rep-value { font-size: 20px; font-weight: 800; color: #18181B; }

  .rep-container { display: flex; flex-direction: column; gap: 24px; }

  .rep-section { display: flex; flex-direction: column; gap: 10px; }

  .section-title {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
    margin-bottom: 4px;
  }

  .quest-card, .shop-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .quest-card.completed { opacity: 0.6; }
  .shop-card.owned { opacity: 0.5; }

  .quest-info, .shop-info { flex: 1; }
  .quest-label, .shop-label { font-size: 14px; font-weight: 600; }
  .quest-desc, .shop-desc { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

  .quest-reward, .shop-action {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .rep-cost { font-size: 13px; font-weight: 700; color: #f59e0b; }

  .btn-claim, .btn-buy {
    border: none;
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-claim {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #fff;
  }

  .btn-buy {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #18181B;
  }

  .btn-claim:hover, .btn-buy:hover { transform: translateY(-1px); }

  .done-badge {
    font-size: 16px;
    color: #22c55e;
    font-weight: 800;
  }

  .owned-badge {
    font-size: 12px;
    color: var(--text-muted);
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 4px 10px;
  }
</style>
