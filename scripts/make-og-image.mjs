/* Renders assets/og-image.jpg, the 1200x630 card shown when the site is
   shared on Instagram, Viber, Facebook and the like.
   Usage: node scripts/make-og-image.mjs */
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const mark = (await readFile('assets/brand/nikonect-mark.svg', 'utf8'))
  .replace(/viewBox="[^"]+"/, 'viewBox="296 820 488 290"');
const posters = ['matchday-06', 'matchday-02', 'matchday-08'];

const html = `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="../assets/css/fonts.css">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #0a0a0a; color: #f5f5f5;
    font-family: 'Space Grotesk', sans-serif; position: relative;
    background-image: radial-gradient(rgba(245,245,245,.06) 1px, transparent 1px); background-size: 30px 30px; }
  .glow { position: absolute; width: 760px; height: 760px; right: -200px; top: -160px; border-radius: 50%;
    background: radial-gradient(circle, rgba(232,0,28,.38), transparent 62%); }
  .copy { position: absolute; left: 80px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; }
  .copy svg { width: 150px; height: auto; }
  h1 { font-family: 'Bebas Neue', sans-serif; font-weight: 400; font-size: 132px; line-height: .9; letter-spacing: .04em; margin-top: 34px; }
  h1 span { color: #e8001c; }
  .agency { font-weight: 500; font-size: 24px; letter-spacing: .62em; text-transform: uppercase; color: #b4b4b4; margin-top: 12px; }
  .bar { width: 90px; height: 3px; background: #e8001c; margin: 34px 0 22px; }
  p { font-size: 25px; font-weight: 300; color: #d4d4d4; max-width: 470px; line-height: 1.4; }
  .fan { position: absolute; right: 70px; top: 50%; width: 520px; height: 520px; transform: translateY(-50%); }
  .fan img { position: absolute; width: 230px; aspect-ratio: 9/16; object-fit: cover; border-radius: 14px;
    border: 1px solid rgba(255,255,255,.16); box-shadow: 0 30px 60px -20px rgba(0,0,0,.9); }
  .fan img:nth-child(1) { left: 0; top: 70px; transform: rotate(-8deg); }
  .fan img:nth-child(2) { left: 145px; top: 10px; transform: rotate(-1deg); z-index: 2; }
  .fan img:nth-child(3) { left: 290px; top: 80px; transform: rotate(7deg); }
</style>
<div class="glow"></div>
<div class="copy">
  ${mark}
  <h1>NIKO<span>NECT</span></h1>
  <div class="agency">Agency</div>
  <div class="bar"></div>
  <p>Matchday posters, lineups and social content for clubs, players and tournaments.</p>
</div>
<div class="fan">${posters.map((p) => `<img src="../assets/images/matchdays/${p}-720.webp">`).join('')}</div>`;

await mkdir('.perf', { recursive: true });
await writeFile('.perf/og-source.html', html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(resolve('.perf/og-source.html')).href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'assets/og-image.jpg', type: 'jpeg', quality: 86 });
await browser.close();
console.log('assets/og-image.jpg');
