<script>
  import Modal from '../shared/Modal.svelte';

  let { open = false, onclose } = $props();

  let quality = $state('high');
  let particles = $state(true);
  let scanlines = $state(true);
  let autoSave = $state(true);

  function onQualityChange(v) {
    window.setGraphicsQuality?.(v);
  }
  function onParticlesChange(v) {
    window.toggleParticles?.(v);
  }
  function onScanlinesChange(v) {
    window.toggleScanlines?.(v);
  }
</script>

<Modal {open} title="游戏设置" {onclose}>
  <div class="settings-body">
    <div class="settings-group">
      <h4>显示</h4>
      <label>
        <span>画质</span>
        <select value={quality} onchange={(e) => onQualityChange(e.target.value)}>
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
          <option value="ultra">极高</option>
        </select>
      </label>
      <label class="toggle">
        <span>粒子效果</span>
        <input type="checkbox" checked={particles} onchange={(e) => onParticlesChange(e.target.checked)} />
      </label>
      <label class="toggle">
        <span>扫描线</span>
        <input type="checkbox" checked={scanlines} onchange={(e) => onScanlinesChange(e.target.checked)} />
      </label>
    </div>
    <div class="settings-group">
      <h4>游戏</h4>
      <label class="toggle">
        <span>自动保存</span>
        <input type="checkbox" bind:checked={autoSave} />
      </label>
      <button class="btn-outline" onclick={() => window.exportSave?.()}>📤 导出存档</button>
      <button class="btn-outline" onclick={() => window.importSave?.()}>📥 导入存档</button>
    </div>
  </div>
</Modal>

<style>
  .settings-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .settings-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .settings-group h4 {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: var(--bg-elevated);
    border-radius: 8px;
    font-size: 14px;
  }

  label.toggle {
    cursor: pointer;
  }

  select {
    padding: 4px 10px;
    background: var(--bg-overlay);
    border: 1px solid var(--border-default);
    border-radius: 6px;
    color: var(--text-base);
    font-size: 13px;
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--gold-bright);
    cursor: pointer;
  }

  .btn-outline {
    padding: 10px 12px;
    background: transparent;
    border: 1px solid var(--border-default);
    border-radius: 8px;
    color: var(--text-base);
    font-size: 13px;
    cursor: pointer;
    text-align: center;
    transition: all 0.15s ease;
  }

  .btn-outline:hover {
    background: var(--bg-elevated);
    border-color: var(--gold-bright);
    color: var(--gold-bright);
  }
</style>
