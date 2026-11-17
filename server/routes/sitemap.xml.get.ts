import { seedSlug } from '../utils/article'
import { siteOrigin } from '../utils/site-origin'

export default defineEventHandler(event => {
  const origin = siteOrigin(event)
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${origin}/</loc></url>
  <url><loc>${origin}/blog/${seedSlug}</loc></url>
</urlset>`
})
