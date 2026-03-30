const router = require('express').Router()
const { requireAuth, requireRole } = require('../middleware/auth')
const c = require('../controllers/financials.controller')

router.use(requireAuth)

// GET  /api/financials           — list all monthly records (ordered by period)
router.get('/',    c.getAll)

// GET  /api/financials/:id       — get single financial record
router.get('/:id', c.getById)

// POST /api/financials           — create monthly entry (Admin only)
router.post('/',   requireRole('ADMIN'), c.create)

// PUT  /api/financials/:id       — update monthly entry (Admin only)
router.put('/:id', requireRole('ADMIN'), c.update)

// DELETE /api/financials/:id     — delete entry (Admin only)
router.delete('/:id', requireRole('ADMIN'), c.remove)

module.exports = router
