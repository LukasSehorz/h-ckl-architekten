import { chromium } from 'playwright';
import fs from 'fs';

const url = process.argv[2] || 'https://www.bloom3d.studio/';
const out = process.argv[3] || '../_research/ref/measure.json';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 900 } });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(9000);

const data = await page.evaluate(() => {
  const sels = [
    'section', '.portfolio_wrapper', '.portfolio_heading', '.portfolio_grid', '.portfolio_project',
    '.services_wrapper', '.services_heading', '.carousel_wrapper', '.carousel_card',
    '.about_wrapper', '.about_heading', '.about_nums', '.advantages_wrapper', '.advantages_content',
    '.advantageg_img_wrapper', '.cta_wrapper', '.cta_content', '.faq_wrapper', '.faq_list',
    '.section_footer', '.footer_content', '.footer_cols', '.hero_wrapper', '.hero_content',
    '.hero_heading', '.navbar', '.u-container', '.u-container-wide', '.u-btn'
  ];
  const res = {};
  for (const s of sels) {
    const els = Array.from(document.querySelectorAll(s)).slice(0, 14);
    res[s] = els.map(e => {
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      return {
        cls: (e.className || '').toString().slice(0, 70),
        x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height),
        pad: cs.padding, mar: cs.margin, gap: cs.gap, bg: cs.backgroundColor,
        fs: cs.fontSize, ls: cs.letterSpacing, lh: cs.lineHeight, fw: cs.fontWeight, ar: cs.aspectRatio,
        maxw: cs.maxWidth, ta: cs.textAlign,
      };
    });
  }
  return res;
});
fs.writeFileSync(out, JSON.stringify(data, null, 1));
console.log('done');
await browser.close();
