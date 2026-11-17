import { parse } from 'csv-parse/sync'

export class DatasetError extends Error {}

const aliases = {
  company: ['company', 'company name', 'business name', 'name', 'organisation', 'organization'],
  funding: ['total raised', 'total fundraising', 'total funding', 'fundraising total', 'total amount raised', 'funding raised', 'amount raised', 'funding', 'total raised gbp', 'total funding gbp'],
  region: ['region', 'location', 'uk region', 'headquarters'],
  stage: ['stage', 'funding stage', 'company stage'],
}

export const maxCsvBytes = 512 * 1024
const normaliseHeader = value => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function parseFunding(value, rowNumber) {
  const cleaned = value.trim().replace(/^GBP\s*/i, '').replace(/^£\s*/, '').replace(/\s*GBP$/i, '')
  const match = /^(\d+|\d{1,3}(?:,\d{3})+)(?:\.(\d{1,2}))?$/.exec(cleaned)
  if (!match) throw new DatasetError(`Row ${rowNumber}: use a GBP amount such as £1,200,000 or 1200000.50.`)
  const pence = Number(match[1].replaceAll(',', '')) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  if (!Number.isSafeInteger(pence)) throw new DatasetError(`Row ${rowNumber}: funding amount is too large.`)
  return pence
}

export function parseDataset(csv) {
  if (typeof csv !== 'string' || !csv.trim()) throw new DatasetError('Choose a CSV with a header and at least one company.')
  if (new TextEncoder().encode(csv).length > maxCsvBytes) throw new DatasetError('Choose a CSV smaller than 512 KB.')
  let records
  try {
    records = parse(csv, { bom: true, skip_empty_lines: true, relax_column_count: true, trim: true })
  } catch {
    throw new DatasetError('The CSV contains an invalid quoted field. Check the file and try again.')
  }
  const [headers, ...rows] = records
  if (!headers) throw new DatasetError('Include a header and at least one company.')
  const keys = headers.map(normaliseHeader)
  if (new Set(keys.filter(Boolean)).size !== keys.filter(Boolean).length) throw new DatasetError('Give each CSV column a unique header.')
  const columns = Object.fromEntries(Object.entries(aliases).map(([field, names]) => [
    field, keys.findIndex(key => names.includes(key)),
  ]))
  if (columns.company < 0 || columns.funding < 0) throw new DatasetError('Include Company and Total Raised columns. The example CSV shows the supported format.')
  if (!rows.length || rows.length > 500) throw new DatasetError('Include between 1 and 500 company rows.')

  let total = 0
  const companies = rows.map((row, index) => {
    const rowNumber = index + 2
    if (row.length !== headers.length) throw new DatasetError(`Row ${rowNumber}: check the number of columns and quote values that contain commas.`)
    const value = field => row[columns[field]]?.trim() ?? ''
    const company = value('company')
    if (!company || company.length > 160) throw new DatasetError(`Row ${rowNumber}: use a company name between 1 and 160 characters.`)
    const funding = parseFunding(value('funding'), rowNumber)
    total += funding
    if (!Number.isSafeInteger(total)) throw new DatasetError('The combined funding total is too large.')
    return {
      company,
      funding,
      region: value('region').slice(0, 100),
      stage: value('stage').slice(0, 100),
    }
  })
  return companies.sort((a, b) => b.funding - a.funding)
}

export function summarise(companies) {
  const count = companies.length
  const total = companies.reduce((sum, row) => sum + row.funding, 0)
  const topFive = companies.slice(0, 5).reduce((sum, row) => sum + row.funding, 0)
  const middle = Math.floor(count / 2)
  const median = count % 2
    ? companies[middle].funding
    : companies[middle - 1].funding / 2 + companies[middle].funding / 2
  const regions = new Map()
  let regionCount = 0
  for (const { region } of companies) {
    if (!region || /^(n\/?a|unknown|-)$/i.test(region)) continue
    regionCount++
    const key = region.toLowerCase()
    const group = regions.get(key) ?? { name: region, count: 0 }
    group.count++
    regions.set(key, group)
  }
  const leadingRegion = [...regions.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))[0]
  return {
    count, total, median, topFive, regionCount, leadingRegion,
    topFiveShare: total ? (topFive / total) * 100 : null,
  }
}

