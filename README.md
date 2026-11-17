# Funding Atlas

Funding Atlas takes a company fundraising CSV and turns it into a report. The example in the app ranks the 100 UK seed-stage fintech companies in the Beauhurst dataset.

[Try the live app](https://funding-atlas.funding-atlas.workers.dev/) · [View the fintech ranking](https://funding-atlas.funding-atlas.workers.dev/blog/uk-fintech-funding)

## Try an upload

1. Open **Generate a report** and download the example healthtech CSV.
2. Enter **UK healthtech** as the topic, select the CSV and click **Generate report**.
3. The new report should show seven companies, with Aster Care Technologies first and £42,700,000 raised in total. Refresh the page to check the report was saved.

You can use your own CSV too. Include `Company` and `Total Raised` as column headers. `Company Name` and `Total Funding (GBP)` also work. `Region` and `Stage` are optional. Use GBP amounts, put values with commas in quotes, and keep the file under 512 KB with up to 500 company rows. The companies in the healthtech example are fictional.

## How it works

- [The upload handler](server/api/blogs/index.post.ts) receives the topic and CSV. [The parser](server/utils/dataset.mjs) uses csv-parse to read the rows, checks the funding values, sorts the companies and works out the totals and median.
- [The AI step](server/utils/generate-copy.mjs) gets a short set of facts and writes the intro, a heading and a short analysis. The numbers in the ranking come from the CSV.
- [The storage code](server/utils/blog-store.ts) saves each generated report under its own link. The live app uses Cloudflare D1. A local run saves reports in `.data/blogs`.
- [The Nuxt page](app/pages/blog/%5Bslug%5D.vue) displays the fintech report and generated reports using the same layout. The full table is in the HTML on the first request.

The fintech page is linked from the home page and listed in the sitemap. It has a page title, meta description, canonical URL and article structured data. Generated reports also get their own metadata. I set them to `noindex` so they can be shared by link and checked before appearing in search.

## Run locally

Use Node.js 22.18+ on the 22.x line or Node.js 24.11+, with npm.

```sh
npm ci
npm test
cp .env.example .env
npm run dev
```

Open [localhost:3000](http://localhost:3000). The fintech ranking works straight away. To generate reports locally, add a Gemini API key as `NUXT_GEMINI_API_KEY` in `.env` and restart the app. The live site uses Cloudflare Workers AI, so you can try an upload there without setting up a key. For a local production build, use `npm run build` followed by `npm run preview`.

## Deploy a copy

1. Run `npx wrangler login` and sign in to a Cloudflare account on the Free plan.
2. Run `npx wrangler d1 create funding-atlas` and put the database ID under `BLOG_DB` in `wrangler.jsonc`.
3. Run `npx wrangler d1 execute funding-atlas --remote --file=schema.sql`.
4. Run `npm run deploy` and open the URL Wrangler prints. Try an upload and reopen the generated report.

## What I’d improve

I’d add a review step so someone can check the source and the AI copy before publishing. The app checks the structure of the AI response. The copy still needs a factual read-through. I’d also add a way to map columns for CSVs with different headers.
