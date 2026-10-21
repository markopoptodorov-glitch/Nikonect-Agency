/* Mobile audit at the five target widths.
   Usage: node scripts/mobile-audit.mjs <url> */
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:8080/';
const WIDTHS = [360, 375, 390, 430, 768];
const MIN_TAP = 44;

const browser = await chromium.launch();

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(1200);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(r));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
  /* Park mid-page so the floating dock is in its visible state. */
  await page.evaluate(() => window.scrollTo(0, Math.round(document.body.scrollHeight * 0.4)));
  await page.waitForTimeout(700);

  const r = await page.evaluate((cfg) => {
    const { MIN_TAP, vw } = cfg;
    const out = {};

    out.hScroll = document.documentElement.scrollWidth > vw + 1;

    // Tap targets for the controls a thumb actually uses.
    const tapSel = '.burger, .lang button, .filter, .btn, .dock a, #gridMore button, .nav__links a';
    out.smallTaps = [];
    for (const el of document.querySelectorAll(tapSel)) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      if (b.height < MIN_TAP - 0.5 || b.width < MIN_TAP - 0.5) {
        out.smallTaps.push(`${el.className || el.tagName}:${Math.round(b.width)}x${Math.round(b.height)}`);
      }
    }
    out.smallTaps = [...new Set(out.smallTaps)].slice(0, 8);

    // Nav must be collapsed to a hamburger.
    const burger = document.querySelector('.burger');
    out.burgerVisible = burger ? getComputedStyle(burger).display !== 'none' : false;

    // Hero CTAs stacked and full width.
    const ctas = [...document.querySelectorAll('.hero__cta .btn')];
    out.ctaTops = [...new Set(ctas.map((c) => Math.round(c.getBoundingClientRect().top)))].length;
    out.ctaFullWidth = ctas.every((c) => {
      const p = c.parentElement.getBoundingClientRect();
      return c.getBoundingClientRect().width >= p.width - 2;
    });

    // Marquee poster width.
    const mq = document.querySelector('.marquee__set img');
    out.posterW = mq ? Math.round(mq.getBoundingClientRect().width) : 0;
    const track = document.querySelector('.marquee__track');
    out.marqueeDur = track ? getComputedStyle(track).animationDuration : 'n/a';

    // Single column cards.
    const colCount = (sel) => {
      const els = [...document.querySelectorAll(sel)];
      if (!els.length) return 0;
      return [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().left)))].length;
    };
    out.serviceCols = colCount('.bento .card');
    out.priceCols = colCount('.prices .price');

    // iOS zooms any input under 16px.
    out.smallInputs = [...document.querySelectorAll('input, select, textarea')]
      .map((i) => parseFloat(getComputedStyle(i).fontSize))
      .filter((s) => s < 16);

    // Viewport units that break on mobile browser chrome.
    out.usesVh = [...document.querySelectorAll('.hero, .nav__links, .lightbox')]
      .map((e) => getComputedStyle(e).height)
      .join(',');

    // Dock position vs footer and safe area.
    /* The dock sits 14px lower while hidden, so measure it only in the state
       the user actually sees. */
    const dock = document.querySelector('.dock');
    if (dock && dock.classList.contains('is-visible')) {
      const d = dock.getBoundingClientRect();
      const footer = document.querySelector('footer').getBoundingClientRect();
      out.dockBottomGap = Math.round(window.innerHeight - d.bottom);
      out.dockOverFooter = d.bottom > footer.top && d.top < footer.bottom;
      out.dockVisible = getComputedStyle(dock).opacity !== '0';
    }

    // Effects budget.
    let glass = 0; let maxBlur = 0;
    for (const el of document.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      const bf = cs.backdropFilter || cs.webkitBackdropFilter;
      if (!bf || bf === 'none') continue;
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.bottom < 0 || b.top > window.innerHeight) continue;
      glass++;
      const m = bf.match(/blur\(([\d.]+)px\)/);
      if (m) maxBlur = Math.max(maxBlur, Number(m[1]));
    }
    out.glassInView = glass;
    out.maxBlur = maxBlur;
    out.glowShapes = [...document.querySelectorAll('.glow')]
      .filter((g) => getComputedStyle(g).display !== 'none').length;

    const cur = document.querySelector('#cursor');
    out.cursorShown = cur ? getComputedStyle(cur).display !== 'none' : false;

    return out;
  }, { MIN_TAP, vw: width });

  const flag = (ok) => (ok ? 'ok ' : 'FIX');
  console.log(`\n=== ${width}px ===`);
  console.log(` ${flag(!r.hScroll)} horizontal scroll: ${r.hScroll}`);
  console.log(` ${flag(r.smallTaps.length === 0)} tap targets <44px: ${r.smallTaps.length ? r.smallTaps.join(', ') : 'none'}`);
  console.log(` ${flag(r.burgerVisible || width > 820)} hamburger visible: ${r.burgerVisible}`);
  console.log(` ${flag(width > 620 || (r.ctaTops === 2 && r.ctaFullWidth))} hero CTAs: rows=${r.ctaTops} fullWidth=${r.ctaFullWidth}`);
  console.log(` ${flag(r.posterW >= 215 && r.posterW <= 265)} marquee poster width: ${r.posterW}px (target 220-260)  duration=${r.marqueeDur}`);
  console.log(` ${flag(width > 860 || r.serviceCols === 1)} service columns: ${r.serviceCols}`);
  console.log(` ${flag(width > 900 || r.priceCols === 1)} pricing columns: ${r.priceCols}`);
  console.log(` ${flag(r.smallInputs.length === 0)} inputs under 16px: ${r.smallInputs.length ? r.smallInputs.join(',') : 'none'}`);
  console.log(` ${flag(r.dockBottomGap === undefined || r.dockBottomGap >= 8)} dock bottom gap: ${r.dockBottomGap ?? 'hidden'}px, overFooter=${r.dockOverFooter ?? 'n/a'}`);
  console.log(` ${flag(r.glassInView <= 6)} glass in view: ${r.glassInView}, maxBlur=${r.maxBlur}px`);
  console.log(` ${flag(width > 620 || r.glowShapes <= 2)} glow shapes: ${r.glowShapes}`);
  console.log(` ${flag(!r.cursorShown)} custom cursor shown: ${r.cursorShown}`);

  await page.close();
}

await browser.close();
