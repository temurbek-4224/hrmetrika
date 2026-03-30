const router = require('express').Router()
const { requireAuth, requireRole } = require('../middleware/auth')
const c = require('../controllers/employees.controller')

// All employee routes require authentication
router.use(requireAuth)

// GET    /api/employees          — list all (with optional filters)
router.get('/',     c.getAll)

// GET    /api/employees/:id      — get single employee
router.get('/:id',  c.getById)

// POST   /api/employees          — create employee (Admin only)
router.post('/',    requireRole('ADMIN'), c.create)

// PUT    /api/employees/:id      — update employee (Admin only)
router.put('/:id',  requireRole('ADMIN'), c.update)

// DELETE /api/employees/:id      — soft-delete / terminate (Admin only)
router.delete('/:id', requireRole('ADMIN'), c.remove)

module.exports = router
