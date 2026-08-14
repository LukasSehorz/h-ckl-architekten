// crude motion metric: mean abs pixel diff between frames 1s apart, on 160x90 grayscale
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
const CAND = path.resolve('../_research/showreel_src/cand');
for (const name of process.argv.slice(2)) {
  const mp4 = path.join(CAND, name + '.mp4');
  const out = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', mp4,
    '-vf', 'fps=1,scale=160:90,format=gray,tblend=all_mode=difference,metadata=print:file=-',
    '-f', 'null', '-'], { maxBuffer: 1 << 24 }).toString();
  // use signalstats instead
  const out2 = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', mp4,
    '-vf', 'fps=1,scale=160:90,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-',
    '-f', 'null', '-'], { maxBuffer: 1 << 24 }).toString();
  const vals = [...out2.matchAll(/YAVG=([\d.]+)/g)].map(m => +m[1]).slice(1);
  const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
  const max = Math.max(...vals, 0);
  console.log(name.padEnd(12), 'avgDiff/s', avg.toFixed(2), 'maxDiff/s', max.toFixed(2), 'n', vals.length);
}
