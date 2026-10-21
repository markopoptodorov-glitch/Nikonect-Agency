/* Full-page screenshots at the three target breakpoints, plus an
   overflow check (any element wider than the viewport).

   Usage: node scripts/screenshots.mjs <url> <label>
*/
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const url = process.argv[2] || 'http://localhost:8080/';
const label = process.argv[3] || 'run';
const WIDTHS = [375, 768, 1440];

const browser = await chromium.launch();
await mkdir(`.perf/shots-${label}`, { recursive: true });
const report = [];

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  // Settle lazy images and scroll-reveals by walking the page once.
  await page.evaluate(async () => {
    const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await frame(); await frame();
    }
    window.scrollTo(0, 0);
    await frame();
  });
  await page.waitForTimeout(2500);

  const diag = await page.evaluate((vw) => {
    const docScrollW = document.documentElement.scrollWidth;

    /* An element wider than the viewport is only a bug if it can actually
       push the page sideways. Anything inside an overflow:hidden ancestor
       (the marquee) or inside the closed off-canvas menu is clipped by
       design, so it is not reported. */
    const isClipped = (el) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (cs.overflowX !== 'visible' || cs.overflow !== 'visible') return true;
        if (cs.transform !== 'none' && p.classList.contains('nav__links')) return true;
      }
      return false;
    };

    const offenders = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed') continue; // decorative fixed layers
      if (r.right > vw + 1 || r.left < -1) {
        if (isClipped(el)) continue;
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && el.className.toString().slice(0, 60)) || '',
          left: Math.round(r.left), right: Math.round(r.right),
        });
      }
    }
    return { docScrollW, bodyOverflowX: docScrollW > vw + 1, offenders: offenders.slice(0, 12) };
  }, width);

  await page.screenshot({ path: `.perf/shots-${label}/${width}.png`, fullPage: true });
  report.push({ width, ...diag });
  console.log(`${width}px  scrollWidth=${diag.docScrollW}  overflowX=${diag.bodyOverflowX}  offenders=${diag.offenders.length}`);
  for (const o of diag.offenders) console.log(`   ${o.tag}.${o.cls} [${o.left} → ${o.right}]`);
  await page.close();
}

await writeFile(`.perf/shots-${label}/report.json`, JSON.stringify(report, null, 2));
await browser.close();
