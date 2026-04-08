/**
 * Save Export/Import - Attached to window for Settings.svelte buttons
 */

window.exportSave = function(slot = 0) {
  try {
    const saveData = {
      version: 1,
      timestamp: Date.now(),
      slot,
      gameState: window.G || {}
    };
    const json = JSON.stringify(saveData);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    navigator.clipboard.writeText(base64).then(() => {
      window.showToast?.('存档已复制到剪贴板！', 'success', '📋');
    }).catch(() => {
      // Fallback: create download
      const blob = new Blob([base64], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `idle-empire-save-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      window.showToast?.('存档已下载！', 'success', '📋');
    });
  } catch (err) {
    window.showToast?.('导出失败: ' + err.message, 'error', '❌');
  }
};

window.importSave = function() {
  const base64 = prompt('请粘贴存档内容：');
  if (!base64) return;

  try {
    const json = decodeURIComponent(escape(atob(base64.trim())));
    const saveData = JSON.parse(json);

    if (!saveData.gameState) {
      throw new Error('无效存档格式');
    }

    // Merge save data into window.G
    Object.assign(window.G, saveData.gameState);
    window.showToast?.('存档导入成功！', 'success', '✅');

    // Trigger sync refresh
    window.dispatchEvent(new Event('gameStateImported'));
  } catch (err) {
    window.showToast?.('导入失败: ' + err.message, 'error', '❌');
  }
};

window.getSaveSlots = function() {
  const slots = [];
  for (let i = 0; i < 3; i++) {
    const key = `idle_empire_save_${i}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const save = JSON.parse(raw);
        slots.push({
          slot: i,
          name: save.meta?.name || `存档 ${i + 1}`,
          meta: save.meta
        });
      } catch {
        slots.push({ slot: i, name: `存档 ${i + 1}`, meta: null });
      }
    } else {
      slots.push({ slot: i, name: `存档 ${i + 1}`, meta: null });
    }
  }
  return slots;
};

window.switchSaveSlot = function(slot) {
  // Save current to localStorage if needed, then switch
  window.G._currentSlot = slot;
  window.showToast?.(`已切换到存档 ${slot + 1}`, 'info', '💾');
};
