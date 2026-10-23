/* Builds the favicon PNGs from the vector mark in assets/brand.
   Usage: node scripts/make-favicons.mjs */
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const mark = await readFile('assets/brand/nikonect-mark.svg', 'utf8');

/* The mark on the brand black, so it reads on light and dark tab strips. */
const tile = mark
  .replace('<g ', '<rect x="279" y="700" width="520" height="520" fill="#0a0a0a"/><g ');
await writeFile('assets/favicon/icon.svg', tile);

for (const size of [32, 180, 192, 512]) {
  await sharp(Buffer.from(tile), { density: 72 * size / 520 * 4 })
    .resize(size, size)
    .png()
    .toFile(`assets/favicon/icon-${size}.png`);
  console.log(`icon-${size}.png`);
}
