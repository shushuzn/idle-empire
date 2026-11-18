// 点击飘字：固定定位一层，动画结束自动清理
const MAX = 8;

export function floatText(text, x, y, kind = '') {
  const host = document.getElementById('floaters');
  if (!host) return;
  while (host.children.length >= MAX) host.firstElementChild.remove();
  const node = document.createElement('span');
  node.className = `floater ${kind}`.trim();
  node.textContent = text;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  node.addEventListener('animationend', () => node.remove());
  setTimeout(() => node.remove(), 1000); // 减少动画时不会触发 animationend
  host.append(node);
}

export function centerOf(node) {
  const r = node.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
