export const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)

export const formatNumber = (value) =>
  new Intl.NumberFormat('en-US').format(value)

export const formatPercent = (value, decimals = 1) =>
  `${value.toFixed(decimals)}%`

export const formatCompact = (value) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

export const getTrendColor = (value, inverse = false) => {
  if (value === 0) return 'text-slate-500'
  const isPositive = value > 0
  const isGood = inverse ? !isPositive : isPositive
  return isGood ? 'text-emerald-600' : 'text-red-500'
}

export const getTrendBg = (value, inverse = false) => {
  if (value === 0) return 'bg-slate-100'
  const isPositive = value > 0
  const isGood = inverse ? !isPositive : isPositive
  return isGood ? 'bg-emerald-50' : 'bg-red-50'
}
