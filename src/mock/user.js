/**
 * Mock authenticated user — used across AuthContext, Sidebar, Topbar, and demo login.
 * Replace with real API response when backend is ready.
 */
export const mockUser = {
  id: 1,
  name: 'Ferangiz Tolibova',
  initials: 'FT',
  email: 'ferangiz@hrmetrika.uz',
  role: 'analyst',         // 'admin' | 'analyst'
  roleLabel: 'HR Analyst',
  avatarColor: 'from-brand-500 to-violet-500',
}

/**
 * Demo login credentials (pre-filled on the login form).
 */
export const demoCredentials = {
  email: 'ferangiz@hrmetrika.uz',
  password: 'demo1234',
}
