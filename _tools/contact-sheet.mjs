import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const dirs = [
  { label: 'OLD', dir: path.resolve('../_research/old/img') },
  { label: 'IG', dir: path.resolve('../_research/ig/img') },
];
const OUT = path.resolve('../_research/sheets');
fs.mkdirSync(OUT, { recursive: true });

const files = [];
for (const d of dirs) {
  for (const f of fs.readdirSync(d.dir).filter(f => /\.(jpg|png)$/i.test(f))) {
    files.push({ label: d.label, name: f, url: 'file:///' + path.join(d.dir, f).replace(/\\/g, '/') });
  }
}
console.log('total files', files.length);

const PER = 24;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });

for (let i = 0; i < files.length; i += PER) {
  const chunk = files.slice(i, i + PER);
  const html = `<html><body style="margin:0;background:#fff;font:12px monospace;display:grid;grid-template-columns:repeat(6,1fr);gap:4px;padding:4px">
  ${chunk.map((f, j) => `<div style="position:relative"><img src="${f.url}" style="width:100%;height:170px;object-fit:cover;display:block"><div style="position:absolute;top:0;left:0;background:#ff0;color:#000;padding:1px 4px;font-weight:bold">${f.label}-${i + j}</div><div style="font-size:9px;word-break:break-all">${f.name}</div></div>`).join('')}
  </body></html>`;
  const p = path.join(OUT, `sheet_${String(i / PER).padStart(2, '0')}.html`);
  fs.writeFileSync(p, html);
  await page.goto('file:///' + p.replace(/\\/g, '/'));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, `sheet_${String(i / PER).padStart(2, '0')}.png`), fullPage: true });
  console.log('sheet', i / PER, chunk.length);
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(files.map((f, i) => ({ i, ...f })), null, 2));
await browser.close();
