<script>
  let {
    clickable = false,
    affordable = false,
    locked = false,
    onclick,
    children
  } = $props();
</script>

<div
  class="card"
  class:clickable
  class:affordable
  class:locked
  role={clickable ? 'button' : undefined}
  tabindex={clickable ? 0 : undefined}
  {onclick}
>
  {@render children()}
</div>

<style>
  .card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 18px;
    transition: all 0.2s ease;
  }

  .card.clickable {
    cursor: pointer;
  }

  .card.clickable:hover {
    background: var(--bg-elevated);
    border-color: var(--border-default);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .card.affordable {
    border-color: rgba(232, 197, 71, 0.3);
  }

  .card.affordable:hover {
    border-color: var(--gold-bright);
    box-shadow: var(--shadow-gold);
  }

  .card.locked {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .card.locked:hover {
    transform: none;
    box-shadow: none;
  }
</style>
