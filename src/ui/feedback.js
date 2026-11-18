// 反馈用的诊断信息：只放版本、环境和进度计数，不碰存档内容
export function buildDiagnostics({ version, pageUrl, userAgent, width, height, dpr, standalone, progress }) {
  const lines = [
    `版本：${version || '未知'}`,
    `页面：${pageUrl || ''}`,
    `浏览器：${userAgent || ''}`,
    `屏幕：${width}×${height} @${dpr}x`,
    `运行方式：${standalone ? '已安装 / 独立窗口' : '浏览器标签页'}`,
  ];
  if (progress) {
    lines.push(
      `进度：转生 ${progress.rebirths} 次，成就 ${progress.achievements} / ${progress.achievementTotal}，剧情 ${progress.story} / ${progress.storyTotal}`,
    );
  }
  return lines.join('\n');
}
