<script setup>
import { money } from '#shared/utils/money.mjs'

definePageMeta({ key: route => route.path })
const route = useRoute()
const config = useRuntimeConfig()
const origin = config.public.siteUrl || useRequestURL().origin
const { data: article, error } = await useFetch(`/api/blogs/${encodeURIComponent(route.params.slug)}`)
if (error.value || !article.value) {
  throw createError({
    statusCode: error.value?.statusCode || 404,
    statusMessage: error.value?.statusMessage || 'Report not found',
    fatal: true,
  })
}

const { slug, title, description, companies, stats, copy, isSeed } = article.value
const canonical = new URL(`/blog/${slug}`, origin).href
const topShare = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(stats.topFiveShare ?? 0)
const region = stats.leadingRegion
const hasRegion = companies.some(company => company.region)
const hasStage = companies.some(company => company.stage)
const topCount = Math.min(5, stats.count)
const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  mainEntityOfPage: canonical,
  inLanguage: 'en-GB',
  publisher: { '@type': 'Organization', name: 'Funding Atlas' },
}).replaceAll('<', '\\u003c')

useSeoMeta({
  title: `${title} | Funding Atlas`,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'article',
  ogUrl: canonical,
  robots: isSeed ? 'index, follow' : 'noindex, follow',
})
useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [{ type: 'application/ld+json', textContent: jsonLd }],
})
</script>

<template>
  <article class="wrap page">
    <header class="article-header">
      <p v-if="!isSeed" class="draft-note">AI-generated draft</p>
      <h1>{{ title }}</h1>
      <p class="intro">{{ copy.intro }}</p>
      <a href="#ranking">Skip to the ranking</a>
    </header>

    <dl class="metric-grid" aria-label="Funding snapshot">
      <div><dt>Companies ranked</dt><dd>{{ stats.count }}</dd></div>
      <div><dt>Total fundraising</dt><dd>{{ money(stats.total) }}</dd></div>
      <div><dt>Median fundraising</dt><dd>{{ money(stats.median) }}</dd></div>
    </dl>

    <section class="article-section" aria-labelledby="insight-heading">
      <h2 id="insight-heading">{{ copy.heading }}</h2>
      <p>{{ copy.analysis }}</p>
      <p v-if="region"><strong>{{ region.name }}</strong> is the most represented location, with <strong>{{ region.count }} of {{ stats.regionCount }}</strong> companies with a known region<template v-if="stats.regionCount < stats.count"> ({{ stats.count }} companies in total)</template>.</p>
      <p v-if="stats.topFiveShare !== null">The top {{ topCount }} account for <strong>{{ topShare }}%</strong> of total fundraising in the dataset.</p>
    </section>

    <section id="ranking" class="article-section" aria-labelledby="rank-heading">
      <h2 id="rank-heading">Full funding ranking</h2>
      <p class="table-note">Highest to lowest · GBP</p>
      <div class="table-scroll" tabindex="0" role="region" aria-label="Scrollable funding ranking table">
        <table>
          <caption class="sr-only">All {{ stats.count }} companies ranked by total fundraising in GBP</caption>
          <thead>
            <tr><th scope="col">Rank</th><th scope="col">Company</th><th v-if="hasRegion" scope="col">Region</th><th v-if="hasStage" scope="col">Stage</th><th scope="col" class="funding">Total raised</th></tr>
          </thead>
          <tbody>
            <tr v-for="(company, index) in companies" :key="index">
              <td>{{ index + 1 }}</td>
              <th scope="row">{{ company.company }}</th>
              <td v-if="hasRegion">{{ company.region || '—' }}</td>
              <td v-if="hasStage">{{ company.stage || '—' }}</td>
              <td class="funding">{{ money(company.funding) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="method">
        <h2>Source and methodology</h2>
        <p v-if="isSeed">Source: the <a href="https://drive.google.com/file/d/14e3_sIxg4_3c1MHb-326Rg44-CH1aim2/view?usp=sharing">Beauhurst assessment dataset</a>. It contains 100 UK seed-stage fintech companies. The ranking reflects the supplied snapshot.</p>
        <p v-else>Source: a CSV uploaded to Funding Atlas. Review the AI-generated introduction and analysis against the dataset before reuse.</p>
        <p>Rank is based on total fundraising in GBP. Ties retain the original CSV order. The median is the middle value, or the average of the two middle values when the number of companies is even.</p>
      </div>
    </section>
  </article>
</template>
