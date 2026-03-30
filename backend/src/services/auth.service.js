const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const prisma  = require('../lib/prisma')

const JWT_EXPIRES_IN = '8h'

/**
 * Authenticate a user by email + password.
 * Returns a signed JWT and the user profile on success.
 * Throws a 401 error on failure.
 */
async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    const err = new Error('Invalid email or password.')
    err.status = 401
    throw err
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatch) {
    const err = new Error('Invalid email or password.')
    err.status = 401
    throw err
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

  return {
    token,
    user: sanitizeUser(user),
  }
}

/**
 * Fetch a user by id, without the password hash.
 */
async function getById(id) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    const err = new Error('User not found.')
    err.status = 404
    throw err
  }
  return sanitizeUser(user)
}

/**
 * Hash a plain-text password.
 * Utility used by the seed script and admin user creation.
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, 12)
}

/** Strip password_hash before sending user to the client */
function sanitizeUser(user) {
  const { password_hash, ...safe } = user
  return safe
}

module.exports = { login, getById, hashPassword }
