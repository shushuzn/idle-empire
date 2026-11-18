import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

function walk(dir, acc = []) {
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(rel, acc);
    else acc.push(rel);
  }
  return acc;
}

const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const precached = new Set(
  [...sw.matchAll(/'\.\/([^']+)'/g)].map((m) => normalize(m[1])),
);

test('src 与 assets 下的每个文件都在 Service Worker 预缓存里', () => {
  // 少一个模块，离线时 import 失败，整个应用都会起不来
  const missing = [...walk('src'), ...walk('assets')].filter(
    (file) => !precached.has(normalize(file)),
  );
  assert.deepEqual(missing, []);
});

test('预缓存列表里没有已经不存在的文件', () => {
  const gone = [...precached].filter((file) => {
    try {
      readFileSync(join(root, file));
      return false;
    } catch {
      return true;
    }
  });
  assert.deepEqual(gone, []);
});

test('入口脚本与样式表也都在预缓存里', () => {
  // sw.js 由浏览器自己更新，不需要预缓存
  for (const file of ['index.html', 'manifest.webmanifest', 'assets/app.css', 'src/main.js']) {
    assert.ok(precached.has(file), `${file} 没有被预缓存`);
  }
});
