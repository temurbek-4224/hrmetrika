/**
 * HR Metrika — Centralized API Client
 *
 * All backend requests go through this module.
 * - Automatically attaches JWT Bearer token from localStorage
 * - Throws typed ApiError on non-2xx responses
 * - Parses JSON responses consistently
 */

// In production (Vercel) VITE_API_URL must be set to the Render backend origin,
// e.g. https://hrmetrika.onrender.com
// In local dev it is left unset and Vite's proxy forwards /api/* to localhost:5000.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const TOKEN_KEY = 'hr_metrika_token'

// ─── Token helpers ─────────────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// ─── Typed error ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// ─── Core request ──────────────────────────────────────────────────────────────

async function request(method, path, body = undefined) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config = {
    method,
    headers,
  }

  if (body !== undefined) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${path}`, config)

  // Parse JSON (even error bodies have JSON)
  let data
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    // On 401 the token is expired or invalid — clear state and force re-login
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('hr_metrika_session')
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.startsWith('/login')) {
        window.location.replace('/login')
      }
    }
    const message = data?.error || `Request failed with status ${response.status}`
    throw new ApiError(message, response.status)
  }

  return data
}

// ─── HTTP method shorthands ────────────────────────────────────────────────────

export const api = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  put:    (path, body)   => request('PUT',    path, body),
  patch:  (path, body)   => request('PATCH',  path, body),
  delete: (path)         => request('DELETE', path),
}

export default api
