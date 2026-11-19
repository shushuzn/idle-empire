import { BUILDINGS, UPGRADES, BOSSES, ACHIEVEMENTS, SHOP } from '../game/data.js';
import { CHAPTERS } from '../game/story.js';
import { fmt, fmtInt, pct } from './format.js';
import { buzz } from './haptics.js';
import { centerOf, floatText } from './floaters.js';
import { icon, ICON_ART } from './icons.js';
import * as B from '../game/balance.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// 10Hz 刷新时大部分数字并没有变；先比对再写，避免整页反复产生 DOM 变更
function setText(node, value) {
  const text = String(value);
  if (node.textContent !== text) node.textContent = text;
}

function setWidth(node, ratio) {
  const width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  if (node.style.width !== width) node.style.width = width;
}

function setAttr(node, name, value) {
  if (node.getAttribute(name) !== value) node.setAttribute(name, value);
}

function setHidden(node, hidden) {
  if (node.hidden !== hidden) node.hidden = hidden;
}

function setDisabled(node, disabled) {
  if (node.disabled !== disabled) node.disabled = disabled;
}

function setClass(node, name) {
  if (node.className !== name) node.className = name;
}

// 统一的图标格子：颜色由 data-tone 决定，具体映射在 app.css
function iconTile(name, tone, className = 'ico', art = ICON_ART[name] || '') {
  const node = el('div', className);
  node.dataset.tone = String(tone);
  node.append(icon(name));
  if (art) addArt(node, art, 144);
  return node;
}

// 生成式插画叠在线条图标上；加载失败就露出下面的图标
function addArt(node, src, size = 160) {
  if (!src) return null;
  const img = el('img', 'ico-art');
  img.src = src;
  img.alt = '';
  img.width = size;
  img.height = size;
  // 小尺寸缩略图已随 Service Worker 预缓存，直接加载，避免内部滚动容器里懒加载不触发
  img.loading = 'eager';
  img.decoding = 'async';
  img.addEventListener('error', () => img.remove(), { once: true });
  node.classList.add('has-art');
  node.append(img);
  return img;
}

const buildingArt = (id) => `./assets/art/buildings/${id}.webp`;
const bossArt = (id) => `./assets/art/bosses/${id}.webp`;

const UPGRADE_LOOK = {
  click: { name: 'hand', tone: 1 },
  building: { name: 'bricks', tone: 2 },
  boss: { name: 'dagger', tone: 5 },
  auto: { name: 'robot', tone: 3 },
  global: { name: 'laurel', tone: 6 },
  offline: { name: 'moon', tone: 4 },
  echo: { name: 'swirl', tone: 3 },
  breaker: { name: 'guardian', tone: 5 },
  phase: { name: 'hourglass', tone: 5 },
  tide: { name: 'sunring', tone: 2 },
  archive: { name: 'book', tone: 3 },
  mill: { name: 'gear', tone: 2 },
  salt: { name: 'shard', tone: 4 },
  stormtower: { name: 'bolt', tone: 5 },
  ranch: { name: 'moon', tone: 3 },
  watch: { name: 'eye', tone: 6 },
  monsoon: { name: 'swirl', tone: 4 },
  extend: { name: 'clock', tone: 2 },
};

// 流派列：旧的零散效果并进现有列，潮汐线单独成列；7 列在 360px 下仍能放下
const UPGRADE_LANE = {
  echo: 'global',
  breaker: 'boss',
  phase: 'boss',
  tide: 'building',
  archive: 'building',
  mill: 'tideflow',
  salt: 'tideflow',
  stormtower: 'tideflow',
  ranch: 'tideflow',
  watch: 'tideflow',
  monsoon: 'tideflow',
  extend: 'tideflow',
};

const BUILDING_TONE = {
  mine: 1, lumber: 4, farm: 6, factory: 2, bank: 1, castle: 2, temple: 3,
  station: 2, quantum: 3, dyson: 1, time: 4, multiverse: 3, research: 5,
  stargate: 4, dark: 5, rift: 4, warp: 3, infinity: 6,
  deepmine: 1, tidal: 4, antimatter: 3, archive: 2,
  mill: 4, salt: 1, stormtower: 5, ranch: 3,
};

const ACHIEVEMENT_TONE = {
  tower: 2,
  hand: 1,
  skull: 5,
  coin: 1,
  upgrade: 2,
  rebirth: 3,
  shard: 4,
  sunring: 4,
  moon: 3,
  bolt: 5,
  swirl: 3,
  clock: 4,
  hourglass: 4,
  trident: 4,
  eye: 5,
};

const SHOP_LOOK = {
  idle: { name: 'gear', tone: 2 },
  click: { name: 'hand', tone: 1 },
  boss: { name: 'dagger', tone: 5 },
  offline: { name: 'moon', tone: 4 },
  echo: { name: 'swirl', tone: 3 },
  archive: { name: 'book', tone: 3 },
};

const toneOf = (index) => (index % 6) + 1;

const TIDE_TONE = { flood: 4, ebb: 3, storm: 5, calm: 2 };
const clockText = (seconds) => {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const phaseName = (id) => B.TIDE_PHASE_BY_ID.get(id)?.name || id;

/* ---------------- 建筑 ---------------- */

export function buildingsView(game) {
  const root = el('div', 'view-buildings');

  const head = el('div', 'row spread');
  const title = el('h2', 'view-title', '我的帝国');
  const modes = el('div', 'segmented');
  for (const [value, label] of [['x1', '×1'], ['x10', '×10'], ['max', '最大']]) {
    const b = el('button', 'seg', label);
    b.dataset.mode = value;
    if (game.s.buyMode === value) b.classList.add('on');
    modes.append(b);
  }
  head.append(title, modes);
  root.append(head);

  // 潮段条：只放在建筑页顶部，四种潮段各用图标 + 文案区分，不依赖颜色
  const tidePanel = el('section', 'tide-panel');
  const tideHead = el('div', 'tide-head');
  const tideGlyph = el('span', 'tide-glyph');
  const tideName = el('b', 'tide-name', '');
  const tideMonsoon = el('span', 'tide-monsoon', '');
  const tideTime = el('span', 'tide-time', '');
  tideHead.append(tideGlyph, tideName, tideMonsoon, tideTime);
  const tideTrack = el('div', 'tide-track');
  const tideFill = el('div', 'tide-fill');
  tideTrack.append(tideFill);
  const tideEffect = el('p', 'tide-effect', '');
  tidePanel.append(tideHead, tideTrack, tideEffect);
  root.append(tidePanel);
  let tidePhaseId = '';

  const summary = el('p', 'view-sub');
  root.append(summary);

  // 全新存档：先告诉玩家该点什么，买下第一座建筑后就不再出现
  const hint = el('p', 'first-hint');
  hint.innerHTML = '<b>第一次来？</b>点上面那条金色按钮攒金币，攒到 10 枚就能买下第一座金矿。';
  root.append(hint);

  // 回响的一次性说明：买过建筑后出现，点「知道了」永久收起
  const resoHint = el('div', 'first-hint reso-hint');
  resoHint.innerHTML = '<b>回响怎么用？</b>同一种建筑买到 25 / 50 / 100 / 200 座会升到 I–IV 级，该建筑产出最多 +80%；长按卡片上的四格刻度，能看到还差多少座；所有建筑每累计 10 层回响，全局产出再 +2%。';
  const resoHintClose = el('button', 'hint-close', '知道了');
  resoHint.append(resoHintClose);
  root.append(resoHint);
  resoHintClose.addEventListener('click', () => {
    game.s.tutorialSeen = true;
    resoHint.hidden = true;
  });

  const list = el('div', 'cards');
  root.append(list);

  const cards = BUILDINGS.map((b) => {
    const card = el('article', 'card building');
    card.dataset.id = b.id;
    const ico = iconTile(b.icon, BUILDING_TONE[b.id] || 2, 'ico', buildingArt(b.id));
    const body = el('div', 'body');
    const nameRow = el('div', 'name-row');
    const name = el('span', 'name', b.name);
    const owned = el('span', 'owned', '×0');
    nameRow.append(name, owned);
    const desc = el('div', 'desc', b.desc);
    const prod = el('div', 'prod');
    // 回响刻度：四格代表 I–IV，长按或在桌面悬停可以看到还差多少座
    const reso = el('div', 'reso');
    const pips = el('div', 'reso-pips');
    const pipEls = B.RESONANCE_LABELS.map(() => {
      const pip = el('i', 'reso-pip');
      pips.append(pip);
      return pip;
    });
    const resoText = el('span', 'reso-text', '');
    reso.append(pips, resoText);
    body.append(nameRow, desc, prod, reso);
    const buy = el('button', 'buy');
    const buyLabel = el('b', 'buy-label', '购买');
    const buyCost = el('span', 'buy-cost', '0');
    buy.append(buyLabel, buyCost);
    card.append(ico, body, buy);
    list.append(card);
    let pressTimer = 0;
    const showResonanceDetail = () => {
      const tier = B.resonanceTier(game.s, b.id);
      const next = B.nextResonance(game.s, b.id);
      const bonus = Math.round(B.buildingResonanceBonus(game.s, b.id) * 100);
      const text = next
        ? `「${b.name}」现有 ${fmtInt(game.owned(b.id))} 座，回响 ${tier ? B.RESONANCE_LABELS[tier - 1] : '0'}${tier ? `（+${bonus}%）` : ''}，再买 ${fmtInt(next.need)} 座到 ${next.label}。`
        : `「${b.name}」已满回响 IV，产出 +${bonus}%。`;
      root.dispatchEvent(new CustomEvent('toast', { bubbles: true, detail: { text, kind: '', ms: 5000 } }));
    };
    reso.addEventListener('pointerdown', () => {
      clearTimeout(pressTimer);
      pressTimer = setTimeout(showResonanceDetail, 400);
    });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) {
      reso.addEventListener(ev, () => clearTimeout(pressTimer));
    }
    buy.addEventListener('click', () => {
      if (game.buyBuilding(b.id)) {
        buzz(5);
        card.classList.remove('pulse');
        void card.offsetWidth;
        card.classList.add('pulse');
      }
    });
    return { b, card, owned, prod, reso, pipEls, resoText, buy, buyLabel, buyCost };
  });

  modes.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg');
    if (!btn) return;
    game.s.buyMode = btn.dataset.mode;
    for (const b of modes.children) b.classList.toggle('on', b === btn);
  });

  function update() {
    const tide = B.tideState(game.s);
    setHidden(tidePanel, !tide.started);
    if (tide.started) {
      if (tide.phase.id !== tidePhaseId) {
        tidePhaseId = tide.phase.id;
        tideGlyph.dataset.tone = String(TIDE_TONE[tide.phase.id] || 2);
        tidePanel.dataset.tone = tideGlyph.dataset.tone;
        tideGlyph.replaceChildren(icon(tide.phase.icon));
        addArt(tideGlyph, ICON_ART[tide.phase.icon] || '', 144);
      }
      setText(tideName, tide.phase.name);
      setText(tideMonsoon, `${tide.monsoon.name}季风 · ${phaseName(tide.monsoon.favor)}重复`);
      setText(tideTime, clockText(tide.remaining));
      setWidth(tideFill, tide.progress);
      const b = tide.bonuses;
      const parts = [];
      if (b.building) parts.push(`建筑 +${pct(b.building)}`);
      if (b.click) parts.push(`点击 +${pct(b.click)}`);
      if (b.boss) parts.push(`Boss +${pct(b.boss)}`);
      if (b.all) parts.push(`全项 +${pct(b.all)}`);
      if (b.offline) parts.push(`离线 +${pct(b.offline)}`);
      setText(
        tideEffect,
        `${parts.join(' · ')} · 第 ${tide.blockPos + 1}/6 段 · 下一段 ${tide.nextPhase.name}`,
      );
      setAttr(
        tidePanel,
        'aria-label',
        `潮段 ${tide.phase.name}，${tide.monsoon.name}季风，剩余 ${Math.ceil(tide.remaining)} 秒，${parts.join('，')}`,
      );
    }

    let visible = 0;
    let ownedTotal = 0;
    for (const c of cards) {
      const unlocked = game.buildingUnlocked(c.b);
      setHidden(c.card, !unlocked);
      if (!unlocked) continue;
      visible++;
      const count = game.owned(c.b.id);
      ownedTotal += count;
      const { count: buyCount, cost } = game.bulk(c.b, game.s.buyMode);
      setText(c.owned, `×${fmtInt(count)}`);
      setText(c.prod, `每个 +${fmt(B.buildingRate(c.b, game.s))}/秒`);
      setText(c.buyLabel, buyCount > 0 ? `购买 ×${buyCount}` : '金币不足');
      setText(c.buyCost, `${fmt(cost)} 金币`);
      setDisabled(c.buy, buyCount < 1 || game.s.gold < cost);
      c.card.classList.toggle('affordable', game.s.gold >= cost && buyCount > 0);

      const tier = B.resonanceTier(game.s, c.b.id);
      const next = B.nextResonance(game.s, c.b.id);
      const bonus = Math.round(B.buildingResonanceBonus(game.s, c.b.id) * 100);
      for (let i = 0; i < c.pipEls.length; i++) {
        c.pipEls[i].classList.toggle('on', i < tier);
        c.pipEls[i].classList.toggle('next', i === tier);
      }
      const label = next
        ? tier
          ? `回响 ${B.RESONANCE_LABELS[tier - 1]} +${bonus}% · 再买 ${fmtInt(next.need)} 座到 ${next.label}`
          : `再买 ${fmtInt(next.need)} 座解锁回响 I`
        : `回响 IV +${bonus}%`;
      setText(c.resoText, label);
      setAttr(c.reso, 'title', label);
      setAttr(c.reso, 'aria-label', label);
      c.reso.classList.toggle('has-echo', tier > 0);
    }
    const layers = B.resonanceLayers(game.s);
    const globalBonus = Math.round(B.resonanceGlobalBonus(game.s) * 100);
    setText(summary, `${visible} 种建筑 · 总产出 ${fmt(B.production(game.s))} /秒 · 点击 +${fmt(B.clickPower(game.s).perClick)}${layers ? ` · 回响 ${layers} 层${globalBonus ? `（全局 +${globalBonus}%）` : ''}` : ''}`);
    setHidden(hint, ownedTotal > 0);
    setHidden(resoHint, ownedTotal === 0 || Boolean(game.s.tutorialSeen));
  }

  return { el: root, update };
}

/* ---------------- 升级：科技树 ---------------- */

const TREE_LANES = [
  { type: 'click', label: '点击' },
  { type: 'building', label: '建筑' },
  { type: 'boss', label: 'Boss' },
  { type: 'auto', label: '自动' },
  { type: 'global', label: '全局' },
  { type: 'offline', label: '离线' },
  { type: 'tideflow', label: '潮汐' },
];

// 节点位置：横轴是流派，纵轴是同一条链上的第几级
const TREE_NODES = (() => {
  const laneOf = new Map(TREE_LANES.map((lane, i) => [lane.type, i]));
  const depth = new Map();
  return UPGRADES.map((u) => {
    const type = u.effect[0];
    const lane = laneOf.get(UPGRADE_LANE[type] || type) ?? 0;
    const row = depth.get(lane) || 0;
    depth.set(lane, row + 1);
    return { u, lane, row, look: UPGRADE_LOOK[type] || UPGRADE_LOOK.global };
  });
})();
const TREE_ROWS = Math.max(...TREE_NODES.map((n) => n.row)) + 1;
const TREE_COLS = TREE_LANES.length;
const TREE_BY_ID = new Map(TREE_NODES.map((n) => [n.u.id, n]));
const TREE_LANE_TOTALS = TREE_LANES.map((_, i) => TREE_NODES.filter((n) => n.lane === i).length);

// 连线：同流派走竖直的线，跨流派绕到目标那一列的右侧再折回来
function treeLink(from, to) {
  const x1 = from.lane * 100 + 50;
  const y1 = from.row * 100 + 50;
  const x2 = to.lane * 100 + 50;
  const y2 = to.row * 100 + 50;
  if (from.lane === to.lane) return `M${x1} ${y1} L${x2} ${y2}`;
  const rail = x2 + (to.lane >= from.lane ? 50 : -50);
  return `M${x1} ${y1} H${rail} V${y2} H${x2}`;
}

export function upgradesView(game) {
  const root = el('div', 'view-upgrades');
  root.append(el('h2', 'view-title', '科技树'));
  root.append(el('p', 'view-sub', '点亮一个节点才能往下走；点节点看说明并买断，转生后清零。'));

  const labels = el('div', 'utree-labels');
  const laneEls = TREE_LANES.map((lane, i) => {
    const wrap = el('span', 'utree-lane');
    const name = el('b', '', lane.label);
    const count = el('i', 'utree-lane-count', `0/${TREE_LANE_TOTALS[i]}`);
    wrap.append(name, count);
    labels.append(wrap);
    return { lane, total: TREE_LANE_TOTALS[i], wrap, count };
  });
  root.append(labels);

  const canvas = el('div', 'utree-canvas');
  canvas.style.setProperty('--rows', String(TREE_ROWS));

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'utree-links');
  svg.setAttribute('viewBox', `0 0 ${TREE_COLS * 100} ${TREE_ROWS * 100}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const edges = new Map();
  for (const node of TREE_NODES) {
    if (!node.u.req) continue;
    const from = TREE_BY_ID.get(node.u.req);
    if (!from) continue;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', treeLink(from, node));
    path.dataset.to = node.u.id;
    svg.append(path);
    edges.set(node.u.id, path);
  }
  canvas.append(svg);

  const grid = el('div', 'utree-grid');
  grid.style.gridTemplateColumns = `repeat(${TREE_COLS}, 1fr)`;
  canvas.append(grid);
  root.append(canvas);

  let selectedId = null;
  let firstUpdate = true;
  let announcedDone = false;

  const detail = el('section', 'utree-detail');
  const detailHead = el('div', 'utree-detail-head');
  const detailName = el('b', 'utree-name', '');
  const detailState = el('span', 'utree-state', '');
  detailHead.append(detailName, detailState);
  const detailDesc = el('p', 'utree-desc', '');
  const detailNeed = el('p', 'utree-need', '');
  const detailBuy = el('button', 'buy utree-buy');
  const detailBuyLabel = el('b', 'buy-label', '购买');
  const detailBuyCost = el('span', 'buy-cost', '');
  detailBuy.append(detailBuyLabel, detailBuyCost);
  // 未解锁时的替代按钮：直接跳到前置节点，不用自己顺着线找
  const detailJump = el('button', 'ghost utree-jump');
  detailJump.type = 'button';
  detailJump.hidden = true;
  detail.append(detailHead, detailDesc, detailNeed, detailJump, detailBuy);
  root.append(detail);

  const nodes = TREE_NODES.map((node) => {
    const btn = el('button', 'utree-node');
    btn.type = 'button';
    btn.dataset.id = node.u.id;
    btn.style.gridColumn = String(node.lane + 1);
    btn.style.gridRow = String(node.row + 1);
    btn.append(iconTile(node.look.name, node.look.tone, 'utree-ico', ICON_ART[node.look.name]));
    // 同一条流派里图标是重复的，右下角标个级数才分得清先后
    const lvl = el('span', 'utree-lvl', String(node.row + 1));
    lvl.setAttribute('aria-hidden', 'true');
    btn.append(lvl);
    grid.append(btn);
    btn.addEventListener('click', () => {
      selectedId = node.u.id;
      update();
      // 小屏上详情面板可能在折叠区外，点节点后把它带进视野
      detail.scrollIntoView({ block: 'nearest' });
    });
    return { ...node, btn };
  });

  function detailFor(id) {
    const node = TREE_BY_ID.get(id);
    if (!node) return;
    const u = node.u;
    const state = game.upgradeAvailable(u);
    const prev = u.req ? UPGRADES.find((x) => x.id === u.req) : null;
    const prevMissing = Boolean(u.req && prev && !game.s.upgrades.includes(u.req));
    const locked = state === 'locked';
    setText(detailName, u.name);
    setText(detailDesc, u.desc);
    setClass(detailState, `utree-state ${state}`);
    setText(detailState, state === 'owned' ? '已购买' : locked ? '未解锁' : `${fmt(u.cost)} 金币`);

    let needText = '';
    if (locked) {
      if (prevMissing) {
        needText = `先点亮「${prev.name}」`;
      } else if (u.reqResonance) {
        needText = `需要任一建筑达到回响 ${B.RESONANCE_LABELS[u.reqResonance - 1]}`;
      } else if (u.reqBuilding) {
        const [bid, count] = Object.entries(u.reqBuilding)[0];
        const building = BUILDINGS.find((b) => b.id === bid);
        needText = `需要拥有 ${count} 座${building?.name || bid}`;
      }
    }
    setText(detailNeed, needText);
    setHidden(detailNeed, !needText);
    // 锁定：能跳前置就跳；按建筑或回响解锁的只能给出条件
    setHidden(detailJump, !(locked && prevMissing));
    setText(detailJump, locked && prevMissing ? `先点亮「${prev.name}」` : '');
    setHidden(detailBuy, state === 'owned' || locked);
    setDisabled(detailBuy, state !== 'ok' || game.s.gold < u.cost);
    setText(detailBuyLabel, '购买');
    setText(detailBuyCost, `${fmt(u.cost)} 金币`);
  }

  detailJump.addEventListener('click', () => {
    const cur = TREE_BY_ID.get(selectedId);
    if (!cur?.u.req) return;
    selectedId = cur.u.req;
    update();
  });

  detailBuy.addEventListener('click', () => {
    if (!selectedId) return;
    const bought = selectedId;
    if (!game.buyUpgrade(bought)) return;
    buzz(6);
    const node = nodes.find((n) => n.u.id === bought);
    if (node) {
      node.btn.classList.remove('pulse');
      void node.btn.offsetWidth;
      node.btn.classList.add('pulse');
    }
    // 买完自动跳到这条流派的下一级，方便一路往下点
    const next = nodes.find((n) => n.u.req === bought);
    if (next) selectedId = next.u.id;
    update();
  });

  function update() {
    const ownedByLane = new Map(laneEls.map((x) => [x.lane.type, 0]));
    let ownedCount = 0;
    for (const n of nodes) {
      const state = game.upgradeAvailable(n.u);
      if (state === 'owned') {
        ownedCount += 1;
        const type = TREE_LANES[n.lane].type;
        ownedByLane.set(type, ownedByLane.get(type) + 1);
      }
      const affordable = state === 'ok' && game.s.gold >= n.u.cost;
      n.btn.classList.toggle('is-owned', state === 'owned');
      n.btn.classList.toggle('is-ready', state === 'ok');
      n.btn.classList.toggle('is-affordable', affordable);
      n.btn.classList.toggle('is-locked', state === 'locked');
      setAttr(
        n.btn,
        'aria-label',
        `${n.u.name}：${state === 'owned' ? '已购买' : state === 'locked' ? '未解锁' : `${fmt(n.u.cost)} 金币`}`,
      );
      const edge = edges.get(n.u.id);
      if (edge) edge.classList.toggle('on', state === 'owned');
    }
    // 每条流派点亮了几级；整条点满时数字变金色
    for (const x of laneEls) {
      const text = `${ownedByLane.get(x.lane.type) || 0}/${x.total}`;
      setText(x.count, text);
      x.wrap.classList.toggle('done', text === `${x.total}/${x.total}`);
    }
    if (firstUpdate) {
      firstUpdate = false;
      announcedDone = ownedCount === TREE_NODES.length;
    } else if (ownedCount === TREE_NODES.length && !announcedDone) {
      announcedDone = true;
      root.dispatchEvent(
        new CustomEvent('toast', { bubbles: true, detail: { text: '科技树已全部点亮', kind: 'good', ms: 5000 } }),
      );
    } else if (ownedCount < TREE_NODES.length) {
      announcedDone = false;
    }
    // 没选过或选中的节点被买掉后，自动挑一个当下最该看的
    if (!selectedId || !TREE_BY_ID.has(selectedId)) {
      const pick =
        nodes.find((n) => game.upgradeAvailable(n.u) === 'ok' && game.s.gold >= n.u.cost) ||
        nodes.find((n) => game.upgradeAvailable(n.u) === 'ok') ||
        nodes[0];
      selectedId = pick.u.id;
    }
    // 选中的是未解锁节点时，把前置节点和那条连线点亮，告诉玩家该先买什么
    const sel = TREE_BY_ID.get(selectedId);
    const needId = sel && game.upgradeAvailable(sel.u) === 'locked' ? sel.u.req : null;
    for (const n of nodes) {
      n.btn.classList.toggle('is-selected', n.u.id === selectedId);
      n.btn.classList.toggle('is-needed', n.u.id === needId);
    }
    for (const [id, path] of edges) path.classList.toggle('is-hinting', id === selectedId && !!needId);
    detailFor(selectedId);
  }

  return { el: root, update };
}

/* ---------------- Boss ---------------- */

export function bossesView(game) {
  const root = el('div', 'view-bosses');
  root.append(el('h2', 'view-title', 'Boss 挑战'));
  const sub = el('p', 'view-sub', '点击攻击当前 Boss；护盾期点击伤害翻倍、建筑伤害减半，二阶段要打两段。盐碱傀儡每 3 次攻击切换弱点，季风巨鲸只在风暴破盾，风暴之眼的护盾会自行回复。');
  root.append(sub);

  const arena = el('section', 'arena');
  const top = el('div', 'arena-top');
  const arenaIcon = iconTile('goblin', 1, 'arena-icon', bossArt('goblin'));
  let arenaBossId = 'goblin';
  const meta = el('div', 'arena-meta');
  const name = el('div', 'arena-name', '');
  const hpText = el('div', 'arena-hp-text', '');
  meta.append(name, hpText);
  top.append(arenaIcon, meta);
  const bar = el('div', 'hpbar');
  const fill = el('div', 'hpfill');
  bar.append(fill);
  const shieldbar = el('div', 'shieldbar');
  const shieldfill = el('div', 'shieldfill');
  shieldbar.append(shieldfill);
  const attack = el('button', 'attack');
  attack.append(el('b', 'attack-label', '攻击'), el('span', 'attack-dmg', '0 伤害'));
  const attackDmg = attack.querySelector('.attack-dmg');
  arena.append(top, bar, shieldbar, attack);
  root.append(arena);

  const nextInfo = el('p', 'next-boss');
  root.append(nextInfo);

  const list = el('div', 'cards compact');
  const rows = BOSSES.map((b, i) => {
    const row = el('div', 'boss-row');
    const num = el('span', 'boss-num', String(i + 1).padStart(2, '0'));
    const ico = iconTile(b.icon, toneOf(i), 'boss-ico', bossArt(b.id));
    const nm = el('span', 'boss-name', b.name);
    const st = el('span', 'boss-state', '');
    row.append(num, ico, nm, st);
    list.append(row);
    return { b, row, st };
  });
  root.append(list);

  attack.addEventListener('click', () => {
    const result = game.attack();
    if (!result) return;
    buzz(result.killed ? 30 : 10);
    attack.classList.remove('hit');
    void attack.offsetWidth;
    attack.classList.add('hit');
    const at = centerOf(attack);
    floatText(`-${fmt(result.damage)}`, at.x, at.y - 6, 'hit');
    if (result.phase === 2) {
      root.dispatchEvent(new CustomEvent('toast', { bubbles: true, detail: { text: `${result.brokeShield ? '护盾破碎，' : ''}${game.bossState().boss.name} 进入第二阶段`, kind: 'bad', ms: 5000 } }));
    } else if (result.brokeShield) {
      root.dispatchEvent(new CustomEvent('toast', { bubbles: true, detail: { text: '护盾破碎', kind: 'good' } }));
    }
    if (result.killed) {
      floatText(`+${fmt(result.reward)}`, at.x, at.y - 34, 'gold');
      root.dispatchEvent(new CustomEvent('toast', { bubbles: true, detail: { text: `击败 ${result.killed.name}，获得 ${fmt(result.reward)} 金币`, kind: 'good' } }));
    }
  });

  function update() {
    const info = game.bossState();
    if (arenaBossId !== info.boss.id) {
      arenaBossId = info.boss.id;
      arenaIcon.dataset.tone = String(toneOf(game.s.bossIndex));
      arenaIcon.replaceChildren(icon(info.boss.icon));
      addArt(arenaIcon, bossArt(info.boss.id), 192);
    }
    const twoPhase = info.boss.phases === 2;
    setText(name, info.unlocked && twoPhase ? `${info.boss.name} · 第 ${info.phase} 阶段` : info.boss.name);
    let hpStatus = '';
    if (info.unlocked) {
      if (info.phase === 2) hpStatus = ' · 第二阶段';
      else if (info.stormLocked) hpStatus = ` · 护盾 ${fmt(info.shieldLeft)} · 需风暴破盾`;
      else if (info.shielded) hpStatus = ` · 护盾 ${fmt(info.shieldLeft)}`;
      if (info.shieldRegen && info.shielded) hpStatus += ' · 护盾回复中';
    }
    setText(
      hpText,
      info.unlocked
        ? `${fmt(info.hp)} / ${fmt(info.maxHp)} HP${hpStatus}`
        : '尚未解锁',
    );
    setWidth(fill, info.hp / info.maxHp);
    const showShield = info.unlocked && info.phase === 1 && info.shieldPct > 0 && info.shieldLeft > 0;
    setHidden(shieldbar, !showShield);
    setWidth(shieldfill, showShield ? info.shieldLeft / info.maxHp : 0);
    setDisabled(attack, !info.unlocked);
    const damage = B.bossDamage(game.s, {
      shielded: info.shielded,
      phase2: info.phase === 2,
      weakness: info.focus,
    });
    const focusText = info.focus === 'click' ? ' · 弱点：点击' : info.focus === 'building' ? ' · 弱点：建筑' : '';
    const stormIn = info.stormLocked ? B.secondsUntilPhase(game.s, 'storm') : 0;
    const lockText = info.stormLocked ? ` · 等待风暴 ${clockText(stormIn)}` : info.shielded ? ' · 破盾中' : '';
    setText(attackDmg, `${fmt(damage)} 伤害${focusText}${lockText}`);
    if (!info.unlocked) {
      setText(nextInfo, `「${info.boss.name}」需要累计收益 ${fmt(info.boss.unlockAt)}${info.boss.rebirthRequired ? ' 且至少转生 1 次' : ''}，现在 ${fmt(game.s.lifetimeEarned)}。`);
    } else {
      const next = BOSSES[game.s.bossIndex + 1];
      setText(
        nextInfo,
        next
          ? game.bossUnlocked(next)
            ? `下一个：${next.name}`
            : `下一个 Boss「${next.name}」需要累计收益 ${fmt(next.unlockAt)}${next.rebirthRequired ? ' 且至少转生 1 次' : ''}`
          : '已通关全部 Boss，继续刷当前 Boss 吧。',
      );
    }
    rows.forEach((r, i) => {
      const unlocked = game.bossUnlocked(r.b);
      const current = i === game.s.bossIndex;
      r.row.classList.toggle('current', current);
      r.row.classList.toggle('locked', !unlocked);
      setText(
        r.st,
        current
          ? info.phase === 2
            ? '第二阶段'
            : info.stormLocked
              ? '需风暴破盾'
              : info.shielded
                ? '护盾中'
                : '挑战中'
          : unlocked
            ? i < game.s.bossIndex
              ? '已击败'
              : '可挑战'
            : `需 ${fmt(r.b.unlockAt)}`,
      );
    });
  }

  return { el: root, update };
}

/* ---------------- 成就 ---------------- */

export function achievementsView(game) {
  const root = el('div', 'view-achievements');
  root.append(el('h2', 'view-title', '成就'));
  const sub = el('p', 'view-sub', '');
  root.append(sub);

  const list = el('div', 'cards');
  root.append(list);

  const cards = ACHIEVEMENTS.map((a) => {
    const card = el('article', 'card achievement');
    const ico = iconTile(a.icon, ACHIEVEMENT_TONE[a.icon] || 2);
    const body = el('div', 'body');
    const nameRow = el('div', 'name-row');
    const name = el('span', 'name', a.name);
    const reward = el('span', 'tag', a.reward[0] === 'gold' ? `+${fmt(a.reward[1])} 金币` : `+${a.reward[1]} 碎片`);
    nameRow.append(name, reward);
    const desc = el('div', 'desc', a.desc);
    const prog = el('div', 'progress');
    const bar = el('div', 'progress-fill');
    prog.append(bar);
    const count = el('div', 'progress-text', '');
    body.append(nameRow, desc, prog, count);
    card.append(ico, body);
    list.append(card);
    return { a, card, bar, count };
  });

  function update() {
    let done = 0;
    for (const c of cards) {
      const p = game.achievementProgress(c.a);
      if (p.done) done++;
      c.card.classList.toggle('done', p.done);
      setWidth(c.bar, p.ratio);
      setText(c.count, p.done ? '已达成' : `${fmt(p.value)} / ${fmt(p.target)}`);
    }
    setText(sub, `已达成 ${done} / ${ACHIEVEMENTS.length}，成就给的碎片不会因转生消失。`);
  }

  return { el: root, update };
}

/* ---------------- 转生 ---------------- */

export function prestigeView(game) {
  const root = el('div', 'view-prestige');
  root.append(el('h2', 'view-title', '轮回转生'));
  const sub = el('p', 'view-sub', '清空金币、建筑与升级，换永久碎片：每 1 个碎片 +2% 全部收益。');
  root.append(sub);

  const panel = el('section', 'panel');
  const gainRow = el('div', 'gain-row');
  const gainValue = el('b', 'gain-value', '0');
  const gainLabel = el('span', '', ' 碎片可换');
  gainRow.append(gainValue, gainLabel);
  const progress = el('div', 'progress big');
  const progressFill = el('div', 'progress-fill');
  progress.append(progressFill);
  const hint = el('p', 'hint', '');
  const button = el('button', 'primary');
  button.textContent = '转生';
  panel.append(gainRow, progress, hint, button);
  root.append(panel);

  button.addEventListener('click', () => {
    const gain = game.prestigeGain();
    if (gain < 1) return;
    if (!confirm(`确定转生？将清空当前金币、建筑和升级，获得 ${fmt(gain)} 个碎片。`)) return;
    const got = game.prestige();
    root.dispatchEvent(new CustomEvent('toast', { bubbles: true, detail: { text: `转生完成，获得 ${fmt(got)} 个碎片`, kind: 'good' } }));
  });

  const shopTitle = el('h3', 'section-title', '碎片商店（永久）');
  root.append(shopTitle);
  const shopList = el('div', 'cards');
  root.append(shopList);

  const shopCards = SHOP.map((item) => {
    const card = el('article', 'card shop');
    const look = SHOP_LOOK[item.id] || SHOP_LOOK.idle;
    const ico = iconTile(look.name, look.tone);
    const body = el('div', 'body');
    const nameRow = el('div', 'name-row');
    const name = el('span', 'name', item.name);
    const lv = el('span', 'owned', 'Lv.0');
    nameRow.append(name, lv);
    const desc = el('div', 'desc', item.desc);
    body.append(nameRow, desc);
    const buy = el('button', 'buy');
    const label = el('b', 'buy-label', '升级');
    const cost = el('span', 'buy-cost', '0');
    buy.append(label, cost);
    card.append(ico, body, buy);
    shopList.append(card);
    buy.addEventListener('click', () => {
      if (game.buyShop(item.id)) {
        root.dispatchEvent(new CustomEvent('toast', { bubbles: true, detail: { text: `${item.name} 升到 Lv.${game.s.shop[item.id]}`, kind: 'good' } }));
      }
    });
    return { item, card, lv, buy, cost };
  });

  function update() {
    const gain = game.prestigeGain();
    setText(gainValue, fmt(gain));
    setWidth(progressFill, game.s.totalEarned / B.PRESTIGE_THRESHOLD);
    setText(
      hint,
      gain > 0
        ? `本轮累计收益 ${fmt(game.s.totalEarned)}，现在转生可得 ${fmt(gain)} 个碎片。`
        : `本轮累计收益 ${fmt(game.s.totalEarned)}，距 ${fmt(B.PRESTIGE_THRESHOLD)} 还差 ${fmt(Math.max(0, B.PRESTIGE_THRESHOLD - game.s.totalEarned))}。`,
    );
    setDisabled(button, gain < 1);
    setText(button, gain > 0 ? `转生（+${fmt(gain)} 碎片）` : '还不够转生');
    for (const c of shopCards) {
      const level = game.s.shop[c.item.id] || 0;
      const maxed = level >= c.item.max;
      const cost = B.shopCost(c.item, level);
      setText(c.lv, `Lv.${level} / ${c.item.max}`);
      setText(c.cost, maxed ? '已满级' : `${cost} 碎片`);
      setDisabled(c.buy, maxed || game.s.shards < cost);
      c.card.classList.toggle('affordable', !maxed && game.s.shards >= cost);
    }
  }

  return { el: root, update };
}

/* ---------------- 剧情档案 ---------------- */

export function storyView(game) {
  const root = el('div', 'view-story');
  root.append(el('h2', 'view-title', '裂隙纪事'));
  const sub = el('p', 'view-sub', '');
  root.append(sub);

  const hero = el('figure', 'story-hero');
  const heroImg = el('img');
  heroImg.src = './assets/art/rift-mine.webp';
  heroImg.alt = '矿工提灯站在矿洞深处，望着岩壁上发光的紫色裂隙';
  heroImg.width = 1240;
  heroImg.height = 692;
  heroImg.loading = 'lazy';
  heroImg.decoding = 'async';
  hero.append(heroImg, el('figcaption', '', '矿灯与裂隙'));
  root.append(hero);

  // 进入页面时未读的章节标「新」，本次浏览期间一直保留，下次再进就不标了
  const fresh = new Set(game.unreadStory());

  const list = el('div', 'chapters');
  root.append(list);
  const foot = el('p', 'story-foot', '');
  root.append(foot);

  const cards = CHAPTERS.map((chapter, i) => {
    const card = el('article', 'chapter');
    const head = el('div', 'chapter-head');
    const no = el('span', 'chapter-no', String(i + 1).padStart(2, '0'));
    no.dataset.tone = String(toneOf(i));
    const source = el('span', 'chapter-source', chapter.source);
    const freshTag = el('span', 'chapter-new', '新');
    head.append(no, source, freshTag);
    const title = el('h3', 'chapter-title', chapter.title);
    const text = el('p', 'chapter-text', chapter.text);
    card.append(head, title, text);

    let echo = null;
    if (chapter.echo) {
      echo = el('p', 'chapter-echo');
      echo.append(el('b', '', '回响'), el('span', '', chapter.echo));
      card.append(echo);
    }

    list.append(card);
    return { chapter, card, source, freshTag, title, text, echo };
  });

  function update() {
    const unlocked = new Set(game.s.story.unlocked);
    let shown = 0;
    let lockedShown = false;
    let lockedLeft = 0;

    for (const c of cards) {
      const on = unlocked.has(c.chapter.id);
      if (on) {
        shown += 1;
      } else {
        lockedLeft += 1;
        // 只露出最早一篇未解锁的档案作为线索，其余先藏起来
        setHidden(c.card, lockedShown);
        lockedShown = true;
      }
      if (on) setHidden(c.card, false);
      c.card.classList.toggle('locked', !on);
      setText(c.title, on ? c.chapter.title : '这一页还是空白');
      setText(c.text, on ? c.chapter.text : `解锁条件：${c.chapter.need}`);
      setText(c.source, on ? c.chapter.source : '未解锁');
      setHidden(c.freshTag, !(on && fresh.has(c.chapter.id)));
      if (c.echo) setHidden(c.echo, !on || game.s.rebirths < 1);
    }

    setText(
      sub,
      `已收集 ${shown} / ${CHAPTERS.length} 篇。每完成一个里程碑，缝隙里就会多出一页记录${game.s.rebirths > 0 ? '；转生之后，读过的档案会多出一段「回响」' : ''}。`,
    );
    setHidden(foot, lockedLeft < 2);
    setText(foot, lockedLeft > 1 ? `还有 ${lockedLeft - 1} 篇档案没有找到。` : '');
  }

  return { el: root, update };
}

export const VIEWS = {
  buildings: buildingsView,
  upgrades: upgradesView,
  bosses: bossesView,
  achievements: achievementsView,
  prestige: prestigeView,
  story: storyView,
};
