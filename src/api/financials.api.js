import api from './client'

/**
 * Maps a backend Financial record to the shape the UI components expect.
 */
export function mapFinancial(f) {
  const label = new Date(f.period).toLocaleDateString('en-US', {
    month: 'long',
    year:  'numeric',
    timeZone: 'UTC',
  })

  return {
    id:           f.id,
    month:        label,
    period:       f.period,
    revenue:      Number(f.revenue),
    profit:       Number(f.net_profit),
    headcount:    f.headcount,
    revenuePerEmp: f.revenue_per_employee ?? Math.round(Number(f.revenue)    / f.headcount),
    profitPerEmp:  f.profit_per_employee  ?? Math.round(Number(f.net_profit) / f.headcount),
  }
}

// ─── READ ──────────────────────────────────────────────────────────────────────

/** GET /api/financials */
export async function getFinancials() {
  const data = await api.get('/financials')
  return data.map(mapFinancial)
}

// ─── MUTATIONS ─────────────────────────────────────────────────────────────────

/** POST /api/financials  body: { period (YYYY-MM-DD), revenue, net_profit, headcount } */
export async function createFinancial(body) {
  const data = await api.post('/financials', body)
  return mapFinancial(data)
}

/** PUT /api/financials/:id  body: partial fields */
export async function updateFinancial(id, body) {
  const data = await api.put(`/financials/${id}`, body)
  return mapFinancial(data)
}

/** DELETE /api/financials/:id  Returns 204. */
export async function deleteFinancial(id) {
  return api.delete(`/financials/${id}`)
}
