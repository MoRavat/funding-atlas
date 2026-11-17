# Funding Atlas

Funding Atlas turns a company fundraising CSV into a shareable, server-rendered Nuxt article. The featured report uses the 100-company UK seed-stage fintech dataset supplied for the Beauhurst assessment.

## Run locally

Use Node.js 22.18+ (22.x) or 24.11+ and npm.

```sh
npm ci
npm test
cp .env.example .env
npm run dev
```

Open [localhost:3000](http://localhost:3000). The fintech ranking works immediately. To generate a new report locally, set `NUXT_GEMINI_API_KEY` in `.env` using a free-tier Gemini Developer API key, then restart the app. `NUXT_GEMINI_MODEL` can override the default model, `gemini-2.5-flash-lite`.

For a production-style local build, run `npm run build` and `npm run preview`. Generated reports persist in the ignored `.data/blogs` directory. Launch from the project directory so the build resolves that path consistently.

## Generate a report

1. Open **Generate a report** and download the example CSV or choose your own.
2. Enter an industry label such as **UK healthtech**.
3. Select the CSV and click **Generate report**. The app opens the new report once the copy and dataset are saved.
4. Refresh the page or open the same URL in a fresh tab to check persistence.

Use a comma-separated UTF-8 file with a header and 1–500 company rows, up to 512 KB. Include `Company` and `Total Raised` columns. `Company Name` and `Total Funding (GBP)` are accepted aliases. Supply non-negative GBP amounts with up to two decimal places. Quote fields containing commas. `Region` and `Stage` are optional. Other columns are ignored. The example healthtech companies are fictional.

## Architecture

| File | Responsibility |
| --- | --- |
| `server/utils/dataset.mjs` | Parses quoted CSV with csv-parse, checks columns and amounts, sorts by funding, and computes statistics. |
| `server/api/blogs/index.post.ts` | Validates the upload, calls the model, saves a document with a unique slug, and returns its route. |
| `server/utils/generate-copy.mjs` | Sends a compact set of computed facts to Workers AI or Gemini and validates the three returned text fields. |
| `server/utils/blog-store.ts` | Stores generated documents in Cloudflare D1 in production or Nitro file storage locally. |
| `server/api/blogs/[slug].get.ts` | Loads the bundled fintech report or a stored report, and returns a 404 for unknown slugs. |
| `app/pages/blog/[slug].vue` | Server-renders both kinds of report, including the complete table, metadata and Article structured data. |

**Dataset → computed ranking and statistics → model-written prose → persisted report → Nuxt HTML.** The title, meta description, figures, and ranking table come from the industry topic and validated rows. The LLM writes the introduction, an analytical heading and a short interpretation. It receives summary statistics and a few leaders, with no raw CSV or descriptions. Vue escapes all content when inserting it into the page.

The public fintech article is linked from the home page and listed in the sitemap. It has an SEO title, meta description, canonical URL, Open Graph tags and Article JSON-LD. The generator and created reports use `noindex, follow` so shared drafts can be viewed and reviewed before search publication. A noindex directive provides search guidance. A generated link remains publicly readable.

## Deploy on Cloudflare Workers

Cloudflare Workers serves the Nuxt app, D1 persists generated reports and Workers AI runs the Llama model through a server binding. The interviewer needs only the site URL. Use Cloudflare's Free plan and keep the demo within the free quotas.

1. Install dependencies with `npm ci` and authenticate with `npx wrangler login`.
2. Run `npx wrangler d1 create funding-atlas`. Copy its database ID into the `BLOG_DB` entry in `wrangler.jsonc`. Choose a distinct Worker name if your account already uses `funding-atlas`.
3. Run `npx wrangler d1 execute funding-atlas --remote --file=schema.sql`.
4. Run `npm run deploy`. The printed `workers.dev` URL is the demo URL. For a custom canonical host, set `NUXT_PUBLIC_SITE_URL` under `vars` in `wrangler.jsonc` and redeploy. Otherwise the app uses the request origin.
5. Open the live URL in a private window. Load the fintech article, generate a report from the example CSV, and reopen that report directly. Check `/robots.txt` and `/sitemap.xml`.

Workers AI is the cloud default. To use Gemini on the Worker instead, optionally run `npx wrangler secret put NUXT_GEMINI_API_KEY`. Keep secrets out of source control. The deployed upload endpoint has an IP-based rate limit. Check your provider quotas before the interview.

[Cloudflare Nuxt deployment](https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/nuxt/) · [Workers AI JSON mode](https://developers.cloudflare.com/workers-ai/features/json-mode/) · [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) · [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)

## Limitations

- Each report is a snapshot. The fintech source gives no collection date, so the copy avoids recency and market-wide claims.
- Uploads support GBP and common column aliases. An unfamiliar schema may need header normalization or a future field-mapping step.
- Model output can still make an unsupported claim. Output validation checks structure and length. A reviewer should verify the prose before indexing a report.
- The demo handles one generation synchronously per request. Provider outages or rate limits surface as a retriable error. Only a successful generation is saved.
- This demo accepts public data and creates link-accessible drafts. An editorial product would add authentication, review, deletion and a publication state.
