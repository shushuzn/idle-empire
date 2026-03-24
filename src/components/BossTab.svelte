<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let bosses = $state([]);

  onMount(() => {
    bosses = window.BOSSES_DATA || [];
    window.updateBossList?.();
  });
</script>

<div class="tab-header">
  <h1>👹 Boss 列表</h1>
  <p class="subtitle">挑战强大的 Boss 获得丰厚奖励</p>
</div>

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
</style>
