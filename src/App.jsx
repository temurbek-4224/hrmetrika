import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import DashboardLayout from './layouts/DashboardLayout'
import AuthLayout from './layouts/AuthLayout'
import Login from './pages/auth/Login'
import Overview from './pages/dashboard/Overview'
import Headcount from './pages/dashboard/Headcount'
import Absence from './pages/dashboard/Absence'
import Salary from './pages/dashboard/Salary'
import Hiring from './pages/dashboard/Hiring'
import Turnover from './pages/dashboard/Turnover'
import DashboardFinancials from './pages/dashboard/Financials'
import Employees from './pages/admin/Employees'
import Departments from './pages/admin/Departments'
import AdminAbsences from './pages/admin/Absences'
import Recruitment from './pages/admin/Recruitment'
import AdminFinancials from './pages/admin/Financials'

// ─── Route guards ──────────────────────────────────────────────────────────────

/**
 * Redirect unauthenticated users to /login.
 * While the token is being validated on mount (initialising), render nothing
 * to avoid a redirect flash before /me has responded.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, initialising } = useAuth()
  if (initialising) return null   // brief blank while /me is checked
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

/** Redirect already-authenticated users away from /login → /dashboard */
function PublicRoute({ children }) {
  const { isAuthenticated, initialising } = useAuth()
  if (initialising) return null
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

// ─── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      {/* Public: login */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
      </Route>

      {/* Protected: dashboard + admin */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Overview />} />
        <Route path="/dashboard/headcount" element={<Headcount />} />
        <Route path="/dashboard/absence" element={<Absence />} />
        <Route path="/dashboard/salary" element={<Salary />} />
        <Route path="/dashboard/hiring" element={<Hiring />} />
        <Route path="/dashboard/turnover" element={<Turnover />} />
        <Route path="/dashboard/financials" element={<DashboardFinancials />} />
        <Route path="/admin/employees" element={<Employees />} />
        <Route path="/admin/departments" element={<Departments />} />
        <Route path="/admin/absences" element={<AdminAbsences />} />
        <Route path="/admin/recruitment" element={<Recruitment />} />
        <Route path="/admin/financials" element={<AdminFinancials />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
