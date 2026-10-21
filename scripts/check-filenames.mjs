/* Fails if an image filename can be seen anywhere on the rendered page.
 *
 *   node scripts/check-filenames.mjs <url>
 *
 * Checks three things:
 *   1. visible text and every user-facing attribute (alt, title, aria-label,
 *      placeholder, figcaption) against filename-shaped patterns
 *   2. the same text against the actual original filenames in the manifest,
 *      which is the real test — a caption reading "slamjam nikojenct" has no
 *      ".png" in it but is still a leaked filename
 *   3. that published asset paths themselves are clean slugs
 */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const url = process.argv[2] || 'http://localhost:8080/';

/* Filename-shaped patterns that should never appear in user-facing text. */
const PATTERNS = [
  [/IMG_/i, 'IMG_ prefix'],
  [/DSC\d/i, 'DSC camera prefix'],
  [/Screenshot/i, '"Screenshot"'],
  [/Copy of /i, '"Copy of"'],
  [/\b\w+\.(png|jpe?g|webp|gif|svg|avif)\b/i, 'file extension'],
  [/\b\w+[-_]\d{3,4}\.(webp|png|jpg)\b/i, 'width-suffixed filename'],
  [/\buntitled\b/i, '"untitled"'],
  [/\bfinal[-_ ]?v?\d\b/i, 'version suffix'],
];

const manifest = JSON.parse(await readFile('assets/images/manifest.json', 'utf8'));

/* The site's curated vocabulary: the only words allowed to describe an image.
   Read from where they actually live so the check cannot drift out of sync —
   the TYPE_LABELS and CATEGORY blocks in main.js, plus client names from the
   manifest. */
const mainJs = await readFile('assets/js/main.js', 'utf8');
const vocabSource = [
  mainJs.slice(mainJs.indexOf('const TYPE_LABELS'), mainJs.indexOf('const typeLabel')),
  mainJs.slice(mainJs.indexOf('const CATEGORY = {'), mainJs.indexOf('/* Priority for the round-robin')),
  manifest.map((e) => e.client || '').join(' '),
].join(' ');

const curated = new Set();
for (const w of vocabSource.toLowerCase().split(/[^a-z0-9Ѐ-ӿ]+/)) {
  if (w) curated.add(w);
}

/* A leak is a word that comes from an original filename and is NOT part of
   that curated vocabulary. "poster" is fine (it is in TYPE_LABELS);
   "nikojenct", "playpff" or "zzeni" would not be. */
const forbidden = new Set();
for (const entry of manifest) {
  for (const w of entry.source.toLowerCase().split(/[^a-z0-9]+/)) {
    if (w.length >= 4 && !/^\d+$/.test(w) && !curated.has(w)) forbidden.add(w);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(2500);

/* Reveal everything the user could reach: all tiles, and a lightbox. */
await page.evaluate(() => {
  const more = document.querySelector('#gridMore button');
  for (let i = 0; i < 6; i++) if (more && !document.querySelector('#gridMore').hidden) more.click();
});
await page.waitForTimeout(600);

async function harvest(label) {
  return page.evaluate(() => {
    const out = [];
    const push = (where, text, describesImage = false) => {
      if (text && text.trim()) out.push({ where, text: text.trim(), describesImage });
    };

    /* Text whose job is to describe an image — the only place a filename
       could realistically surface. These get the strict word check; ordinary
       prose only gets the pattern check, because body copy legitimately
       contains words like "post", "real" and the brand name. */
    for (const el of document.querySelectorAll(
      '.tile__project, .tile__type, #lightboxCap, figcaption, .marquee img, .hero__poster img, .card__visual'
    )) {
      push('caption<' + (el.className || el.tagName) + '>', el.textContent, true);
      if (el.hasAttribute && el.hasAttribute('alt')) push('alt<img>', el.getAttribute('alt'), true);
      if (el.hasAttribute && el.hasAttribute('title')) push('title', el.getAttribute('title'), true);
    }
    for (const img of document.querySelectorAll('img')) {
      push('alt<img>', img.getAttribute('alt'), true);
      push('title<img>', img.getAttribute('title'), true);
    }

    // Visible text nodes only.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      push('text<' + el.tagName.toLowerCase() + '>', n.nodeValue);
    }

    // User-facing attributes.
    for (const el of document.querySelectorAll('[alt],[title],[aria-label],[placeholder]')) {
      for (const a of ['alt', 'title', 'aria-label', 'placeholder']) {
        if (el.hasAttribute(a)) push(`${a}<${el.tagName.toLowerCase()}>`, el.getAttribute(a));
      }
    }
    return out;
  });
}

const samples = await harvest('page');

/* Open a lightbox so its caption and alt are covered too. */
await page.locator('.tile:not([hidden])').first().click();
await page.waitForTimeout(500);
samples.push(...(await harvest('lightbox')));
await page.keyboard.press('Escape');

/* Switch to Macedonian and harvest again. */
await page.evaluate(() => document.querySelector('.lang button[data-lang="mk"]').click());
await page.waitForTimeout(800);
samples.push(...(await harvest('mk')));

const failures = [];
for (const s of samples) {
  for (const [re, name] of PATTERNS) {
    if (re.test(s.text)) failures.push(`${name}: [${s.where}] "${s.text.slice(0, 90)}"`);
  }
  if (!s.describesImage) continue;
  const lower = s.text.toLowerCase();
  for (const w of forbidden) {
    if (new RegExp(`\\b${w}\\b`).test(lower)) {
      failures.push(`filename-only word "${w}": [${s.where}] "${s.text.slice(0, 90)}"`);
    }
  }
}

/* Published paths must be clean slugs. */
const pathIssues = await page.evaluate(() => {
  const bad = [];
  for (const img of document.querySelectorAll('img')) {
    const urls = [img.getAttribute('src') || ''];
    for (const part of (img.getAttribute('srcset') || '').split(',')) {
      const u = part.trim().split(/\s+/)[0];
      if (u) urls.push(u);
    }
    for (const u of urls) {
      if (/%20| /.test(u)) bad.push('space in path: ' + u.slice(0, 80));
      if (/[A-Z]/.test(u)) bad.push('uppercase in path: ' + u.slice(0, 80));
      if (/\.(png|jpe?g)\b/.test(u) && !u.includes('favicon') && !u.includes('grain')) {
        bad.push('unoptimised format: ' + u.slice(0, 80));
      }
    }
  }
  return [...new Set(bad)];
});

await browser.close();

console.log(`scanned ${samples.length} text and attribute samples`);
console.log(`${curated.size} curated vocabulary words; ${forbidden.size} filename-only words treated as leaks`);
console.log(`patterns: ${PATTERNS.map((p) => p[1]).join(', ')}`);
console.log('');

const all = [...new Set([...failures, ...pathIssues])];
if (all.length) {
  console.log(`FAIL — ${all.length} leak(s):`);
  for (const f of all.slice(0, 40)) console.log('  ' + f);
  process.exitCode = 1;
} else {
  console.log('PASS — no image filename is visible anywhere on the page');
}
