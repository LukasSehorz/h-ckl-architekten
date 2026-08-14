import fs from 'fs';
const files = process.argv.slice(2);
const byId = new Map();
for (const f of files) {
  const o = JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
  for (const [q, urls] of Object.entries(o)) {
    for (const u of urls) {
      const m = u.match(/video-files\/(\d+)\//);
      if (!m) continue;
      const id = m[1];
      const wm = u.match(/_(\d{3,4})_(\d{3,4})_\d+fps\.mp4$/);
      const w = wm ? +wm[1] : 0, h = wm ? +wm[2] : 0;
      if (!byId.has(id)) byId.set(id, { id, qs: new Set(), variants: [] });
      byId.get(id).qs.add(q);
      byId.get(id).variants.push({ u, w, h });
    }
  }
}
const out = [];
for (const v of byId.values()) {
  const land = v.variants.filter(x => x.w >= x.h && x.w > 0);
  const big = land.filter(x => x.w >= 1920).sort((a, b) => a.w - b.w)[0];
  const small = land.slice().sort((a, b) => a.w - b.w)[0];
  if (!big || !small) continue;
  out.push({ id: v.id, q: [...v.qs][0], preview: small.u, full: big.u, fw: big.w, fh: big.h });
}
fs.writeFileSync(process.env.TEMP + '/' + (process.env.OUTN || 'cands') + '.json', JSON.stringify(out));
const g = {};
for (const o of out) g[o.q] = (g[o.q] || 0) + 1;
console.log('total', out.length, JSON.stringify(g));
