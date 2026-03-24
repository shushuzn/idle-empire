<script>
  let { open = false, title = '', onclose, children } = $props();

  function handleKeydown(e) {
    if (e.key === 'Escape' && open) onclose?.();
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onclose?.();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="modal-backdrop" onclick={handleBackdrop} role="dialog">
    <div class="modal-panel">
      <div class="modal-header">
        <h3>{title}</h3>
        <button class="close-btn" onclick={onclose}>✕</button>
      </div>
      <div class="modal-body">
        {@render children()}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  .modal-panel {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 16px;
    width: 420px;
    max-width: 90vw;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
    animation: scaleIn 0.2s ease;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 20px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .modal-header h3 {
    font-size: 18px;
    font-weight: 700;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    background: var(--bg-elevated);
    color: var(--text-bright);
  }

  .modal-body {
    padding: 20px;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>
