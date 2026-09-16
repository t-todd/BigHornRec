import Markdoc from '@markdoc/markdoc';
import home from '../../content/pages/home.json';
import corporate from '../../content/pages/corporate.json';
import individual from '../../content/pages/individual.json';
import news from '../../content/pages/news.json';
import settings from '../../content/site.json';
import updates from '../../content/news.json';

export interface Section {
  layout?: string;
  title: string;
  anchor: string;
  appearance: string;
  body: string;
  image: string;
  imageAlt: string;
  imageSide: string;
  buttonLabel: string;
  buttonUrl: string;
}
export interface PageContent {
  kind?: string;
  eyebrow?: string;
  heroButtonLabel?: string;
  heroButtonUrl?: string;
  title: string;
  description: string;
  label: string;
  headline: string;
  hero: string;
  heroAlt: string;
  sections: Section[];
}
export const pages: Record<'home' | 'corporate' | 'individual' | 'news', PageContent> = { home, corporate, individual, news };
export const site = settings;
export const newsUpdates = [...updates].sort((a, b) => b.date.localeCompare(a.date) || a.order - b.order);
export function renderContent(content: string) {
  return Markdoc.renderers.html(Markdoc.transform(Markdoc.parse(content)));
}
