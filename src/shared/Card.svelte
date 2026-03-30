<script>
  let {
    clickable = false,
    affordable = false,
    locked = false,
    onclick,
    children
  } = $props();

  function handleKeydown(e) {
    if ((e.key === 'Enter' || e.key === ' ') && clickable) {
      e.preventDefault();
      onclick?.();
    }
  }
</script>

{#if clickable}
  <button class="card clickable" class:affordable class:locked {onclick} onkeydown={handleKeydown}>
    {@render children()}
  </button>
{:else}
  <div class="card" class:affordable class:locked>
    {@render children()}
  </div>
{/if}

<style>
  .card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 18px;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
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
