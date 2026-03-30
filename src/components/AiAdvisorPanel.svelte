<script>
  import { onMount } from 'svelte';
  import { analyzeGameState } from '../aiAdvisor.js';
  import { goldStore } from '../gameAdapter.js';

  let advice = $state(null);
  let loading = $state(false);

  function refreshAdvice() {
    loading = true;
    setTimeout(() => {
      advice = analyzeGameState(window.G);
      loading = false;
    }, 50);
  }

  onMount(() => {
    refreshAdvice();
    // 每 5 秒刷新一次（降低频率）
    const interval = setInterval(refreshAdvice, 5000);
    return () => clearInterval(interval);
  });

  function confidenceColor(c) {
    if (c === 'high') return '#4ade80';
    if (c === 'medium') return '#fbbf24';
    return '#94a3b8';
  }
</script>

<div class="ai-panel">
  <div class="panel-header">
    <span class="panel-icon">🤖</span>
    <span class="panel-title">AI 策略顾问</span>
    <button class="refresh-btn" onclick={refreshAdvice} disabled={loading}>
      {loading ? '⏳' : '🔄'}
    </button>
  </div>

  {#if advice}
    <div class="advice-card" style="border-color: {confidenceColor(advice.confidence)}33">
      <div class="advice-type">
        {#if advice.type === 'building'}🏗️ 建筑推荐
        {:else if advice.type === 'upgrade'}⬆️ 升级推荐
        {:else if advice.type === 'boss'}👹 Boss 战斗
        {:else if advice.type === 'rebirth'}👑 转生建议
        {:else if advice.type === 'click_farm'}👆 点击积累
        {:else if advice.type === 'wait'}⏳ 等待中
        {:else}💡 建议{/if}
        <span class="confidence" style="color: {confidenceColor(advice.confidence)}">
          {advice.confidence === 'high' ? '● 高置信' : advice.confidence === 'medium' ? '◐ 中置信' : '○ 低置信'}
        </span>
      </div>

      <div class="advice-content">{advice.reason}</div>

      {#if advice.type === 'building' && advice.target}
        <div class="advice-detail">
          <div class="detail-row">
            <span class="detail-label">推荐建筑</span>
            <span class="detail-value building-name">{advice.target.icon} {advice.target.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">下一个价格</span>
            <span class="detail-value">{advice.target.nextCost.toLocaleString()} 💰</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">边际 GPS</span>
            <span class="detail-value gps">+{advice.target.marginalGps.toFixed(2)}/s</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">已拥有</span>
            <span class="detail-value">{advice.target.count}</span>
          </div>
          {#if advice.buyCount && advice.buyCount > 1}
            <div class="detail-row">
              <span class="detail-label">建议购买</span>
              <span class="detail-value gold">{advice.buyCount} 个</span>
            </div>
            <div class="action-hint">📌 批量购买更划算（x{advice.buyCount >= 10 ? '10' : advice.buyCount}）</div>
          {:else if advice.target.count === 0}
            <div class="action-hint">💡 第一个建筑，性价比最高！</div>
          {/if}
        </div>
      {/if}

      {#if advice.type === 'upgrade' && advice.target}
        <div class="advice-detail">
          <div class="detail-row">
            <span class="detail-label">推荐升级</span>
            <span class="detail-value upgrade-name">⚡ {advice.target.id}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">效果</span>
            <span class="detail-value">{advice.target.desc}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">价格</span>
            <span class="detail-value">{advice.target.cost.toLocaleString()} 💰</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">收益提升</span>
            <span class="detail-value gps">+{Math.floor(advice.target.gpsGain)}/s</span>
          </div>
        </div>
      {/if}

      {#if advice.type === 'boss' && advice.targetGold && advice.targetGold > 0}
        <div class="advice-detail">
          <div class="detail-row">
            <span class="detail-label">目标金币</span>
            <span class="detail-value">{Math.floor(advice.targetGold).toLocaleString()} 💰</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">当前金币</span>
            <span class="detail-value">{Math.floor($goldStore).toLocaleString()} 💰</span>
          </div>
          <div class="progress-bar-wrap">
            <div
              class="progress-bar-fill boss"
              style="width: {Math.min(100, ($goldStore / advice.targetGold) * 100)}%"
            ></div>
          </div>
        </div>
      {/if}

      {#if advice.type === 'rebirth'}
        <div class="advice-detail">
          <button class="btn btn-purple" onclick={() => window.performPrestige?.()}>
            👑 立即转生
          </button>
        </div>
      {/if}

      {#if advice.type === 'wait' && advice.nextCost}
        <div class="advice-detail">
          <div class="detail-row">
            <span class="detail-label">当前金币</span>
            <span class="detail-value">{Math.floor($goldStore).toLocaleString()} 💰</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">目标</span>
            <span class="detail-value">{Math.floor(advice.nextCost).toLocaleString()} 💰</span>
          </div>
          <div class="progress-bar-wrap">
            <div
              class="progress-bar-fill wait"
              style="width: {Math.min(100, ($goldStore / advice.nextCost) * 100)}%"
            ></div>
          </div>
        </div>
      {/if}
    </div>

    {#if advice.upgrade && advice.type === 'building'}
      <div class="sub-advice">
        <div class="sub-item">
          <span class="sub-label">💡 次选升级</span>
          <span class="sub-value">{advice.upgrade.id}（+{Math.floor(advice.upgrade.gpsGain)} GPS）</span>
        </div>
      </div>
    {/if}
  {:else}
    <div class="loading">⏳ 分析中...</div>
  {/if}

  <div class="algo-note">
    🤖 本地算法 · 无外部 API · 数据不离开浏览器
  </div>
</div>

<style>
  .ai-panel {
    background: var(--bg-surface, #1e1e2e);
    border: 1px solid var(--border-default, #3a3a5c);
    border-radius: 12px;
    padding: 14px;
    margin-top: 8px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .panel-icon { font-size: 18px; }

  .panel-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary, #e2e8f0);
    flex: 1;
  }

  .refresh-btn {
    background: none;
    border: 1px solid var(--border-subtle, #3a3a5c);
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }

  .refresh-btn:hover:not(:disabled) {
    background: var(--bg-elevated, #2a2a3e);
  }

  .refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .advice-card {
    background: var(--bg-base, #16161e);
    border: 1px solid;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 8px;
  }

  .advice-type {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary, #94a3b8);
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .confidence { font-size: 10px; font-weight: 400; }

  .advice-content {
    font-size: 13px;
    color: var(--text-primary, #e2e8f0);
    line-height: 1.5;
    margin-bottom: 10px;
  }

  .advice-detail {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
  }

  .detail-label { color: var(--text-muted, #64748b); }
  .detail-value { color: var(--text-secondary, #cbd5e1); font-weight: 500; }
  .detail-value.gps { color: #4ade80; }
  .detail-value.gold { color: #fbbf24; }
  .building-name, .upgrade-name { color: #fbbf24; }

  .action-hint {
    font-size: 11px;
    color: #4ade80;
    margin-top: 4px;
    padding: 4px 8px;
    background: rgba(74, 222, 128, 0.1);
    border-radius: 4px;
  }

  .progress-bar-wrap {
    height: 4px;
    background: var(--bg-elevated, #2a2a3e);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 4px;
  }

  .progress-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .progress-bar-fill.boss {
    background: linear-gradient(90deg, #f87171, #fb923c);
  }

  .progress-bar-fill.wait {
    background: linear-gradient(90deg, #4ade80, #22d3ee);
  }

  .sub-advice {
    padding: 8px;
    background: rgba(251, 191, 36, 0.05);
    border-radius: 6px;
    margin-bottom: 8px;
  }

  .sub-item {
    display: flex;
    gap: 8px;
    font-size: 11px;
  }

  .sub-label { color: #fbbf24; white-space: nowrap; }
  .sub-value { color: var(--text-muted, #94a3b8); }

  .loading {
    text-align: center;
    padding: 20px;
    color: var(--text-muted, #64748b);
    font-size: 13px;
  }

  .algo-note {
    font-size: 10px;
    color: var(--text-faint, #475569);
    text-align: center;
    margin-top: 8px;
  }

  .btn {
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
  }

  .btn-purple {
    background: linear-gradient(135deg, #8b5cf6, #6d28d9);
    color: #fff;
  }

  .btn-purple:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 16px rgba(139, 92, 246, 0.5);
  }
</style>
