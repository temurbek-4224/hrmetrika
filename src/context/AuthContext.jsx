import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginRequest, getMeRequest } from '@/api/auth.api'
import { setToken, clearToken, getToken } from '@/api/client'

const AuthContext = createContext(null)

const SESSION_KEY = 'hr_metrika_session'

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Derive display-friendly fields that the UI reads from the user object */
function enrichUser(apiUser) {
  const nameParts = (apiUser.name || '').trim().split(' ')
  const initials  = nameParts.map(p => p[0]).join('').slice(0, 2).toUpperCase()

  const roleLabel =
    apiUser.role === 'ADMIN'   ? 'Administrator' :
    apiUser.role === 'ANALYST' ? 'HR Analyst'    : apiUser.role

  return {
    ...apiUser,
    initials,
    roleLabel,
    role: apiUser.role?.toLowerCase() ?? 'analyst',   // keep lowercase for UI checks
    avatarColor: 'from-brand-500 to-violet-500',
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  // Initialise from cached session so the UI does not flash on hard refresh
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [initialising, setInitialising] = useState(true)

  // ── On mount: verify the cached token is still valid ───────────────────────
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setInitialising(false)
      return
    }

    getMeRequest()
      .then((apiUser) => {
        const enriched = enrichUser(apiUser)
        setUser(enriched)
        localStorage.setItem(SESSION_KEY, JSON.stringify(enriched))
      })
      .catch(() => {
        // Token is invalid or expired — clear everything
        clearToken()
        localStorage.removeItem(SESSION_KEY)
        setUser(null)
      })
      .finally(() => setInitialising(false))
  }, [])

  /**
   * login(email, password)
   * Returns { success: true } on success or { success: false, error: string } on failure.
   * Saves token + user to localStorage on success.
   */
  const login = useCallback(async (email, password) => {
    try {
      const { token, user: apiUser } = await loginRequest(email, password)

      // Persist token for subsequent API calls
      setToken(token)

      const enriched = enrichUser(apiUser)
      localStorage.setItem(SESSION_KEY, JSON.stringify(enriched))
      setUser(enriched)

      return { success: true }
    } catch (err) {
      return { success: false, error: err?.message ?? 'Login failed.' }
    }
  }, [])

  /**
   * logout()
   * Clears all auth state. Redirect is handled by the caller.
   */
  const logout = useCallback(() => {
    clearToken()
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const value = {
    user,
    isAuthenticated: !!user,
    initialising,   // true only during the very first /me validation on page load
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
