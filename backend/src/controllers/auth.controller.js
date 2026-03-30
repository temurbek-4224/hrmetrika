const authService = require('../services/auth.service')

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    const result = await authService.login(email, password)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile (no password hash).
 */
async function me(req, res, next) {
  try {
    const user = await authService.getById(req.user.id)
    res.json(user)
  } catch (err) {
    next(err)
  }
}

module.exports = { login, me }
