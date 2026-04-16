// ─── Currency / Salary ────────────────────────────────────────────────────────

/**
 * Format a number as Uzbek soum with space thousands separator.
 * 10500000 → "10 500 000 so'm"
 */
export const formatSoum = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) return '—'
  return `${Math.round(Number(value)).toLocaleString('ru-RU')} so'm`
}

/**
 * Compact soum format for KPI cards and chart labels.
 * 10500000 → "10.5 mln so'm"
 *  8300000 → "8.3 mln so'm"
 */
export const formatSoumCompact = (value) => {
  const n = Number(value)
  if (isNaN(n)) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} mln so'm`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)} ming so'm`
  return `${Math.round(n)} so'm`
}

/**
 * Chart axis tick formatter for UZS values (shows "8 mln", "10 mln" etc.)
 */
export const fmtSoumAxis = (value) => {
  const n = Number(value)
  if (isNaN(n)) return ''
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} mln`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`
  return String(Math.round(n))
}

/**
 * Legacy USD formatter — kept for financial metrics (revenue, profit).
 * Do NOT use for employee salaries.
 */
export const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)

// ─── Other formatters ─────────────────────────────────────────────────────────

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
