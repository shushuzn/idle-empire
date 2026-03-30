/**
 * itch-upload.mjs — Upload dist-upload to itch.io via REST API
 * Usage: node scripts/itch-upload.mjs
 */
import { createReadStream, readFileSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_KEY = 'ZkeDvI9jp9um1kr3dKpruyTVJ0mQR2fEJFiS8d1l';
const GAME = 'shushuzn/idle-empire-premium-idle-game';
const DIST = join(__dirname, '../dist-upload');

const PROXY = 'http://127.0.0.1:7897';

function request(opts, body = null) {
  return new Promise((resolve, reject) => {
    const protocol = opts.port === 443 ? https : http;
    // Use proxy if configured
    if (PROXY) {
      const { hostname, port } = new URL(PROXY);
      opts.hostname = hostname;
      opts.port = port;
      opts.path = `http://${opts.hostname.replace('http', '')}${opts.path}`;
      opts.headers['Proxy-Authorization'] = 'Basic ' + Buffer.from('').toString('base64');
    }
    const req = protocol.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: d }));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // 1. Get game record
  console.log('Fetching game record...');
  const gameRes = await request({
    hostname: 'itch.io',
    path: `/api/1/games/${GAME}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' }
  });
  console.log('Game record status:', gameRes.status);
  if (gameRes.status !== 200) {
    console.log('Response:', gameRes.body.slice(0, 200));
    return;
  }
  const gameData = JSON.parse(gameRes.body);
  console.log('Game ID:', gameData.game?.id);

  if (!gameData.game?.id) {
    console.log('Full response:', gameRes.body.slice(0, 500));
    return;
  }

  // 2. Get upload URL (edit record page)
  console.log('\nFetching upload URL...');
  const editRes = await request({
    hostname: 'itch.io',
    path: `/developer/games/${gameData.game.id}/edit`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' }
  });
  console.log('Edit page status:', editRes.status);

  console.log('\nUpload preparation complete. Full API upload requires:');
  console.log('- POST to /api/1/games/{id}/uploads with multipart form data');
  console.log('- See: https://itch.io/docs/butler/api.html');
}

main().catch(console.error);
