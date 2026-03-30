const jwt = require('jsonwebtoken')

/**
 * requireAuth
 * Verifies the Bearer JWT in the Authorization header.
 * Attaches the decoded payload to req.user on success.
 *
 * Usage: router.get('/protected', requireAuth, controller)
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — no token provided' })
  }

  const token = header.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload   // { id, email, role, iat, exp }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized — invalid or expired token' })
  }
}

/**
 * requireRole(...roles)
 * Must be used after requireAuth.
 * Returns 403 if req.user.role is not in the allowed list.
 *
 * Usage: router.post('/admin-only', requireAuth, requireRole('ADMIN'), controller)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden — insufficient permissions' })
    }
    next()
  }
}

module.exports = { requireAuth, requireRole }
