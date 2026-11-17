function database(event) {
  const cloudflare = event.context.cloudflare
  const db = cloudflare?.env?.BLOG_DB
  if (cloudflare && !db) {
    throw createError({ statusCode: 503, statusMessage: 'Blog storage is unavailable.' })
  }
  return db
}

export async function findBlog(event, slug) {
  const db = database(event)
  if (!db) return useStorage('blogs').getItem(slug)
  const row = await db.prepare('SELECT document FROM blogs WHERE slug = ?').bind(slug).first()
  return row ? JSON.parse(row.document) : null
}

export async function saveBlog(event, article) {
  const db = database(event)
  if (!db) {
    await useStorage('blogs').setItem(article.slug, article)
    return
  }
  await db.prepare('INSERT INTO blogs (slug, document) VALUES (?, ?)')
    .bind(article.slug, JSON.stringify(article)).run()
}
