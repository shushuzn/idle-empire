// 页面骨架契约：标题、地标、标签页、社交预览与本地资源都要对得上
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICONS } from '../src/ui/icons.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(join(root, 'index.html'), 'utf8');

const attr = (tag) => {
  const match = html.match(tag);
  return match ? match[1] : null;
};

test('页面有一个 h1 品牌标题，开始页也有独立标题', () => {
  assert.match(html, /<h1 class="brand">[\s\S]*?放置帝国[\s\S]*?<\/h1>/);
  assert.match(html, /<h1 class="start-title">放置帝国<\/h1>/);
});

test('主内容用 main 地标，标签面板与标签列表结构合法', () => {
  assert.equal((html.match(/<main\b/g) || []).length, 1);
  assert.match(html, /<main class="view-wrap">\s*<div id="view" class="view" role="tabpanel"[^>]*tabindex="0"><\/div>\s*<\/main>/);
  assert.match(html, /<nav class="tabbar" aria-label="主导航">\s*<div id="tabbar" class="tablist" role="tablist"><\/div>\s*<\/nav>/);
  // tabpanel 不能再套在 main 上，否则 axe 会报 aria-allowed-role
  assert.doesNotMatch(html, /<main[^>]*role="tabpanel"/);
});

test('基础元信息齐全，手机端可安装', () => {
  assert.match(html, /<html lang="zh-CN"/);
  assert.match(html, /name="viewport"[^>]*viewport-fit=cover/);
  assert.ok(attr(/<title>([^<]+)<\/title>/).includes('放置帝国'));
  assert.ok(attr(/name="description" content="([^"]+)"/).length > 20);
  assert.match(html, /name="theme-color"/);
  assert.match(html, /rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(html, /rel="apple-touch-icon"/);
});

test('Open Graph 与 Twitter 预览完整，封面尺寸正确', () => {
  const og = Object.fromEntries(
    [...html.matchAll(/<meta property="(og:[a-z:]+)" content="([^"]*)"\s*\/?>/g)].map((m) => [m[1], m[2]]),
  );
  for (const key of ['og:type', 'og:title', 'og:description', 'og:url', 'og:image']) {
    assert.ok(og[key], `缺少 ${key}`);
  }
  assert.equal(og['og:type'], 'website');
  assert.equal(og['og:image:width'], '1200');
  assert.equal(og['og:image:height'], '630');
  assert.ok(og['og:locale']);

  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /name="twitter:title"/);
  assert.match(html, /name="twitter:image"/);

  // 封面必须是真实存在的本地文件，且与 og:image 指向同一路径
  const imagePath = new URL(og['og:image']).pathname.replace(/^\/idle-empire\//, '');
  assert.equal(imagePath, 'assets/og-cover.jpg');
  const file = join(root, imagePath);
  assert.ok(existsSync(file), 'OG 封面文件不存在');
  const bytes = readFileSync(file);
  assert.deepEqual([...bytes.subarray(0, 2)], [0xff, 0xd8], '封面应为 JPEG');
  assert.deepEqual([...bytes.subarray(-2)], [0xff, 0xd9], 'JPEG 应完整结束');
});

test('页面引用到的本地图标都在图标表里', () => {
  const names = [...html.matchAll(/data-icon="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(names.length > 0);
  for (const name of new Set(names)) {
    assert.ok(ICONS[name], `图标 ${name} 不存在于 ICONS`);
  }
});

test('页面引用到的本地资源都存在', () => {
  const refs = [...html.matchAll(/(?:href|src)="\.\/([^"#?]+)"/g)].map((m) => m[1]);
  assert.ok(refs.length > 0);
  for (const ref of new Set(refs)) {
    assert.ok(existsSync(join(root, ref)), `资源 ${ref} 不存在`);
  }
});
