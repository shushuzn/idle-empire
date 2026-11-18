import test from 'node:test';
import assert from 'node:assert/strict';
import { fmt, fmtInt, fmtTime, pct } from '../src/ui/format.js';

test('fmt 小数不留多余的 0，整数原样输出', () => {
  assert.equal(fmt(0), '0');
  assert.equal(fmt(2), '2');
  assert.equal(fmt(20), '20');
  assert.equal(fmt(1.5), '1.5');
  assert.equal(fmt(1.05), '1.05');
  assert.equal(fmt(5.54), '5.54');
  assert.equal(fmt(12.345), '12');
});

test('fmt 用 K/M/B 等后缀缩写大数', () => {
  assert.equal(fmt(999), '999');
  assert.equal(fmt(1000), '1K');
  assert.equal(fmt(1234), '1.23K');
  assert.equal(fmt(12345), '12.3K');
  assert.equal(fmt(1e6), '1M');
  assert.equal(fmt(1.5e9), '1.5B');
  assert.equal(fmt(1e12), '1T');
});

test('fmt 处理负数、无穷与非法值', () => {
  assert.equal(fmt(-1234), '-1.23K');
  assert.equal(fmt(Infinity), '∞');
  assert.equal(fmt(NaN), '0');
  assert.equal(fmt(undefined), '0');
});

test('fmtInt 向下取整并按中文习惯分组', () => {
  assert.equal(fmtInt(1234.7), '1,234');
  assert.equal(fmtInt(0.9), '0');
  assert.equal(fmtInt(1e6), '1,000,000');
});

test('fmtTime 按秒 / 分 / 小时 / 天分档', () => {
  assert.equal(fmtTime(0), '0 秒');
  assert.equal(fmtTime(59), '59 秒');
  assert.equal(fmtTime(60), '1 分 0 秒');
  assert.equal(fmtTime(3599), '59 分 59 秒');
  assert.equal(fmtTime(3661), '1 小时 1 分');
  assert.equal(fmtTime(90000), '1 天 1 小时');
  assert.equal(fmtTime(-5), '0 秒');
});

test('pct 夹在 0–100% 之间', () => {
  assert.equal(pct(0), '0%');
  assert.equal(pct(0.5), '50%');
  assert.equal(pct(1.2), '100%');
  assert.equal(pct(-1), '0%');
});
