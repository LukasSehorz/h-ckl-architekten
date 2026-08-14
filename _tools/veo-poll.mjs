/* Pollt KIE-AI-Tasks bis fertig und lädt die Videos herunter. */
import fs from 'fs';
import path from 'path';

const KEY = process.env.KIE_KEY;
if (!KEY) {
  console.error('Bitte KIE_KEY setzen, z. B.:  KIE_KEY=dein_key node veo-poll.mjs name1 name2');
  process.exit(1);
}
const DIR = path.resolve('../_research/veo');
const names = process.argv.slice(2); // optionale Zielnamen je Task

const tasks = fs.readFileSync(path.join(DIR, 'tasks.txt'), 'utf8').trim().split(/\s+/);
console.log('tasks:', tasks.length);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function info(t) {
  const r = await fetch(`https://api.kie.ai/api/v1/veo/record-info?taskId=${t}`, {
    headers: { Authorization: `Bearer ${KEY}` }
  });
  return r.json();
}

function findUrls(obj) {
  const urls = new Set();
  const walk = (v) => {
    if (typeof v === 'string') {
      if (/^https?:\/\/\S+\.(mp4|webm|mov)(\?|$)/i.test(v)) urls.add(v);
      else if (v.trim().startsWith('{') || v.trim().startsWith('[')) { try { walk(JSON.parse(v)); } catch {} }
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(obj);
  return [...urls];
}

const done = new Map();
const deadline = Date.now() + 20 * 60 * 1000;

while (done.size < tasks.length && Date.now() < deadline) {
  for (const [i, t] of tasks.entries()) {
    if (done.has(t)) continue;
    let j;
    try { j = await info(t); } catch (e) { console.log('poll err', e.message); continue; }
    const d = j?.data || {};
    const flag = d.successFlag ?? d.status ?? '?';
    const urls = findUrls(d);
    if (urls.length) {
      const name = (names[i] || `veo_${i + 1}`) + '.mp4';
      const out = path.join(DIR, name);
      const res = await fetch(urls[0]);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(out, buf);
      console.log('FERTIG', name, (buf.length / 1e6).toFixed(1) + ' MB', urls[0].slice(0, 80));
      done.set(t, out);
    } else if (String(flag) === '2' || String(flag) === '3' || d.errorCode) {
      console.log('FEHLGESCHLAGEN', t, d.errorMessage || d.errorCode || flag);
      done.set(t, null);
    } else {
      console.log('...', t.slice(0, 8), 'flag=' + flag);
    }
  }
  if (done.size < tasks.length) await sleep(20000);
}
console.log('abgeschlossen:', [...done.entries()].map(([k, v]) => k.slice(0, 8) + '=' + (v ? 'ok' : 'fehler')).join(', '));
