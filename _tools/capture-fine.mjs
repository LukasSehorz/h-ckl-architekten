import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT = path.resolve('../_research/ref/fine');
fs.mkdirSync(OUT, { recursive: true });

const RANGES = [
  { name: 'hero', from: 0, to: 1400, step: 50 },
  { name: 'projects', from: 1400, to: 2600, step: 60 },
  { name: 'services', from: 4200, to: 5900, step: 50 },
  { name: 'stats', from: 5900, to: 6600, step: 60 },
  { name: 'whyus', from: 6600, to: 8800, step: 60 },
  { name: 'cta', from: 8800, to: 9900, step: 60 },
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1512, height: 900 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' });
const page = await ctx.newPage();
await page.goto('https://www.bloom3d.studio/', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(8000);

for (const r of RANGES) {
  const dir = path.join(OUT, r.name);
  fs.mkdirSync(dir, { recursive: true });
  let i = 0;
  for (let y = r.from; y <= r.to; y += r.step) {
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(dir, `${String(i).padStart(3,'0')}_y${y}.png`) });
    i++;
  }
  console.log(r.name, i);
}

// Also: capture transform state of service cards across scroll
await browser.close();
