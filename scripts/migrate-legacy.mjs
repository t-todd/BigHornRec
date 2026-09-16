// One-time import. Original source is retained under legacy/ for auditing.
import { readFile, writeFile, mkdir, cp, access } from 'node:fs/promises';
import { load } from 'cheerio';
import TurndownService from 'turndown';

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', emDelimiter: '*' });
td.addRule('absoluteImages', {
  filter: 'img',
  replacement: (_, node) => `![${node.getAttribute('alt') || ''}](${encodeURI('/' + node.getAttribute('src').replace(/^\//, ''))})`,
});
const output = async (file, value) => writeFile(file, JSON.stringify(value, null, 2) + '\n');
await mkdir('content/pages', { recursive: true });
await mkdir('public', { recursive: true });
const sourceRoot = await access('legacy/index.html').then(() => 'legacy/').catch(() => '');
await cp(sourceRoot + 'images', 'public/images', { recursive: true });

for (const [file, key] of [['index', 'home'], ['corporate', 'corporate'], ['individual', 'individual'], ['news', 'news']]) {
  const original = await readFile(`${sourceRoot}${file}.html`, 'utf8');
  const $ = load(original.replaceAll('</br>', '<br>').replace('<p>To contribute a donation:<p>', '<p>To contribute a donation:</p>'));
  if (key === 'home') {
    await output('content/site.json', {
      name: $('.title').first().text().trim(), logo: '/images/BHRecLogo.png', email: 'bighornbaseballclub@gmail.com',
      navigation: $('.nav-links a').map((_, el) => ({ label: $(el).text(), href: $(el).attr('href') })).get(),
    });
  }
  const page = {
    title: $('title').text(), description: $('meta[name="description"]').attr('content') || '',
    label: $('.title').first().text().trim(), headline: $('h1').first().text().trim(),
    hero: key === 'home' ? '/images/BIGHORN RENDER 7.jpg' : '',
    heroAlt: key === 'home' ? 'Architectural rendering of the proposed Big Horn Recreation Center beside the sports field' : '', sections: [],
  };
  $('section').each((_, el) => {
    const section = $(el);
    const cls = section.attr('class') || '';
    if (['nav-section', 'title-section', 'image-section', 'news-section'].includes(cls)) return;
    const title = section.find('h2').first();
    const data = { title: title.text().trim(), anchor: section.attr('id') || '', appearance: 'standard', body: '', image: '', imageAlt: '', imageSide: 'right', buttonLabel: '', buttonUrl: '' };
    title.remove();
    if (cls === 'vision' || cls === 'cta' || cls === 'donate-instructions-section') data.appearance = 'maroon';
    if (cls === 'early-learning-center') data.appearance = 'muted';
    if (cls.startsWith('quote')) data.appearance = 'quote';
    if (['features', 'early-learning-center'].includes(cls)) {
      const img = section.find('img').first();
      data.image = '/' + img.attr('src').replace(/^\//, ''); data.imageAlt = img.attr('alt');
      data.imageSide = cls === 'early-learning-center' ? 'left' : 'right'; img.remove();
    }
    const button = section.find('a.cta-button').first();
    if (button.length) { data.buttonLabel = button.text(); data.buttonUrl = button.attr('href'); button.remove(); }
    data.body = td.turndown(section.html()).replaceAll('\\*\\*', '').trim();
    page.sections.push(data);
  });
  await output(`content/pages/${key}.json`, page);
  if (key === 'news') {
    const news = $('.news-item').map((order, el) => {
      const heading = $(el).find('h2').text(); const [date, title] = heading.split(' – ');
      const dateISO = new Date(`${date} 12:00:00 UTC`).toISOString().slice(0, 10);
      $(el).find('h2').remove();
      return { title, date: dateISO, order, content: td.turndown($(el).html()).replaceAll('Auguest', 'August') };
    }).get();
    await output('content/news.json', news);
  }
  console.log(`Imported ${key}: ${page.sections.length} sections`);
}
