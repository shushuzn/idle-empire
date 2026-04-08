<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let collectibles = $state([]);
  let totalBonus = $state(0);

  onMount(() => {
    const poll = setInterval(() => {
      if (window.COLLECTIBLES_DATA?.length > 0) {
        collectibles = window.COLLECTIBLES_DATA;
        calcBonus();
        clearInterval(poll);
      }
    }, 50);
    return () => clearInterval(poll);
  });

  function calcBonus() {
    const all = collectibles.filter(c => c.collected);
    if (!all.length) { totalBonus = 0; return; }
    const allType = all.find(c => c.effect?.type === 'all');
    totalBonus = allType ? Math.round(allType.effect.value * 100) : 0;
  }

  function formatUnlock(unlock) {
    if (!unlock) return '';
    if (unlock.type === 'gold') return `${(unlock.target/1e6).toFixed(1)}M 金币`;
    if (unlock.type === 'boss') return `击败 ${unlock.target} 个Boss`;
    if (unlock.type === 'building') return `购买 ${unlock.target} 个建筑`;
    if (unlock.type === 'click') return `${(unlock.target/1e3).toFixed(0)}K 次点击`;
    if (unlock.type === 'upgrade') return `购买 ${unlock.target} 个升级`;
    if (unlock.type === 'dynasty') return `王朝 Lv${unlock.target}`;
    if (unlock.type === 'gps') return `${(unlock.target/1e6).toFixed(1)}M/s`;
    return '';
  }

  function effectText(c) {
    const v = c.effect?.value || 0;
    const pct = Math.round(v * 100);
    switch (c.effect?.type) {
      case 'gold': return `+${pct}% 金币收益`;
      case 'global': return `+${pct}% 全局收益`;
      case 'dynasty': return `+${pct}% 王朝增益`;
      case 'boss': return `+${pct}% Boss伤害`;
      case 'click': return `+${pct}% 点击收益`;
      case 'upgrade': return `+${pct}% 升级效果`;
      case 'offline': return `+${pct}% 离线收益`;
      case 'event': return `+${pct}% 事件收益`;
      case 'gps': return `+${pct}% 产量`;
      case 'lucky': return `+${pct}% 幸运值`;
      case 'all': return `+${pct}% 所有收益`;
      default: return '';
    }
  }

  function rarityColor(r) {
    switch (r) {
      case 'common': return '#9ca3af';
      case 'rare': return '#3b82f6';
      case 'epic': return '#a855f7';
      case 'legendary': return '#f59e0b';
      default: return '#9ca3af';
    }
  }
</script>

<div class="tab-header">
  <h1>📦 收藏品图鉴</h1>
  <p class="subtitle">收集全部收藏品解锁传说故事</p>
</div>

<div class="collect-header">
  <span class="collect-count">{collectibles.filter(c => c.collected).length} / {collectibles.length} 已收集</span>
  {#if totalBonus > 0}
    <span class="collect-bonus">套装加成: +{totalBonus}% 全局收益</span>
  {/if}
</div>

<div class="collect-grid">
  {#each collectibles as c (c.id)}
    <Card>
      <div class="col-card" class:collected={c.collected} style="--rarity-color: {rarityColor(c.rarity)}">
        <div class="c-icon">{c.collected ? c.icon : '❓'}</div>
        <div class="c-info">
          <div class="c-name">{c.name}</div>
          <div class="c-desc">{c.desc}</div>
          <div class="c-effect" class:unlocked={c.collected}>{effectText(c)}</div>
          {#if !c.collected}
            <div class="c-unlock">解锁条件: {formatUnlock(c.unlock)}</div>
          {/if}
        </div>
        <div class="c-rarity" style="color: {rarityColor(c.rarity)}">{c.rarity}</div>
      </div>
    </Card>
  {/each}
</div>

<style>
  .tab-header { margin-bottom: 16px; }
  h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  .subtitle { color: var(--text-muted); font-size: 14px; }

  .collect-header {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
    font-size: 13px;
  }
  .collect-count { color: var(--text-base); font-weight: 600; }
  .collect-bonus { color: var(--emerald); font-weight: 600; }

  .collect-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }

  .col-card {
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: 0.45;
    border-left: 3px solid var(--rarity-color);
    padding-left: 8px;
  }

  .col-card.collected { opacity: 1; }

  .c-icon {
    font-size: 28px;
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-elevated);
    border-radius: 10px;
    flex-shrink: 0;
  }

  .col-card.collected .c-icon {
    background: linear-gradient(135deg, color-mix(in srgb, var(--rarity-color) 30%, transparent), transparent);
    border: 1px solid var(--rarity-color);
  }

  .c-info { flex: 1; }
  .c-name { font-size: 14px; font-weight: 700; }
  .c-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  .c-effect { font-size: 11px; color: var(--text-faint); margin-top: 4px; }
  .c-effect.unlocked { color: var(--emerald); }
  .c-unlock { font-size: 10px; color: var(--text-faint); margin-top: 2px; }
  .c-rarity { font-size: 10px; font-weight: 700; text-transform: uppercase; writing-mode: vertical-rl; letter-spacing: 1px; }
</style>
