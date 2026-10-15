import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { load } from 'cheerio';

const pages = ['index', 'corporate', 'individual', 'news'];
const normalize = text => text.replaceAll('Auguest', 'August').replaceAll('**', '').replace(/\s+/g, '').normalize('NFC');
const parse = async file => load(await readFile(file, 'utf8'));
const updatedCopy = new Map([
  ['Donate $250,000+: Get your company logo on the hardwood floor (4 available).',
    'Donate $250,000+: Get your company logo or name on the hardwood floor (4 available).'],
  ['Donate $200,000+: Get named sponsorship of a room in the Early Education Wing (4 available).',
    'Donate $200,000+: Get named sponsorship of a room in the Early Education Wing (2 remaining).'],
  ['Upon hitting a predefined funding goal, we will begin the process of breaking ground.',
    'Ground has been broken, bringing our community’s vision for a place to learn, play, and grow one step closer to reality. We hope to complete the Early Learning Center by September 2027, with the recreation center potentially following a few months later.'],
]);

for (const page of pages) {
  test(`${page}: all original paragraphs, list items, and headings survive migration`, async () => {
    const old = await parse(`legacy/${page}.html`);
    const current = await parse(`dist/${page}.html`);
    const text = normalize(current('body').text());
    old('p, li, h1, h2, h3').each((_, element) => {
      const legacyText = old(element).text().trim();
      const original = updatedCopy.get(legacyText) ?? legacyText;
      if (!original) return;
      const parts = page === 'news' && element.tagName === 'h2' ? original.split(' – ') : [original];
      for (const part of parts) assert.ok(text.includes(normalize(part)), `Missing content: ${part}`);
    });
    assert.equal(current('main').length, 1);
    assert.equal(current('h1').length, 1);
    assert.equal(current('footer').length, 1);
  });
  test(`${page}: original external and donation links are retained`, async () => {
    const old = await parse(`legacy/${page}.html`);
    const current = await parse(`dist/${page}.html`);
    const links = new Set(current('a[href]').map((_, el) => current(el).attr('href')).get());
    old('a[href]').each((_, el) => {
      const href = old(el).attr('href');
      assert.ok(links.has(href), `Missing link: ${href}`);
    });
  });
  test(`${page}: local asset, page, and fragment references resolve`, async () => {
    const $ = await parse(`dist/${page}.html`);
    for (const el of $('[href], [src]').toArray()) {
      const ref = $(el).attr('href') || $(el).attr('src');
      if (!ref || /^(https?:|mailto:|data:)/.test(ref)) continue;
      const url = new URL(ref, `http://local/${page === 'index' ? '' : page + '.html'}`);
      let target = 'dist' + decodeURIComponent(url.pathname);
      if (url.pathname.endsWith('/')) target += 'index.html';
      assert.ok((await stat(target)).isFile(), `Missing file: ${ref}`);
      if (url.hash) {
        const targetPage = await parse(target);
        const id = decodeURIComponent(url.hash.slice(1));
        assert.ok(targetPage('[id]').toArray().some(el => targetPage(el).attr('id') === id), `Missing anchor: ${ref}`);
      }
    }
  });
}
async function files(dir) {
  const results = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...await files(full));
    else if (entry.name !== '.DS_Store') results.push(full);
  }
  return results;
}
test('original assets are preserved except intentionally regenerated favicons', async () => {
  const regenerated = new Set(['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png']);
  for (const file of await files('legacy/images')) {
    if (regenerated.has(path.relative('legacy/images', file))) continue;
    const migrated = file.replace('legacy/', 'public/');
    const hash = bytes => createHash('sha256').update(bytes).digest('hex');
    assert.equal(hash(await readFile(migrated)), hash(await readFile(file)), `Changed asset: ${file}`);
  }
});
test('all twelve original news entries and their dates are retained', async () => {
  const news = JSON.parse(await readFile('content/news.json', 'utf8'));
  const $ = await parse('dist/news.html');
  assert.ok(news.length >= 12, 'Keep the original entries while allowing new updates');
  assert.equal($('.news-item').length, news.length);
  for (const update of news) assert.equal(Number.isNaN(Date.parse(update.date)), false);
  assert.deepEqual($('time').map((_, el) => $(el).attr('datetime')).get(), [...news].sort((a,b) => b.date.localeCompare(a.date) || a.order - b.order).map(n => n.date));
});
test('the public build excludes archived sources and content files', async () => {
  const built = await files('dist');
  assert.ok(built.every(file => !file.includes('/legacy/') && !file.includes('/content/')));
});
