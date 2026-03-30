const express = require('express')
const cors    = require('cors')

const authRoutes        = require('./routes/auth.routes')
const employeeRoutes    = require('./routes/employees.routes')
const departmentRoutes  = require('./routes/departments.routes')
const absenceRoutes     = require('./routes/absences.routes')
const recruitmentRoutes = require('./routes/recruitment.routes')
const financialRoutes   = require('./routes/financials.routes')
const metricsRoutes     = require('./routes/metrics.routes')
const errorHandler      = require('./middleware/errorHandler')

const app = express()

// ─── Core middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes)
app.use('/api/employees',   employeeRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/absences',    absenceRoutes)
app.use('/api/recruitment', recruitmentRoutes)
app.use('/api/financials',  financialRoutes)
app.use('/api/metrics',     metricsRoutes)

// ─── 404 handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ─── Global error handler ───────────────────────────────────────────────────────
app.use(errorHandler)

module.exports = app
