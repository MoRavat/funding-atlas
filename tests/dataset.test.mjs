import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatasetError, parseDataset, summarise } from '../server/utils/dataset.mjs'
import { generateCopy, readCopy } from '../server/utils/generate-copy.mjs'

test('the supplied fintech dataset ranks every row and has the expected totals', () => {
  const companies = parseDataset(readFileSync(new URL('../server/data/fintech.csv', import.meta.url), 'utf8'))
  const stats = summarise(companies)
  assert.equal(companies.length, 100)
  assert.equal(companies[0].company, 'Nevis')
  assert.equal(companies.at(-1).company, 'Ledger Rocket')
  assert.equal(stats.total, 62_230_127_000)
  assert.equal(stats.median, 414_678_600)
  assert.deepEqual(stats.leadingRegion, { name: 'London', count: 78 })
})

test('accepts header aliases, BOM, escaped names, quoted GBP and funding ties', () => {
  const companies = parseDataset('\uFEFFCompany Name,Total Funding (GBP),Location\r\n"Small, Ltd",0,Unknown\r\n"North ""Health""","£1,200.50",London\r\nOther,1200.50,london')
  assert.deepEqual(companies.map(row => row.company), ['North "Health"', 'Other', 'Small, Ltd'])
  const stats = summarise(companies)
  assert.equal(stats.median, 120_050)
  assert.equal(stats.regionCount, 2)
  assert.deepEqual(stats.leadingRegion, { name: 'London', count: 2 })
  assert.equal(stats.topFiveShare, 100)
  assert.equal(summarise(parseDataset('Company,Funding\nZero,0')).topFiveShare, null)
})

test('rejects invalid schemas, inconsistent widths and unsupported amounts', () => {
  for (const csv of [
    'Company,Country\nExample,UK',
    'Company,Funding\nExample,1,200',
    'Company,Funding\nExample,£25m',
    'Company,Funding\nExample,-200',
    'Company,Funding\n"Unclosed,100',
  ]) {
    assert.throws(() => parseDataset(csv), DatasetError)
  }
})

test('validates output from each provider and sends computed facts rather than the raw CSV', async () => {
  const copy = { intro: 'Industry funding snapshot.', heading: 'The ranking', analysis: 'Each company is ranked by total fundraising.' }
  const gemini = { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(copy) }] } }] }
  assert.deepEqual(readCopy(gemini), copy)
  assert.throws(() => readCopy({ candidates: [{ finishReason: 'MAX_TOKENS' }] }))
  assert.throws(() => readCopy({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"intro":"<div>"}' }] } }] }))
  const companies = parseDataset('Company,Total Raised,Description\nAster,300,Do not send this raw description')
  const ai = {
    async run(model, request) {
      assert.match(model, /llama/)
      assert.match(request.messages[1].content, /£300/)
      assert.doesNotMatch(request.messages[1].content, /raw description/)
      return { response: copy }
    },
  }
  assert.deepEqual(await generateCopy({ ai, topic: 'Healthtech', companies, stats: summarise(companies) }), copy)
})
