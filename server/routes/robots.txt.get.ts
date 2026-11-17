import { siteOrigin } from '../utils/site-origin'

export default defineEventHandler(event => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return `User-agent: *\nAllow: /\nSitemap: ${siteOrigin(event)}/sitemap.xml\n`
})
