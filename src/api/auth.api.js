import api from './client'

/**
 * POST /api/auth/login
 * Returns { token, user }
 */
export async function loginRequest(email, password) {
  return api.post('/auth/login', { email, password })
}

/**
 * GET /api/auth/me
 * Returns the authenticated user profile (no password hash).
 */
export async function getMeRequest() {
  return api.get('/auth/me')
}
