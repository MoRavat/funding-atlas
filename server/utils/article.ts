import { parseDataset, summarise } from './dataset.mjs'
import { money } from '../../shared/utils/money.mjs'

export const seedSlug = 'uk-fintech-funding'
export const seedTitle = 'Top 100 UK seed-stage fintech companies by funding'

export function assembleArticle({ slug, topic, companies, stats, copy, isSeed = false }) {
  const title = isSeed ? seedTitle : `${topic} companies ranked by funding`
  const description = `Explore ${stats.count} ${isSeed ? 'UK seed-stage fintech' : topic} companies ranked by total fundraising, with funding totals and ranking insights.`
  return { slug, topic, title, description, companies, stats, copy, isSeed }
}

export async function loadSeed() {
  const csv = await useStorage('assets:datasets').getItem<string>('fintech.csv')
  const companies = parseDataset(csv)
  const stats = summarise(companies)
  return assembleArticle({
    slug: seedSlug, topic: 'UK fintech', companies, stats, isSeed: true,
    copy: {
      intro: `Which seed-stage fintech companies have raised the most? This ranking compares 100 UK businesses in the supplied dataset by total fundraising. Together, they have raised ${money(stats.total)}, with ${companies[0].company} leading the table at ${money(companies[0].funding)}.`,
      heading: 'What the ranking reveals about seed-stage fintech',
      analysis: 'This list covers a specific slice of UK fintech. Its seed-stage focus makes it useful for comparing early-stage businesses within the sample. Total fundraising reflects cumulative capital recorded for each business, and the source does not state a collection date.',
    },
  })
}
