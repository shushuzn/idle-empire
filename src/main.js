import { Game } from './game/engine.js';
import { load, save, reset, exportSave, exportSaveText, importSave, defaultState } from './game/state.js';
import { ACHIEVEMENTS, UPGRADES } from './game/data.js';
import { CHAPTERS } from './game/story.js';
import { fmt, fmtInt, fmtTime } from './ui/format.js';
import { VIEWS } from './ui/views.js';
import { buzz, hapticsEnabled, setHaptics } from './ui/haptics.js';
import { readPref, resolveTheme, systemPrefersLight, writePref } from './ui/theme.js';
import { centerOf, floatText } from './ui/floaters.js';
import { hydrateIcons, iconMarkup } from './ui/icons.js';
import { buildDiagnostics } from './ui/feedback.js';
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
let statusTimer = 0;
let deferredToast = null;

// 设置弹窗是模态的，toast 会被压在下层，改在面板里显示一行状态
function showSettingsStatus(text, kind = '') {
  const node = $('#s-status');
  if (!node) return;
  clearTimeout(statusTimer);
  node.textContent = text;
  node.className = `settings-status ${kind}`.trim();
  if (text) statusTimer = setTimeout(() => showSettingsStatus(''), 6000);
}

// action 形如 { label, onClick }，用于「新版本已就绪」这类可操作的提示
function toast(text, kind = '', ms = 3000, action = null) {
  if (document.getElementById('settings')?.open) {
    // 带操作的提示先在设置里留一句，关掉弹窗后再弹出来，避免按钮被挡住
    if (action) {
      deferredToast = { text, kind, ms, action };
      showSettingsStatus(`${text}（关闭设置后可查看）`, kind);
    } else {
      showSettingsStatus(text, kind);
    }
    return;
  }
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
  }, action ? Math.max(ms, 8000) : ms);
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
const TAB_IDS = TABS.map(([id]) => id);
const TAB_ID_SET = new Set(TAB_IDS);
let activeTab = 'buildings';
let currentView = null;
const badges = {};
const scrollMemo = {}; // 每个标签页记住自己的滚动位置

// 地址栏带上 #story 这类锚点：刷新、收藏、PWA 快捷方式都能直达对应标签
function tabFromHash() {
  const id = location.hash.replace(/^#\/?/, '');
  return TAB_ID_SET.has(id) ? id : null;
}

function writeTabHash(id) {
  try {
    history.replaceState(null, '', `#${id}`);
  } catch {
    /* 个别浏览器在 file:// 下不让改地址，忽略即可 */
  }
}

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

function switchTab(id, { writeHash = true } = {}) {
  if (!VIEWS[id]) return;
  if (currentView) scrollMemo[activeTab] = viewHost.scrollTop;
  activeTab = id;
  if (writeHash) writeTabHash(id);
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

switchTab(tabFromHash() || 'buildings', { writeHash: false });

// 手动改地址栏锚点，或从 PWA 快捷方式跳进来时同步标签
window.addEventListener('hashchange', () => {
  const id = tabFromHash();
  if (id && id !== activeTab) switchTab(id, { writeHash: false });
});

// 标签栏按 ARIA tabs 模式做 roving tabindex，方向键 / Home / End 切换
tabbar.addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  const ids = TAB_IDS;
  const current = ids.indexOf(activeTab);
  const next =
    e.key === 'Home'
      ? ids[0]
      : e.key === 'End'
        ? ids[ids.length - 1]
        : ids[(current + (e.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length];
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

/* ---------- 安装到桌面 ---------- */

let installPrompt = null;

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)')?.matches || navigator.standalone === true;

function syncInstall() {
  const block = $('#install-block');
  const note = $('#install-note');
  const button = $('#s-install');
  if (!block || !note || !button) return;
  if (isStandalone()) {
    block.hidden = true;
    return;
  }
  if (installPrompt) {
    block.hidden = false;
    note.textContent = '装到主屏幕后可全屏打开，断网也能继续经营。';
    button.hidden = false;
    return;
  }
  // iOS 不支持安装提示，只能给出手动步骤（iPadOS 默认伪装成 Macintosh UA）
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  if (ios) {
    block.hidden = false;
    note.textContent = '在 Safari 里点「分享」→「添加到主屏幕」，就能像 App 一样全屏打开。';
    button.hidden = true;
    return;
  }
  block.hidden = true;
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  syncInstall();
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  syncInstall();
  toast('已安装到桌面', 'good');
});

$('#s-install').addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;
  installPrompt = null;
  syncInstall();
  if (outcome === 'accepted') toast('正在安装…', 'good');
});

/* ---------- 设置面板 ---------- */

const dialog = $('#settings');
$('#settings-btn').addEventListener('click', () => {
  syncSettings();
  showSettingsStatus('');
  dialog.showModal();
});

dialog.addEventListener('close', () => {
  showSettingsStatus('');
  if (!deferredToast) return;
  const next = deferredToast;
  deferredToast = null;
  toast(next.text, next.kind, next.ms, next.action);
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
  syncInstall();
}

$('#s-vibrate').addEventListener('change', (e) => {
  setHaptics(e.target.checked);
  buzz(12);
});
$('#s-close').addEventListener('click', () => dialog.close());
$('#s-save').addEventListener('click', () => {
  const ok = persist();
  toast(ok ? '已存档' : '存档失败：浏览器存储不可用', ok ? 'good' : 'bad');
});
$('#s-diagnostics').addEventListener('click', async () => {
  const version = $('.about')?.textContent.match(/v(\d+\.\d+\.\d+)/)?.[1] || '';
  const text = buildDiagnostics({
    version,
    pageUrl: location.href,
    userAgent: navigator.userAgent,
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
    standalone: isStandalone(),
    progress: {
      rebirths: game.s.rebirths,
      achievements: game.s.achievements.length,
      achievementTotal: ACHIEVEMENTS.length,
      story: game.s.story.unlocked.length,
      storyTotal: CHAPTERS.length,
    },
  });
  try {
    await navigator.clipboard.writeText(text);
    toast('诊断信息已复制，粘贴到 issue 里即可', 'good');
  } catch {
    window.prompt('复制下面的诊断信息：', text);
  }
});
$('#s-export').addEventListener('click', () => {
  try {
    const stamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([exportSaveText(game.s)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idle-empire-${stamp}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('存档已导出为 JSON 文件', 'good');
  } catch {
    // 极老的浏览器不支持 Blob 下载时退回复制存档码
    const text = exportSave(game.s);
    navigator.clipboard?.writeText(text).then(
      () => toast('存档已复制到剪贴板', 'good'),
      () => window.prompt('复制下面的存档文本：', text),
    );
  }
});

function applyImport(text, fileName = '') {
  let imported;
  try {
    imported = importSave(text);
  } catch (error) {
    toast(error?.code === 'not-a-save' ? '这个文件不像放置帝国的存档，没有导入' : '存档格式不对，没能导入', 'bad');
    return;
  }
  const label = fileName ? `「${fileName}」` : '这个存档';
  if (!confirm(`导入${label}会覆盖当前进度（当前 ${fmt(game.s.gold)} 金币，存档内 ${fmt(imported.gold)} 金币），确定继续？`)) return;
  Object.keys(game.s).forEach((k) => delete game.s[k]);
  Object.assign(game.s, imported);
  game.checkAchievements();
  game.checkStory();
  persist();
  switchTab(activeTab);
  syncSettings();
  toast(fileName ? `已导入 ${fileName}` : '存档已导入', 'good');
}

$('#s-import').addEventListener('click', () => $('#save-file').click());
$('#save-file').addEventListener('change', async (e) => {
  const input = e.target;
  const file = input.files?.[0];
  input.value = ''; // 清空后可以连续导入同一个文件
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    toast('文件太大，不像是这个游戏的存档', 'bad');
    return;
  }
  try {
    applyImport(await file.text(), file.name);
  } catch {
    toast('文件读不出来，换一个试试', 'bad');
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
  const target = e.target;
  if (target.closest?.('input, textarea, select, [contenteditable="true"]') || dialog.open || welcome.open) return;
  const map = { 1: 'buildings', 2: 'upgrades', 3: 'bosses', 4: 'achievements', 5: 'prestige', 6: 'story' };
  if (map[e.key]) {
    switchTab(map[e.key]);
    e.preventDefault();
  } else if (e.code === 'Space') {
    // 焦点在按钮/链接上时，空格应该触发那个控件，而不是挖矿
    if (target.closest?.('button, a[href], [role="button"]')) return;
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

// 断网不影响本地游戏，只给个轻提示
window.addEventListener('offline', () => toast('网络已断开，游戏照常运行', ''));
window.addEventListener('online', () => toast('网络已恢复', 'good'));

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
