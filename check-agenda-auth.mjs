import { chromium } from 'playwright';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jwt = require('/Users/joel/projetos/atendente/server/node_modules/jsonwebtoken');

const token = jwt.sign({
  sub: '8991d4b2-3ab4-4a2b-9edf-5bf73282be78',
  email: 'contato@controletotal.app',
  exp: Math.floor(Date.now() / 1000) + 3600
}, 'qualquer_coisa');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', err => errors.push('PAGE_ERROR: ' + err.message));
page.on('console', msg => {
  if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text().substring(0, 200));
});

await page.goto('https://atendente.controletotal.app/', { timeout: 15000, waitUntil: 'networkidle' });
await page.evaluate((t) => { localStorage.setItem('auth_token', t); }, token);
await page.goto('https://atendente.controletotal.app/agenda', { timeout: 15000, waitUntil: 'networkidle' }).catch(e => errors.push('NAV: ' + e.message));
await page.waitForTimeout(3000);

errors.forEach(e => console.log('ERR:', e));
console.log('URL:', page.url());
console.log('TITLE:', await page.title());
const root = await page.evaluate(() => document.getElementById('root')?.childElementCount ?? -1);
console.log('ROOT CHILDREN:', root);
const body = await page.evaluate(() => document.body.innerText.substring(0, 500));
console.log('BODY:', body);
await browser.close();
