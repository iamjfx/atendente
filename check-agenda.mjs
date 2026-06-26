import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', err => errors.push(err.message));
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.type() + ': ' + msg.text().substring(0, 200));
});
await page.goto('https://atendente.controletotal.app/agenda', { timeout: 15000 }).catch(e => errors.push('NAV: ' + e.message));
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/agenda.png' });
errors.forEach(e => console.log('ERR:', e));
console.log('URL:', page.url());
console.log('TITLE:', await page.title());
const root = await page.evaluate(() => document.getElementById('root')?.childElementCount ?? -1);
console.log('ROOT CHILDREN:', root);
const body = await page.evaluate(() => document.body.innerText.substring(0, 300));
console.log('BODY:', body);
await browser.close();
