<script>
  import { onMount } from 'svelte';

  let buffs = $state([]);

  const EVENT_INFO = {
    doubleProduction: { name: '产量翻倍', icon: '⬆️', color: '#22c55e' },
    clickCrit: { name: '点击暴击', icon: '💥', color: '#f59e0b' },
    bossWeak: { name: 'Boss虚弱', icon: '😈', color: '#3b82f6' },
    luckyDay: { name: '幸运降临', icon: '🍀', color: '#a855f7' },
  };

  onMount(() => {
    const update = () => {
      const eb = window.G?.eventBuffs || {};
      const now = Date.now();
      const active = [];
      for (const [key, info] of Object.entries(EVENT_INFO)) {
        if (eb[key] && now < eb[key]) {
          const remaining = Math.ceil((eb[key] - now) / 1000);
          active.push({ key, ...info, remaining });
        }
      }
      buffs = active;
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  });
</script>

{#if buffs.length > 0}
  <div class="event-buffs">
    {#each buffs as b (b.key)}
      <div class="buff-chip" style="--buff-color: {b.color}">
        <span class="buff-icon">{b.icon}</span>
        <span class="buff-name">{b.name}</span>
        <span class="buff-time">{b.remaining}s</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .event-buffs {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .buff-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: color-mix(in srgb, var(--buff-color) 15%, var(--bg-elevated));
    border: 1px solid var(--buff-color);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    animation: buffPulse 2s ease-in-out infinite;
  }

  .buff-icon { font-size: 14px; }
  .buff-name { flex: 1; color: var(--buff-color); }
  .buff-time { font-size: 11px; color: var(--text-muted); font-variant-numeric: tabular-nums; }

  @keyframes buffPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
</style>
