// 游戏引擎：状态变更、购买、Boss、转生、成就、剧情。UI 只负责展示与派发事件
import { BUILDINGS, UPGRADES, BOSSES, ACHIEVEMENTS, SHOP } from './data.js';
import { CHAPTERS, chapterUnlocked } from './story.js';
import * as B from './balance.js';
import { save } from './state.js';

export const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
export const UPGRADE_BY_ID = new Map(UPGRADES.map((u) => [u.id, u]));
export const BUILDING_BY_ID = new Map(BUILDINGS.map((b) => [b.id, b]));

export class Game {
  constructor(state, hooks = {}) {
    this.state = state;
    this.hooks = hooks;
    this.saveTimer = 0;
    this.achievementTimer = 0;
    if (!this.state.story) this.state.story = { unlocked: [], read: [] };
    if (!this.state.bossKills) this.state.bossKills = {};
  }

  get s() {
    return this.state;
  }

  addGold(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.s.gold += amount;
    this.s.totalEarned += amount;
    this.s.lifetimeEarned += amount;
  }

  tap() {
    this.s.clicks += 1;
    if (this.s.tideStarted && B.tideState(this.s).phase.id === 'calm') {
      this.s.calmClicks = (this.s.calmClicks || 0) + 1;
    }
    this.addGold(B.clickPower(this.s).perClick);
  }

  // 玩家进入游戏后才启动潮汐；重复调用只补记当前潮段，不会重置计时
  startTide() {
    return B.startTide(this.s);
  }

  owned(buildingId) {
    return this.s.buildings[buildingId] || 0;
  }

  buildingUnlocked(building) {
    if (this.owned(building.id) > 0) return true;
    if (building.rebirthRequired && this.s.rebirths < 1) return false;
    if (building.unlockOwned) {
      for (const [id, need] of Object.entries(building.unlockOwned)) {
        if (this.owned(id) < need) return false;
      }
    }
    const i = BUILDINGS.indexOf(building);
    const prev = BUILDINGS[i - 1];
    if (!prev) return true;
    return this.s.lifetimeEarned >= prev.baseCost * 0.4 || this.owned(building.id) > 0;
  }

  nextCost(building) {
    return B.costOf(building, this.owned(building.id));
  }

  bulk(building, mode = this.s.buyMode) {
    const owned = this.owned(building.id);
    if (mode === 'max') return B.maxAffordable(building, owned, this.s.gold);
    const count = mode === 'x10' ? 10 : 1;
    return { count, cost: B.bulkCost(building, owned, count) };
  }

  buyBuilding(buildingId, mode = this.s.buyMode) {
    const building = BUILDING_BY_ID.get(buildingId);
    if (!building || !this.buildingUnlocked(building)) return false;
    const { count, cost } = this.bulk(building, mode);
    if (count < 1 || this.s.gold < cost) return false;
    this.s.gold -= cost;
    this.s.buildings[buildingId] = this.owned(buildingId) + count;
    this.checkAchievements();
    this.checkResonance();
    return true;
  }

  upgradeAvailable(upgrade) {
    if (this.s.upgrades.includes(upgrade.id)) return 'owned';
    if (upgrade.req && !this.s.upgrades.includes(upgrade.req)) return 'locked';
    if (upgrade.reqResonance && B.maxResonanceTier(this.s) < upgrade.reqResonance) return 'locked';
    if (upgrade.reqBuilding) {
      for (const [id, need] of Object.entries(upgrade.reqBuilding)) {
        if (this.owned(id) < need) return 'locked';
      }
    }
    return 'ok';
  }

  buyUpgrade(upgradeId) {
    const upgrade = UPGRADE_BY_ID.get(upgradeId);
    if (!upgrade || this.upgradeAvailable(upgrade) !== 'ok') return false;
    if (this.s.gold < upgrade.cost) return false;
    this.s.gold -= upgrade.cost;
    this.s.upgrades.push(upgradeId);
    this.checkAchievements();
    return true;
  }

  shopCost(item) {
    return B.shopCost(item, this.s.shop[item.id] || 0);
  }

  buyShop(itemId) {
    const item = SHOP.find((i) => i.id === itemId);
    if (!item) return false;
    const level = this.s.shop[itemId] || 0;
    if (level >= item.max) return false;
    const cost = this.shopCost(item);
    if (this.s.shards < cost) return false;
    this.s.shards -= cost;
    this.s.shop[itemId] = level + 1;
    return true;
  }

  currentBoss() {
    let index = this.s.bossIndex;
    // 若当前 Boss 条件不满足（例如旧档越界），回退到已解锁的最后一个
    while (index > 0 && !this.bossUnlocked(BOSSES[index])) index--;
    this.s.bossIndex = index;
    return BOSSES[index];
  }

  bossUnlocked(boss) {
    return this.s.lifetimeEarned >= boss.unlockAt && (!boss.rebirthRequired || this.s.rebirths >= 1);
  }

  bossState() {
    const boss = this.currentBoss();
    const phase = boss.phases === 2 && this.s.bossPhase === 2 ? 2 : 1;
    const maxHp = phase === 2 ? boss.hp * 0.6 : boss.hp;
    const focus = boss.weaknessSwitch
      ? (Math.floor((this.s.bossHits || 0) / 3) % 2 === 0 ? 'click' : 'building')
      : null;
    if (!this.bossUnlocked(boss)) {
      return {
        boss, hp: maxHp, maxHp, unlocked: false, phase, shielded: false, shieldPct: 0,
        shieldHp: 0, focus, stormLocked: false, shieldRegen: boss.shieldRegen || 0,
        next: BOSSES[this.s.bossIndex + 1],
      };
    }
    if (this.s.bossHp === null || !Number.isFinite(this.s.bossHp)) this.s.bossHp = maxHp;
    const hp = Math.min(Math.max(0, this.s.bossHp), maxHp);
    const shieldPct = phase === 1 ? boss.shield || 0 : 0;
    const shieldHp = maxHp * shieldPct;
    const shielded = shieldHp > 0 && hp > maxHp - shieldHp;
    // 季风巨鲸的护盾只在风暴潮段可以被击破，其余时候最多压到 1 点
    const stormLocked = Boolean(
      shielded && boss.stormShield && B.tideState(this.s).phase.id !== 'storm',
    );
    const next = BOSSES[this.s.bossIndex + 1];
    return {
      boss,
      hp,
      maxHp,
      unlocked: true,
      phase,
      shielded,
      shieldPct,
      shieldHp,
      shieldLeft: Math.max(0, hp - (maxHp - shieldHp)),
      focus,
      stormLocked,
      shieldRegen: boss.shieldRegen || 0,
      next,
    };
  }

  attack() {
    const info = this.bossState();
    if (!info.unlocked) return null;
    const damage = B.bossDamage(this.s, {
      shielded: info.shielded,
      phase2: info.phase === 2,
      weakness: info.focus,
    });
    let hp = info.hp - damage;
    if (info.stormLocked) {
      // 护盾锁定时最多压到护盾线之上，不能直接击穿；按最大生命取相对余量，避免大数值下 +1 被浮点吞掉
      const guard = info.maxHp - info.shieldHp;
      const lockFloor = guard + Math.max(1, info.maxHp * 1e-9);
      hp = Math.max(hp, Math.min(info.hp, lockFloor));
    }
    const actual = Math.max(0, info.hp - hp);
    if (info.boss.weaknessSwitch) this.s.bossHits = (this.s.bossHits || 0) + 1;
    let brokeShield = false;
    if (info.shielded && hp <= info.maxHp - info.shieldHp) {
      this.s.shieldsBroken += 1;
      brokeShield = true;
    }
    const result = { damage: actual, brokeShield, phase: 0, killed: null, reward: 0, focus: info.focus };
    if (hp > 0) {
      this.s.bossHp = hp;
      if (brokeShield) this.checkAchievements();
      return result;
    }

    // 二阶段 Boss 第一段血空后不回奖励，直接进入 60% 血的第二段
    if (info.boss.phases === 2 && info.phase === 1) {
      this.s.bossPhase = 2;
      this.s.bossHp = info.boss.hp * 0.6;
      result.phase = 2;
      this.checkAchievements();
      return result;
    }

    const killed = info.boss;
    const reward = B.bossReward(killed);
    this.s.kills += 1;
    this.s.bossKills[killed.id] = (this.s.bossKills[killed.id] || 0) + 1;
    this.s.bossHits = 0;
    if (killed.phases === 2) this.s.phaseKills += 1;
    this.addGold(reward);
    const nextIndex = this.s.bossIndex + 1;
    const next = BOSSES[nextIndex];
    this.s.bossPhase = 1;
    if (next && this.bossUnlocked(next)) {
      this.s.bossIndex = nextIndex;
      this.s.bossHp = next.hp;
    } else {
      // 已是当前能打的最后一个 Boss：原地满血重来，可以继续刷击杀数
      this.s.bossHp = killed.hp;
    }
    result.killed = killed;
    result.reward = reward;
    this.checkAchievements();
    this.checkStory();
    return result;
  }

  canPrestige() {
    return B.shardsFor(this.s.totalEarned) > 0;
  }

  prestigeGain() {
    return B.shardsFor(this.s.totalEarned);
  }

  prestige() {
    const gain = this.prestigeGain();
    if (gain < 1) return 0;
    this.checkStory(); // 先把本轮达成的章节记下来，再清空进度
    const tide = B.tideState(this.s);
    if (tide.started && (tide.phase.id === 'calm' || tide.monsoon.id === 'hush')) {
      this.s.calmPrestiges = (this.s.calmPrestiges || 0) + 1;
    }
    this.s.shards += gain;
    this.s.rebirths += 1;
    this.s.gold = 0;
    this.s.totalEarned = 0;
    this.s.buildings = {};
    this.s.upgrades = [];
    this.s.bossIndex = 0;
    this.s.bossHp = null;
    this.s.bossPhase = 1;
    this.s.bossHits = 0;
    this.checkAchievements();
    this.checkStory();
    return gain;
  }

  achievementProgress(achievement) {
    const [type, target] = achievement.cond;
    const s = this.s;
    let value = 0;
    switch (type) {
      case 'buildings': value = Object.values(s.buildings).reduce((a, b) => a + b, 0); break;
      case 'clicks': value = s.clicks; break;
      case 'kills': value = s.kills; break;
      case 'earned': value = s.lifetimeEarned; break;
      case 'upgrades': value = s.upgrades.length; break;
      case 'rebirths': value = s.rebirths; break;
      case 'shards': value = s.shards; break;
      case 'resonance': value = B.maxResonanceTier(s); break;
      case 'resonanceCount': value = B.resonanceCount(s); break;
      case 'story': value = s.story.unlocked.length; break;
      case 'shields': value = s.shieldsBroken; break;
      case 'phases': value = s.phaseKills; break;
      case 'building': value = s.buildings[achievement.cond[2]] || 0; break;
      case 'tidephase': value = s.tideCounts?.[achievement.cond[2]] || 0; break;
      case 'tidetotal': value = B.tideTotal(s); break;
      case 'monsoon': value = s.monsoonSeen?.length || 0; break;
      case 'monsooncount': value = s.monsoonChanges || 0; break;
      case 'bosskill': value = s.bossKills?.[achievement.cond[2]] || 0; break;
      case 'calmprestige': value = s.calmPrestiges || 0; break;
      case 'calmclicks': value = s.calmClicks || 0; break;
      case 'newbuildings': value = Math.min(...['mill', 'salt', 'stormtower', 'ranch'].map((id) => s.buildings[id] || 0)); break;
      default: value = 0;
    }
    return { value, target, done: s.achievements.includes(achievement.id), ratio: Math.min(1, target ? value / target : 0) };
  }

  checkAchievements() {
    const unlocked = [];
    for (const a of ACHIEVEMENTS) {
      if (this.s.achievements.includes(a.id)) continue;
      if (this.achievementProgress(a).value >= a.cond[1]) {
        this.s.achievements.push(a.id);
        const [type, amount] = a.reward;
        if (type === 'gold') this.addGold(amount);
        else if (type === 'shards') this.s.shards += amount;
        unlocked.push(a);
      }
    }
    if (unlocked.length && this.hooks.onAchievement) this.hooks.onAchievement(unlocked);
    return unlocked;
  }

  // 回响等级只升不降，记下已经提示过的等级，避免每次买建筑都弹一遍
  checkResonance() {
    const seen = new Set(this.s.resonanceSeen || []);
    const gained = [];
    for (const building of BUILDINGS) {
      const tier = B.resonanceTier(this.s, building.id);
      if (!tier) continue;
      const key = `${building.id}:${tier}`;
      if (seen.has(key)) continue;
      seen.add(key);
      gained.push({ building, tier });
    }
    if (!gained.length) return gained;
    this.s.resonanceSeen = [...seen];
    if (this.hooks.onResonance) this.hooks.onResonance(gained);
    return gained;
  }

  // 剧情章节一经解锁就永久保留，转生清空进度也不会丢
  checkStory() {
    const unlockedNow = [];
    for (const chapter of CHAPTERS) {
      if (this.s.story.unlocked.includes(chapter.id)) continue;
      if (!chapterUnlocked(chapter, this.s)) continue;
      this.s.story.unlocked.push(chapter.id);
      unlockedNow.push(chapter);
    }
    if (unlockedNow.length && this.hooks.onStory) this.hooks.onStory(unlockedNow);
    return unlockedNow;
  }

  unreadStory() {
    const read = new Set(this.s.story.read);
    return this.s.story.unlocked.filter((id) => !read.has(id));
  }

  markStoryRead() {
    this.s.story.read = [...this.s.story.unlocked];
  }

  tick(dt, now = performance.now()) {
    // 潮段先于产出推进：换段当帧就按新潮段的加成结算
    const tideChanged = B.advanceTide(this.s, dt);
    if (tideChanged) {
      this.checkAchievements();
      this.checkStory();
      if (this.hooks.onTide) this.hooks.onTide(B.tideState(this.s), tideChanged);
    }
    this.regenerateBossShield(dt);

    const gain = B.totalPerSecond(this.s) * dt;
    if (gain > 0) this.addGold(gain);

    this.achievementTimer += dt;
    if (this.achievementTimer >= 0.5) {
      this.achievementTimer = 0;
      this.checkAchievements();
      this.checkStory();
    }

    this.saveTimer += dt;
    if (this.saveTimer >= 15) {
      this.saveTimer = 0;
      save(this.s);
    }
  }

  // 风暴之眼：护盾未被击破时缓慢回复，逼玩家在破盾窗口里集中输出
  regenerateBossShield(dt) {
    const boss = BOSSES[this.s.bossIndex];
    if (!boss || !boss.shieldRegen || !this.s.tideStarted) return;
    if (this.s.bossHp === null || !Number.isFinite(this.s.bossHp)) return;
    const info = this.bossState();
    if (!info.unlocked || !info.shielded) return;
    const regen = info.maxHp * boss.shieldRegen * dt;
    this.s.bossHp = Math.min(info.maxHp, info.hp + regen);
  }
}
