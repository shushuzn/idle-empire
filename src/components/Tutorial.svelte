<script>
  import { onMount } from 'svelte';

  let { onComplete } = $props();

  const STORAGE_KEY = 'idle_empire_tutorial_done';

  let currentStep = $state(0);
  let tooltipPos = $state({ top: 0, left: 0, arrow: 'bottom' });
  let highlightRect = $state(null);

  const steps = [
    {
      selector: '.gold-card',
      text: '欢迎来到挂机帝国！点击金币获取第一笔收入',
      action: 'click-gold',
    },
    {
      selector: '.building-grid .building-card:first-child',
      text: '金币用来购买建筑，建筑会自动产出金币',
      action: null,
    },
    {
      selector: '.nav-tab:nth-child(2)',
      text: '升级可以大幅提升产出效率',
      action: 'goto-upgrades',
    },
    {
      selector: '.nav-tab:nth-child(3)',
      text: '挑战Boss获得更多奖励',
      action: 'goto-bosses',
    },
    {
      selector: null,
      text: '开始你的帝国之旅！',
      action: 'complete',
    },
  ];

  function computePosition(selector) {
    const el = document.querySelector(selector);
    if (!el) {
      // Element not found, skip to next step
      nextStep();
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // small delay to let scroll complete
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      highlightRect = { top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 };

      const tooltipW = 280;
      const tooltipH = 100;
      const gap = 12;
      const arrowH = 10;

      let top, left, arrow;

      // Try below first
      if (rect.bottom + gap + tooltipH + arrowH < window.innerHeight) {
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        arrow = 'top';
      }
      // Try above
      else if (rect.top - gap - tooltipH - arrowH > 0) {
        top = rect.top - gap - tooltipH - arrowH;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        arrow = 'bottom';
      }
      // Try right
      else if (rect.right + gap + tooltipW < window.innerWidth) {
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.right + gap;
        arrow = 'left';
      }
      // Fallback: left
      else {
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.left - gap - tooltipW;
        arrow = 'right';
      }

      // Clamp to viewport
      left = Math.max(12, Math.min(left, window.innerWidth - tooltipW - 12));

      tooltipPos = { top, left, arrow };
    }, 200);
  }

  function nextStep() {
    const step = steps[currentStep];

    if (step.action === 'click-gold') {
      window.clickGold?.();
    } else if (step.action === 'goto-upgrades') {
      // Navigation updates activeTab via bind
    } else if (step.action === 'goto-bosses') {
      // Navigation updates activeTab via bind
    } else if (step.action === 'complete') {
      localStorage.setItem(STORAGE_KEY, '1');
      onComplete?.();
      return;
    }

    currentStep++;
    const next = steps[currentStep];
    if (next?.selector) {
      computePosition(next.selector);
    }
  }

  onMount(async () => {
    // Wait for child components to fully render
    await new Promise(r => setTimeout(r, 100));
    computePosition(steps[0].selector);
  });
</script>

<div class="tutorial-overlay" aria-live="polite">
  {#if highlightRect}
    <div
      class="highlight-ring"
      style="top:{highlightRect.top}px;left:{highlightRect.left}px;width:{highlightRect.width}px;height:{highlightRect.height}px"
    ></div>
  {/if}

  {#if steps[currentStep]?.selector || currentStep === steps.length - 1}
    <div
      class="tooltip"
      class:arrow-top={tooltipPos.arrow === 'top'}
      class:arrow-bottom={tooltipPos.arrow === 'bottom'}
      class:arrow-left={tooltipPos.arrow === 'left'}
      class:arrow-right={tooltipPos.arrow === 'right'}
      style="top:{tooltipPos.top}px;left:{tooltipPos.left}px"
    >
      <div class="step-indicator">{currentStep + 1} / {steps.length}</div>
      <p class="tooltip-text">{steps[currentStep].text}</p>
      <button class="next-btn" onclick={nextStep}>
        {currentStep === steps.length - 1 ? '完成' : '下一步'}
      </button>
    </div>
  {/if}
</div>

<style>
  .tutorial-overlay {
    position: fixed;
    inset: 0;
    z-index: 9000;
    pointer-events: none;
  }

  .highlight-ring {
    position: absolute;
    border: 2px solid var(--gold-bright);
    border-radius: 10px;
    box-shadow: 0 0 0 4px rgba(232, 197, 71, 0.2), var(--shadow-gold);
    animation: pulse 2s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 4px rgba(232, 197, 71, 0.2), var(--shadow-gold); }
    50% { box-shadow: 0 0 0 8px rgba(232, 197, 71, 0.35), 0 0 32px rgba(232, 197, 71, 0.4); }
  }

  .tooltip {
    position: absolute;
    width: 280px;
    background: var(--bg-elevated);
    border: 1px solid var(--gold-muted);
    border-radius: 14px;
    padding: 18px 20px;
    box-shadow: var(--shadow-lg), 0 0 24px rgba(232, 197, 71, 0.15);
    pointer-events: auto;
    animation: fadeUp 0.25s ease;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .tooltip::before {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    background: var(--bg-elevated);
    border: 1px solid var(--gold-muted);
    transform: rotate(45deg);
  }

  .tooltip.arrow-top::before {
    top: -7px;
    left: 50%;
    margin-left: -6px;
    border-bottom: none;
    border-right: none;
  }

  .tooltip.arrow-bottom::before {
    bottom: -7px;
    left: 50%;
    margin-left: -6px;
    border-top: none;
    border-left: none;
  }

  .tooltip.arrow-left::before {
    left: -7px;
    top: 50%;
    margin-top: -6px;
    border-right: none;
    border-bottom: none;
  }

  .tooltip.arrow-right::before {
    right: -7px;
    top: 50%;
    margin-top: -6px;
    border-left: none;
    border-top: none;
  }

  .step-indicator {
    font-size: 11px;
    color: var(--text-faint);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .tooltip-text {
    font-size: 14px;
    color: var(--text-base);
    line-height: 1.6;
    margin: 0 0 14px 0;
  }

  .next-btn {
    width: 100%;
    padding: 10px 16px;
    background: linear-gradient(135deg, var(--gold-bright), var(--gold-muted));
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    color: #18181B;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .next-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 20px rgba(232, 197, 71, 0.4);
  }
</style>
