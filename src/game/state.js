// 存档：创建、迁移、读写、离线结算
import { BUILDINGS, UPGRADES, SHOP, BOSSES } from './data.js';
import { CHAPTERS } from './story.js';
import { offlineEarnings } from './balance.js';

export const SAVE_KEY = 'idle_empire_save';
export const BACKUP_KEY = 'idle_empire_backup';
export const BROKEN_KEY = 'idle_empire_broken';
export const VERSION = 4;

export function defaultState(now = Date.now()) {
  return {
    version: VERSION,
    gold: 0,
    totalEarned: 0,
    lifetimeEarned: 0,
    clicks: 0,
    buildings: {},
    upgrades: [],
    shards: 0,
    rebirths: 0,
    shop: { idle: 0, click: 0, boss: 0, offline: 0 },
    achievements: [],
    bossIndex: 0,
    bossHp: null,
    kills: 0,
    buyMode: 'x1',
    story: { unlocked: [], read: [] },
    startedAt: now,
    lastSeen: now,
  };
}

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};
const int = (v, fallback = 0) => Math.floor(num(v, fallback));

// 时间戳：非数值、0、负数和未来时间都不可信，一律回落到当前时间
const time = (v, now) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n <= now ? Math.floor(n) : now;
};

// 兼容旧版存档（js/save.js 写出来的结构），并把脏数据夹到合法范围
export function normalize(raw, now = Date.now()) {
  const s = defaultState(now);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return s;

  s.gold = num(raw.gold);
  s.totalEarned = num(raw.totalEarned, s.gold);
  s.lifetimeEarned = Math.max(num(raw.lifetimeEarned, s.totalEarned), s.totalEarned);
  s.clicks = int(raw.clicks ?? raw.totalClicks);
  s.shards = int(raw.shards ?? raw.prestigeShards);
  s.rebirths = int(raw.rebirths ?? raw.prestigeResets);
  s.kills = int(raw.kills);
  s.startedAt = time(raw.startedAt ?? raw.startTime, now);
  s.lastSeen = time(raw.lastSeen ?? raw.lastSave, now);

  if (raw.buildings && typeof raw.buildings === 'object') {
    for (const b of BUILDINGS) {
      const count = int(raw.buildings[b.id]);
      if (count > 0) s.buildings[b.id] = count;
    }
  }

  const owned = Array.isArray(raw.upgrades)
    ? raw.upgrades
    : raw.upgrades && typeof raw.upgrades === 'object'
      ? Object.keys(raw.upgrades).filter((k) => raw.upgrades[k])
      : [];
  const valid = new Set(UPGRADES.map((u) => u.id));
  s.upgrades = [...new Set(owned.filter((id) => valid.has(id)))];

  s.achievements = Array.isArray(raw.achievements)
    ? [...new Set(raw.achievements.filter((id) => typeof id === 'string'))]
    : [];

  // 剧情：只保留已知章节，已读必须是已解锁的子集
  const storyRaw = raw.story && typeof raw.story === 'object' ? raw.story : {};
  const validChapter = new Set(CHAPTERS.map((c) => c.id));
  const chapters = (v) =>
    Array.isArray(v) ? [...new Set(v.filter((id) => typeof id === 'string' && validChapter.has(id)))] : [];
  const unlocked = chapters(storyRaw.unlocked);
  s.story = { unlocked, read: chapters(storyRaw.read).filter((id) => unlocked.includes(id)) };

  if (['x1', 'x10', 'max'].includes(raw.buyMode)) s.buyMode = raw.buyMode;

  const oldShop = raw.shop || raw.prestigeShop || {};
  s.shop = {
    idle: int(oldShop.idle ?? oldShop.idleCore),
    click: int(oldShop.click ?? oldShop.clickCore),
    boss: int(oldShop.boss ?? oldShop.bossCore),
    offline: int(oldShop.offline),
  };
  for (const item of SHOP) s.shop[item.id] = Math.min(s.shop[item.id], item.max);

  const idx = int(raw.bossIndex ?? indexOfBoss(raw.currentBoss));
  s.bossIndex = Math.min(idx, BOSSES.length - 1);
  // 血量只认正数且不超过当前 Boss 上限；0、负数、NaN 都当作未开战
  const bossHp = raw.bossHp === null || raw.bossHp === undefined ? NaN : Number(raw.bossHp);
  s.bossHp =
    Number.isFinite(bossHp) && bossHp > 0 ? Math.min(bossHp, BOSSES[s.bossIndex].hp) : null;

  return s;
}

function indexOfBoss(id) {
  const i = BOSSES.findIndex((b) => b.id === id);
  return i >= 0 ? i : 0;
}

export function load(now = Date.now()) {
  let stored = null;
  try {
    stored = localStorage.getItem(SAVE_KEY);
  } catch {
    stored = null;
  }
  let raw = null;
  let corrupt = false;
  if (stored !== null) {
    try {
      raw = JSON.parse(stored);
    } catch {
      raw = null;
    }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      // 存档坏了先原样留一份，避免刷新或重置后彻底丢失
      corrupt = true;
      raw = null;
      saveBrokenSave(stored);
    }
  }
  const state = normalize(raw, now);
  let offline = null;
  const elapsed = (now - state.lastSeen) / 1000;
  if (raw && elapsed > 60) {
    const result = offlineEarnings(state, elapsed);
    if (result.gold > 0) {
      state.gold += result.gold;
      state.totalEarned += result.gold;
      state.lifetimeEarned += result.gold;
      offline = { ...result, rate: result.gold / Math.max(1, result.seconds) };
    }
  }
  state.lastSeen = now;
  return { state, offline, migrated: Boolean(raw && raw.version !== VERSION), corrupt, hasSave: Boolean(raw) };
}

export function save(state, now = Date.now()) {
  state.lastSeen = now;
  state.version = VERSION;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function reset() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

// 有进度的存档才值得留备份；刚开局空档（含自动解锁的序章）不占备份位
export function hasProgress(state) {
  if (!state || typeof state !== 'object') return false;
  if (Number(state.gold) >= 1000 || Number(state.totalEarned) >= 1000) return true;
  if (Number(state.rebirths) > 0 || Number(state.shards) > 0) return true;
  if (state.buildings && Object.values(state.buildings).some((n) => Number(n) > 0)) return true;
  if (Array.isArray(state.upgrades) && state.upgrades.length) return true;
  return Array.isArray(state.achievements) && state.achievements.length > 0;
}

// 覆盖或重置前先存一份上一份进度，误操作还能退回来
export function saveBackup(state, now = Date.now()) {
  try {
    const snapshot = JSON.stringify({
      savedAt: now,
      gold: Number(state?.gold) || 0,
      state,
    });
    localStorage.setItem(BACKUP_KEY, snapshot);
    return true;
  } catch {
    return false;
  }
}

export function loadBackup(now = Date.now()) {
  let payload = null;
  try {
    payload = JSON.parse(localStorage.getItem(BACKUP_KEY) || 'null');
  } catch {
    return null;
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const raw = payload.state && typeof payload.state === 'object' ? payload.state : payload;
  if (!looksLikeSave(raw)) return null;
  const state = normalize(raw, now);
  return { state, savedAt: num(payload.savedAt), gold: num(payload.gold, state.gold) };
}

export function clearBackup() {
  try {
    localStorage.removeItem(BACKUP_KEY);
  } catch {
    /* ignore */
  }
}

// 解析失败的原始存档文本，原样保留供导出排查
export function saveBrokenSave(text) {
  try {
    localStorage.setItem(BROKEN_KEY, String(text));
    return true;
  } catch {
    return false;
  }
}

export function loadBrokenSave() {
  try {
    return localStorage.getItem(BROKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function clearBrokenSave() {
  try {
    localStorage.removeItem(BROKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function exportSave(state) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

// 导出成可读的 JSON 文件；导入时同时兼容 JSON 文本与旧的 base64 存档码
export function exportSaveText(state) {
  return JSON.stringify(state, null, 2);
}

// 至少要有两个核心字段，才认得出是存档；避免选错 JSON 把进度清空
const SAVE_FIELDS = ['gold', 'buildings', 'upgrades', 'achievements', 'story'];
function looksLikeSave(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  return SAVE_FIELDS.filter((key) => key in raw).length >= 2;
}

export function importSave(text, now = Date.now()) {
  const trimmed = String(text).replace(/^\uFEFF/, '').trim();
  // 以 { 或 [ 开头按 JSON 解析，其余当成旧版 base64 存档码
  const json = trimmed.startsWith('{') || trimmed.startsWith('[');
  const raw = JSON.parse(json ? trimmed : decodeURIComponent(escape(atob(trimmed))));
  if (!looksLikeSave(raw)) {
    const error = new Error('not-a-save');
    error.code = 'not-a-save';
    throw error;
  }
  return normalize(raw, now);
}
