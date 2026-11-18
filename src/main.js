import { Game } from './game/engine.js';
import { load, save, reset, exportSave, importSave } from './game/state.js';
import { ACHIEVEMENTS, UPGRADES } from './game/data.js';
import { fmt, fmtInt, fmtTime } from './ui/format.js';
import { VIEWS } from './ui/views.js';
import { buzz, hapticsEnabled, setHaptics } from './ui/haptics.js';
import { readPref, resolveTheme, systemPrefersLight, writePref } from './ui/theme.js';
import { centerOf, floatText } from './ui/floaters.js';
import { hydrateIcons, iconMarkup } from './ui/icons.js';
import * as B from './game/balance.js';

const TABS = [
  ['buildings', 'castle', '建筑'],
  ['upgrades', 'upgrade', '升级'],
  ['bosses', 'skull', 'Boss'],
  ['achievements', 'trophy', '成就'],
  ['prestige', 'rebirth', '轮回'],
];

const $ = (sel) => document.querySelector(sel);
const welcome = $('#welcome');

// 静态 HTML 里的 data-icon 占位统一换成自绘 SVG
hydrateIcons();

const { state, offline, migrated } = load();

// 离线结算弹窗打开时先把成就提示攒起来，关掉再一次性弹，避免被遮挡
const pendingAchievements = [];

function showAchievements(list) {
  if (list.length === 1) {
    const a = list[0];
    toast(`成就达成：${a.name}（${a.reward[0] === 'gold' ? `+${fmt(a.reward[1])} 金币` : `+${a.reward[1]} 碎片`}）`, 'good');
    return;
  }
  const names = list.slice(0, 3).map((a) => a.name).join('、');
  toast(`一次解锁 ${list.length} 个成就：${names}${list.length > 3 ? ' 等' : ''}`, 'good', 4200);
}

function flushAchievements() {
  if (!pendingAchievements.length) return;
  const list = pendingAchievements.splice(0).flat();
  showAchievements(list);
}

const game = new Game(state, {
  onAchievement(list) {
    if (welcome.open) pendingAchievements.push(list);
    else showAchievements(list);
  },
});

/* ---------- 主题（默认跟随系统） ---------- */

const themeMeta = document.querySelector('meta[name="theme-color"]');
const themeInputs = [...document.querySelectorAll('input[name="theme-pref"]')];
let themePref = readPref();

function paintTheme(pref, persist = true) {
  themePref = pref;
  const actual = resolveTheme(pref, systemPrefersLight());
  document.documentElement.dataset.theme = actual;
  document.documentElement.dataset.themePref = pref;
  if (themeMeta) themeMeta.content = actual === 'light' ? '#f4f2ec' : '#0b0f18';
  if (persist) writePref(pref);
  syncThemePicker();
}

function syncThemePicker() {
  for (const input of themeInputs) input.checked = input.value === themePref;
}

paintTheme(themePref, false);

for (const input of themeInputs) {
  input.addEventListener('change', () => {
    if (input.checked) paintTheme(input.value);
  });
}

// 选「跟随系统」时，系统深浅色切换要实时生效
try {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (themePref === 'auto') paintTheme('auto', false);
  });
} catch {
  /* 老浏览器没有 addEventListener，下次打开页面时也会重新解析 */
}

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

tapBtn.addEventListener('click', (e) => {
  const { perClick } = B.clickPower(game.s);
  game.tap();
  tapBtn.classList.remove('pressed');
  void tapBtn.offsetWidth;
  tapBtn.classList.add('pressed');
  buzz(6);
  const at = e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : centerOf(tapBtn);
  floatText(`+${fmt(perClick)}`, at.x, at.y - 10, 'gold');
});

/* ---------- 标签页 ---------- */

const viewHost = $('#view');
const tabbar = $('#tabbar');
let activeTab = 'buildings';
let currentView = null;
const badges = {};

// 视图内部派发的 toast 事件（Boss 击杀、转生、商店升级）在这里统一接住
viewHost.addEventListener('toast', (e) => {
  if (e.detail?.text) toast(e.detail.text, e.detail.kind || '', e.detail.ms);
});

for (const [id, iconName, label] of TABS) {
  const btn = document.createElement('button');
  btn.className = 'tab';
  btn.dataset.tab = id;
  btn.setAttribute('role', 'tab');
  btn.setAttribute('aria-selected', 'false');
  btn.innerHTML = `<span class="tab-icon" aria-hidden="true">${iconMarkup(iconName)}</span><span class="tab-label">${label}</span>`;
  const badge = document.createElement('span');
  badge.className = 'tab-badge';
  badge.hidden = true;
  btn.append(badge);
  badges[id] = badge;
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

function setBadge(id, text) {
  const node = badges[id];
  if (!node) return;
  node.textContent = text;
  node.hidden = !text;
}

function updateBadges() {
  let affordable = 0;
  for (const u of UPGRADES) {
    if (game.upgradeAvailable(u) === 'ok' && game.s.gold >= u.cost) affordable++;
  }
  setBadge('upgrades', affordable > 0 ? (affordable > 9 ? '9+' : String(affordable)) : '');
  setBadge('prestige', game.prestigeGain() > 0 ? '!' : '');
}

/* ---------- 主循环 ---------- */

let last = performance.now();
let badgeTimer = 0;
function frame(now) {
  const dt = Math.min(0.5, (now - last) / 1000);
  last = now;
  game.tick(dt);

  goldEl.textContent = fmt(game.s.gold);
  gpsEl.textContent = `+${fmt(B.totalPerSecond(game.s))}/秒`;
  shardsEl.textContent = fmtInt(game.s.shards);
  tapGainEl.textContent = fmt(B.clickPower(game.s).perClick);
  if (currentView) currentView.update();

  badgeTimer += dt;
  if (badgeTimer >= 0.25) {
    badgeTimer = 0;
    updateBadges();
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- 自动存档 ---------- */

function persist() {
  if (save(game.s)) return true;
  toast('存档失败：浏览器存储不可用', 'bad');
  return false;
}

let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    hiddenAt = Date.now();
    persist();
  } else if (hiddenAt) {
    const seconds = (Date.now() - hiddenAt) / 1000;
    hiddenAt = 0;
    if (seconds > 5) settle(seconds, '离开');
  }
});
window.addEventListener('pagehide', persist);
document.addEventListener('freeze', persist);

// 切到后台期间 rAF 不跑，回到前台时补算这段时间的产出
function settle(seconds, label) {
  const result = B.offlineEarnings(game.s, seconds);
  if (result.gold <= 0) return;
  game.addGold(result.gold);
  persist(); // 立刻落盘，避免刚回来又刷新时重复结算
  if (seconds >= 300) {
    showWelcome({
      seconds: result.seconds,
      gold: result.gold,
      capped: seconds > result.seconds,
      title: label === '离线' ? '离线收益' : '欢迎回来',
    });
  }
  game.checkAchievements(); // 弹窗已开时成就提示会先入队，关掉后再弹
  if (seconds >= 30 && seconds < 300) {
    toast(`${label} ${fmtTime(result.seconds)}，获得 ${fmt(result.gold)} 金币`, 'good');
  }
}

/* ---------- 离线结算弹窗 ---------- */

function showWelcome({ seconds, gold, capped, title }) {
  $('#w-title').textContent = title;
  $('#w-time').textContent = `你离开了 ${fmtTime(seconds)}${capped ? '（离线收益按 8 小时封顶）' : ''}`;
  $('#w-gold').textContent = fmt(gold);
  $('#w-rate').textContent = `按产能 ${fmt(B.totalPerSecond(game.s))}/秒 的 ${Math.round(B.offlineRate(game.s) * 100)}% 结算${B.offlineRate(game.s) < 1 ? '，升级「离线契约」能提高比例' : ''}`;
  if (!welcome.open) welcome.showModal();
}
$('#w-ok').addEventListener('click', () => welcome.close());
welcome.addEventListener('close', flushAchievements);

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
  $('#s-playtime').textContent = fmtTime((Date.now() - game.s.startedAt) / 1000);
  $('#s-ach').textContent = `${game.s.achievements.length} / ${ACHIEVEMENTS.length}`;
  $('#s-vibrate').checked = hapticsEnabled();
  syncThemePicker();
}

$('#s-vibrate').addEventListener('change', (e) => {
  setHaptics(e.target.checked);
  buzz(12);
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
    game.checkAchievements();
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
  if (e.target.matches('input, textarea') || dialog.open || welcome.open) return;
  const map = { 1: 'buildings', 2: 'upgrades', 3: 'bosses', 4: 'achievements', 5: 'prestige' };
  if (map[e.key]) {
    switchTab(map[e.key]);
    e.preventDefault();
  } else if (e.code === 'Space') {
    const { perClick } = B.clickPower(game.s);
    game.tap();
    buzz(6);
    const at = centerOf(tapBtn);
    floatText(`+${fmt(perClick)}`, at.x, at.y - 10, 'gold');
    e.preventDefault();
  }
});

/* ---------- 离线 / 迁移 / 首次进入 ---------- */

if (offline) {
  showWelcome({
    seconds: offline.seconds,
    gold: offline.gold,
    capped: offline.seconds >= B.OFFLINE_CAP_SECONDS,
    title: '离线收益',
  });
} else if (migrated) {
  toast('已把旧版存档迁移到新版本', 'good');
} else if (!Object.keys(game.s.buildings).length && game.s.clicks === 0) {
  toast('点上面的金色条开始，先攒够 10 金币买第一座金矿', '');
}

// 页面关闭前再存一次，避免丢最后 15 秒
window.addEventListener('beforeunload', persist);

/* ---------- PWA ---------- */

const swCapable =
  location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
if ('serviceWorker' in navigator && swCapable) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
