// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://carexporters.com',
  integrations: [sitemap()],
  redirects: {
    '/admin': '/admin/index.html',
    '/blog/china-car-exports-jump-73-in-may-as-high-fuel-prices-raise-interest-in-evs': '/blog/china-car-exports-jump-73-percent',
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
