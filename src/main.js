import './styles/global.css';
import './styles/theme-dark.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { startSync } from './gameAdapter.js';

document.addEventListener('DOMContentLoaded', () => {
  mount(App, { target: document.getElementById('app') });
  startSync();
});
