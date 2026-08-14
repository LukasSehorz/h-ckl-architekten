import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const URL = process.argv[2] || 'https://www.bloom3d.studio/';
const OUT = process.argv[3] || '../_research/ref';
const STEP = Number(process.argv[4] || 200);

const outDir = path.resolve(OUT);
fs.mkdirSync(path.join(outDir, 'frames'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'net'), { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1512, height: 900 },
  deviceScaleFactor: 1,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
});
const page = await ctx.newPage();

const assets = [];
page.on('response', async (res) => {
  try {
    const u = res.url();
    const ct = res.headers()['content-type'] || '';
    assets.push({ url: u, type: ct, status: res.status() });
  } catch {}
});

console.log('goto', URL);
await page.goto(URL, { waitUntil: 'networkidle', timeout: 120000 }).catch(e => console.log('nav warn', e.message));
await page.waitForTimeout(4000);

// dump HTML
fs.writeFileSync(path.join(outDir, 'page.html'), await page.content(), 'utf8');

// dump stylesheets
const sheets = await page.evaluate(async () => {
  const out = [];
  for (const ss of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(ss.cssRules).map(r => r.cssText).join('\n');
      out.push({ href: ss.href || 'inline', css: rules });
    } catch (e) { out.push({ href: ss.href || 'inline', css: '/* CORS blocked */' }); }
  }
  return out;
});
fs.writeFileSync(path.join(outDir, 'styles.json'), JSON.stringify(sheets, null, 2), 'utf8');

// design tokens: fonts, colors, text nodes
const tokens = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll('body *')).slice(0, 4000);
  const fonts = {}, colors = {}, bgs = {}, sizes = {};
  const texts = [];
  for (const el of els) {
    const cs = getComputedStyle(el);
    fonts[cs.fontFamily] = (fonts[cs.fontFamily] || 0) + 1;
    colors[cs.color] = (colors[cs.color] || 0) + 1;
    if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') bgs[cs.backgroundColor] = (bgs[cs.backgroundColor] || 0) + 1;
    const t = (el.childElementCount === 0 ? el.textContent : '').trim();
    if (t && t.length < 400) {
      texts.push({
        tag: el.tagName, cls: el.className && el.className.toString().slice(0,120), text: t,
        font: cs.fontFamily, size: cs.fontSize, weight: cs.fontWeight, ls: cs.letterSpacing,
        lh: cs.lineHeight, tt: cs.textTransform, color: cs.color,
      });
      sizes[cs.fontSize] = (sizes[cs.fontSize] || 0) + 1;
    }
  }
  return {
    fonts, colors, bgs, sizes, texts,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    htmlBg: getComputedStyle(document.documentElement).backgroundColor,
    scrollHeight: document.documentElement.scrollHeight,
    title: document.title,
    metaDesc: document.querySelector('meta[name=description]')?.content || '',
  };
});
fs.writeFileSync(path.join(outDir, 'tokens.json'), JSON.stringify(tokens, null, 2), 'utf8');

// section outline
const outline = await page.evaluate(() => {
  const walk = (el, depth) => {
    if (depth > 4) return [];
    const out = [];
    for (const c of Array.from(el.children)) {
      const r = c.getBoundingClientRect();
      const cs = getComputedStyle(c);
      if (r.height < 8) continue;
      out.push({
        depth, tag: c.tagName, id: c.id, cls: (c.className||'').toString().slice(0,160),
        top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width),
        pos: cs.position, display: cs.display, bg: cs.backgroundColor,
        txt: (c.innerText||'').trim().slice(0,160).replace(/\s+/g,' '),
        children: walk(c, depth + 1),
      });
    }
    return out;
  };
  return walk(document.body, 0);
});
fs.writeFileSync(path.join(outDir, 'outline.json'), JSON.stringify(outline, null, 2), 'utf8');

// scroll frames
const H = await page.evaluate(() => document.documentElement.scrollHeight);
console.log('scrollHeight', H);
let i = 0;
for (let y = 0; y <= H; y += STEP) {
  await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
  await page.waitForTimeout(650);
  const name = `f${String(i).padStart(3, '0')}_y${y}.png`;
  await page.screenshot({ path: path.join(outDir, 'frames', name) });
  i++;
  if (i > 220) break;
}

fs.writeFileSync(path.join(outDir, 'net', 'assets.json'), JSON.stringify(assets, null, 2), 'utf8');
console.log('frames', i);
await browser.close();
