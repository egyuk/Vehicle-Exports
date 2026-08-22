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
    '/admin': '/admin/index.html',
    // Page renamed for search; the old path was indexed and linked from the footer.
    '/export-sailing-schedule': '/uk-car-sailing-schedule',
    // Target must match the post's `slug:` frontmatter, not the filename.
    '/car-export-news/china-car-exports-jump-73-in-may-as-high-fuel-prices-raise-interest-in-evs': '/car-export-news/china-car-exports',
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
