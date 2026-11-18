import { BUILDINGS, UPGRADES, BOSSES, ACHIEVEMENTS, SHOP } from '../game/data.js';
import { fmt, fmtInt } from './format.js';
import { buzz } from './haptics.js';
import { centerOf, floatText } from './floaters.js';
import { icon } from './icons.js';
import * as B from '../game/balance.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// 统一的图标格子：颜色由 data-tone 决定，具体映射在 app.css
function iconTile(name, tone, className = 'ico') {
  const node = el('div', className);
  node.dataset.tone = String(tone);
  node.append(icon(name));
  return node;
}

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

  const list = el('div', 'cards');
  root.append(list);

  const cards = BUILDINGS.map((b) => {
    const card = el('article', 'card building');
    card.dataset.id = b.id;
    const ico = iconTile(b.icon, BUILDING_TONE[b.id] || 2);
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
    const mult = B.productionMultiplier(game.s);
    for (const c of cards) {
      const unlocked = game.buildingUnlocked(c.b);
      c.card.hidden = !unlocked;
      if (!unlocked) continue;
      visible++;
      const count = game.owned(c.b.id);
      const { count: buyCount, cost } = game.bulk(c.b, game.s.buyMode);
      c.owned.textContent = `×${fmtInt(count)}`;
      c.prod.textContent = `每个 +${fmt(c.b.baseProduction * mult)}/秒`;
      c.buyLabel.textContent = buyCount > 0 ? `购买 ×${buyCount}` : '金币不足';
      c.buyCost.textContent = `${fmt(cost)} 金币`;
      c.buy.disabled = buyCount < 1 || game.s.gold < cost;
      c.card.classList.toggle('affordable', game.s.gold >= cost && buyCount > 0);
    }
    summary.textContent = `${visible} 种建筑 · 总产出 ${fmt(B.production(game.s))} /秒 · 点击 +${fmt(B.clickPower(game.s).perClick)}`;
  }

  return { el: root, update };
}

/* ---------------- 升级 ---------------- */

export function upgradesView(game) {
  const root = el('div', 'view-upgrades');
  root.append(el('h2', 'view-title', '升级'));
  const sub = el('p', 'view-sub', '一次性买断，转生后清零。');
  root.append(sub);

  const list = el('div', 'cards');
  root.append(list);

  const cards = UPGRADES.map((u) => {
    const card = el('article', 'card upgrade');
    card.dataset.id = u.id;
    const look = UPGRADE_LOOK[u.effect[0]] || UPGRADE_LOOK.global;
    const ico = iconTile(look.name, look.tone);
    const body = el('div', 'body');
    const nameRow = el('div', 'name-row');
    const name = el('span', 'name', u.name);
    const tag = el('span', 'tag');
    nameRow.append(name, tag);
    body.append(el('div', 'desc', u.desc));
    const cost = el('div', 'prod', `${fmt(u.cost)} 金币`);
    body.append(cost);
    const buy = el('button', 'buy');
    const label = el('b', 'buy-label', '购买');
    const price = el('span', 'buy-cost', fmt(u.cost));
    buy.append(label, price);
    card.append(ico, body, buy);
    list.append(card);
    buy.addEventListener('click', () => {
      if (game.buyUpgrade(u.id)) {
        card.classList.remove('pulse');
        void card.offsetWidth;
        card.classList.add('pulse');
      }
    });
    return { u, card, tag, buy, label, price };
  });

  function update() {
    for (const c of cards) {
      const state = game.upgradeAvailable(c.u);
      c.card.hidden = state === 'locked';
      c.card.classList.toggle('owned', state === 'owned');
      c.tag.textContent = state === 'owned' ? '已购买' : '';
      c.buy.hidden = state === 'owned';
      c.buy.disabled = game.s.gold < c.u.cost;
      c.card.classList.toggle('affordable', state === 'ok' && game.s.gold >= c.u.cost);
      c.price.textContent = fmt(c.u.cost);
    }
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
  const arenaIcon = iconTile('goblin', 1, 'arena-icon');
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
    const ico = el('span', 'boss-ico');
    ico.dataset.tone = String(toneOf(i));
    ico.append(icon(b.icon));
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
    arenaIcon.dataset.tone = String(toneOf(game.s.bossIndex));
    arenaIcon.replaceChildren(icon(info.boss.icon));
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

export const VIEWS = {
  buildings: buildingsView,
  upgrades: upgradesView,
  bosses: bossesView,
  achievements: achievementsView,
  prestige: prestigeView,
};
