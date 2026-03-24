<script>
  let { value = 0, max = 100, color = 'gold', showLabel = false } = $props();
  let pct = $derived(Math.min(100, (value / max) * 100));
</script>

<div class="progress-track">
  <div class="progress-fill {color}" style="width: {pct}%"></div>
</div>
{#if showLabel}
  <span class="progress-label">{Math.floor(value)} / {Math.floor(max)}</span>
{/if}

<style>
  .progress-track {
    height: 10px;
    background: var(--bg-overlay);
    border-radius: 5px;
    overflow: hidden;
    border: 1px solid var(--border-subtle);
  }

  .progress-fill {
    height: 100%;
    border-radius: 5px;
    transition: width 0.3s ease;
  }

  .progress-fill.gold {
    background: linear-gradient(90deg, var(--gold-muted), var(--gold-bright));
  }

  .progress-fill.crimson {
    background: linear-gradient(90deg, var(--crimson), #E05555);
  }

  .progress-fill.emerald {
    background: linear-gradient(90deg, var(--emerald), #4DC87A);
  }

  .progress-fill.amethyst {
    background: linear-gradient(90deg, var(--amethyst), #a08aff);
  }

  .progress-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 4px;
    display: block;
    text-align: right;
  }
</style>
