// 主题偏好：auto 跟随系统，light/dark 是用户手动覆盖
export const THEME_KEY = 'idle_empire_theme';
export const THEME_PREFS = ['auto', 'light', 'dark'];

export function normalizePref(value) {
  return THEME_PREFS.includes(value) ? value : 'auto';
}

// systemLight: 系统当前是否是浅色
export function resolveTheme(pref, systemLight) {
  const p = normalizePref(pref);
  if (p === 'auto') return systemLight ? 'light' : 'dark';
  return p;
}

export function systemPrefersLight() {
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches;
  } catch {
    return false;
  }
}

export function readPref() {
  try {
    return normalizePref(localStorage.getItem(THEME_KEY));
  } catch {
    return 'auto';
  }
}

export function writePref(pref) {
  try {
    localStorage.setItem(THEME_KEY, normalizePref(pref));
  } catch {
    /* 隐私模式下只在本次会话生效 */
  }
}
