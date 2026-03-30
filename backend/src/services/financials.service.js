const prisma = require('../lib/prisma')

async function getAll() {
  const records = await prisma.financial.findMany({
    orderBy: { period: 'asc' },
  })

  // Attach computed per-employee metrics for convenience
  return records.map(withPerEmployeeMetrics)
}

async function getById(id) {
  const record = await prisma.financial.findUnique({ where: { id } })
  return record ? withPerEmployeeMetrics(record) : null
}

async function create(data) {
  const record = await prisma.financial.create({
    data: {
      period:     new Date(data.period),
      revenue:    data.revenue,
      net_profit: data.net_profit,
      headcount:  Number(data.headcount),
    },
  })
  return withPerEmployeeMetrics(record)
}

async function update(id, data) {
  const record = await prisma.financial.update({
    where: { id },
    data: {
      ...(data.period     && { period:     new Date(data.period) }),
      ...(data.revenue    !== undefined && { revenue:    data.revenue    }),
      ...(data.net_profit !== undefined && { net_profit: data.net_profit }),
      ...(data.headcount  !== undefined && { headcount:  Number(data.headcount) }),
    },
  })
  return withPerEmployeeMetrics(record)
}

async function remove(id) {
  return prisma.financial.delete({ where: { id } })
}

/** Attach revenue_per_employee and profit_per_employee to a financial record */
function withPerEmployeeMetrics(record) {
  const hc = record.headcount || 1   // avoid division by zero
  return {
    ...record,
    revenue_per_employee: Math.round(Number(record.revenue)    / hc),
    profit_per_employee:  Math.round(Number(record.net_profit) / hc),
  }
}

module.exports = { getAll, getById, create, update, remove }
