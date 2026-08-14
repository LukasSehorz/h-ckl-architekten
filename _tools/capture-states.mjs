import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const URL = process.argv[2] || 'http://localhost:8899/';
const OUT = path.resolve('../_research/states');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

/* ---- 1) Preloader-Ablauf ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1512, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  for (const t of [200, 600, 1000, 1500, 2000, 2600, 3200, 3800, 4400, 5200, 6200, 7500]) {
    await page.waitForTimeout(t === 200 ? 200 : 0);
    await page.screenshot({ path: path.join(OUT, `pre_${String(t).padStart(4, '0')}.png`) });
    if (t !== 7500) await page.waitForTimeout(([600, 1000, 1500, 2000, 2600, 3200, 3800, 4400, 5200, 6200, 7500][[200, 600, 1000, 1500, 2000, 2600, 3200, 3800, 4400, 5200, 6200].indexOf(t)] - t));
  }
  await ctx.close();
}

/* ---- 2) Menü offen ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1512, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(9000);
  await page.click('.navbar_menu_btn');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'menu_open.png') });
  await page.click('.navbar_nav_dd_btn');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, 'menu_dropdown.png') });
  await ctx.close();
}

/* ---- 3) FAQ offen + Hover-Zustände ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1512, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(9000);
  await page.evaluate(() => window.scrollTo(0, 10300));
  await page.waitForTimeout(1500);
  await page.click('.faq_item:nth-child(2) .faq_item_header');
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, 'faq_open.png') });
  await ctx.close();
}

/* ---- 4) Responsive ---- */
const devices = [
  { name: 'mobile', w: 390, h: 844 },
  { name: 'tablet', w: 834, h: 1112 },
  { name: 'laptop', w: 1280, h: 800 },
  { name: 'wide', w: 1920, h: 1080 },
];
for (const d of devices) {
  const ctx = await browser.newContext({ viewport: { width: d.w, height: d.h }, isMobile: d.name === 'mobile', hasTouch: d.name === 'mobile' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(9000);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1
    ? { sw: document.documentElement.scrollWidth, iw: window.innerWidth } : null);
  let i = 0;
  for (let y = 0; y <= H; y += Math.round(d.h * 0.9)) {
    await page.evaluate(yy => window.scrollTo(0, yy), y);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, `${d.name}_${String(i).padStart(2, '0')}.png`) });
    i++;
    if (i > 24) break;
  }
  console.log(d.name, 'H=' + H, 'frames=' + i, 'overflow=' + JSON.stringify(overflow), 'errors=' + errs.length, errs.slice(0, 3).join(' | '));
  await ctx.close();
}

await browser.close();
