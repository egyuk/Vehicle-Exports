# AutoDeal — Content Management Guide

Welcome to your AutoDeal website! This guide explains how to add and manage content.

---

## Quick Overview

Your website content is stored as Markdown files in the `src/content/` folder:

```
src/content/
├── vehicles/     ← Car listings
├── blog/         ← Blog posts
└── countries/    ← Export destination pages
```

You have two options for managing content:
1. **Sveltia CMS** — Visual editor at `/admin` (recommended for non-technical users)
2. **Markdown files** — Edit files directly in the `src/content/` folder

---

## Option 1: Using Sveltia CMS (Visual Editor)

### Access the CMS
1. Go to `https://your-domain.com/admin`
2. Log in with your GitHub account
3. You'll see three collections: **Vehicles**, **Blog Posts**, and **Export Destinations**

### Add a New Vehicle
1. Click **Vehicles** in the sidebar
2. Click **New Vehicles**
3. Fill in the fields:
   - **Title**: Full vehicle name (e.g., "2024 Toyota Land Cruiser VX")
   - **Slug**: URL-friendly name (e.g., "2024-toyota-land-cruiser") — no spaces, use hyphens
   - **Make**: Select the manufacturer
   - **Model**: Type the model name
   - **Year**: Vehicle year
   - **Price (USD)**: Price as a whole number (e.g., 45000)
   - **Mileage**: Mileage in miles
   - **Fuel Type**: Petrol, Diesel, Electric, or Hybrid
   - **Transmission**: Automatic, Manual, or CVT
   - **Body Type**: SUV, Sedan, Pickup Truck, etc.
   - **Color**: Optional
   - **Description**: Short description (shown in vehicle cards)
   - **Images**: Upload vehicle photos (first image = main photo)
   - **Featured**: Toggle ON to show on homepage
4. Add detailed content in the **Body** editor (features, specs, export info)
5. Click **Publish**

### Add a New Blog Post
1. Click **Blog Posts** in the sidebar
2. Click **New Blog Posts**
3. Fill in the fields:
   - **Title**: Post title
   - **Slug**: URL name (e.g., "my-first-post")
   - **Description**: Short summary (shown in blog cards)
   - **Date**: Publication date
   - **Author**: Default is "AutoDeal Team"
   - **Category**: Choose from Export Guide, Industry News, Vehicle Reviews, Company Updates, Tips & Advice
   - **Featured Image**: Optional header image
   - **Draft**: Set to ON to save without publishing
4. Write your post content in the **Body** editor
5. Click **Publish**

### Add a New Export Destination
1. Click **Export Destinations** in the sidebar
2. Click **New Export Destinations**
3. Fill in all fields (title, slug, region, shipping time, ports, etc.)
4. Write the page content in the **Body** editor
5. Click **Publish**

---

## Option 2: Editing Markdown Files Directly

### Add a New Vehicle

Create a new `.md` file in `src/content/vehicles/`. Example filename: `2024-toyota-rav4.md`

```markdown
---
title: "2024 Toyota RAV4 Hybrid"
slug: "2024-toyota-rav4"
make: "Toyota"
model: "RAV4 Hybrid"
year: 2024
price: 32000
mileage: 5200
fuel: "Hybrid"
transmission: "Automatic"
bodyType: "SUV"
color: "Silver"
description: "Low mileage RAV4 Hybrid in excellent condition. Perfect for export."
images: ["/images/rav4-1.jpg", "/images/rav4-2.jpg"]
featured: false
---

## Vehicle Details

Write detailed vehicle information here using Markdown.

### Key Features
- Feature 1
- Feature 2

### Export Ready
This vehicle includes all documentation for international export.
```

**Image handling:**
- Place vehicle images in `public/images/`
- Reference them as `/images/filename.jpg` in the `images` array
- First image in the array = main display photo

### Add a New Blog Post

Create a new `.md` file in `src/content/blog/`. Example: `my-new-post.md`

```markdown
---
title: "Your Post Title"
slug: "your-post-title"
description: "A short summary of the post."
date: 2026-05-12
author: "AutoDeal Team"
category: "Export Guide"
image: ""
draft: false
---

Write your blog post content here in Markdown.

## Heading

Paragraph text with **bold** and *italic*.

- Bullet point 1
- Bullet point 2
```

**Categories available:**
- Export Guide
- Industry News
- Vehicle Reviews
- Company Updates
- Tips & Advice

### Add a New Export Destination

Create a new `.md` file in `src/content/countries/`. Example: `south-america.md`

```markdown
---
title: "Export to South America"
slug: "south-america"
description: "Quality UK vehicles exported to South American markets."
heroImage: ""
region: "South America"
shippingTime: "4-6 weeks"
popularBrands: ["Toyota", "Nissan", "Ford"]
popularModels: ["Toyota Hilux", "Nissan Navara", "Ford Ranger"]
ports: ["Santos", "Buenos Aires", "Callao"]
keyFacts:
  - title: "Shipping Time"
    value: "4-6 weeks"
  - title: "Popular Vehicles"
    value: "Pickups & SUVs"
  - title: "Documentation"
    value: "Full export docs included"
  - title: "Inspection"
    value: "Pre-shipment report"
---

Write page content here about exporting to South America.
```

---

## After Making Changes

### If using Sveltia CMS:
Changes are saved automatically to your GitHub repository. The site rebuilds and deploys within 1-2 minutes.

### If editing files directly:
1. Save your changes
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Add new vehicle listing"
   git push
   ```
3. Vercel will automatically rebuild and deploy (1-2 minutes)

### Local Development
To test changes locally before deploying:
```bash
npm run dev        # Start development server at localhost:4321
npm run build      # Build for production
npm run preview    # Preview the production build
```

---

## Important Notes

- **Slug must be unique** — no two items can have the same slug
- **Images** — upload to `public/images/` and reference as `/images/filename.jpg`
- **Drafts** — blog posts with `draft: true` won't appear on the live site
- **Featured vehicles** — toggle `featured: true` to display on the homepage
- **Categories** — use one of the five predefined categories for blog posts
- **Date format** — use YYYY-MM-DD format (e.g., 2026-05-12)

---

## Need Help?

If you run into any issues or need assistance:
- Check the Astro docs: https://docs.astro.build
- Check the Sveltia CMS docs: https://sveltiacms.app/en/docs
- Contact your developer for technical support
