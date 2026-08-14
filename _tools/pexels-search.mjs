import { chromium } from 'playwright';
const queries = process.argv.slice(2);
const browser = await chromium.launch({ headless: true });
const out = {};
for (const q of queries) {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 1000 }, locale: 'en-US',
  });
  const page = await ctx.newPage();
  const url = `https://www.pexels.com/search/videos/${encodeURIComponent(q)}/?orientation=landscape`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(9000);
    for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 2500); await page.waitForTimeout(2000); }
    const html = await page.content();
    const mp4s = [...new Set((html.match(/https:\/\/videos\.pexels\.com\/video-files\/[^"'\ )]+?\.mp4/g) || []))];
    out[q] = mp4s;
    console.error(`[${q}] mp4s=${mp4s.length}`);
  } catch (e) { console.error(`[${q}] ERR ${e.message}`); out[q]=[]; }
  await ctx.close();
  await new Promise(r=>setTimeout(r,4000));
}
console.log(JSON.stringify(out));
await browser.close();
