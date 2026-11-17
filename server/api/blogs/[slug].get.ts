import { loadSeed, seedSlug } from '../../utils/article'
import { findBlog } from '../../utils/blog-store'

export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')
  if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug)) throw createError({ statusCode: 404, statusMessage: 'Report not found' })
  const article = slug === seedSlug ? await loadSeed() : await findBlog(event, slug)
  if (!article) throw createError({ statusCode: 404, statusMessage: 'Report not found' })
  if (!article.isSeed) setResponseHeader(event, 'X-Robots-Tag', 'noindex, follow')
  return article
})
