<script setup>
const config = useRuntimeConfig()
const origin = config.public.siteUrl || useRequestURL().origin
useSeoMeta({
  title: 'Funding Atlas | Company fundraising rankings',
  description: 'Explore the UK seed-stage fintech funding ranking or turn a company fundraising CSV into an industry report.',
})
useHead(() => ({ link: [{ rel: 'canonical', href: new URL('/', origin).href }] }))
</script>

<template>
  <div class="wrap page">
    <h1>Industry funding rankings</h1>
    <p class="intro">Explore company fundraising data or use a CSV to create a report for another industry.</p>
    <section class="report-list" aria-labelledby="reports">
      <h2 id="reports">Reports</h2>
      <NuxtLink to="/blog/uk-fintech-funding">Top 100 UK seed-stage fintech companies by funding</NuxtLink>
      <p>The full ranking, total fundraising and regional breakdown.</p>
    </section>
  </div>
</template>
