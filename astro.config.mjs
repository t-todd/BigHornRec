import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://bighornrec.org',
  output: 'static',
  build: { format: 'file' },
  server: { host: '127.0.0.1', port: 4321 },
});
