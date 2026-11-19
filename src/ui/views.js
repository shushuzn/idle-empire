import { BUILDINGS, UPGRADES, BOSSES, ACHIEVEMENTS, SHOP } from '../game/data.js';
import { CHAPTERS } from '../game/story.js';
import { fmt, fmtInt } from './format.js';
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
};

const BUILDING_TONE = {
  mine: 1, lumber: 4, farm: 6, factory: 2, bank: 1, castle: 2, temple: 3,
  station: 2, quantum: 3, dyson: 1, time: 4, multiverse: 3, research: 5,
  stargate: 4, dark: 5, rift: 4, warp: 3, infinity: 6,
};

const ACHIEVEMENT_TONE = {
  tower: 2,
  hand: 1,
  skull: 5,
  coin: 1,
  upgrade: 2,
  rebirth: 3,
  shard: 4,
};

const SHOP_LOOK = {
  idle: { name: 'gear', tone: 2 },
  click: { name: 'hand', tone: 1 },
  boss: { name: 'dagger', tone: 5 },
  offline: { name: 'moon', tone: 4 },
};

const toneOf = (index) => (index % 6) + 1;

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

  const summary = el('p', 'view-sub');
  root.append(summary);

  // 全新存档：先告诉玩家该点什么，买下第一座建筑后就不再出现
  const hint = el('p', 'first-hint');
  hint.innerHTML = '<b>第一次来？</b>点上面那条金色按钮攒金币，攒到 10 枚就能买下第一座金矿。';
  root.append(hint);

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
    body.append(nameRow, desc, prod);
    const buy = el('button', 'buy');
    const buyLabel = el('b', 'buy-label', '购买');
    const buyCost = el('span', 'buy-cost', '0');
    buy.append(buyLabel, buyCost);
    card.append(ico, body, buy);
    list.append(card);
    buy.addEventListener('click', () => {
      if (game.buyBuilding(b.id)) {
        buzz(5);
        card.classList.remove('pulse');
        void card.offsetWidth;
        card.classList.add('pulse');
      }
    });
    return { b, card, owned, prod, buy, buyLabel, buyCost };
  });

  modes.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg');
    if (!btn) return;
    game.s.buyMode = btn.dataset.mode;
    for (const b of modes.children) b.classList.toggle('on', b === btn);
  });

  function update() {
    let visible = 0;
    let ownedTotal = 0;
    const mult = B.productionMultiplier(game.s);
    for (const c of cards) {
      const unlocked = game.buildingUnlocked(c.b);
      c.card.hidden = !unlocked;
      if (!unlocked) continue;
      visible++;
      const count = game.owned(c.b.id);
      ownedTotal += count;
      const { count: buyCount, cost } = game.bulk(c.b, game.s.buyMode);
      c.owned.textContent = `×${fmtInt(count)}`;
      c.prod.textContent = `每个 +${fmt(c.b.baseProduction * mult)}/秒`;
      c.buyLabel.textContent = buyCount > 0 ? `购买 ×${buyCount}` : '金币不足';
      c.buyCost.textContent = `${fmt(cost)} 金币`;
      c.buy.disabled = buyCount < 1 || game.s.gold < cost;
      c.card.classList.toggle('affordable', game.s.gold >= cost && buyCount > 0);
    }
    summary.textContent = `${visible} 种建筑 · 总产出 ${fmt(B.production(game.s))} /秒 · 点击 +${fmt(B.clickPower(game.s).perClick)}`;
    hint.hidden = ownedTotal > 0;
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
];

// 节点位置：横轴是流派，纵轴是同一条链上的第几级
const TREE_NODES = (() => {
  const laneOf = new Map(TREE_LANES.map((lane, i) => [lane.type, i]));
  const depth = new Map();
  return UPGRADES.map((u) => {
    const type = u.effect[0];
    const lane = laneOf.get(type) ?? 0;
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
  const detailBuy = el('button', 'buy utree-buy');
  const detailBuyLabel = el('b', 'buy-label', '购买');
  const detailBuyCost = el('span', 'buy-cost', '');
  detailBuy.append(detailBuyLabel, detailBuyCost);
  // 未解锁时的替代按钮：直接跳到前置节点，不用自己顺着线找
  const detailJump = el('button', 'ghost utree-jump');
  detailJump.type = 'button';
  detailJump.hidden = true;
  detail.append(detailHead, detailDesc, detailJump, detailBuy);
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
    });
    return { ...node, btn };
  });

  function detailFor(id) {
    const node = TREE_BY_ID.get(id);
    if (!node) return;
    const u = node.u;
    const state = game.upgradeAvailable(u);
    const prev = u.req ? UPGRADES.find((x) => x.id === u.req) : null;
    const locked = state === 'locked';
    detailName.textContent = u.name;
    detailDesc.textContent = u.desc;
    detailState.className = `utree-state ${state}`;
    detailState.textContent = state === 'owned' ? '已购买' : locked ? '未解锁' : `${fmt(u.cost)} 金币`;
    // 锁定：把购买键换成「先点亮前置」，点一下就选中前置节点
    detailJump.hidden = !(locked && prev);
    detailJump.textContent = locked && prev ? `先点亮「${prev.name}」` : '';
    detailBuy.hidden = state === 'owned' || (locked && !!prev);
    detailBuy.disabled = state !== 'ok' || game.s.gold < u.cost;
    detailBuyLabel.textContent = locked ? '未解锁' : '购买';
    detailBuyCost.textContent = locked ? '' : `${fmt(u.cost)} 金币`;
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
      n.btn.setAttribute(
        'aria-label',
        `${n.u.name}：${state === 'owned' ? '已购买' : state === 'locked' ? '未解锁' : `${fmt(n.u.cost)} 金币`}`,
      );
      const edge = edges.get(n.u.id);
      if (edge) edge.classList.toggle('on', state === 'owned');
    }
    // 每条流派点亮了几级；整条点满时数字变金色
    for (const x of laneEls) {
      const text = `${ownedByLane.get(x.lane.type) || 0}/${x.total}`;
      if (x.count.textContent !== text) x.count.textContent = text;
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
  const sub = el('p', 'view-sub', '点击攻击当前 Boss，击杀后按最大生命值重来，可以一直刷奖励。');
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
  const attack = el('button', 'attack');
  attack.append(el('b', 'attack-label', '攻击'), el('span', 'attack-dmg', '0 伤害'));
  arena.append(top, bar, attack);
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
    if (result.killed) {
      floatText(`+${fmt(result.killed.reward)}`, at.x, at.y - 34, 'gold');
      root.dispatchEvent(new CustomEvent('toast', { bubbles: true, detail: { text: `击败 ${result.killed.name}，获得 ${fmt(result.killed.reward)} 金币`, kind: 'good' } }));
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
    name.textContent = info.boss.name;
    hpText.textContent = info.unlocked ? `${fmt(info.hp)} / ${fmt(info.maxHp)} HP` : '尚未解锁';
    fill.style.width = `${Math.max(0, Math.min(1, info.hp / info.maxHp)) * 100}%`;
    attack.disabled = !info.unlocked;
    attack.querySelector('.attack-dmg').textContent = `${fmt(B.bossDamage(game.s))} 伤害`;
    if (!info.unlocked) {
      nextInfo.textContent = `「${info.boss.name}」需要累计收益 ${fmt(info.boss.unlockAt)}${info.boss.rebirthRequired ? ' 且至少转生 1 次' : ''}，现在 ${fmt(game.s.lifetimeEarned)}。`;
    } else {
      const next = BOSSES[game.s.bossIndex + 1];
      nextInfo.textContent = next
        ? game.bossUnlocked(next)
          ? `下一个：${next.name}`
          : `下一个 Boss「${next.name}」需要累计收益 ${fmt(next.unlockAt)}${next.rebirthRequired ? ' 且至少转生 1 次' : ''}`
        : '已通关全部 Boss，继续刷当前 Boss 吧。';
    }
    rows.forEach((r, i) => {
      const unlocked = game.bossUnlocked(r.b);
      const current = i === game.s.bossIndex;
      r.row.classList.toggle('current', current);
      r.row.classList.toggle('locked', !unlocked);
      r.st.textContent = current ? '挑战中' : unlocked ? (i < game.s.bossIndex ? '已击败' : '可挑战') : `需 ${fmt(r.b.unlockAt)}`;
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
      c.bar.style.width = `${p.ratio * 100}%`;
      c.count.textContent = p.done ? '已达成' : `${fmt(p.value)} / ${fmt(p.target)}`;
    }
    sub.textContent = `已达成 ${done} / ${ACHIEVEMENTS.length}，成就给的碎片不会因转生消失。`;
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
    if (!confirm(`确定转生？将清空当前金币、建筑和升级，获得 ${gain} 个碎片。`)) return;
    const got = game.prestige();
    root.dispatchEvent(new CustomEvent('toast', { bubbles: true, detail: { text: `转生完成，获得 ${got} 个碎片`, kind: 'good' } }));
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
    gainValue.textContent = String(gain);
    const ratio = Math.min(1, game.s.totalEarned / B.PRESTIGE_THRESHOLD);
    progressFill.style.width = `${ratio * 100}%`;
    hint.textContent = gain > 0
      ? `本轮累计收益 ${fmt(game.s.totalEarned)}，现在转生可得 ${gain} 个碎片。`
      : `本轮累计收益 ${fmt(game.s.totalEarned)}，距 ${fmt(B.PRESTIGE_THRESHOLD)} 还差 ${fmt(Math.max(0, B.PRESTIGE_THRESHOLD - game.s.totalEarned))}。`;
    button.disabled = gain < 1;
    button.textContent = gain > 0 ? `转生（+${gain} 碎片）` : '还不够转生';
    for (const c of shopCards) {
      const level = game.s.shop[c.item.id] || 0;
      const maxed = level >= c.item.max;
      const cost = B.shopCost(c.item, level);
      c.lv.textContent = `Lv.${level} / ${c.item.max}`;
      c.cost.textContent = maxed ? '已满级' : `${cost} 碎片`;
      c.buy.disabled = maxed || game.s.shards < cost;
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
        c.card.hidden = lockedShown;
        lockedShown = true;
      }
      if (on) c.card.hidden = false;
      c.card.classList.toggle('locked', !on);
      c.title.textContent = on ? c.chapter.title : '这一页还是空白';
      c.text.textContent = on ? c.chapter.text : `解锁条件：${c.chapter.need}`;
      c.source.textContent = on ? c.chapter.source : '未解锁';
      c.freshTag.hidden = !(on && fresh.has(c.chapter.id));
      if (c.echo) c.echo.hidden = !on || game.s.rebirths < 1;
    }

    sub.textContent = `已收集 ${shown} / ${CHAPTERS.length} 篇。每完成一个里程碑，缝隙里就会多出一页记录${game.s.rebirths > 0 ? '；转生之后，读过的档案会多出一段「回响」' : ''}。`;
    foot.hidden = lockedLeft < 2;
    foot.textContent = lockedLeft > 1 ? `还有 ${lockedLeft - 1} 篇档案没有找到。` : '';
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
