import { fileURLToPath } from "node:url"

const cloudflare = process.argv.includes('cloudflare_module') || process.env.NITRO_PRESET === 'cloudflare_module'

export default defineNuxtConfig({
  ssr: true,
  devtools: { enabled: false },
  compatibilityDate: '2025-11-01',
  css: ['~/assets/main.css'],
  app: { head: { htmlAttrs: { lang: 'en-GB' } } },
  runtimeConfig: {
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash-lite',
    public: { siteUrl: '' },
  },
  nitro: {
    serverAssets: [{ baseName: 'datasets', dir: fileURLToPath(new URL('./server/data', import.meta.url)) }],
    storage: cloudflare ? {} : { blogs: { driver: 'fs', base: './.data/blogs' } },
  },
})
