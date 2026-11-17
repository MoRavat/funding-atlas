import { assembleArticle } from '../../utils/article'
import { saveBlog } from '../../utils/blog-store'
import { DatasetError, parseDataset, summarise } from '../../utils/dataset.mjs'
import { generateCopy } from '../../utils/generate-copy.mjs'

export default defineEventHandler(async event => {
  const size = Number(getRequestHeader(event, 'content-length'))
  if (size > 3 * 1024 * 1024) throw createError({ statusCode: 413, statusMessage: 'Choose a CSV smaller than 512 KB.' })

  const body = await readBody(event)
  const topic = typeof body?.topic === 'string' ? body.topic.trim().replace(/\s+/g, ' ') : ''
  if (topic.length < 2 || topic.length > 60 || !/^[\p{L}\p{N}][\p{L}\p{N} &/.,()+'’–-]*$/u.test(topic)) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a short industry or report topic.' })
  }

  let companies
  try {
    companies = parseDataset(body?.csv)
  } catch (error) {
    if (!(error instanceof DatasetError)) throw error
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  const { geminiApiKey, geminiModel } = useRuntimeConfig(event)
  const env = event.context.cloudflare?.env
  const apiKey = env?.NUXT_GEMINI_API_KEY || geminiApiKey
  if (!apiKey && !env?.AI) throw createError({ statusCode: 503, statusMessage: 'AI generation is awaiting a server API key.' })
  if (env?.GENERATE_LIMIT) {
    const key = getRequestHeader(event, 'cf-connecting-ip') || 'unknown'
    const { success } = await env.GENERATE_LIMIT.limit({ key })
    if (!success) throw createError({ statusCode: 429, statusMessage: 'Too many requests. Try again in a minute.' })
  }

  const stats = summarise(companies)
  let copy
  try {
    copy = await generateCopy({ ai: apiKey ? undefined : env?.AI, apiKey, model: env?.NUXT_GEMINI_MODEL || geminiModel, topic, companies, stats })
  } catch (error) {
    console.warn('Report copy generation failed', error instanceof Error ? error.name : 'Unknown error')
    throw createError({ statusCode: 502, statusMessage: 'AI generation is unavailable. Please try again shortly.' })
  }

  const prefix = topic.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42).replace(/-$/, '') || 'funding'
  const slug = `${prefix}-${crypto.randomUUID()}`
  await saveBlog(event, assembleArticle({ slug, topic, companies, stats, copy }))
  setResponseStatus(event, 201)
  return { path: `/blog/${slug}` }
})
