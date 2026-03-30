/**
 * main.js — Svelte 挂载入口
 *
 * 所有游戏数据同步逻辑在 gameAdapter.js（单一数据源）。
 * 本文件仅负责 Svelte App 的 mount。
 */
import './styles/global.css';
import './styles/theme-dark.css';
import { mount } from 'svelte';
import App from './App.svelte';

document.addEventListener('DOMContentLoaded', () => {
  mount(App, { target: document.getElementById('app') });
});
