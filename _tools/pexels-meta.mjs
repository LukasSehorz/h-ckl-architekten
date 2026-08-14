import { chromium } from 'playwright';

const ids = process.argv.slice(2);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1400, height: 1000 },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
});

for (const id of ids) {
  try {
    await page.goto(`https://www.pexels.com/video/${id}/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4000);
    const r = await page.evaluate(() => ({
      title: document.title,
      desc: document.querySelector('meta[name=description]')?.content || '',
      ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
      ogDesc: document.querySelector('meta[property="og:description"]')?.content || '',
      h1: document.querySelector('h1')?.innerText || '',
      authors: [...document.querySelectorAll('a[href*="/@"]')].map(a => a.innerText.trim()).filter(Boolean).slice(0, 3),
      tags: [...document.querySelectorAll('a[href*="/search/"]')].map(a => a.innerText.trim()).filter(Boolean).slice(0, 25),
    }));
    console.log('=== ' + id + ' ===');
    console.log(JSON.stringify(r, null, 1));
  } catch (e) {
    console.log(id, 'FEHLER', e.message);
  }
}
await browser.close();
