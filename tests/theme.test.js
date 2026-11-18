import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePref, resolveTheme } from '../src/ui/theme.js';

test('主题偏好只接受 auto/light/dark，其余落到跟随系统', () => {
  assert.equal(normalizePref('auto'), 'auto');
  assert.equal(normalizePref('light'), 'light');
  assert.equal(normalizePref('dark'), 'dark');
  assert.equal(normalizePref(null), 'auto');
  assert.equal(normalizePref('sepia'), 'auto');
});

test('跟随系统时按系统深浅色解析，手动选择则覆盖系统', () => {
  assert.equal(resolveTheme('auto', true), 'light');
  assert.equal(resolveTheme('auto', false), 'dark');
  assert.equal(resolveTheme('light', false), 'light');
  assert.equal(resolveTheme('dark', true), 'dark');
  assert.equal(resolveTheme('bogus', true), 'light');
});
