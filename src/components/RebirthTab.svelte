<script>
  import Card from '../shared/Card.svelte';
  import ProgressBar from '../shared/ProgressBar.svelte';
  import { onMount } from 'svelte';

  let rebirthData = $state({ currentPoints: 0, multiplier: 1, nextCost: 1000, rebirthCount: 0 });

  onMount(() => {
    window.updateRebirthUI?.();
    const interval = setInterval(() => {
      rebirthData = window.getRebirthData?.() || rebirthData;
    }, 500);
    return () => clearInterval(interval);
  });
</script>

<div class="tab-header">
  <h1>🔄 转生</h1>
  <p class="subtitle">转生获得永久强化</p>
</div>

<div class="rebirth-container">
  <Card>
    <div class="rebirth-card">
      <div class="r-icon">🔄</div>
      <div class="r-info">
        <div class="r-title">转生点数</div>
        <div class="r-points font-mono">{rebirthData.currentPoints}</div>
        <div class="r-mult">当前倍数: x{rebirthData.multiplier}</div>
      </div>
    </div>
    <div class="r-progress">
      <ProgressBar value={rebirthData.currentPoints} max={rebirthData.nextCost} color="amethyst" showLabel />
    </div>
    <button class="btn btn-purple" onclick={() => window.performRebirth?.()}>
      转生 (需要 {rebirthData.nextCost.toLocaleString()} 点)
    </button>
  </Card>

  <div class="talent-tree">
    <div class="talent-header">
      <div class="talent-title">🌟 终极天赋</div>
      <div class="talent-points">转生解锁深层强化</div>
    </div>
    <div class="talent-tiers">
      {#each [
        { id: 'idle', icon: '⚡', require: 1, name: 'Idle精通', desc: '+25% GPS' },
        { id: 'click', icon: '👆', require: 3, name: 'Click精通', desc: '+25% 点击伤害' },
        { id: 'boss', icon: '👹', require: 5, name: 'Boss精通', desc: '+25% Boss伤害' },
      ] as node}
        <div class="talent-tier">
          <div class="talent-tier-label">需 {node.require} 次转生</div>
          <div
            class="talent-node"
            class:unlocked={rebirthData.rebirthCount >= node.require}
            class:available={rebirthData.rebirthCount >= node.require}
            title={node.name + ': ' + node.desc}
          >{node.icon}</div>
          <div class="talent-node-require">{node.name}</div>
        </div>
        {#if node.id !== 'boss'}
          <div class="talent-connector" class:active={rebirthData.rebirthCount > node.require}></div>
        {/if}
      {/each}
    </div>
  </div>
</div>

<style>
  .tab-header { margin-bottom: 24px; }
  h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  .subtitle { color: var(--text-muted); font-size: 14px; }

  .rebirth-container { max-width: 480px; }

  .rebirth-card {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }

  .r-icon { font-size: 36px; }
  .r-title { font-size: 12px; color: var(--text-muted); text-transform: uppercase; }
  .r-points { font-size: 32px; font-weight: 800; color: var(--amethyst); }
  .r-mult { font-size: 12px; color: var(--text-muted); }

  .r-progress { margin: 16px 0; }

  .btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-purple {
    background: linear-gradient(135deg, var(--amethyst), #6B4FC0);
    color: #fff;
  }

  .btn-purple:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 20px rgba(139, 111, 204, 0.4);
  }

  .talent-tree {
    margin-top: 24px;
  }

  .talent-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .talent-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--amethyst);
  }

  .talent-points {
    font-size: 13px;
    color: var(--text-muted);
  }

  .talent-tiers {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .talent-tier {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .talent-tier-label {
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .talent-node {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    cursor: pointer;
    border: 2px solid var(--border-default);
    background: var(--bg-surface);
    transition: all 0.2s ease;
    position: relative;
  }

  .talent-node:hover:not(.locked) {
    transform: scale(1.1);
    border-color: var(--amethyst);
    box-shadow: 0 0 12px rgba(139, 111, 204, 0.4);
  }

  .talent-node.unlocked {
    background: linear-gradient(135deg, var(--amethyst), #6B4FC0);
    border-color: var(--amethyst);
    box-shadow: 0 0 10px rgba(139, 111, 204, 0.5);
  }

  .talent-node.locked {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .talent-node.available {
    border-color: var(--amethyst);
    animation: talent-pulse 2s ease-in-out infinite;
  }

  .talent-node-require {
    font-size: 9px;
    color: var(--text-faint);
    text-align: center;
  }

  .talent-connector {
    width: 12px;
    height: 2px;
    background: var(--border-default);
    margin-top: 24px;
  }

  .talent-connector.active {
    background: var(--amethyst);
  }

  @keyframes talent-pulse {
    0%, 100% { box-shadow: 0 0 4px rgba(139, 111, 204, 0.3); }
    50% { box-shadow: 0 0 12px rgba(139, 111, 204, 0.6); }
  }
</style>
