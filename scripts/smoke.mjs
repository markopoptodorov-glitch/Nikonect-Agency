/* Functional smoke test: console errors, failed requests, and the behaviours
   that are easy to break silently (filters, language toggle, lightbox,
   counters, marquee pausing, glass budget).

   Usage: node scripts/smoke.mjs <url>
*/
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:8080/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
const failed = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('requestfailed', (r) => failed.push(`${r.failure()?.errorText} ${r.url()}`));
page.on('response', (r) => { if (r.status() >= 400) failed.push(`HTTP ${r.status()} ${r.url()}`); });

await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });

const check = (label, value) => console.log(`${value ? 'PASS' : 'FAIL'}  ${label}`);

/* --- portfolio ------------------------------------------------------- */
const total = await page.locator('.tile').count();
check(`portfolio built (${total} tiles)`, total > 50);

await page.click('.filter[data-filter="client"]');
await page.waitForTimeout(300);
const clientVisible = await page.locator('.tile:not([hidden])').count();
const clientBadges = await page.locator('.tile:not([hidden]) .badge--client').count();
check(`"Client work" filter shows only client tiles (${clientVisible})`, clientVisible > 0 && clientVisible === clientBadges);

/* Filtering may reveal tiles whose lazy image has not loaded yet, which is a
   first load, not a re-request. What must never happen is the same URL being
   fetched twice — that is the signature of a rebuilt DOM. */
await page.click('.filter[data-filter="concepts"]');
await page.click('.filter[data-filter="all"]');
await page.waitForTimeout(600);
const refetched = await page.evaluate(() => {
  const seen = new Map();
  for (const r of performance.getEntriesByType('resource')) {
    if (!r.name.includes('/assets/images/')) continue;
    seen.set(r.name, (seen.get(r.name) || 0) + 1);
  }
  return [...seen].filter(([, n]) => n > 1).map(([u]) => u.split('/').pop());
});
check(`filtering never refetches an image (${refetched.length} duplicates)`, refetched.length === 0);

/* And the tile elements themselves must be the same nodes, not rebuilt. */
const nodeIdentity = await page.evaluate(() => {
  const first = document.querySelector('.tile');
  first.dataset.probe = 'x';
  document.querySelector('.filter[data-filter="matchdays"]').click();
  document.querySelector('.filter[data-filter="all"]').click();
  return document.querySelector('.tile').dataset.probe === 'x';
});
check('filtering reuses the same DOM nodes', nodeIdentity);

const allVisible = await page.locator('.tile:not([hidden])').count();
check(`"All" shows the first page (${allVisible} of ${total})`, allVisible === 24);
check('"Load more" offered while tiles remain', await page.locator('#gridMore:not([hidden])').count() === 1);

await page.click('#gridMore button');
await page.waitForTimeout(400);
const afterMore = await page.locator('.tile:not([hidden])').count();
check(`"Load more" reveals the next page (${afterMore})`, afterMore === 48);

/* The opening screen must not be a run of near-identical schedule tables. */
const firstEight = await page.evaluate(() =>
  [...document.querySelectorAll('.tile:not([hidden])')].slice(0, 8).map((t) => t.dataset.cat));
check(`first 8 tiles mix categories (${[...new Set(firstEight)].length} distinct)`, new Set(firstEight).size >= 3);

/* --- language -------------------------------------------------------- */
/* The nav hides on scroll-down by design, so come back to the top first. */
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
await page.click('.lang button[data-lang="mk"]');
await page.waitForTimeout(300);
const mk = await page.evaluate(() => ({
  lang: document.documentElement.lang,
  h1: document.querySelector('.hero h1').textContent.trim(),
  badge: document.querySelector('.badge')?.textContent.trim(),
}));
check(`lang attribute follows toggle (${mk.lang})`, mk.lang === 'mk');
check(`hero H1 translated (${mk.h1.slice(0, 32)}…)`, mk.h1.startsWith('Дизајн'));
check(`portfolio badges translated (${mk.badge})`, /Клиентска|Концепт/.test(mk.badge || ''));

await page.click('.lang button[data-lang="en"]');
await page.waitForTimeout(300);
const enH1 = await page.locator('.hero h1').textContent();
check('switching back restores English', enH1.includes('final'));

/* --- pricing --------------------------------------------------------- */
const prices = await page.locator('.price__amt').allTextContents();
check(`null prices render "Request a quote" (${prices.join(' | ')})`, prices.every((p) => p.includes('Request a quote')));
check('no em-dash placeholder anywhere', !(await page.content()).includes('€—'));

/* --- counters -------------------------------------------------------- */
await page.locator('#about').scrollIntoViewIfNeeded();
await page.waitForTimeout(2200);
const stats = await page.locator('.stat__n').allTextContents();
check(`counters reach final values (${stats.join(', ')})`, stats.join(',') === '48h,50+,3+');

/* --- marquee --------------------------------------------------------- */
const marquee = await page.evaluate(() => {
  const el = document.querySelector('#marquee');
  const track = document.querySelector('.marquee__track');
  const sets = document.querySelectorAll('.marquee__set');
  return {
    sets: sets.length,
    equalSets: sets.length === 2 && sets[0].children.length === sets[1].children.length,
    cloneHidden: sets[1]?.getAttribute('aria-hidden') === 'true',
    animated: getComputedStyle(track).animationName !== 'none',
    willChange: getComputedStyle(track).willChange,
    contain: getComputedStyle(el).contain,
  };
});
check(`marquee duplicated exactly once (${marquee.sets} sets, equal: ${marquee.equalSets})`, marquee.sets === 2 && marquee.equalSets);
check('marquee clone is aria-hidden', marquee.cloneHidden);
check('marquee animated by CSS', marquee.animated);
check(`will-change on track only (${marquee.willChange})`, marquee.willChange === 'transform');
check(`contain on container (${marquee.contain})`, marquee.contain.includes('layout') && marquee.contain.includes('paint'));

/* Pausing when off-screen. */
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
const pausedOffscreen = await page.locator('#marquee').evaluate((el) => el.classList.contains('is-paused'));
check('marquee paused while off-screen', pausedOffscreen);

await page.locator('#marquee').scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
const runningOnscreen = await page.locator('#marquee').evaluate((el) => !el.classList.contains('is-paused'));
check('marquee runs while on-screen', runningOnscreen);

/* No backdrop-filter may be active on or above the marquee while visible. */
const glassOverMarquee = await page.evaluate(() => {
  const offenders = [];
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    const bf = cs.backdropFilter || cs.webkitBackdropFilter;
    if (!bf || bf === 'none') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    const m = document.querySelector('#marquee').getBoundingClientRect();
    const overlaps = !(r.bottom < m.top || r.top > m.bottom);
    if (overlaps || el.contains(document.querySelector('#marquee'))) {
      offenders.push(el.className.toString().slice(0, 40) || el.tagName);
    }
  }
  return offenders;
});
check(`no glass over the marquee (${glassOverMarquee.join(', ') || 'none'})`, glassOverMarquee.length === 0);

/* --- glass budget ---------------------------------------------------- */
const glassCounts = await page.evaluate(() => {
  const counts = [];
  const step = Math.round(window.innerHeight * 0.6);
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    let n = 0;
    const blurs = [];
    for (const el of document.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      const bf = cs.backdropFilter || cs.webkitBackdropFilter;
      if (!bf || bf === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.bottom < 0 || r.top > window.innerHeight) continue;
      n++;
      const m = bf.match(/blur\(([\d.]+)px\)/);
      if (m) blurs.push(Number(m[1]));
    }
    counts.push({ y, n, maxBlur: blurs.length ? Math.max(...blurs) : 0 });
  }
  window.scrollTo(0, 0);
  return counts;
});
const worst = glassCounts.reduce((a, b) => (b.n > a.n ? b : a));
const maxBlur = Math.max(...glassCounts.map((c) => c.maxBlur));
check(`max glass surfaces in one viewport: ${worst.n} (budget 6)`, worst.n <= 6);
check(`max blur radius: ${maxBlur}px (budget 20)`, maxBlur <= 20);

/* --- lightbox -------------------------------------------------------- */
await page.locator('.tile:not([hidden])').first().click();
await page.waitForTimeout(500);
const lbOpen = await page.locator('#lightbox').evaluate((d) => d.open);
const lbSrc = await page.locator('#lightboxImg').getAttribute('src');
check('lightbox opens', lbOpen);
check(`lightbox loads the 1080 step (${lbSrc?.split('/').pop()})`, !!lbSrc?.includes('-1080.webp'));
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
check('lightbox closes on Escape', !(await page.locator('#lightbox').evaluate((d) => d.open)));

/* --- misc ------------------------------------------------------------ */
const year = await page.locator('#year').textContent();
check(`footer year is dynamic (${year})`, year === String(new Date().getFullYear()));
check('no "Scroll" cue', !(await page.locator('.scroll-ind').count()));
check('form present or replaced', (await page.locator('#contactForm, #formPanel .btn').count()) > 0);
check('no GSAP / Three.js', !(await page.content()).match(/gsap|three\.min/i));

console.log('\nconsole errors:', errors.length ? errors : 'none');
console.log('failed requests:', failed.length ? failed.slice(0, 10) : 'none');

await browser.close();
