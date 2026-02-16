import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('reiblast1123'),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    draft: z.boolean().default(false),
    slug: z.string().optional(),
  }),
});

const profile = defineCollection({
  type: 'content',
  schema: z.object({
    handle: z.string(),
    birthdate: z.string(),
    location: z.string(),
    education: z.string(),
    hobbies: z.array(z.string()),
    certifications: z.array(z.string()),
  }),
});

export const collections = { blog, profile };
