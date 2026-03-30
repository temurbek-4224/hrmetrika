import { useAuth } from '@/context/AuthContext'

/**
 * useRole()
 *
 * Returns role-related helpers derived from the authenticated user.
 * The AuthContext stores role as lowercase ('admin' | 'analyst').
 *
 * @returns {{ role: string, isAdmin: boolean, isAnalyst: boolean }}
 */
export function useRole() {
  const { user } = useAuth()
  const role = user?.role ?? 'analyst'

  return {
    role,
    isAdmin:   role === 'admin',
    isAnalyst: role === 'analyst',
  }
}
