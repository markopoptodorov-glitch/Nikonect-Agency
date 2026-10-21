/* Lighthouse mobile audit. Usage: node scripts/lighthouse.mjs <url> <label> */
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const url = process.argv[2] || 'http://localhost:8080/';
const label = process.argv[3] || 'run';

const browser = await chromium.launch({ args: ['--remote-debugging-port=9222'] });
const result = await lighthouse(url, {
  port: 9222,
  output: 'json',
  logLevel: 'error',
  screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
  formFactor: 'mobile',
  throttlingMethod: 'simulate',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
});

const lhr = result.lhr;
const a = lhr.audits;
const out = {
  label,
  url,
  performance: Math.round(lhr.categories.performance.score * 100),
  accessibility: Math.round(lhr.categories.accessibility.score * 100),
  bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
  seo: Math.round(lhr.categories.seo.score * 100),
  LCP: a['largest-contentful-paint'].displayValue,
  CLS: a['cumulative-layout-shift'].displayValue,
  TBT: a['total-blocking-time'].displayValue,
  FCP: a['first-contentful-paint'].displayValue,
  SI: a['speed-index'].displayValue,
  totalBytes: a['total-byte-weight'].displayValue,
  totalBytesRaw: a['total-byte-weight'].numericValue,
};
await mkdir('.perf', { recursive: true });
await writeFile(`.perf/${label}.json`, JSON.stringify({ summary: out }, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
