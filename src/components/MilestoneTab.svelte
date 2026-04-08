<script>
  import Card from '../shared/Card.svelte';
  import { onMount } from 'svelte';

  let milestones = $state([]);
  let totalBonus = $state(0);

  const MILESTONES_SRC = [
    { id: 'gold_100k', name: '财富积累', desc: '累计获得100K金币', icon: '💰', target: { type: 'gold', value: 100000 }, reward: { effect: 'gold', value: 0.1 }, tier: 1 },
    { id: 'gold_1m', name: '百万富翁', desc: '累计获得1M金币', icon: '💎', target: { type: 'gold', value: 1000000 }, reward: { effect: 'gold', value: 0.15 }, tier: 2 },
    { id: 'gold_10m', name: '千万富翁', desc: '累计获得10M金币', icon: '👑', target: { type: 'gold', value: 10000000 }, reward: { effect: 'gold', value: 0.2 }, tier: 3 },
    { id: 'gold_100m', name: '亿万富翁', desc: '累计获得100M金币', icon: '🏆', target: { type: 'gold', value: 100000000 }, reward: { effect: 'gold', value: 0.25 }, tier: 4 },
    { id: 'gold_1b', name: '财富神话', desc: '累计获得1B金币', icon: '🌟', target: { type: 'gold', value: 1000000000 }, reward: { effect: 'all', value: 0.3 }, tier: 5 },
    { id: 'buildings_50', name: '建筑大师', desc: '拥有50个建筑', icon: '🏗️', target: { type: 'buildings', value: 50 }, reward: { effect: 'gps', value: 0.2 }, tier: 2 },
    { id: 'buildings_100', name: '建筑帝国', desc: '拥有100个建筑', icon: '🏛️', target: { type: 'buildings', value: 100 }, reward: { effect: 'gps', value: 0.3 }, tier: 4 },
    { id: 'buildings_200', name: '建筑传奇', desc: '拥有200个建筑', icon: '🏰', target: { type: 'buildings', value: 200 }, reward: { effect: 'gps', value: 0.4 }, tier: 5 },
    { id: 'clicks_10k', name: '点金之手', desc: '累计点击10K次', icon: '🖱️', target: { type: 'clicks', value: 10000 }, reward: { effect: 'click', value: 0.25 }, tier: 3 },
    { id: 'clicks_50k', name: '点击大师', desc: '累计点击50K次', icon: '👆', target: { type: 'clicks', value: 50000 }, reward: { effect: 'click', value: 0.4 }, tier: 5 },
    { id: 'bosses_10', name: 'Boss猎手', desc: '击败10个Boss', icon: '⚔️', target: { type: 'bosses', value: 10 }, reward: { effect: 'boss', value: 0.3 }, tier: 3 },
    { id: 'bosses_50', name: 'Boss克星', desc: '击败50个Boss', icon: '💀', target: { type: 'bosses', value: 50 }, reward: { effect: 'boss', value: 0.5 }, tier: 5 },
    { id: 'upgrades_10', name: '升级达人', desc: '购买10个升级', icon: '⬆️', target: { type: 'upgrades', value: 10 }, reward: { effect: 'upgrade', value: 0.2 }, tier: 2 },
    { id: 'upgrades_20', name: '升级大师', desc: '购买20个升级', icon: '🔝', target: { type: 'upgrades', value: 20 }, reward: { effect: 'upgrade', value: 0.35 }, tier: 4 },
    { id: 'dynasty_5', name: '王朝崛起', desc: '达到王朝5级', icon: '👑', target: { type: 'dynasty', value: 5 }, reward: { effect: 'dynasty', value: 0.3 }, tier: 3 },
    { id: 'dynasty_10', name: '王朝传奇', desc: '达到王朝10级', icon: '🌟', target: { type: 'dynasty', value: 10 }, reward: { effect: 'dynasty', value: 0.5 }, tier: 5 },
    { id: 'gps_10k', name: '产能爆发', desc: '达到10K/s的产量', icon: '⚡', target: { type: 'gps', value: 10000 }, reward: { effect: 'gps', value: 0.25 }, tier: 3 },
    { id: 'gps_100k', name: '产能神话', desc: '达到100K/s的产量', icon: '🌊', target: { type: 'gps', value: 100000 }, reward: { effect: 'gps', value: 0.4 }, tier: 5 },
  ];

  let rawCollected = $state([]);

  onMount(() => {
    const poll = setInterval(() => {
      const raw = localStorage.getItem('idle_empire_milestones');
      rawCollected = raw ? JSON.parse(raw) : [];
      buildMilestones();
      calcBonus();
      if (window.G) { clearInterval(poll); }
    }, 100);
    return () => clearInterval(poll);
  });

  function getG() { return window.G || {}; }

  function getProgress(m) {
    const g = getG();
    switch (m.target.type) {
      case 'gold': return Math.min(1, (g.totalEarned || 0) / m.target.value);
      case 'buildings': return Math.min(1, Object.values(g.buildings || {}).reduce((a, b) => a + b, 0) / m.target.value);
      case 'clicks': return Math.min(1, (g.totalClicks || 0) / m.target.value);
      case 'bosses': return Math.min(1, (g.bossesDefeated || 0) / m.target.value);
      case 'upgrades': return Math.min(1, (g.upgrades || []).length / m.target.value);
      case 'dynasty': return Math.min(1, (g.dynastyLevel || 1) / m.target.value);
      case 'gps': return Math.min(1, (g.goldPerSecond || 0) / m.target.value);
      default: return 0;
    }
  }

  function buildMilestones() {
    const collectedIds = rawCollected.map(c => c.id);
    milestones = MILESTONES_SRC.map(m => ({
      ...m,
      unlocked: collectedIds.includes(m.id),
      progress: getProgress(m)
    }));
  }

  function calcBonus() {
    const unlocked = milestones.filter(m => m.unlocked);
    if (!unlocked.length) { totalBonus = 0; return; }
    const allType = unlocked.find(m => m.reward.effect === 'all');
    totalBonus = allType ? Math.round(allType.reward.value * 100) : 0;
  }

  function formatTarget(m) {
    const v = m.target.value;
    if (v >= 1e9) return (v/1e9).toFixed(1)+'B';
    if (v >= 1e6) return (v/1e6).toFixed(1)+'M';
    if (v >= 1e3) return (v/1e3).toFixed(0)+'K';
    return v.toLocaleString();
  }

  function rewardText(m) {
    const pct = Math.round(m.reward.value * 100);
    switch (m.reward.effect) {
      case 'gold': return `+${pct}% 金币收益`;
      case 'gps': return `+${pct}% 产量`;
      case 'click': return `+${pct}% 点击收益`;
      case 'boss': return `+${pct}% Boss伤害`;
      case 'upgrade': return `+${pct}% 升级效果`;
      case 'dynasty': return `+${pct}% 王朝增益`;
      case 'all': return `+${pct}% 所有收益`;
      default: return '';
    }
  }

  function tierColor(tier) {
    switch (tier) {
      case 1: return '#9ca3af';
      case 2: return '#22c55e';
      case 3: return '#3b82f6';
      case 4: return '#a855f7';
      case 5: return '#f59e0b';
      default: return '#9ca3af';
    }
  }
</script>

<div class="tab-header">
  <h1>🏆 里程碑</h1>
  <p class="subtitle">达成长期目标获得永久奖励</p>
</div>

<div class="miles-header">
  <span class="miles-count">{milestones.filter(m => m.unlocked).length} / {milestones.length} 已达成</span>
  {#if totalBonus > 0}
    <span class="miles-bonus">总奖励: +{totalBonus}% 所有收益</span>
  {/if}
</div>

<div class="miles-grid">
  {#each milestones as m (m.id)}
    <Card>
      <div class="mile-card" class:unlocked={m.unlocked} style="--tier-color: {tierColor(m.tier)}">
        <div class="m-icon">{m.unlocked ? m.icon : '🔒'}</div>
        <div class="m-info">
          <div class="m-name">{m.name}</div>
          <div class="m-desc">{m.desc}</div>
          <div class="m-reward">奖励: {rewardText(m)}</div>
          {#if !m.unlocked}
            <div class="m-progress">
              <div class="m-progress-fill" style="width: {Math.round(m.progress * 100)}%"></div>
            </div>
            <div class="m-target">{formatTarget(m.target)}</div>
          {/if}
        </div>
        <div class="m-tier" style="color: {tierColor(m.tier)}">T{m.tier}</div>
      </div>
    </Card>
  {/each}
</div>

<style>
  .tab-header { margin-bottom: 16px; }
  h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  .subtitle { color: var(--text-muted); font-size: 14px; }

  .miles-header {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
    font-size: 13px;
  }
  .miles-count { color: var(--text-base); font-weight: 600; }
  .miles-bonus { color: var(--gold-bright); font-weight: 600; }

  .miles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }

  .mile-card {
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: 0.45;
    border-left: 3px solid var(--tier-color);
    padding-left: 8px;
  }

  .mile-card.unlocked { opacity: 1; }

  .m-icon {
    font-size: 28px;
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-elevated);
    border-radius: 10px;
    flex-shrink: 0;
  }

  .mile-card.unlocked .m-icon {
    background: linear-gradient(135deg, color-mix(in srgb, var(--tier-color) 30%, transparent), transparent);
    border: 1px solid var(--tier-color);
  }

  .m-info { flex: 1; }
  .m-name { font-size: 14px; font-weight: 700; }
  .m-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  .m-reward { font-size: 11px; color: var(--emerald); margin-top: 4px; }
  .m-progress {
    height: 3px;
    background: var(--bg-elevated);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 6px;
  }
  .m-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--tier-color), color-mix(in srgb, var(--tier-color) 60%, white));
    border-radius: 2px;
    transition: width 0.3s ease;
  }
  .m-target { font-size: 10px; color: var(--text-faint); margin-top: 2px; }
  .m-tier { font-size: 14px; font-weight: 800; }
</style>
