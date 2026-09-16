import { defineMiddleware } from 'astro:middleware';

// Production exports the original .html filenames. Resolve those same URLs
// against Astro's extensionless source routes during local development.
export const onRequest = defineMiddleware((context, next) => {
  const aliases: Record<string, string> = {
    '/index.html': '/',
    '/corporate.html': '/corporate',
    '/individual.html': '/individual',
    '/news.html': '/news',
  };
  const pathname = aliases[context.url.pathname];
  if (pathname) {
    const url = new URL(context.url);
    url.pathname = pathname;
    return context.rewrite(url);
  }
  return next();
});
