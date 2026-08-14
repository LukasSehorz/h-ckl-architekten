// usage: node qc.mjs <id|name=url> ...
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const BASE = path.resolve('../_research/showreel_src');
const CAND = path.join(BASE, 'cand');
const CHECK = path.join(BASE, 'check');
fs.mkdirSync(CAND, { recursive: true });
fs.mkdirSync(CHECK, { recursive: true });

const all = [];
for (const f of fs.readdirSync(process.env.TEMP).filter(f => /^cands.*\.json$/.test(f))) {
  try { all.push(...JSON.parse(fs.readFileSync(path.join(process.env.TEMP, f), 'utf8'))); } catch {}
}
const byId = new Map(all.map(c => [c.id, c]));

for (const arg of process.argv.slice(2)) {
  let name, url;
  if (arg.includes('=')) { [name, url] = arg.split(/=(.+)/); }
  else { name = arg; url = byId.get(arg)?.full; }
  if (!url) { console.log(JSON.stringify({ name, err: 'no url' })); continue; }
  const mp4 = path.join(CAND, name + '.mp4');
  try {
    if (!fs.existsSync(mp4) || fs.statSync(mp4).size < 100000) {
      execFileSync('curl.exe', ['-sL', '--max-time', '300', '-o', mp4, url]);
    }
    const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,r_frame_rate,duration', '-show_entries', 'format=duration',
      '-of', 'json', mp4]).toString());
    const st = probe.streams[0];
    const dur = parseFloat(st.duration || probe.format.duration);
    const [n, d] = st.r_frame_rate.split('/').map(Number);
    const tmp = path.join(CHECK, '_t_' + name);
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.mkdirSync(tmp, { recursive: true });
    for (let i = 0; i < 8; i++) {
      const t = (dur * (i + 0.5)) / 8;
      execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', t.toFixed(2), '-i', mp4,
        '-frames:v', '1', '-vf', 'scale=640:-2', path.join(tmp, `f${i + 1}.png`)]);
    }
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(tmp, 'f%d.png'),
      '-filter_complex', 'tile=2x4:padding=8:margin=8:color=0xdd2222', '-q:v', '3', path.join(CHECK, 'qc_' + name + '.jpg')]);
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(JSON.stringify({ name, res: `${st.width}x${st.height}`, dur: +dur.toFixed(2), fps: +(n / d).toFixed(2), mb: +(fs.statSync(mp4).size / 1048576).toFixed(1), url }));
  } catch (e) { console.log(JSON.stringify({ name, err: e.message.slice(0, 120) })); }
}
