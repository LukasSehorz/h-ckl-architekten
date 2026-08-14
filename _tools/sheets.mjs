import fs from 'fs';
import path from 'path';
import { execFile, execFileSync } from 'child_process';
import { promisify } from 'util';
const pexec = promisify(execFile);

const BASE = path.resolve('../_research/showreel_src');
const PREV = path.join(BASE, 'prev');
const SHEETS = path.join(BASE, 'check');
fs.mkdirSync(PREV, { recursive: true });
fs.mkdirSync(SHEETS, { recursive: true });

const PFX = process.env.PFX || '';
const cands = JSON.parse(fs.readFileSync(process.env.TEMP + '/' + (process.env.OUTN || 'cands') + '.json', 'utf8'));
const byQ = {};
for (const c of cands) (byQ[c.q] ||= []).push(c);

async function pool(items, n, fn) {
  const it = items[Symbol.iterator]();
  await Promise.all(Array.from({ length: n }, async () => {
    for (const x of it) { try { await fn(x); } catch (e) { console.error('ERR', x.id, e.message.slice(0, 80)); } }
  }));
}

// download previews
await pool(cands, 8, async (c) => {
  const f = path.join(PREV, c.id + '.mp4');
  if (fs.existsSync(f) && fs.statSync(f).size > 30000) return;
  await pexec('curl.exe', ['-sL', '--max-time', '90', '-o', f, c.preview]);
});
console.log('downloaded');

const qs = Object.keys(byQ);
const index = {};
for (let qi = 0; qi < qs.length; qi++) {
  const q = qs[qi];
  const list = byQ[q];
  const tmp = path.join(SHEETS, '_t');
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  let k = 0;
  const map = [];
  for (const c of list) {
    const f = path.join(PREV, c.id + '.mp4');
    if (!fs.existsSync(f) || fs.statSync(f).size < 30000) continue;
    let dur = 5;
    try {
      dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim()) || 5;
    } catch { continue; }
    k++;
    map.push({ n: k, id: c.id, dur: +dur.toFixed(1) });
    try {
      execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', (dur * 0.4).toFixed(2), '-i', f, '-frames:v', '1',
        '-vf', 'scale=480:270:force_original_aspect_ratio=increase,crop=480:270',
        path.join(tmp, `f${k}.png`)]);
    } catch (e) { k--; map.pop(); }
  }
  const name = `sheet_${PFX}q${qi}_` + q.replace(/\W+/g, '-');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(tmp, 'f%d.png'), '-filter_complex', 'tile=4x6:padding=6:margin=6:color=0xdd2222', '-q:v', '3', path.join(SHEETS, name + '.jpg')]);
  index[name] = { q, items: map };
  console.log(name, k);
  fs.rmSync(tmp, { recursive: true, force: true });
}
fs.writeFileSync(path.join(SHEETS, PFX + 'index.json'), JSON.stringify(index, null, 1));
