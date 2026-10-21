/* Image pipeline.
 *
 * Reads the untouched PNGs in assets/original/ and writes responsive WebP
 * derivatives into assets/images/, plus a manifest the site uses to render
 * every <img> with real width/height (no layout shift) and a correct srcset.
 *
 *   node scripts/optimize-images.mjs
 *
 * Originals are never modified or deleted.
 */
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, extname, basename, relative, dirname, sep } from 'node:path';

const SRC = 'assets/original';
const OUT = 'assets/images';
const WIDTHS = [480, 720, 1080];
const QUALITY = 78;

/* The carousel/marquee serves the 720px step, which must stay under this. */
const CAROUSEL_BUDGET_KB = 150;

/* ---------------------------------------------------------------------------
 * Category map.
 *
 * Folder name decides the category for everything inside a folder. The ten
 * loose files at the top of assets/original/ have no folder to inherit from,
 * so they are mapped by hand below.
 *
 * TODO(Marko): the five files mapped to 'events-other' are clearly real event
 * graphics in Macedonian, but I could not tell which competition they belong
 * to. Tell me and I'll fold them into the right project group.
 * ------------------------------------------------------------------------ */
const FOLDER_CATEGORY = {
  'SlamJam': 'slamjam',
  'Sportski Igri': 'sportski',
  'concepts': 'concepts',
  'matchday': 'matchdays',
  'thumbnails': 'thumbnails',
};

const LOOSE_FILE_CATEGORY = {
  'behance slamjam poster].png': 'slamjam',
  'nikonect slamjam.png': 'slamjam',
  'maccabi matchday.png': 'matchdays',
  'amg.png': 'concepts',
  'atm rma.png': 'concepts',
  'aspored cetvrtok.png': 'events-other',
  'cetvrtok fudbal crta.png': 'events-other',
  'juniori champions.png': 'events-other',
  'saatnica juniori.png': 'events-other',
  'borec 2.png': 'events-other',
};

const slugify = (s) =>
  s.normalize('NFKD')
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.(png|jpe?g|webp)$/i.test(e.name)) out.push(p);
  }
  return out;
}

const files = (await walk(SRC)).sort();
console.log(`found ${files.length} source images in ${SRC}`);

/* Deduplicate by content hash. Several posters exist both at the top level and
 * inside a folder; the folder copy wins because it carries a category. */
const byHash = new Map();
for (const f of files) {
  const hash = createHash('sha256').update(await readFile(f)).digest('hex');
  const rel = relative(SRC, f);
  const inFolder = rel.includes(sep);
  const prev = byHash.get(hash);
  if (!prev || (inFolder && !prev.inFolder)) byHash.set(hash, { file: f, rel, inFolder });
}
const unique = [...byHash.values()];
console.log(`${unique.length} unique (skipping ${files.length - unique.length} duplicate copies)`);

function categoryFor(rel) {
  const parts = rel.split(sep);
  if (parts.length > 1) return FOLDER_CATEGORY[parts[0]] || slugify(parts[0]);
  return LOOSE_FILE_CATEGORY[parts[0]] || 'concepts';
}

await mkdir(OUT, { recursive: true });

const manifest = [];
const oversized = [];
let totalOut = 0;

for (const { file, rel } of unique) {
  const cat = categoryFor(rel);
  const id = slugify(basename(rel));
  const meta = await sharp(file).metadata();
  const dir = join(OUT, cat);
  await mkdir(dir, { recursive: true });

  /* Never upscale: only emit steps the original can actually fill, but always
   * emit at least one so every image has a source. */
  let steps = WIDTHS.filter((w) => w <= meta.width);
  if (steps.length === 0) steps = [meta.width];

  const sizes = {};
  for (const w of steps) {
    const dest = join(dir, `${id}-${w}.webp`);
    /* The 720px step is what the marquee loads, so it has a hard byte budget.
     * Busy poster art does not always fit at the default quality — step the
     * quality down for those few files until it does. */
    const budget = w === 720 ? CAROUSEL_BUDGET_KB * 1024 : Infinity;
    let size = 0;
    for (const q of [QUALITY, 72, 66, 60, 54]) {
      await sharp(file)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: q, effort: 5 })
        .toFile(dest);
      ({ size } = await stat(dest));
      if (size <= budget) break;
      if (q === 54) oversized.push({ id, kb: Math.round(size / 1024) });
    }
    sizes[w] = size;
    totalOut += size;
  }

  manifest.push({
    id,
    cat,
    src: `${OUT}/${cat}/${id}`,
    w: meta.width,
    h: meta.height,
    widths: steps,
    bytes: sizes,
  });
  process.stdout.write('.');
}
console.log('');

manifest.sort((a, b) => a.cat.localeCompare(b.cat) || a.id.localeCompare(b.id));
await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));

/* Same data as a plain script, so the portfolio grid does not have to wait on
 * a second network round trip before it can render. */
await writeFile(
  join(OUT, 'manifest.js'),
  `/* Generated by scripts/optimize-images.mjs — do not edit by hand. */\n` +
  `window.NIKONECT_IMAGES=${JSON.stringify(manifest)};\n`
);

/* ---- derived assets -------------------------------------------------- */

/* Open Graph card: a 1200x630 crop of a poster. */
const ogSource = unique.find((u) => u.rel.includes('slamjam x nikonect')) || unique[0];
await sharp(ogSource.file)
  .resize({ width: 1200, height: 630, fit: 'cover', position: 'top' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile('assets/og-image.jpg');

/* Favicons from the same poster crop. */
await mkdir('assets/favicon', { recursive: true });
for (const size of [32, 180, 192, 512]) {
  await sharp(ogSource.file)
    .resize({ width: size, height: size, fit: 'cover' })
    .png()
    .toFile(`assets/favicon/icon-${size}.png`);
}

/* Static grain tile. Replaces the SVG feTurbulence filter the old page ran at
 * full viewport size — this is a plain tiled bitmap with no filter cost. */
const N = 128;
const noise = Buffer.alloc(N * N * 4);
let seed = 0x2f6e2b1;
for (let i = 0; i < N * N; i++) {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  const v = seed >>> 24;
  noise[i * 4] = v; noise[i * 4 + 1] = v; noise[i * 4 + 2] = v;
  noise[i * 4 + 3] = 36;
}
await sharp(noise, { raw: { width: N, height: N, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile('assets/images/grain.png');

/* ---- report ----------------------------------------------------------- */
const byCat = {};
for (const m of manifest) byCat[m.cat] = (byCat[m.cat] || 0) + 1;
console.log('\nby category:', byCat);
console.log(`output total: ${(totalOut / 1048576).toFixed(1)} MB across ${manifest.length} images`);
const largest720 = manifest
  .filter((m) => m.bytes[720])
  .sort((a, b) => b.bytes[720] - a.bytes[720])[0];
if (largest720) {
  console.log(`largest 720px file: ${Math.round(largest720.bytes[720] / 1024)} KB (${largest720.id})`);
}
if (oversized.length) {
  console.log(`\nOVER ${CAROUSEL_BUDGET_KB} KB budget at 720px:`);
  for (const o of oversized) console.log(`  ${o.kb} KB  ${o.id}`);
} else {
  console.log(`all 720px files within the ${CAROUSEL_BUDGET_KB} KB carousel budget`);
}
