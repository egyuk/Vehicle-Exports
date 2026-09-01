// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Drives every canonical tag and the sitemap URLs. Keep in step with the
  // fallback in src/layouts/Layout.astro and the Sitemap line in public/robots.txt.
  site: 'https://vehicleexports.co.uk',
  integrations: [sitemap()],
  redirects: {
    // Not a legacy redirect — resolves the bare /admin URL to the Decap CMS
    // panel's static page. Keep even though old-URL redirects were dropped.
    '/admin': '/admin/index.html',
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
