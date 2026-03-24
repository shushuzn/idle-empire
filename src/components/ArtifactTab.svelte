<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let artifacts = $state([]);

  onMount(() => {
    artifacts = window.ARTIFACTS_DATA || [];
  });
</script>

<div class="tab-header">
  <h1>💠 神器</h1>
  <p class="subtitle">收集神器获得强大加成</p>
</div>

<div class="artifact-grid">
  {#each artifacts as a (a.id)}
    <Card clickable={a.unlocked} onclick={() => window.collectArtifact?.(a.id)}>
      <div class="artifact-card" class:unlocked={a.unlocked}>
        <div class="a-icon">{a.unlocked ? (a.icon || '💠') : '❓'}</div>
        <div class="a-info">
          <div class="a-name">{a.name || '未知神器'}</div>
          <div class="a-bonus">{a.bonus || ''}</div>
        </div>
        <div class="a-tier">{a.tier || '?'}</div>
      </div>
    </Card>
  {/each}
</div>

<style>
  .tab-header { margin-bottom: 24px; }
  h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  .subtitle { color: var(--text-muted); font-size: 14px; }

  .artifact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }

  .artifact-card {
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: 0.5;
  }

  .artifact-card.unlocked { opacity: 1; border-color: var(--amethyst); }

  .a-icon {
    font-size: 26px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-elevated);
    border-radius: 10px;
    flex-shrink: 0;
  }

  .a-info { flex: 1; }
  .a-name { font-size: 14px; font-weight: 700; }
  .a-bonus { font-size: 11px; color: var(--amethyst); }
  .a-tier { font-size: 10px; padding: 2px 8px; background: var(--bg-overlay); border-radius: 999px; color: var(--text-faint); }
</style>
