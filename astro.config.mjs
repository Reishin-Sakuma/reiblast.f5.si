// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import cloudflare from '@astrojs/cloudflare';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProd = process.env.NODE_ENV === 'production';

// https://astro.build/config
export default defineConfig({
  // 'server' is required so Keystatic's /api/keystatic/update POST endpoint
  // is routed through the SSR pipeline. Static pages opt in via `prerender = true`.
  output: 'server',
  adapter: cloudflare(),
  site: 'https://reiblast1123.com',
  // Keystatic API breaks when Astro enforces trailing-slash redirects on POSTs.
  // See https://github.com/Thinkmill/keystatic/issues/1042
  trailingSlash: isProd ? 'always' : 'never',
  integrations: [mdx(), sitemap(), react(), keystatic()],
  markdown: {
    shikiConfig: {
      theme: 'one-dark-pro',
      wrap: true,
    },
  },
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
});
