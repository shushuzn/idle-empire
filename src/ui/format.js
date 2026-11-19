const UNITS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd'];

// 1.50 → 1.5、2.00 → 2；没有小数点时原样返回，避免把 20 削成 2
function trimZeros(text) {
  return text.includes('.') ? text.replace(/\.?0+$/, '') : text;
}

// 1234 → 1.23K；1.5 → 1.5；0 → 0
export function fmt(value, digits = 2) {
  const n = Number(value) || 0;
  if (!Number.isFinite(n)) return '∞';
  if (n < 0) return '-' + fmt(-n, digits);
  if (n < 1000) {
    const rounded = Math.floor(n * 100) / 100;
    const text = trimZeros(rounded.toFixed(n < 10 ? digits : 0));
    // 999.99 四舍五入后会变成没有单位的 1000，直接进位成 1K
    return text === '1000' ? '1K' : text;
  }
  let tier = 0;
  let v = n;
  while (v >= 1000 && tier < UNITS.length - 1) {
    v /= 1000;
    tier++;
  }
  let rounded = Number(v.toFixed(v < 10 ? digits : 1));
  // 999.96K 这类值四舍五入后到 1000，要再升一级单位，避免出现 1000K
  if (rounded >= 1000 && tier < UNITS.length - 1) {
    rounded /= 1000;
    tier++;
  }
  return `${trimZeros(rounded.toFixed(rounded < 10 ? digits : 1))}${UNITS[tier]}`;
}

export function fmtInt(n) {
  return Math.floor(n).toLocaleString('zh-CN');
}

export function fmtTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s} 秒`;
  if (s < 3600) return `${Math.floor(s / 60)} 分 ${s % 60} 秒`;
  if (s < 86400) return `${Math.floor(s / 3600)} 小时 ${Math.floor((s % 3600) / 60)} 分`;
  return `${Math.floor(s / 86400)} 天 ${Math.floor((s % 86400) / 3600)} 小时`;
}

export function pct(ratio) {
  return `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`;
}
