import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const URL = process.argv[2] || 'http://localhost:8899/';
const OUT = path.resolve(process.argv[3] || '../_research/mine');
const STEP = Number(process.argv[4] || 150);
fs.rmSync(path.join(OUT, 'frames'), { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1512, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('requestfailed', r => errors.push('404/FAIL: ' + r.url() + ' :: ' + (r.failure()?.errorText || '')));

await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(9000); // Preloader abwarten

const H = await page.evaluate(() => document.documentElement.scrollHeight);
console.log('scrollHeight', H);

let i = 0;
for (let y = 0; y <= H; y += STEP) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, 'frames', `f${String(i).padStart(3, '0')}_y${y}.png`) });
  i++;
  if (i > 200) break;
}

const measure = await page.evaluate(() => {
  const sels = ['.portfolio_wrapper', '.portfolio_heading', '.portfolio_grid', '.portfolio_project',
    '.services_content', '.carousel_wrapper', '.about_wrapper', '.about_heading', '.about_nums',
    '.advantages_wrapper', '.advantageg_img_wrapper', '.cta_wrapper', '.faq_wrapper',
    '.section_footer', '.footer_cols', '.hero_content', '.hero_heading', 'section'];
  const res = {};
  for (const s of sels) {
    res[s] = Array.from(document.querySelectorAll(s)).slice(0, 14).map(e => {
      const r = e.getBoundingClientRect();
      return { cls: (e.className || '').toString().slice(0, 50), x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
    });
  }
  res.__scrollHeight = document.documentElement.scrollHeight;
  return res;
});
fs.writeFileSync(path.join(OUT, 'measure.json'), JSON.stringify(measure, null, 1));
fs.writeFileSync(path.join(OUT, 'errors.txt'), errors.join('\n'));
console.log('frames', i, 'errors', errors.length);
errors.slice(0, 30).forEach(e => console.log(' ', e));
await browser.close();
