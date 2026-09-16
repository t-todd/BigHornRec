// Run on macOS with `npm run icons`. sips preserves the supplied artwork.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, copyFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const transparent = 'public/images/BigHornRecLogo.webp';
const blue = 'public/images/BigHornRecLogo_blue.webp';
function png(source, size, destination) {
  execFileSync('sips', ['-s', 'format', 'png', '--resampleHeightWidth', String(size), String(size), source, '--out', destination], { stdio: 'ignore' });
}
for (const size of [16, 32]) png(transparent, size, `public/images/favicon-${size}x${size}.png`);
png(blue, 180, 'public/images/apple-touch-icon.png');
for (const size of [192, 512]) png(blue, size, `public/images/android-chrome-${size}x${size}.png`);

// ICO supports PNG-encoded entries; include multiple sizes for browser selection.
const temporary = await mkdtemp(path.join(tmpdir(), 'bighorn-icons-'));
try {
  const sizes = [16, 32, 48];
  const images = [];
  for (const size of sizes) {
    const file = path.join(temporary, `${size}.png`);
    png(transparent, size, file);
    images.push(await readFile(file));
  }
  const directory = Buffer.alloc(6 + 16 * sizes.length);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(sizes.length, 4);
  let offset = directory.length;
  sizes.forEach((size, i) => {
    const entry = 6 + i * 16;
    directory[entry] = size;
    directory[entry + 1] = size;
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(images[i].length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += images[i].length;
  });
  await writeFile('public/images/favicon.ico', Buffer.concat([directory, ...images]));
  await copyFile('public/images/favicon.ico', 'public/favicon.ico');
} finally {
  await rm(temporary, { recursive: true });
}
console.log('Generated ICO, 16/32px PNGs, Apple 180px, and Android 192/512px icons.');
