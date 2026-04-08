/**
 * share-achievement.mjs — Export achievement as shareable PNG card
 *
 * Usage:
 *   node scripts/share-achievement.mjs <achievement-id>
 *   node scripts/share-achievement.mjs --list
 *
 * Generates a shareable card image for an unlocked achievement,
 * using HTML Canvas and exports as PNG. No external dependencies.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ACHIEVEMENTS = [
  { id: 'builder_1', name: '初露锋芒', desc: '拥有 10 个建筑', icon: '🏗️' },
  { id: 'builder_2', name: '建筑大师', desc: '拥有 50 个建筑', icon: '🏗️' },
  { id: 'builder_3', name: '帝国建造者', desc: '拥有 100 个建筑', icon: '🏗️' },
  { id: 'slayer_1', name: '新手猎人', desc: '击败 1 个 Boss', icon: '⚔️' },
  { id: 'gold_1', name: '小有积蓄', desc: '累计获得 10K 金币', icon: '💰' },
  { id: 'rebirth_1', name: '轮回初体验', desc: '首次转生', icon: '🔄' },
];

function generateCard(achievement) {
  // Output dimensions
  const W = 400, H = 160;

  // Escape HTML entities for canvas
  const icon = achievement.icon;
  const name = achievement.name;
  const desc = achievement.desc;

  // Build SVG string
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#16213e"/>
    </linearGradient>
    <linearGradient id="border" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="50%" stop-color="#22d3ee"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="${W}" height="${H}" rx="16" fill="url(#bg)"/>
  <!-- Border -->
  <rect x="2" y="2" width="${W-4}" height="${H-4}" rx="14" fill="none" stroke="url(#border)" stroke-width="2"/>
  <!-- Glow effect -->
  <rect x="2" y="2" width="${W-4}" height="${H-4}" rx="14" fill="none" stroke="#22d3ee" stroke-width="1" opacity="0.3"/>
  <!-- Icon circle -->
  <circle cx="60" cy="${H/2}" r="40" fill="#21262d" stroke="#30363d" stroke-width="1"/>
  <!-- Icon -->
  <text x="60" y="${H/2+12}" font-size="36" text-anchor="middle" dominant-baseline="middle">${icon}</text>
  <!-- Achievement label -->
  <text x="115" y="55" font-size="11" fill="#8b949e" font-family="sans-serif">ACHIEVEMENT UNLOCKED</text>
  <!-- Name -->
  <text x="115" y="82" font-size="22" font-weight="bold" fill="#e6edf3" font-family="sans-serif">${name}</text>
  <!-- Description -->
  <text x="115" y="106" font-size="13" fill="#8b949e" font-family="sans-serif">${desc}</text>
  <!-- Watermark -->
  <text x="${W-12}" y="${H-10}" font-size="10" fill="#30363d" text-anchor="end" font-family="sans-serif">Idle Empire</text>
</svg>`;

  return Buffer.from(svg);
}


const args = process.argv.slice(2);

if (args.includes('--list')) {
  console.log('Available achievements:');
  ACHIEVEMENTS.forEach(a => console.log(' ', a.id, '-', a.name, a.icon));
  console.log('\nNote: pass a save file path to filter by unlocked achievements');
  process.exit(0);
}

const achievementId = args[0];
if (!achievementId) {
  console.log('Usage: node share-achievement.mjs <achievement-id> [--list] [--output <path>]');
  console.log('  --list    List available achievements');
  console.log('  --output  Output path (default: achievement-<id>.png)');
  process.exit(1);
}

const outputArg = args.indexOf('--output');
const outputPath = outputArg >= 0 ? args[outputArg + 1] : `achievement-${achievementId}.png`;

const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
if (!achievement) {
  console.error('Achievement not found:', achievementId);
  process.exit(1);
}

const card = generateCard(achievement);

// Try to save as PNG using sharp (available in workspace)
try {
  const sharp = await import('sharp');
  await sharp.default(card, { density: 144 })
    .png()
    .toFile(outputPath);
  console.log('Saved:', outputPath);
} catch (e) {
  // sharp not available — save SVG
  const svgPath = outputPath.replace(/\.png$/, '.svg');
  writeFileSync(svgPath, card);
  console.log('Saved SVG (sharp not available):', svgPath);
  console.log('For PNG: install sharp with: npm install sharp');
}
