import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDiagnostics } from '../src/ui/feedback.js';

test('反馈诊断信息包含版本、环境与进度', () => {
  const text = buildDiagnostics({
    version: '3.1.8',
    pageUrl: 'https://example.com/idle-empire/#story',
    userAgent: 'TestBrowser/1.0',
    width: 390,
    height: 844,
    dpr: 3,
    standalone: false,
    progress: { rebirths: 2, achievements: 5, achievementTotal: 20, story: 3, storyTotal: 18 },
  });

  assert.match(text, /^版本：3\.1\.8/m);
  assert.match(text, /^页面：https:\/\/example\.com\/idle-empire\/#story$/m);
  assert.match(text, /^浏览器：TestBrowser\/1\.0$/m);
  assert.match(text, /^屏幕：390×844 @3x$/m);
  assert.match(text, /^运行方式：浏览器标签页$/m);
  assert.match(text, /^进度：转生 2 次，成就 5 \/ 20，剧情 3 \/ 18$/m);
});

test('缺少版本或进度时也能给出可用文本', () => {
  const text = buildDiagnostics({ width: 360, height: 640, dpr: 2, standalone: true });
  assert.match(text, /^版本：未知$/m);
  assert.match(text, /^运行方式：已安装 \/ 独立窗口$/m);
  assert.ok(!text.includes('进度：'));
});
