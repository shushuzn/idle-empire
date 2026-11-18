import { Game } from './game/engine.js';
import { load, save, reset, exportSave, importSave, THEME_KEY } from './game/state.js';
import { ACHIEVEMENTS } from './game/data.js';
import { fmt, fmtInt, fmtTime } from './ui/format.js';
import { VIEWS } from './ui/views.js';
import * as B from './game/balance.js';

const TABS = [
  ['buildings', '🏗️', '建筑'],
  ['upgrades', '⬆️', '升级'],
  ['bosses', '⚔️', 'Boss'],
  ['achievements', '🏆', '成就'],
  ['prestige', '🔄', '轮回'],
];

const $ = (sel) => document.querySelector(sel);

const { state, offline, migrated } = load();
const game = new Game(state, {
  onAchievement(list) {
    if (list.length === 1) {
      const a = list[0];
      toast(`${a.icon} 成就达成：${a.name}（${a.reward[0] === 'gold' ? `+${fmt(a.reward[1])} 金币` : `+${a.reward[1]} 碎片`}）`, 'good');
      return;
    }
    const names = list.slice(0, 3).map((a) => a.name).join('、');
    toast(`🏆 一次解锁 ${list.length} 个成就：${names}${list.length > 3 ? ' 等' : ''}`, 'good', 4200);
  },
});

/* ---------- 主题 ---------- */

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
}

applyTheme(localStorage.getItem(THEME_KEY) || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));

/* ---------- 提示条 ---------- */

const toastHost = $('#toasts');
function toast(text, kind = '', ms = 3000) {
  while (toastHost.children.length >= 3) toastHost.firstElementChild.remove();
  const node = document.createElement('div');
  node.className = `toast ${kind}`.trim();
  node.textContent = text;
  toastHost.append(node);
  requestAnimationFrame(() => node.classList.add('show'));
  setTimeout(() => {
    node.classList.remove('show');
    setTimeout(() => node.remove(), 250);
  }, ms);
}

/* ---------- 顶部资源与点击 ---------- */

const goldEl = $('#gold');
const gpsEl = $('#gps');
const shardsEl = $('#shards');
const tapGainEl = $('#tap-gain');
const tapBtn = $('#tap');

tapBtn.addEventListener('click', () => {
  game.tap();
  tapBtn.classList.remove('pressed');
  void tapBtn.offsetWidth;
  tapBtn.classList.add('pressed');
});

/* ---------- 标签页 ---------- */

const viewHost = $('#view');
const tabbar = $('#tabbar');
let activeTab = 'buildings';
let currentView = null;

for (const [id, icon, label] of TABS) {
  const btn = document.createElement('button');
  btn.className = 'tab';
  btn.dataset.tab = id;
  btn.innerHTML = `<span class="tab-icon" aria-hidden="true">${icon}</span><span class="tab-label">${label}</span>`;
  btn.addEventListener('click', () => switchTab(id));
  tabbar.append(btn);
}

function switchTab(id) {
  if (!VIEWS[id]) return;
  activeTab = id;
  for (const b of tabbar.children) {
    const on = b.dataset.tab === id;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', String(on));
  }
  viewHost.replaceChildren();
  currentView = VIEWS[id](game);
  viewHost.append(currentView.el);
  currentView.update();
  viewHost.scrollTop = 0;
}

switchTab('buildings');

/* ---------- 主循环 ---------- */

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.5, (now - last) / 1000);
  last = now;
  game.tick(dt);

  goldEl.textContent = fmt(game.s.gold);
  gpsEl.textContent = `+${fmt(B.totalPerSecond(game.s))}/秒`;
  shardsEl.textContent = fmtInt(game.s.shards);
  tapGainEl.textContent = fmt(B.clickPower(game.s).perClick);
  if (currentView) currentView.update();

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- 自动存档 ---------- */

function persist() {
  if (save(game.s)) return true;
  toast('存档失败：浏览器存储不可用', 'bad');
  return false;
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') persist();
});
window.addEventListener('pagehide', persist);

/* ---------- 设置面板 ---------- */

const dialog = $('#settings');
$('#settings-btn').addEventListener('click', () => {
  syncSettings();
  dialog.showModal();
});

function syncSettings() {
  $('#s-gold').textContent = fmt(game.s.gold);
  $('#s-total').textContent = fmt(game.s.totalEarned);
  $('#s-life').textContent = fmt(game.s.lifetimeEarned);
  $('#s-clicks').textContent = fmtInt(game.s.clicks);
  $('#s-buildings').textContent = fmtInt(Object.values(game.s.buildings).reduce((a, b) => a + b, 0));
  $('#s-kills').textContent = fmtInt(game.s.kills);
  $('#s-rebirths').textContent = fmtInt(game.s.rebirths);
  $('#s-shards').textContent = fmtInt(game.s.shards);
  $('#s-kills').textContent = fmtInt(game.s.kills);
  $('#s-playtime').textContent = fmtTime((Date.now() - game.s.startedAt) / 1000);
  $('#s-ach').textContent = `${game.s.achievements.length} / ${ACHIEVEMENTS.length}`;
  $('#s-theme').checked = document.documentElement.dataset.theme === 'light';
}

$('#s-theme').addEventListener('change', (e) => {
  applyTheme(e.target.checked ? 'light' : 'dark');
});
$('#s-close').addEventListener('click', () => dialog.close());
$('#s-save').addEventListener('click', () => {
  toast(persist() ? '已存档' : '存档失败', 'good');
});
$('#s-export').addEventListener('click', () => {
  const text = exportSave(game.s);
  navigator.clipboard?.writeText(text).then(
    () => toast('存档已复制到剪贴板', 'good'),
    () => window.prompt('复制下面的存档文本：', text),
  );
});
$('#s-import').addEventListener('click', () => {
  const text = window.prompt('粘贴存档文本：');
  if (!text) return;
  try {
    const imported = importSave(text);
    Object.keys(game.s).forEach((k) => delete game.s[k]);
    Object.assign(game.s, imported);
    persist();
    switchTab(activeTab);
    toast('存档已导入', 'good');
  } catch {
    toast('存档格式不对，没能导入', 'bad');
  }
});
$('#s-reset').addEventListener('click', () => {
  if (!confirm('确定重置？所有进度会清空，且不能撤销。')) return;
  reset();
  Object.assign(game.s, {
    gold: 0, totalEarned: 0, lifetimeEarned: 0, clicks: 0, buildings: {}, upgrades: [],
    shards: 0, rebirths: 0, shop: { idle: 0, click: 0, boss: 0, offline: 0 },
    achievements: [], bossIndex: 0, bossHp: null, kills: 0, buyMode: 'x1', startedAt: Date.now(),
  });
  persist();
  switchTab('buildings');
  dialog.close();
  toast('已重置', 'good');
});

/* ---------- 键盘快捷键 ---------- */

window.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea')) return;
  const map = { '1': 'buildings', '2': 'upgrades', '3': 'bosses', '4': 'achievements', '5': 'prestige' };
  if (map[e.key]) {
    switchTab(map[e.key]);
    e.preventDefault();
  } else if (e.code === 'Space') {
    game.tap();
    e.preventDefault();
  }
});

/* ---------- 首次进入 / 离线提示 ---------- */

if (offline) {
  toast(`离线 ${fmtTime(offline.seconds)}，按 ${Math.round(B.offlineRate(game.s) * 100)}% 结算，获得 ${fmt(offline.gold)} 金币`, 'good');
} else if (migrated) {
  toast('已把旧版存档迁移到新版本', 'good');
} else if (!Object.keys(game.s.buildings).length && game.s.clicks === 0) {
  toast('点上面的金色条开始，先攒够 10 金币买第一座金矿', '');
}

// 页面关闭前再存一次，避免丢最后 15 秒
window.addEventListener('beforeunload', persist);
