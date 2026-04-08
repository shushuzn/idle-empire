<script>
  import ProgressBar from '../shared/ProgressBar.svelte';
  import { onMount } from 'svelte';

  let bossHp = $state(100);
  let bossMaxHp = $state(100);
  let bossName = $state('哥布林首领');
  let bossIcon = $state('👺');
  let bossReward = $state('500 💰');
  let isAttacking = $state(false);

  onMount(() => {
    window.updateBossUI?.();

    // Expose flash trigger for boss.js to call
    window.triggerBossAttackFlash = () => {
      isAttacking = true;
      setTimeout(() => { isAttacking = false; }, 150);
    };
  });
</script>

<div class="boss-panel">
  <div class="boss-header">
    <span class="boss-icon" class:attacking={isAttacking}>{bossIcon}</span>
    <div>
      <div class="boss-name">{bossName}</div>
      <div class="boss-sub">Boss 战斗中</div>
    </div>
  </div>
  <ProgressBar value={bossHp} max={bossMaxHp} color="crimson" showLabel />
  <div class="boss-reward">{bossReward}</div>
</div>

<style>
  .boss-panel {
    background: var(--crimson-bg);
    border: 1px solid rgba(201, 64, 64, 0.3);
    border-radius: 14px;
    padding: 14px;
  }

  .boss-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .boss-icon {
    font-size: 28px;
    animation: pulse 2s ease-in-out infinite;
  }

  .boss-name { font-size: 14px; font-weight: 700; }
  .boss-sub { font-size: 11px; color: var(--text-muted); }

  .boss-reward {
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    color: var(--gold-bright);
    margin-top: 8px;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  @keyframes boss-attack-flash {
    0% { filter: brightness(1); transform: scale(1); }
    30% { filter: brightness(2) drop-shadow(0 0 8px var(--crimson)); transform: scale(1.2); }
    100% { filter: brightness(1); transform: scale(1); }
  }

  .boss-icon.attacking {
    animation: boss-attack-flash 0.15s ease-out;
  }
</style>
