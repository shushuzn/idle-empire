<script>
  let { onClose } = $props();

  function getPreviewData() {
    if (!window.G) return null;
    const gain = Math.floor(Math.sqrt((G.totalEarned || 1) / 1e6));
    const resets = [
      { icon: '💰', label: '当前金币', value: Math.floor(G.gold || 0).toLocaleString() },
      { icon: '💎', label: '累计收益', value: Math.floor(G.totalEarned || 0).toLocaleString() },
      { icon: '🏗️', label: '所有建筑', value: Object.values(G.buildings || {}).reduce((a, b) => a + b, 0) + ' 栋' },
      { icon: '⚡', label: '所有升级', value: Object.keys(G.upgrades || {}).length + ' 个' },
      { icon: '👹', label: 'Boss进度', value: (G.bossesDefeated || 0) + ' 击杀' },
      { icon: '👆', label: '总点击数', value: (G.totalClicks || 0).toLocaleString() },
    ];
    const keeps = [
      { icon: '🔮', label: '王朝碎片', value: (G.prestigeShards || 0) + ' (+' + gain + ')' },
      { icon: '👑', label: '王朝等级', value: 'Lv ' + (G.dynastyLevel || 1) },
      { icon: '🌟', label: '王朝天赋', value: JSON.stringify(G.dynastyTalents || {}) },
      { icon: '🛒', label: '声望商店', value: JSON.stringify(G.prestigeShop || {}) },
      { icon: '🏆', label: '成就', value: Object.keys(G.achievements || {}).length + ' 个' },
      { icon: '💠', label: '神器', value: Object.keys(G.artifacts || {}).length + ' 个' },
    ];
    return { gain, resets, keeps };
  }

  let data = $state(null);
  data = getPreviewData();

  function confirm() {
    window.executePrestige?.();
    onClose?.();
  }
</script>

<div class="modal-overlay" onclick={onClose} role="presentation">
  <div class="modal" onclick={(e) => e.stopPropagation()}>
    <div class="modal-header">
      <span class="modal-title">⚜️ 王朝重铸预览</span>
      <button class="close-btn" onclick={onClose}>✕</button>
    </div>

    {#if data}
      <div class="gain-banner">
        重铸将获得 <strong>+{data.gain}</strong> 王朝碎片
      </div>

      <div class="columns">
        <div class="col resets">
          <div class="col-title reset-title">❌ 将被重置</div>
          {#each data.resets as item}
            <div class="row">
              <span class="row-icon">{item.icon}</span>
              <span class="row-label">{item.label}</span>
              <span class="row-value reset-val">{item.value}</span>
            </div>
          {/each}
        </div>
        <div class="col keeps">
          <div class="col-title keep-title">✅ 永久保留</div>
          {#each data.keeps as item}
            <div class="row">
              <span class="row-icon">{item.icon}</span>
              <span class="row-label">{item.label}</span>
              <span class="row-value keep-val">{item.value}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="actions">
      <button class="btn-cancel" onclick={onClose}>取消</button>
      <button class="btn-confirm" onclick={confirm}>确认重铸</button>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5000;
  }

  .modal {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 16px;
    padding: 24px;
    width: 560px;
    max-width: 95vw;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .modal-title {
    font-size: 18px;
    font-weight: 800;
    color: var(--gold-bright);
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 18px;
  }

  .gain-banner {
    background: linear-gradient(135deg, rgba(139,111,204,0.2), rgba(139,111,204,0.1));
    border: 1px solid rgba(139,111,204,0.4);
    border-radius: 10px;
    padding: 12px 16px;
    text-align: center;
    font-size: 15px;
    color: var(--text-base);
    margin-bottom: 20px;
  }

  .gain-banner strong {
    color: var(--amethyst);
    font-size: 18px;
  }

  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }

  .col-title {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .reset-title { color: var(--crimson); }
  .keep-title { color: var(--emerald); }

  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 0;
    font-size: 13px;
  }

  .row-icon { font-size: 14px; width: 20px; text-align: center; }
  .row-label { flex: 1; color: var(--text-muted); }
  .row-value { font-weight: 600; font-family: monospace; }

  .reset-val { color: var(--crimson); }
  .keep-val { color: var(--emerald); }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .btn-cancel {
    padding: 12px;
    border: 1px solid var(--border-default);
    background: var(--bg-elevated);
    color: var(--text-muted);
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-confirm {
    padding: 12px;
    border: none;
    background: linear-gradient(135deg, var(--amethyst), #6B4FC0);
    color: #fff;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(139,111,204,0.3);
  }

  .btn-confirm:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(139,111,204,0.4);
  }
</style>
