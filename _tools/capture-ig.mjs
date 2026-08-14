import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT = path.resolve('../_research/ig');
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'img'), { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1400, height: 1000 },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  locale: 'de-DE',
});
const page = await ctx.newPage();

const imgUrls = new Set();
page.on('response', (res) => {
  const u = res.url();
  if (/cdninstagram|fbcdn/.test(u) && /\.(jpg|jpeg|webp|png)/.test(u)) imgUrls.add(u);
});

const targets = [
  'https://www.instagram.com/haeckl_architekten/',
  'https://www.picuki.com/profile/haeckl_architekten',
  'https://imginn.com/haeckl_architekten/',
];

for (const [i, t] of targets.entries()) {
  try {
    console.log('TRY', t);
    await page.goto(t, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(6000);
    for (let s = 0; s < 6; s++) {
      await page.screenshot({ path: path.join(OUT, 'shots', `t${i}_s${s}.png`), fullPage: false });
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(2500);
    }
    const html = await page.content();
    fs.writeFileSync(path.join(OUT, `t${i}.html`), html, 'utf8');
    const srcs = await page.evaluate(() => Array.from(document.images).map(i => i.src).filter(Boolean));
    srcs.forEach(s => imgUrls.add(s));
    console.log('ok', t, srcs.length);
  } catch (e) { console.log('FAIL', t, e.message); }
}

fs.writeFileSync(path.join(OUT, 'imgurls.json'), JSON.stringify([...imgUrls], null, 2), 'utf8');
console.log('collected', imgUrls.size);
await browser.close();
