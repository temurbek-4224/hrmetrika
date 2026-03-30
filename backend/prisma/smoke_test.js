/**
 * Smoke test — runs all 7 metrics functions directly against the live DB
 * and prints a summary of the results without needing HTTP.
 *
 * Run: node prisma/smoke_test.js
 */
require('dotenv').config()
const m = require('../src/services/metrics.service')

const label = (s) => console.log('\n' + '═'.repeat(52) + '\n  ' + s + '\n' + '─'.repeat(52))
const show  = (o) => console.log(JSON.stringify(o, null, 2).slice(0, 1400))

async function run() {
  try {
    label('1. OVERVIEW')
    const ov = await m.getOverview()
    console.log('  headcount:       ', ov.headcount.value, '(active:', ov.headcount.active, ')')
    console.log('  absenceRate:     ', ov.absenceRate.value + '%')
    console.log('  avgSalary:      $', ov.avgSalary.value)
    console.log('  turnoverRate:    ', ov.turnoverRate.value + '%')
    console.log('  offerAcceptance: ', ov.offerAcceptance.value + '%', '(' + ov.offerAcceptance.accepted + '/' + ov.offerAcceptance.offered + ')')
    console.log('  revenuePerEmp:  $', ov.revenuePerEmployee.value)
    console.log('  profitPerEmp:   $', ov.profitPerEmployee.value)
    console.log('  timeToHire:      ', ov.timeToHire.value, 'days')
    console.log('  openPositions:   ', ov.openPositions.value)

    label('2. HEADCOUNT')
    const hc = await m.getHeadcount()
    console.log('  summary:', hc.summary)
    console.log('  departments:', hc.byDepartment.length, 'entries')
    console.log('  monthly trend:', hc.monthlyTrend.length, 'months')
    console.log('  first month:', hc.monthlyTrend[0])
    console.log('  last  month:', hc.monthlyTrend[hc.monthlyTrend.length - 1])

    label('3. ABSENCE')
    const ab = await m.getAbsence()
    console.log('  summary:', ab.summary)
    console.log('  byType (top 3):', ab.byType.slice(0, 3).map(t => t.type + ':' + t.days + 'd'))
    console.log('  monthly trend:', ab.monthlyTrend.length, 'months')

    label('4. SALARY')
    const sal = await m.getSalary()
    console.log('  summary:', sal.summary)
    console.log('  byDepartment (top 3):', sal.byDepartment.slice(0, 3).map(d => d.department + ':$' + d.avg))
    console.log('  bands:', sal.salaryBands.map(b => b.label + ':' + b.count))

    label('5. HIRING')
    const hi = await m.getHiring()
    console.log('  summary:', hi.summary)
    console.log('  funnel:', hi.funnel)
    console.log('  monthlyHires:', hi.monthlyHires.length, 'months')

    label('6. TURNOVER')
    const to = await m.getTurnover()
    console.log('  summary:', to.summary)
    console.log('  byDepartment (top 3):', to.byDepartment.slice(0, 3).map(d => d.department + ':' + d.turnoverRate + '%'))
    console.log('  monthlyTrend:', to.monthlyTrend.length, 'months')

    label('7. FINANCIALS')
    const fi = await m.getFinancialMetrics()
    console.log('  summary:', fi.summary)
    console.log('  trend months:', fi.monthlyTrend.length)
    console.log('  first:', fi.monthlyTrend[0])
    console.log('  last: ', fi.monthlyTrend[fi.monthlyTrend.length - 1])

    console.log('\n' + '═'.repeat(52))
    console.log('  All 7 metrics computed successfully')
    console.log('═'.repeat(52))
  } catch (err) {
    console.error('SMOKE TEST FAILED:', err)
    process.exit(1)
  } finally {
    const { PrismaClient } = require('@prisma/client')
    // disconnect via module-level prisma
    process.exit(0)
  }
}

run()
