<script setup>
useSeoMeta({
  title: 'Generate a funding report | Funding Atlas',
  description: 'Upload a company fundraising CSV to generate an industry report.',
  robots: 'noindex, follow',
})
const topic = ref('')
const file = ref(null)
const busy = ref(false)
const error = ref('')

async function generate() {
  if (busy.value) return
  error.value = ''
  if (!file.value || file.value.size > 512 * 1024) {
    error.value = 'Choose a CSV file no larger than 512 KB.'
    return
  }

  busy.value = true
  try {
    const { path } = await $fetch('/api/blogs', {
      method: 'POST',
      body: { topic: topic.value, csv: await file.value.text() },
      retry: 0,
    })
    await navigateTo(path)
  } catch (failure) {
    error.value = failure?.data?.statusMessage || 'The report could not be generated. Please try again.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="wrap page generator-page">
    <section aria-labelledby="generator-title">
      <h1 id="generator-title">Generate a funding report</h1>
      <p class="generator-intro">Upload a company dataset to calculate its rankings and create an article with AI-written copy.</p>
      <form class="form-card" @submit.prevent="generate">
        <div>
          <label for="topic">Industry or report topic</label>
          <input id="topic" v-model.trim="topic" type="text" required minlength="2" maxlength="60" placeholder="e.g. UK healthtech" :disabled="busy">
        </div>
        <div>
          <label for="csv">Company CSV</label>
          <input id="csv" type="file" accept=".csv,text/csv" required aria-describedby="file-help" :disabled="busy" @change="file = $event.target.files[0] ?? null">
          <p id="file-help" class="hint">UTF-8 CSV. Up to 500 companies and 512 KB.</p>
        </div>
        <p class="hint">Use public company data only. Anyone with the generated report link can open it.</p>
        <p v-if="error" role="alert" class="form-error">{{ error }}</p>
        <button class="button" type="submit" :disabled="busy">{{ busy ? 'Generating report…' : 'Generate report' }}</button>
        <p v-if="busy" role="status" class="hint">Writing the draft and preparing the ranking. This can take a moment.</p>
      </form>
    </section>
    <aside class="upload-help">
      <h2>CSV format</h2>
      <p><strong>Required columns</strong><br>Company and Total Raised (GBP).</p>
      <p><strong>Optional columns</strong><br>Region and Stage.</p>
      <p>Use one company per row. Quote any amount that contains commas, such as <code>"£1,000,000"</code>.</p>
      <a class="text-link" href="/example-healthtech.csv" download>Download example CSV</a>
    </aside>
  </div>
</template>
