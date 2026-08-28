import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const countries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/countries' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    heroImage: z.string().optional(),
    region: z.string(),
    parentSlug: z.string().optional(),
    // Destination country as it appears after the comma in the schedule data's
    // "Port, Country" strings (e.g. "Malta"). When set, the page shows a
    // country-filtered <SailingSchedule>. Leave unset on region pages.
    scheduleCountry: z.string().optional(),
    shippingTime: z.string().optional().default(''),
    popularBrands: z.array(z.string()).optional().default([]),
    popularModels: z.array(z.string()).optional().default([]),
    ports: z.array(z.string()).optional().default([]),
    keyFacts: z.array(z.object({
      title: z.string(),
      value: z.string(),
    })).optional().default([]),
  }),
});

const vehicles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/vehicles' }),
  schema: z.object({
    title: z.string(),
    make: z.string(),
    model: z.string(),
    year: z.number(),
    price: z.number(),
    mileage: z.number(),
    fuel: z.string(),
    transmission: z.string(),
    bodyType: z.string(),
    color: z.string().optional(),
    condition: z.enum(['New', 'Used']).default('Used'),
    doors: z.number().optional(),
    driveType: z.string().optional(),
    engineSize: z.string().optional(),
    features: z.array(z.string()).optional(),
    description: z.string(),
    images: z.array(z.string()).optional(),
    featured: z.boolean().default(false),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.string().default('UK Vehicle Exporters Team'),
    category: z.string(),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { countries, vehicles, blog };
