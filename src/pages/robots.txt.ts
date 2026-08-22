import type { APIRoute } from 'astro';

// robots.txt is generated rather than static, because the staging deployment and
// the live site need opposite answers.
//
// The site currently deploys to vehicle-exports.vercel.app while it is being
// built, and moves to vehicleexports.co.uk when finished. That staging URL is a
// Vercel *production* deployment, so Vercel does not add its automatic
// noindex header — without this, Google can index the staging copy and it then
// competes with the real site at launch.
//
// Crawling is therefore blocked by default and only opened up when the
// deployment sets SITE_LIVE=true. See the launch checklist in SITE-BACKLOG.md.
const isLive = import.meta.env.SITE_LIVE === 'true';

const live = `User-agent: *
Allow: /

Sitemap: https://vehicleexports.co.uk/sitemap-index.xml
`;

const staging = `# Staging deployment — deliberately not indexed.
# Set SITE_LIVE=true in the deployment environment when this goes live on
# vehicleexports.co.uk, which switches this file to allow crawling.
User-agent: *
Disallow: /
`;

export const GET: APIRoute = () =>
  new Response(isLive ? live : staging, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
