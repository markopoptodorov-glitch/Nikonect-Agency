/* Verifies the contact form against a configured endpoint.
   Serves a copy of the site with SITE_CONFIG.formEndpoint filled in, then
   intercepts the POST so nothing leaves the machine.

   Usage: node scripts/form-test.mjs
*/
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const TMP = '.perf/form-fixture';
const PORT = 8099;

await rm(TMP, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });
for (const f of ['index.html', 'assets']) await cp(f, `${TMP}/${f}`, { recursive: true });

/* Fill in the two values Marko would set. */
let js = await readFile(`${TMP}/assets/js/main.js`, 'utf8');
js = js.replace('formEndpoint: null,', "formEndpoint: 'https://api.web3forms.com/submit',");
js = js.replace('formAccessKey: null,', "formAccessKey: 'test-key-0000',");
js = js.replace('email: null,', "email: 'test@example.com',");
js = js.replace('viber: null,', "viber: '38970000000',");
await writeFile(`${TMP}/assets/js/main.js`, js);

const server = spawn(process.execPath, ['scripts/serve.mjs', TMP, String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const check = (label, v) => console.log(`${v ? 'PASS' : 'FAIL'}  ${label}`);

let posted = null;
await page.route('https://api.web3forms.com/**', async (route) => {
  posted = route.request().postData() || '';
  await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
});

await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
await page.waitForTimeout(1200);

check('form renders when an endpoint is configured', await page.locator('#contactForm').count() === 1);

/* Dock gains the configured channels. */
const dockLabels = await page.locator('#dock a').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
check(`dock shows configured channels (${dockLabels.join(', ')})`, dockLabels.includes('Viber') && dockLabels.includes('Email') && dockLabels.includes('Instagram'));

/* Email row appears in the contact column. */
check('email row rendered', (await page.locator('#contactSide a[href^="mailto:"]').count()) === 1);

await page.locator('#contact').scrollIntoViewIfNeeded();
await page.waitForTimeout(500);

/* Validation first: empty submit must not POST. */
await page.click('#formSubmit');
await page.waitForTimeout(400);
check('empty submit is rejected client-side', posted === null);
check('validation message shown', (await page.locator('#formNote').textContent()).length > 0);

/* No page reload on submit. */
await page.evaluate(() => { window.__stillHere = true; });

await page.fill('#f-name', 'Test Person');
await page.fill('#f-email', 'test@example.com');
await page.selectOption('#f-type', { index: 1 });
await page.fill('#f-msg', 'Need matchday posters for Saturday.');
await page.click('#formSubmit');
await page.waitForTimeout(1200);

check('POST reached the endpoint', posted !== null);
check('access_key included', (posted || '').includes('test-key-0000'));
check('honeypot field not submitted', !(posted || '').includes('botcheck'));
check('message body included', (posted || '').includes('Need matchday posters'));
check('no page reload', await page.evaluate(() => window.__stillHere === true));
check('success state shown', (await page.locator('#formNote').getAttribute('data-state')) === 'ok');
check('form reset after success', (await page.inputValue('#f-name')) === '');

/* Honeypot: a filled bot field must silently do nothing. */
posted = null;
await page.fill('#f-name', 'Bot');
await page.fill('#f-email', 'bot@example.com');
await page.fill('#f-msg', 'spam');
await page.evaluate(() => { document.querySelector('#f-company').value = 'ACME'; });
await page.click('#formSubmit');
await page.waitForTimeout(800);
check('honeypot blocks submission', posted === null);

/* Error path. */
await page.unroute('https://api.web3forms.com/**');
await page.route('https://api.web3forms.com/**', (route) => route.fulfill({ status: 500, body: 'nope' }));
await page.evaluate(() => { document.querySelector('#f-company').value = ''; });
await page.fill('#f-name', 'Test Person');
await page.fill('#f-email', 'test@example.com');
await page.fill('#f-msg', 'Another message');
await page.click('#formSubmit');
await page.waitForTimeout(1200);
check('server error shows an error state', (await page.locator('#formNote').getAttribute('data-state')) === 'error');

await browser.close();
server.kill();
await rm(TMP, { recursive: true, force: true });
