const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const authController  = require('../controllers/auth.controller')

// POST /api/auth/login  — authenticate and receive a JWT
router.post('/login', authController.login)

// GET  /api/auth/me     — return the currently authenticated user (protected)
router.get('/me', requireAuth, authController.me)

module.exports = router
