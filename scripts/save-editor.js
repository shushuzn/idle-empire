#!/usr/bin/env node
/**
 * Idle Empire Save Editor
 * Modify localStorage save data for offline time manipulation.
 *
 * Usage:
 *   node scripts/save-editor.js --offline-time <hours> [options]
 *   node scripts/save-editor.js --show
 *   node scripts/save-editor.js --set <key> <value>
 *
 * Options:
 *   --offline-time <hours>  Multiply offline earnings by this factor
 *   --dry-run               Show what would change without modifying
 *   --show                  Print current save data
 *   --set <key> <value>     Set a specific save key
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SAVE_KEY = 'idle_empire_save';
const COLLECTIBLES_KEY = 'idle_empire_collectibles';
const MILESTONES_KEY = 'idle_empire_milestones';
const TUTORIAL_KEY = 'idle_empire_tutorial_done';

const argMap = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const next = process.argv[i + 1];
    if (next && !next.startsWith('--')) {
      argMap[key] = next;
      i++;
    } else {
      argMap[key] = true;
    }
  }
}

function getProjectRoot() {
  return path.resolve(__dirname, '..');
}

function loadSaveFromDir(dir) {
  const savePath = path.join(dir, '.savebackup');
  if (fs.existsSync(savePath)) {
    try {
      return JSON.parse(fs.readFileSync(savePath, 'utf-8'));
    } catch {}
  }
  return null;
}

function saveSaveToDir(dir, data) {
  const savePath = path.join(dir, '.savebackup');
  fs.writeFileSync(savePath, JSON.stringify(data, null, 2));
}

function applyOfflineTime(save, hours) {
  if (typeof save !== 'object' || save === null) {
    console.error('Invalid save data format');
    return save;
  }
  // Set offline time in seconds
  const seconds = Math.floor(hours * 3600);
  if (!save.offlineTime) save.offlineTime = 0;
  const prev = save.offlineTime;
  save.offlineTime = seconds;
  console.log(`Offline time: ${prev}s → ${seconds}s (${hours}h)`);
  return save;
}

async function main() {
  const root = getProjectRoot();
  const dryRun = !!argMap['dry-run'];
  const show = !!argMap['show'];
  const offlineTime = argMap['offline-time'];
  const setKey = argMap['set'];
  const setValue = argMap['value'];

  if (!fs.existsSync(path.join(root, 'package.json'))) {
    console.error('Must be run from idle-empire project root');
    process.exit(1);
  }

  // Try to load existing save from project root
  let existingSave = null;
  for (const key of [SAVE_KEY, COLLECTIBLES_KEY, MILESTONES_KEY]) {
    const val = process.env[key];
    if (val) {
      try {
        existingSave = JSON.parse(Buffer.from(val, 'base64').toString('utf-8'));
        break;
      } catch {}
    }
  }

  if (show) {
    if (existingSave) {
      console.log('Current save:');
      console.log(JSON.stringify(existingSave, null, 2));
    } else {
      console.log('No save data found. Pass save data via environment variable:');
      console.log(`  SAVE_KEY=<base64-json> node scripts/save-editor.js --show`);
      console.log('');
      console.log('Or export from browser console:');
      console.log(`  btoa(JSON.stringify(localStorage.getItem('${SAVE_KEY}')))`);
    }
    return;
  }

  if (setKey) {
    let data = existingSave || {};
    const val = setValue ? JSON.parse(setValue) : true;
    data[setKey] = val;
    console.log(`Set ${setKey} = ${JSON.stringify(val)}`);
    if (!dryRun) {
      process.env[SAVE_KEY] = Buffer.from(JSON.stringify(data)).toString('base64');
      saveSaveToDir(root, data);
      console.log('Saved to project root .savebackup');
    }
    return;
  }

  if (offlineTime !== undefined) {
    const hours = parseFloat(offlineTime);
    if (isNaN(hours) || hours < 0) {
      console.error('Invalid offline-time value:', offlineTime);
      process.exit(1);
    }

    let data = existingSave || {};
    data = applyOfflineTime(data, hours);

    if (dryRun) {
      console.log('Dry run — no changes written');
    } else {
      process.env[SAVE_KEY] = Buffer.from(JSON.stringify(data)).toString('base64');
      saveSaveToDir(root, data);
      console.log('Wrote to project root .savebackup');
      console.log('');
      console.log('To use in browser:');
      console.log(`  localStorage.setItem('${SAVE_KEY}', JSON.stringify(/* copy from .savebackup */))`);
      console.log(`  Or: localStorage.setItem('${SAVE_KEY}', atob('${process.env[SAVE_KEY]}'))`);
    }
    return;
  }

  console.log(`Idle Empire Save Editor

Usage:
  node scripts/save-editor.js --offline-time <hours>  Set offline time
  node scripts/save-editor.js --show                   Show current save
  node scripts/save-editor.js --set <key> <value>      Set a save key
  node scripts/save-editor.js --dry-run                Preview changes

Environment:
  SAVE_KEY=<base64>   Pass localStorage save data directly
`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
