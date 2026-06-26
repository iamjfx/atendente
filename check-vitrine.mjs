import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('https://controletotal.app/', { timeout: 15000, waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Get all section headings and structure
const sections = await page.evaluate(() => {
  const els = document.querySelectorAll('h1, h2, h3, section, [class*="section"], [class*="hero"], [class*="features"], [class*="testimonial"], [class*="pricing"], [class*="faq"], [class*="cta"]');
  return Array.from(els).slice(0, 50).map(el => ({
    tag: el.tagName,
    class: (el.className || '').slice(0, 60),
    text: (el.textContent || '').slice(0, 80),
    id: el.id || '',
  }));
});

console.log('=== SECTIONS ===');
sections.forEach(s => console.log(`${s.tag} #${s.id}: ${s.text} (${s.class})`));

// Also get the page structure more broadly
const structure = await page.evaluate(() => {
  const main = document.querySelector('main') || document.body;
  const children = Array.from(main.children);
  return children.map((el, i) => ({
    index: i,
    tag: el.tagName,
    id: el.id || '',
    class: (el.className || '').slice(0, 60),
    text: (el.textContent || '').slice(0, 100),
    childCount: el.children.length,
  }));
});

console.log('\n=== MAIN STRUCTURE ===');
structure.forEach(s => console.log(`${s.index}. <${s.tag}> #${s.id}: ${s.text.slice(0,80)} (${s.childCount} children)`));

await browser.close();
