// 振动反馈：设置项独立存储，避免污染存档
const KEY = 'idle_empire_vibrate';

function read() {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

let enabled = read();

export function hapticsEnabled() {
  return enabled;
}

export function setHaptics(value) {
  enabled = Boolean(value);
  try {
    localStorage.setItem(KEY, enabled ? 'on' : 'off');
  } catch {
    /* 隐私模式下写不了，只在本次会话生效 */
  }
}

export function buzz(ms = 8) {
  if (enabled) navigator.vibrate?.(ms);
}
