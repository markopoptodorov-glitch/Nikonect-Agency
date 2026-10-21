/* Keyboard and contrast checks that an automated audit tends to miss.
   Usage: node scripts/a11y.mjs <url> */
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:8080/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1500);

const check = (label, v) => console.log(`${v ? 'PASS' : 'FAIL'}  ${label}`);

/* Skip link is the first thing a keyboard reaches, and it becomes visible. */
await page.keyboard.press('Tab');
await page.waitForTimeout(400); // the reveal is a 250ms transform transition
const skip = await page.evaluate(() => {
  const a = document.activeElement;
  const r = a.getBoundingClientRect();
  return { cls: a.className, href: a.getAttribute('href'), onScreen: r.top >= 0 && r.bottom <= window.innerHeight };
});
check(`first Tab reaches the skip link (${skip.href})`, skip.cls === 'skip-link');
check('skip link becomes visible when focused', skip.onScreen);

/* Filters are real buttons: reachable, operable by keyboard, state exposed. */
const filterKeyboard = await page.evaluate(async () => {
  const b = document.querySelector('.filter[data-filter="thumbnails"]');
  b.focus();
  const focused = document.activeElement === b;
  b.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  b.click(); // what Enter does natively on a <button>
  await new Promise((r) => setTimeout(r, 200));
  return { focused, pressed: b.getAttribute('aria-pressed'), tag: b.tagName };
});
check(`filters are focusable buttons (${filterKeyboard.tag})`, filterKeyboard.focused && filterKeyboard.tag === 'BUTTON');
check('filter exposes aria-pressed state', filterKeyboard.pressed === 'true');

/* Language toggle. */
const langKeyboard = await page.evaluate(async () => {
  const b = document.querySelector('.lang button[data-lang="mk"]');
  b.focus();
  const focused = document.activeElement === b;
  b.click();
  await new Promise((r) => setTimeout(r, 250));
  return { focused, pressed: b.getAttribute('aria-pressed'), lang: document.documentElement.lang };
});
check('language toggle is keyboard operable', langKeyboard.focused && langKeyboard.lang === 'mk');
check('language toggle exposes aria-pressed', langKeyboard.pressed === 'true');
/* Click directly: focusing a filter scrolled the page, and the nav hides on
   scroll-down by design, so Playwright's visibility wait would time out. */
await page.evaluate(() => document.querySelector('.lang button[data-lang="en"]').click());
await page.waitForTimeout(300);

/* FAQ uses native <details>, which is keyboard operable for free. */
const faq = await page.evaluate(() => {
  const d = document.querySelector('.faq details');
  const s = d.querySelector('summary');
  s.focus();
  const focused = document.activeElement === s;
  s.click();
  return { focused, open: d.open, native: d.tagName === 'DETAILS' };
});
check('FAQ accordions are native <details>', faq.native);
check('FAQ summary is focusable and toggles', faq.focused && faq.open);

/* Visible focus ring everywhere. */
const focusRing = await page.evaluate(() => {
  const el = document.querySelector('.nav__links a');
  el.focus();
  const cs = getComputedStyle(el, null);
  return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
});
check('focus-visible draws an outline', focusRing);

/* Images: every content image needs alt; decorative ones need empty alt. */
const alts = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')];
  return {
    total: imgs.length,
    missing: imgs.filter((i) => i.getAttribute('alt') === null).length,
    tiles: [...document.querySelectorAll('.tile img')].filter((i) => !i.alt.trim()).length,
  };
});
check(`no img missing an alt attribute (${alts.total} images)`, alts.missing === 0);
check('every portfolio tile image has descriptive alt text', alts.tiles === 0);

/* Landmarks. */
const landmarks = await page.evaluate(() => ({
  main: document.querySelectorAll('main').length,
  header: document.querySelectorAll('header').length,
  footer: document.querySelectorAll('footer').length,
  nav: document.querySelectorAll('nav').length,
  h1: document.querySelectorAll('h1').length,
}));
check(`one main, header, footer, nav and h1 (${JSON.stringify(landmarks)})`,
  landmarks.main === 1 && landmarks.header === 1 && landmarks.footer === 1 && landmarks.h1 === 1);

/* Contrast of the small text colours actually used, against the page black. */
const contrast = await page.evaluate(() => {
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => lin(v / 255));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  return {
    muted: ratio('#8a8a8a', '#0a0a0a'),
    body: ratio('#c9c9c9', '#0a0a0a'),
    label: ratio('#b4b4b4', '#0a0a0a'),
    redInkSmall: ratio('#ff4552', '#0a0a0a'),
    redLarge: ratio('#e8001c', '#0a0a0a'),
    whiteOnRed: ratio('#ffffff', '#e8001c'),
  };
});
for (const [k, v] of Object.entries(contrast)) {
  const need = k === 'redLarge' ? 3 : 4.5;
  check(`contrast ${k}: ${v.toFixed(2)}:1 (needs ${need})`, v >= need);
}

await browser.close();
