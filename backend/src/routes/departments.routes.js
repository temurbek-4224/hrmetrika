const router = require('express').Router()
const { requireAuth, requireRole } = require('../middleware/auth')
const c = require('../controllers/departments.controller')

router.use(requireAuth)

// GET    /api/departments        — list all departments (with headcount summary)
router.get('/',     c.getAll)

// GET    /api/departments/:id    — get single department
router.get('/:id',  c.getById)

// POST   /api/departments        — create department (Admin only)
router.post('/',    requireRole('ADMIN'), c.create)

// PUT    /api/departments/:id    — update department (Admin only)
router.put('/:id',  requireRole('ADMIN'), c.update)

// DELETE /api/departments/:id    — delete department (Admin only)
router.delete('/:id', requireRole('ADMIN'), c.remove)

module.exports = router
