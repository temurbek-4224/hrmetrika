const metricsService = require('../services/metrics.service')

// ─── Thin controller — delegates entirely to the service layer ─────────────────

async function overview(req, res, next) {
  try {
    const data = await metricsService.getOverview()
    res.json(data)
  } catch (err) {
    console.error('[metrics/overview]', err.message)
    next(err)
  }
}

async function headcount(req, res, next) {
  try {
    const data = await metricsService.getHeadcount()
    res.json(data)
  } catch (err) {
    console.error('[metrics/headcount]', err.message)
    next(err)
  }
}

async function absence(req, res, next) {
  try {
    const data = await metricsService.getAbsence()
    res.json(data)
  } catch (err) {
    console.error('[metrics/absence]', err.message)
    next(err)
  }
}

async function salary(req, res, next) {
  try {
    const data = await metricsService.getSalary()
    res.json(data)
  } catch (err) {
    console.error('[metrics/salary]', err.message)
    next(err)
  }
}

async function hiring(req, res, next) {
  try {
    const data = await metricsService.getHiring()
    res.json(data)
  } catch (err) {
    console.error('[metrics/hiring]', err.message)
    next(err)
  }
}

async function turnover(req, res, next) {
  try {
    const data = await metricsService.getTurnover()
    res.json(data)
  } catch (err) {
    console.error('[metrics/turnover]', err.message)
    next(err)
  }
}

async function financials(req, res, next) {
  try {
    const data = await metricsService.getFinancialMetrics()
    res.json(data)
  } catch (err) {
    console.error('[metrics/financials]', err.message)
    next(err)
  }
}

module.exports = { overview, headcount, absence, salary, hiring, turnover, financials }
