/* Baut aus mehreren Quellclips ein Hero-Showreel mit harten Schnitten.
   Konfiguration: _tools/showreel.json
   Aufruf: node build-showreel.mjs [out.mp4]
*/
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const cfgPath = path.resolve('showreel.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const OUT = path.resolve(process.argv[2] || cfg.out || '../site/assets/video/hero.mp4');
const TMP = path.resolve('../_research/showreel_build');
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });

const W = cfg.width || 1920, H = cfg.height || 1080, FPS = cfg.fps || 30;

// Einheitliche Bildanmutung über alle Quellen hinweg
const grade = cfg.grade ?? 'eq=saturation=0.80:contrast=1.02';

const parts = [];
cfg.shots.forEach((s, i) => {
  const src = path.resolve(s.file);
  if (!fs.existsSync(src)) { console.log('FEHLT, übersprungen:', src); return; }
  const out = path.join(TMP, `s${String(i).padStart(2, '0')}.mp4`);
  const perClip = [
    `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos`,
    `crop=${W}:${H}`,
    `fps=${FPS}`,
    s.grade || grade,
    s.extra || null,
    'format=yuv420p',
  ].filter(Boolean).join(',');

  const args = ['-y', '-v', 'error'];
  if (s.start != null) args.push('-ss', String(s.start));
  args.push('-i', src, '-t', String(s.duration), '-an', '-vf', perClip,
    '-c:v', 'libx264', '-crf', String(cfg.crf ?? 20), '-preset', 'slow', '-g', String(FPS * 2), out);
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
  parts.push(out);
  console.log('Shot', i, path.basename(src), s.start ?? 0, '+', s.duration + 's');
});

if (!parts.length) { console.log('Keine Shots gebaut.'); process.exit(1); }

const listFile = path.join(TMP, 'list.txt');
fs.writeFileSync(listFile, parts.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listFile,
  '-c:v', 'libx264', '-crf', String(cfg.crf ?? 20), '-preset', 'slow', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', '-an', OUT], { stdio: 'inherit' });

const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=width,height',
  '-of', 'default=noprint_wrappers=1', OUT]).toString();
console.log('\n=>', OUT);
console.log(probe.trim());
