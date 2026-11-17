export const money = pence => new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: 'GBP',
  minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
  maximumFractionDigits: 2,
}).format(pence / 100)
