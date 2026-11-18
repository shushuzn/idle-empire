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
