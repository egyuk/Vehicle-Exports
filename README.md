# AutoDeal — Vehicle Export Website

A static site for a UK vehicle export business, built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com). Content (vehicle listings, blog posts, export destination pages) is managed as Markdown via [Sveltia CMS](https://sveltiacms.app), available at `/admin`.

## Project Structure

```text
/
├── public/
│   ├── admin/            # Decap CMS config and entry point
│   └── images/            # Vehicle photos and site assets
├── src/
│   ├── components/        # Astro components (Header, VehicleCard, etc.)
│   ├── content/
│   │   ├── vehicles/      # Vehicle listings (Markdown + frontmatter)
│   │   ├── blog/          # Blog posts
│   │   └── countries/     # Export destination pages
│   ├── content.config.ts  # Content collection schemas
│   ├── layouts/
│   └── pages/              # Routes, including dynamic /cars/[make]/[model]/[vehicleSlug]
└── package.json
```

For guidance on adding or editing vehicles, blog posts, and export destinations, see [CONTENT-GUIDE.md](./CONTENT-GUIDE.md).

## Commands

All commands are run from the root of the project, from a terminal:

| Command             | Action                                           |
| :------------------- | :----------------------------------------------- |
| `npm install`         | Installs dependencies                            |
| `npm run dev`         | Starts local dev server at `localhost:4321`      |
| `npm run build`       | Build the production site to `./dist/`           |
| `npm run preview`     | Preview the production build locally             |
| `npm run astro ...`   | Run CLI commands like `astro add`, `astro check` |

## Content Management

Content lives in `src/content/` as Markdown files and can be edited either:
1. Through the Sveltia CMS visual editor at `/admin` (requires GitHub login), or
2. Directly in the Markdown files

See [CONTENT-GUIDE.md](./CONTENT-GUIDE.md) for full details on both workflows.

## Deployment

Pushing to `master` triggers an automatic rebuild and deploy (Vercel).
