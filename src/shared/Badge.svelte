<script>
  let { count = 0, variant = 'default' } = $props();
</script>

{#if count > 0}
  <span class="badge" class:variant>{count > 99 ? '99+' : count}</span>
{/if}

<style>
  .badge {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    background: var(--bg-overlay);
    border-radius: 999px;
    color: var(--text-muted);
    min-width: 20px;
    text-align: center;
  }

  .variant {
    background: linear-gradient(135deg, var(--gold-bright), var(--gold-muted));
    color: #18181B;
  }
</style>
