const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const c = require('../controllers/metrics.controller')

// All metrics endpoints require authentication
router.use(requireAuth)

// GET /api/metrics/overview      — KPI summary cards
router.get('/overview',    c.overview)

// GET /api/metrics/headcount     — headcount trend + dept distribution
router.get('/headcount',   c.headcount)

// GET /api/metrics/absence       — absence rate + trend + breakdown
router.get('/absence',     c.absence)

// GET /api/metrics/salary        — salary averages + dept breakdown + bands
router.get('/salary',      c.salary)

// GET /api/metrics/hiring        — hiring funnel + time-to-hire + trend
router.get('/hiring',      c.hiring)

// GET /api/metrics/turnover      — turnover/retention + monthly trend
router.get('/turnover',    c.turnover)

// GET /api/metrics/financials    — revenue/profit trend + per-employee metrics
router.get('/financials',  c.financials)

module.exports = router
