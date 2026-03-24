<script>
  import { onMount } from 'svelte';

  let toasts = $state([]);

  onMount(() => {
    window.showToast = (msg, type = 'info', icon = '💡') => {
      const id = Date.now();
      toasts = [...toasts, { id, msg, type, icon }];
      setTimeout(() => {
        toasts = toasts.filter(t => t.id !== id);
      }, 4000);
    };
  });
</script>

<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <div class="toast {toast.type}">
      <span class="toast-icon">{toast.icon}</span>
      <span class="toast-msg">{toast.msg}</span>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 9999;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    animation: slideIn 0.3s ease;
    min-width: 260px;
    pointer-events: auto;
  }

  .toast.success { border-left: 4px solid var(--emerald); }
  .toast.warning { border-left: 4px solid var(--crimson); }
  .toast.info { border-left: 4px solid var(--sapphire); }

  .toast-icon { font-size: 20px; }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(40px); }
    to { opacity: 1; transform: translateX(0); }
  }
</style>
