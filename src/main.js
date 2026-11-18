import { Game } from './game/engine.js';
import { load, save, reset, exportSave, importSave, defaultState } from './game/state.js';
import { ACHIEVEMENTS, UPGRADES } from './game/data.js';
import { CHAPTERS } from './game/story.js';
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
  ['story', 'book', '剧情'],
];

const $ = (sel) => document.querySelector(sel);
const welcome = $('#welcome');

// 静态 HTML 里的 data-icon 占位统一换成自绘 SVG
hydrateIcons();

const { state, offline, migrated } = load();

// 立刻落盘：首次进入就建立存档；离线结算后也避免刷新一次重复领取
save(state);

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

function showStories(list) {
  if (!list.length) return;
  const text = list.length === 1 ? `新档案：${list[0].title}` : `一次解锁 ${list.length} 篇档案`;
  toast(text, '', 5000, { label: '阅读', onClick: () => switchTab('story') });
}

// 离线弹窗开着时先攒着，关掉再提示
const pendingStories = [];
function flushStories() {
  if (!pendingStories.length) return;
  showStories(pendingStories.splice(0).flat());
}

const game = new Game(state, {
  onAchievement(list) {
    if (welcome.open) pendingAchievements.push(list);
    else showAchievements(list);
  },
  onStory(list) {
    if (welcome.open) {
      pendingStories.push(list);
    } else if (activeTab === 'story') {
      // 正停在剧情页，新章节直接算已读，不弹提示
      game.markStoryRead();
    } else {
      showStories(list);
    }
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

// action 形如 { label, onClick }，用于「新版本已就绪」这类可操作的提示
function toast(text, kind = '', ms = 3000, action = null) {
  while (toastHost.children.length >= 3) toastHost.firstElementChild.remove();
  const node = document.createElement('div');
  node.className = `toast ${kind}`.trim();
  const message = document.createElement('span');
  message.className = 'toast-text';
  message.textContent = text;
  node.append(message);
  if (action) {
    node.classList.add('has-action');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'toast-action';
    button.textContent = action.label;
    button.addEventListener('click', () => {
      node.remove();
      action.onClick();
    });
    node.append(button);
  }
  toastHost.append(node);
  requestAnimationFrame(() => node.classList.add('show'));
  setTimeout(() => {
    node.classList.remove('show');
    setTimeout(() => node.remove(), 250);
  }, action ? Math.max(ms, 12000) : ms);
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
const TAB_LABELS = Object.fromEntries(TABS.map(([id, , label]) => [id, label]));
let activeTab = 'buildings';
let currentView = null;
const badges = {};
const scrollMemo = {}; // 每个标签页记住自己的滚动位置

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
  btn.setAttribute('aria-controls', 'view');
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
  if (currentView) scrollMemo[activeTab] = viewHost.scrollTop;
  activeTab = id;
  for (const b of tabbar.children) {
    const on = b.dataset.tab === id;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  }
  viewHost.setAttribute('aria-label', TAB_LABELS[id] || '');
  viewHost.replaceChildren();
  currentView = VIEWS[id](game);
  viewHost.append(currentView.el);
  currentView.update();
  // 打开剧情页即视为读过，徽章清零；页面里本次仍保留「新」标记
  if (id === 'story' && game.unreadStory().length) {
    game.markStoryRead();
    persist(true);
  }
  updateBadges();
  const restore = scrollMemo[id] || 0;
  viewHost.scrollTop = restore;
  // 刚替换 DOM 时高度还没算出来，下一帧再对齐一次
  if (restore) requestAnimationFrame(() => { viewHost.scrollTop = restore; });
}

switchTab('buildings');

// 标签栏按 ARIA tabs 模式做 roving tabindex，左右方向键切换
tabbar.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  e.preventDefault();
  const ids = TABS.map(([id]) => id);
  const step = e.key === 'ArrowRight' ? 1 : -1;
  const next = ids[(ids.indexOf(activeTab) + step + ids.length) % ids.length];
  switchTab(next);
  const btn = tabbar.querySelector(`[data-tab="${next}"]`);
  if (btn) btn.focus();
});

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
  const unread = game.unreadStory().length;
  setBadge('story', unread > 0 ? (unread > 9 ? '9+' : String(unread)) : '');
}

/* ---------- 主循环 ---------- */

let last = performance.now();
let badgeTimer = 0;
let saveTimer = 0;
const AUTOSAVE_SECONDS = 20;

function frame(now) {
  const dt = Math.min(0.5, (now - last) / 1000);
  last = now;
  game.tick(dt);

  // 定时落盘：崩溃或强杀进程时最多丢 20 秒
  saveTimer += dt;
  if (saveTimer >= AUTOSAVE_SECONDS) {
    saveTimer = 0;
    persist(true);
  }

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

function persist(silent = false) {
  if (save(game.s)) return true;
  if (!silent) toast('存档失败：浏览器存储不可用', 'bad');
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
    if (seconds > 1) settle(seconds, '离开');
  }
});
window.addEventListener('pagehide', () => persist());
document.addEventListener('freeze', () => persist());

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
welcome.addEventListener('close', () => {
  flushStories();
  flushAchievements();
});

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
  $('#s-story').textContent = `${game.s.story.unlocked.length} / ${CHAPTERS.length}`;
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
  Object.assign(game.s, defaultState());
  persist();
  switchTab('buildings');
  dialog.close();
  toast('已重置', 'good');
});

/* ---------- 键盘快捷键 ---------- */

window.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea') || dialog.open || welcome.open) return;
  const map = { 1: 'buildings', 2: 'upgrades', 3: 'bosses', 4: 'achievements', 5: 'prestige', 6: 'story' };
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
window.addEventListener('beforeunload', () => persist());

/* ---------- PWA ---------- */

const swCapable =
  location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
if ('serviceWorker' in navigator && swCapable) {
  window.addEventListener('load', async () => {
    let updateNotified = false;
    const notifyUpdate = () => {
      // 首次安装时没有旧的 controller，不需要提示
      if (updateNotified || !navigator.serviceWorker.controller) return;
      updateNotified = true;
      toast('新版本已就绪', 'good', 12000, { label: '刷新', onClick: () => location.reload() });
    };

    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      if (reg.waiting) notifyUpdate();
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed') notifyUpdate();
        });
      });
      // 回到前台时主动检查一次，避免长期挂着页面错过更新
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    } catch {
      /* 浏览器不支持或离线时忽略 */
    }
  });
}
