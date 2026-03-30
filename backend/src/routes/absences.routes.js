const router = require('express').Router()
const { requireAuth, requireRole } = require('../middleware/auth')
const c = require('../controllers/absences.controller')

router.use(requireAuth)

// GET    /api/absences           — list all absences (filterable by status, employee)
router.get('/',     c.getAll)

// GET    /api/absences/:id       — get single absence record
router.get('/:id',  c.getById)

// POST   /api/absences           — log a new absence (Admin only)
router.post('/',    requireRole('ADMIN'), c.create)

// PUT    /api/absences/:id       — update absence record (Admin only)
router.put('/:id',  requireRole('ADMIN'), c.update)

// PATCH  /api/absences/:id/approve — approve an absence (Admin only)
router.patch('/:id/approve', requireRole('ADMIN'), c.approve)

// PATCH  /api/absences/:id/reject  — reject an absence (Admin only)
router.patch('/:id/reject',  requireRole('ADMIN'), c.reject)

// DELETE /api/absences/:id       — delete absence record (Admin only)
router.delete('/:id', requireRole('ADMIN'), c.remove)

module.exports = router
