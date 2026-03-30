const router = require('express').Router()
const { requireAuth, requireRole } = require('../middleware/auth')
const c = require('../controllers/recruitment.controller')

router.use(requireAuth)

// GET    /api/recruitment        — list all records (filterable by status, dept)
router.get('/',     c.getAll)

// GET    /api/recruitment/:id    — get single recruitment record
router.get('/:id',  c.getById)

// POST   /api/recruitment        — create new opening (Admin only)
router.post('/',    requireRole('ADMIN'), c.create)

// PUT    /api/recruitment/:id    — update record (Admin only)
router.put('/:id',  requireRole('ADMIN'), c.update)

// DELETE /api/recruitment/:id    — delete record (Admin only)
router.delete('/:id', requireRole('ADMIN'), c.remove)

module.exports = router
