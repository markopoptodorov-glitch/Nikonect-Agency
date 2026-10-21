/* Long-task probe under "4x CPU slowdown + Fast 4G".
   Scrolls the poster marquee and reports any main-thread task over 50 ms.

   Usage: node scripts/longtasks.mjs <url> <label> [clickSelector] [scrollSelector]
*/
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const url = process.argv[2] || 'http://localhost:8080/';
const label = process.argv[3] || 'run';
const clickSelector = process.argv[4] || '';
const scrollTarget = process.argv[5] || '#portfolio';

// Chrome DevTools "Fast 4G" preset.
const FAST_4G = {
  offline: false,
  latency: 20,
  downloadThroughput: (4 * 1024 * 1024) / 8,
  uploadThroughput: (3 * 1024 * 1024) / 8,
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 412, height: 823 } });
const cdp = await page.context().newCDPSession(page);

await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', FAST_4G);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

// Install the observer before any page script runs.
await page.addInitScript(() => {
  window.__longTasks = [];
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__longTasks.push({ start: Math.round(e.startTime), dur: Math.round(e.duration) });
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch { /* longtask unsupported */ }
});

await page.goto(url, { waitUntil: 'load', timeout: 180000 });
await page.waitForTimeout(1500);

// Long tasks during load are reported separately from the scroll interaction.
const loadTasks = await page.evaluate(() => window.__longTasks.slice());
await page.evaluate(() => { window.__longTasks.length = 0; });

if (clickSelector) {
  await page.click(clickSelector, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
}

// Scroll the marquee through the viewport in small steps, as a user would.
await page.evaluate(async (sel) => {
  const el = document.querySelector(sel);
  if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
  for (let i = 0; i < 70; i++) {
    window.scrollBy(0, 60);
    await frame();
    await frame();
  }
}, scrollTarget);
await page.waitForTimeout(1200);

const scrollTasks = await page.evaluate(() => window.__longTasks.slice());

const stat = (tasks) => {
  const over = tasks.filter((t) => t.dur > 50);
  return {
    count: over.length,
    worstMs: over.reduce((m, t) => Math.max(m, t.dur), 0),
    totalBlockingMs: over.reduce((s, t) => s + (t.dur - 50), 0),
  };
};

const out = { label, url, clickSelector, load: stat(loadTasks), scroll: stat(scrollTasks) };
await mkdir('.perf', { recursive: true });
await writeFile(`.perf/longtasks-${label}.json`, JSON.stringify({ out, loadTasks, scrollTasks }, null, 2));
console.log(JSON.stringify(out, null, 2));

await browser.close();
