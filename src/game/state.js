// 存档：创建、迁移、读写、离线结算
import { BUILDINGS, UPGRADES, SHOP, BOSSES } from './data.js';
import { CHAPTERS } from './story.js';
import { offlineEarnings } from './balance.js';

export const SAVE_KEY = 'idle_empire_save';
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

// 兼容旧版存档（js/save.js 写出来的结构），并把脏数据夹到合法范围
export function normalize(raw, now = Date.now()) {
  const s = defaultState(now);
  if (!raw || typeof raw !== 'object') return s;

  s.gold = num(raw.gold);
  s.totalEarned = num(raw.totalEarned, s.gold);
  s.lifetimeEarned = Math.max(num(raw.lifetimeEarned, s.totalEarned), s.totalEarned);
  s.clicks = int(raw.clicks ?? raw.totalClicks);
  s.shards = int(raw.shards ?? raw.prestigeShards);
  s.rebirths = int(raw.rebirths ?? raw.prestigeResets);
  s.kills = int(raw.kills);
  s.startedAt = int(raw.startedAt ?? raw.startTime, now);
  s.lastSeen = int(raw.lastSeen ?? raw.lastSave, now);

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
  s.bossHp = raw.bossHp === null || raw.bossHp === undefined ? null : num(raw.bossHp);

  return s;
}

function indexOfBoss(id) {
  const i = BOSSES.findIndex((b) => b.id === id);
  return i >= 0 ? i : 0;
}

export function load(now = Date.now()) {
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  } catch {
    raw = null;
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
  return { state, offline, migrated: Boolean(raw && raw.version !== VERSION) };
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

export function exportSave(state) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

// 导出成可读的 JSON 文件；导入时同时兼容 JSON 文本与旧的 base64 存档码
export function exportSaveText(state) {
  return JSON.stringify(state, null, 2);
}

export function importSave(text, now = Date.now()) {
  const trimmed = String(text).replace(/^\uFEFF/, '').trim();
  const raw = JSON.parse(trimmed.startsWith('{') ? trimmed : decodeURIComponent(escape(atob(trimmed))));
  return normalize(raw, now);
}
