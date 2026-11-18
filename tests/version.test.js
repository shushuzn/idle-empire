import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

// 规范见 VERSIONING.md：五处版本号必须一起改
test('版本号在五个位置保持一致', () => {
  const { version } = JSON.parse(read('package.json'));
  assert.match(version, /^\d+\.\d+\.\d+$/, 'package.json 的 version 不是 X.Y.Z');

  assert.ok(
    read('sw.js').includes(`idle-empire-v${version}`),
    `sw.js 的 CACHE 没跟上 v${version}，老用户会继续拿旧缓存`,
  );
  assert.ok(
    read('index.html').includes(`放置帝国 v${version}`),
    `index.html 设置底部的版本号没跟上 v${version}`,
  );
  assert.ok(
    read('README.md').includes(`version-${version}-`),
    `README 的版本徽章没跟上 v${version}`,
  );

  const firstEntry = read('CHANGELOG.md').match(/^## \[(\d+\.\d+\.\d+)\]/m);
  assert.equal(firstEntry?.[1], version, 'CHANGELOG 顶部条目不是当前版本');
});

// 版本历史：每个编号都要有发布日期，旧缓存名不能写成 idle_empire-
test('版本历史条目完整，缓存名书写一致', () => {
  const text = read('CHANGELOG.md');
  const entries = [...text.matchAll(/^## \[(\d+\.\d+\.\d+)\](.*)$/gm)];
  assert.ok(entries.length >= 1, 'CHANGELOG 的版本条目太少');
  for (const [, version, rest] of entries) {
    assert.match(rest, /^ - \d{4}-\d{2}-\d{2}$/, `${version} 缺少 YYYY-MM-DD 发布日期`);
  }
  assert.doesNotMatch(text, /idle_empire-v\d/, '缓存名应为 idle-empire-vX.Y.Z');
});

// 规范见 VERSIONING.md：同一天最多只有一个 MINOR 版本（第一位由用户决定，不参与统计）
test('同一天最多一个 MINOR 版本', () => {
  const policyDate = '2026-11-18';
  const entries = [...read('CHANGELOG.md').matchAll(/^## \[(\d+)\.(\d+)\.(\d+)\] - (\d{4}-\d{2}-\d{2})$/gm)]
    .map(([, major, minor, patch, date]) => ({ version: [+major, +minor, +patch], date }));

  const counts = new Map();
  for (const { version, date } of entries) {
    if (date < policyDate) continue;
    if (version[1] === 0 && version[2] === 0) continue; // X.0.0：第一位变更
    if (version[2] !== 0) continue;
    counts.set(date, (counts.get(date) || 0) + 1);
  }
  for (const [date, count] of counts) {
    assert.ok(count <= 1, `${date} 发布了 ${count} 个 MINOR 版本，同一天最多 1 个`);
  }
});
