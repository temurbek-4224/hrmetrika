/**
 * HR Metrika — Metrics Service
 *
 * Computes all HR analytics from live database data.
 * Each exported function corresponds to one dashboard endpoint.
 *
 * Conventions:
 *  - safeNum()  → converts Prisma Decimal to JS number, returns 0 on NaN
 *  - safePct()  → divides with zero-guard, returns one decimal percentage
 *  - monthLabel() → formats a Date as "Jan 2024" using UTC to avoid tz shift
 */

const prisma = require('../lib/prisma')

// ─── Shared helpers ────────────────────────────────────────────────────────────

const safeNum = (v, fallback = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

const safePct = (numerator, denominator, decimals = 1) => {
  if (!denominator) return 0
  const raw = (numerator / denominator) * 100
  const factor = Math.pow(10, decimals)
  return Math.round(raw * factor) / factor
}

const round = (v, places = 0) => {
  const f = Math.pow(10, places)
  return Math.round(safeNum(v) * f) / f
}

/** "Jan 2024" label from a Date / ISO string, UTC-safe */
const monthLabel = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'short', year: 'numeric', timeZone: 'UTC',
  })

/** Number of calendar days between two dates */
const daysBetween = (a, b) =>
  Math.round((new Date(b) - new Date(a)) / 86_400_000)

/** Add months to a date */
const addMonths = (d, n) => {
  const r = new Date(d)
  r.setUTCMonth(r.getUTCMonth() + n)
  return r
}

/** First day of the month for a given date (UTC) */
const startOfMonth = (d) =>
  new Date(Date.UTC(new Date(d).getUTCFullYear(), new Date(d).getUTCMonth(), 1))

// ─── WORKING DAYS constant (approximate) ──────────────────────────────────────
const WORKING_DAYS_PER_MONTH = 22

// ═══════════════════════════════════════════════════════════════════════════════
// 1. OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

async function getOverview() {
  // ── Load raw data ────────────────────────────────────────────────────────────
  const [
    employeeStats,
    salaryAgg,
    absenceAgg,
    financials,
    recruitmentAll,
    terminatedLast12m,
    recentHires,
  ] = await Promise.all([
    // Headcount by status
    prisma.employee.groupBy({
      by: ['status'],
      _count: { id: true },
    }),

    // Average salary of active employees
    prisma.employee.aggregate({
      where:  { status: 'ACTIVE' },
      _avg:   { salary: true },
      _count: { id: true },
    }),

    // Total approved absence days (all time)
    prisma.absence.aggregate({
      where: { approved: true },
      _sum:  { days: true },
      _count: { id: true },
    }),

    // All financial records ordered by period
    prisma.financial.findMany({ orderBy: { period: 'asc' } }),

    // All recruitment records
    prisma.recruitmentRecord.findMany(),

    // Employees terminated in last 12 months
    prisma.employee.count({
      where: {
        status:           'TERMINATED',
        termination_date: { gte: new Date(Date.now() - 365 * 86_400_000) },
      },
    }),

    // Employees hired in last 30 days
    prisma.employee.count({
      where: {
        hire_date: { gte: new Date(Date.now() - 30 * 86_400_000) },
      },
    }),
  ])

  // ── Headcount ────────────────────────────────────────────────────────────────
  const statusMap = Object.fromEntries(
    employeeStats.map(s => [s.status, s._count.id])
  )
  const activeCount     = statusMap.ACTIVE     || 0
  const onLeaveCount    = statusMap.ON_LEAVE   || 0
  const terminatedCount = statusMap.TERMINATED || 0
  const totalHeadcount  = activeCount + onLeaveCount

  // ── Absence rate (approved days / available workdays over 12 months) ─────────
  const totalAbsenceDays  = safeNum(absenceAgg._sum.days)
  const availableWorkdays = totalHeadcount * 12 * WORKING_DAYS_PER_MONTH || 1
  const absenceRate       = safePct(totalAbsenceDays, availableWorkdays, 1)

  // ── Average salary ───────────────────────────────────────────────────────────
  const avgSalary = round(safeNum(salaryAgg._avg.salary))

  // ── Turnover rate (terminated last 12 months / avg headcount) ───────────────
  const avgHeadcount  = totalHeadcount || 1
  const turnoverRate  = safePct(terminatedLast12m, avgHeadcount, 1)
  const retentionRate = round(100 - turnoverRate, 1)

  // ── Offer acceptance rate ────────────────────────────────────────────────────
  const offersExtended  = recruitmentAll.filter(r => r.offer_date !== null).length
  const offersAccepted  = recruitmentAll.filter(r => r.offer_accepted === true).length
  const offerAcceptance = safePct(offersAccepted, offersExtended, 1)

  // ── Revenue / profit per employee (latest financial record) ─────────────────
  const latest           = financials[financials.length - 1] || null
  const latestRevenue    = latest ? safeNum(latest.revenue)    : 0
  const latestProfit     = latest ? safeNum(latest.net_profit) : 0
  const latestHeadcount  = latest ? (latest.headcount || 1)    : 1
  const revenuePerEmp    = round(latestRevenue  / latestHeadcount)
  const profitPerEmp     = round(latestProfit   / latestHeadcount)

  // ── Time to hire (average days from opened → hired for FILLED records) ───────
  const filledRecs  = recruitmentAll.filter(r => r.status === 'FILLED' && r.hire_date && r.opened_date)
  const hireDays    = filledRecs.map(r => daysBetween(r.opened_date, r.hire_date))
  const avgTimeHire = hireDays.length
    ? round(hireDays.reduce((s, d) => s + d, 0) / hireDays.length)
    : 0

  // ── Open positions ───────────────────────────────────────────────────────────
  const openPositions = recruitmentAll.filter(r => r.status === 'OPEN').length

  // ── Month-over-month trends (use last 2 financial records for revenue/profit)─
  const prev     = financials.length >= 2 ? financials[financials.length - 2] : null
  const revTrend = prev
    ? safePct(safeNum(latest.revenue) - safeNum(prev.revenue), safeNum(prev.revenue), 1)
    : 0
  const profTrend = prev
    ? safePct(safeNum(latest.net_profit) - safeNum(prev.net_profit), safeNum(prev.net_profit), 1)
    : 0

  return {
    headcount:          { value: totalHeadcount,  active: activeCount, onLeave: onLeaveCount },
    absenceRate:        { value: absenceRate,       totalDays: totalAbsenceDays },
    avgSalary:          { value: avgSalary,          currency: 'USD' },
    turnoverRate:       { value: turnoverRate,       retentionRate, terminatedLast12m },
    offerAcceptance:    { value: offerAcceptance,    offered: offersExtended, accepted: offersAccepted },
    revenuePerEmployee: { value: revenuePerEmp,      trend: revTrend },
    profitPerEmployee:  { value: profitPerEmp,       trend: profTrend },
    timeToHire:         { value: avgTimeHire,         unit: 'days' },
    openPositions:      { value: openPositions },
    newHires:           { value: recentHires,         period: 'last30days' },
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. HEADCOUNT
// ═══════════════════════════════════════════════════════════════════════════════

async function getHeadcount() {
  const [employees, financials, deptCounts] = await Promise.all([
    prisma.employee.findMany({
      select: { status: true, department: { select: { name: true } } },
    }),

    // Financial records carry monthly headcount snapshots
    prisma.financial.findMany({
      orderBy: { period: 'asc' },
      select: { period: true, headcount: true },
    }),

    // Active employee count per department
    prisma.employee.groupBy({
      by:    ['department_id'],
      where: { status: { in: ['ACTIVE', 'ON_LEAVE'] } },
      _count: { id: true },
    }),
  ])

  // ── Summary ──────────────────────────────────────────────────────────────────
  const byStatus = { ACTIVE: 0, ON_LEAVE: 0, TERMINATED: 0 }
  for (const e of employees) byStatus[e.status] = (byStatus[e.status] || 0) + 1
  const totalActive = byStatus.ACTIVE + byStatus.ON_LEAVE

  // ── By department (with name join) ───────────────────────────────────────────
  const deptNameMap = {}
  for (const e of employees) {
    const n = e.department?.name
    if (n) deptNameMap[n] = (deptNameMap[n] || 0) + (e.status !== 'TERMINATED' ? 1 : 0)
  }
  const byDepartment = Object.entries(deptNameMap)
    .map(([name, headcount]) => ({
      name,
      headcount,
      percentage: safePct(headcount, totalActive, 1),
    }))
    .sort((a, b) => b.headcount - a.headcount)

  // ── Monthly trend (from financial snapshots) ─────────────────────────────────
  const monthlyTrend = financials.map(f => ({
    month:    monthLabel(f.period),
    headcount: f.headcount,
  }))

  return {
    summary: {
      total:      employees.length,
      active:     byStatus.ACTIVE,
      onLeave:    byStatus.ON_LEAVE,
      terminated: byStatus.TERMINATED,
    },
    byDepartment,
    monthlyTrend,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ABSENCE
// ═══════════════════════════════════════════════════════════════════════════════

async function getAbsence() {
  const [absences, headcountResult] = await Promise.all([
    prisma.absence.findMany({
      select: {
        type: true, days: true, approved: true,
        start_date: true,
        employee: { select: { department: { select: { name: true } } } },
      },
    }),
    prisma.employee.count({ where: { status: { in: ['ACTIVE', 'ON_LEAVE'] } } }),
  ])

  const totalHeadcount    = headcountResult || 1
  const totalDays         = absences.reduce((s, a) => s + a.days, 0)
  const approvedAbsences  = absences.filter(a => a.approved)
  const approvedDays      = approvedAbsences.reduce((s, a) => s + a.days, 0)

  // ── Overall absence rate ─────────────────────────────────────────────────────
  const availableWorkdays = totalHeadcount * 12 * WORKING_DAYS_PER_MONTH
  const absenceRate       = safePct(approvedDays, availableWorkdays, 2)

  // ── By type ──────────────────────────────────────────────────────────────────
  const typeMap = {}
  for (const a of absences) {
    if (!typeMap[a.type]) typeMap[a.type] = { count: 0, days: 0 }
    typeMap[a.type].count += 1
    typeMap[a.type].days  += a.days
  }
  const byType = Object.entries(typeMap).map(([type, v]) => ({
    type,
    count:      v.count,
    days:       v.days,
    percentage: safePct(v.count, absences.length, 1),
  })).sort((a, b) => b.days - a.days)

  // ── By department ─────────────────────────────────────────────────────────────
  const deptMap = {}
  for (const a of absences) {
    const n = a.employee?.department?.name || 'Unknown'
    if (!deptMap[n]) deptMap[n] = { days: 0, count: 0 }
    deptMap[n].days  += a.days
    deptMap[n].count += 1
  }
  const byDepartment = Object.entries(deptMap).map(([department, v]) => ({
    department,
    days:  v.days,
    count: v.count,
  })).sort((a, b) => b.days - a.days)

  // ── Monthly trend (group by year-month of start_date) ────────────────────────
  const monthMap = {}
  for (const a of absences) {
    const key = monthLabel(a.start_date)
    if (!monthMap[key]) monthMap[key] = { days: 0, count: 0, date: new Date(a.start_date) }
    monthMap[key].days  += a.days
    monthMap[key].count += 1
  }
  const monthlyTrend = Object.entries(monthMap)
    .sort(([, a], [, b]) => a.date - b.date)
    .map(([month, v]) => ({
      month,
      days:  v.days,
      count: v.count,
      rate:  safePct(v.days, totalHeadcount * WORKING_DAYS_PER_MONTH, 2),
    }))

  return {
    summary: {
      rate:         absenceRate,
      totalDays,
      approvedDays,
      totalRecords: absences.length,
      approved:     approvedAbsences.length,
      pending:      absences.filter(a => !a.approved).length,
    },
    byType,
    byDepartment,
    monthlyTrend,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SALARY
// ═══════════════════════════════════════════════════════════════════════════════

async function getSalary() {
  const [activeEmployees, deptGroups] = await Promise.all([
    // All active employees with salary + department
    prisma.employee.findMany({
      where:  { status: { in: ['ACTIVE', 'ON_LEAVE'] } },
      select: {
        salary:     true,
        department: { select: { name: true } },
      },
    }),

    // Prisma groupBy for avg per dept (Decimal needs manual computation too)
    prisma.employee.groupBy({
      by:    ['department_id'],
      where: { status: { in: ['ACTIVE', 'ON_LEAVE'] } },
      _avg:  { salary: true },
      _min:  { salary: true },
      _max:  { salary: true },
      _count: { id: true },
    }),
  ])

  const salaries = activeEmployees.map(e => safeNum(e.salary))
  salaries.sort((a, b) => a - b)

  const totalPayroll = salaries.reduce((s, v) => s + v, 0)
  const avgSalary    = salaries.length ? round(totalPayroll / salaries.length) : 0
  const minSalary    = salaries[0] || 0
  const maxSalary    = salaries[salaries.length - 1] || 0

  // Median
  const mid    = Math.floor(salaries.length / 2)
  const median = salaries.length % 2 !== 0
    ? salaries[mid]
    : round((salaries[mid - 1] + salaries[mid]) / 2)

  // ── Build dept name map ───────────────────────────────────────────────────────
  const deptNameFromEmp = {}
  for (const e of activeEmployees) {
    const n = e.department?.name
    if (!n) continue
    if (!deptNameFromEmp[n]) deptNameFromEmp[n] = []
    deptNameFromEmp[n].push(safeNum(e.salary))
  }

  const byDepartment = Object.entries(deptNameFromEmp).map(([department, salaries]) => {
    const sorted = [...salaries].sort((a, b) => a - b)
    const avg = round(sorted.reduce((s, v) => s + v, 0) / sorted.length)
    return {
      department,
      count: sorted.length,
      avg,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      payrollShare: safePct(sorted.reduce((s, v) => s + v, 0), totalPayroll, 1),
    }
  }).sort((a, b) => b.avg - a.avg)

  // ── Salary bands ─────────────────────────────────────────────────────────────
  const bands = [
    { label: '< $3k',         min: 0,     max: 3000  },
    { label: '$3k – $5k',     min: 3000,  max: 5000  },
    { label: '$5k – $7k',     min: 5000,  max: 7000  },
    { label: '$7k – $10k',    min: 7000,  max: 10000 },
    { label: '> $10k',        min: 10000, max: Infinity },
  ]
  const salaryBands = bands.map(b => ({
    label: b.label,
    count: salaries.filter(s => s >= b.min && s < b.max).length,
    percentage: safePct(salaries.filter(s => s >= b.min && s < b.max).length, salaries.length, 1),
  }))

  return {
    summary: {
      average:      avgSalary,
      median,
      total_payroll: round(totalPayroll),
      min:          minSalary,
      max:          maxSalary,
      headcount:    salaries.length,
    },
    byDepartment,
    salaryBands,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. HIRING
// ═══════════════════════════════════════════════════════════════════════════════

async function getHiring() {
  const records = await prisma.recruitmentRecord.findMany({
    include: { department: { select: { name: true } } },
    orderBy: { opened_date: 'asc' },
  })

  const filled    = records.filter(r => r.status === 'FILLED')
  const open      = records.filter(r => r.status === 'OPEN')
  const cancelled = records.filter(r => r.status === 'CANCELLED')

  // ── Time to hire (days from opened → hire_date) ───────────────────────────────
  const hireDays   = filled
    .filter(r => r.hire_date && r.opened_date)
    .map(r => daysBetween(r.opened_date, r.hire_date))
  const avgTimeHire = hireDays.length
    ? round(hireDays.reduce((s, d) => s + d, 0) / hireDays.length)
    : 0

  // ── Offer acceptance rate ────────────────────────────────────────────────────
  const withOffer  = records.filter(r => r.offer_date !== null)
  const accepted   = records.filter(r => r.offer_accepted === true)
  const offerRate  = safePct(accepted.length, withOffer.length, 1)

  // ── Funnel (aggregate across all records) ────────────────────────────────────
  const totalCandidates  = records.reduce((s, r) => s + r.candidates_count, 0)
  const totalInterviews  = records.reduce((s, r) => s + r.interviews_count, 0)
  const totalOffers      = withOffer.length
  const totalHired       = filled.length

  // ── Monthly hires trend (by hire_date month) ──────────────────────────────────
  const hireMonthMap = {}
  for (const r of filled) {
    if (!r.hire_date) continue
    const key = monthLabel(r.hire_date)
    hireMonthMap[key] = {
      count: (hireMonthMap[key]?.count || 0) + 1,
      date:  new Date(r.hire_date),
    }
  }
  const monthlyHires = Object.entries(hireMonthMap)
    .sort(([, a], [, b]) => a.date - b.date)
    .map(([month, v]) => ({ month, hires: v.count }))

  // ── By department ─────────────────────────────────────────────────────────────
  const deptMap = {}
  for (const r of records) {
    const n = r.department?.name || 'Unknown'
    if (!deptMap[n]) deptMap[n] = { open: 0, filled: 0, cancelled: 0, candidates: 0, interviews: 0 }
    deptMap[n][r.status.toLowerCase()] += 1
    deptMap[n].candidates += r.candidates_count
    deptMap[n].interviews += r.interviews_count
  }
  const byDepartment = Object.entries(deptMap)
    .map(([department, v]) => ({ department, ...v }))
    .sort((a, b) => b.filled - a.filled)

  return {
    summary: {
      timeToHire:     avgTimeHire,
      offerAcceptance: offerRate,
      openPositions:  open.length,
      totalFilled:    filled.length,
      totalCancelled: cancelled.length,
      totalRecords:   records.length,
    },
    funnel: {
      candidates:  totalCandidates,
      interviews:  totalInterviews,
      offers:      totalOffers,
      hired:       totalHired,
      candidateToInterview: safePct(totalInterviews, totalCandidates, 1),
      interviewToOffer:     safePct(totalOffers,     totalInterviews, 1),
      offerToHire:          safePct(totalHired,      totalOffers,     1),
    },
    monthlyHires,
    byDepartment,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. TURNOVER
// ═══════════════════════════════════════════════════════════════════════════════

async function getTurnover() {
  const [employees, financials] = await Promise.all([
    prisma.employee.findMany({
      select: {
        status:           true,
        hire_date:        true,
        termination_date: true,
        department:       { select: { name: true } },
      },
    }),
    prisma.financial.findMany({
      orderBy: { period: 'asc' },
      select:  { period: true, headcount: true },
    }),
  ])

  const active     = employees.filter(e => e.status === 'ACTIVE' || e.status === 'ON_LEAVE')
  const terminated = employees.filter(e => e.status === 'TERMINATED')

  // ── Overall rates ────────────────────────────────────────────────────────────
  const avgHeadcount = financials.length
    ? round(financials.reduce((s, f) => s + f.headcount, 0) / financials.length)
    : (active.length || 1)

  const turnoverRate  = safePct(terminated.length, avgHeadcount, 1)
  const retentionRate = round(100 - turnoverRate, 1)

  // ── Monthly hires vs exits trend ─────────────────────────────────────────────
  // Build a sorted list of months from financial records
  const monthSet = financials.map(f => monthLabel(f.period))
  const hiresMap  = {}  // month → count of employees hired that month
  const exitsMap  = {}  // month → count of employees terminated that month

  for (const e of employees) {
    if (e.hire_date) {
      const key = monthLabel(e.hire_date)
      hiresMap[key] = (hiresMap[key] || 0) + 1
    }
    if (e.termination_date) {
      const key = monthLabel(e.termination_date)
      exitsMap[key] = (exitsMap[key] || 0) + 1
    }
  }

  // Use only months that appear in financial records for a consistent 24-month window
  const monthlyTrend = financials.map(f => {
    const label = monthLabel(f.period)
    const hires = hiresMap[label] || 0
    const exits = exitsMap[label] || 0
    const rate  = safePct(exits, f.headcount, 1)
    return { month: label, headcount: f.headcount, hires, exits, rate }
  })

  // ── By department ─────────────────────────────────────────────────────────────
  const deptMap = {}
  for (const e of employees) {
    const n = e.department?.name || 'Unknown'
    if (!deptMap[n]) deptMap[n] = { total: 0, terminated: 0 }
    deptMap[n].total += 1
    if (e.status === 'TERMINATED') deptMap[n].terminated += 1
  }
  const byDepartment = Object.entries(deptMap).map(([department, v]) => ({
    department,
    total:        v.total,
    terminated:   v.terminated,
    turnoverRate: safePct(v.terminated, v.total, 1),
  })).sort((a, b) => b.turnoverRate - a.turnoverRate)

  return {
    summary: {
      turnoverRate,
      retentionRate,
      terminatedTotal:   terminated.length,
      terminatedLast12m: employees.filter(e =>
        e.status === 'TERMINATED' &&
        e.termination_date &&
        new Date(e.termination_date) >= new Date(Date.now() - 365 * 86_400_000)
      ).length,
      avgHeadcount,
      activeCount: active.length,
    },
    byDepartment,
    monthlyTrend,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. FINANCIALS
// ═══════════════════════════════════════════════════════════════════════════════

async function getFinancialMetrics() {
  const records = await prisma.financial.findMany({
    orderBy: { period: 'asc' },
  })

  if (records.length === 0) {
    return {
      summary:       { revenue: 0, profit: 0, margin: 0, revenuePerEmp: 0, profitPerEmp: 0 },
      monthlyTrend:  [],
    }
  }

  const latest     = records[records.length - 1]
  const latestRev  = safeNum(latest.revenue)
  const latestProf = safeNum(latest.net_profit)
  const latestHC   = latest.headcount || 1

  // ── Monthly trend ─────────────────────────────────────────────────────────────
  const monthlyTrend = records.map(f => {
    const rev     = safeNum(f.revenue)
    const profit  = safeNum(f.net_profit)
    const hc      = f.headcount || 1
    return {
      month:        monthLabel(f.period),
      revenue:      round(rev),
      profit:       round(profit),
      margin:       safePct(profit, rev, 1),
      headcount:    hc,
      revenuePerEmp: round(rev    / hc),
      profitPerEmp:  round(profit / hc),
    }
  })

  // ── Aggregate summary ────────────────────────────────────────────────────────
  const totalRevenue = records.reduce((s, f) => s + safeNum(f.revenue),    0)
  const totalProfit  = records.reduce((s, f) => s + safeNum(f.net_profit), 0)
  const avgMargin    = safePct(totalProfit, totalRevenue, 1)

  return {
    summary: {
      latestRevenue:    round(latestRev),
      latestProfit:     round(latestProf),
      latestMargin:     safePct(latestProf, latestRev, 1),
      revenuePerEmp:    round(latestRev  / latestHC),
      profitPerEmp:     round(latestProf / latestHC),
      totalRevenue:     round(totalRevenue),
      totalProfit:      round(totalProfit),
      avgMargin,
      periods:          records.length,
      latestPeriod:     monthLabel(latest.period),
    },
    monthlyTrend,
  }
}

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  getOverview,
  getHeadcount,
  getAbsence,
  getSalary,
  getHiring,
  getTurnover,
  getFinancialMetrics,
}
