import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, CalendarX2, DollarSign, UserPlus,
  TrendingDown, BarChart3, Users2, Building2, CalendarOff,
  Briefcase, Receipt, LogOut, Activity
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/context/AuthContext'

const navSections = [
  {
    labelKey: 'nav.dashboard',
    items: [
      { to: '/dashboard',            labelKey: 'nav.overview',    icon: LayoutDashboard, exact: true },
      { to: '/dashboard/headcount',  labelKey: 'nav.headcount',   icon: Users },
      { to: '/dashboard/absence',    labelKey: 'nav.absence',     icon: CalendarX2 },
      { to: '/dashboard/salary',     labelKey: 'nav.salary',      icon: DollarSign },
      { to: '/dashboard/hiring',     labelKey: 'nav.hiring',      icon: UserPlus },
      { to: '/dashboard/turnover',   labelKey: 'nav.turnover',    icon: TrendingDown },
      { to: '/dashboard/financials', labelKey: 'nav.financials',  icon: BarChart3 },
    ],
  },
  {
    labelKey: 'nav.admin',
    items: [
      { to: '/admin/employees',   labelKey: 'nav.employees',   icon: Users2 },
      { to: '/admin/departments', labelKey: 'nav.departments', icon: Building2 },
      { to: '/admin/absences',    labelKey: 'nav.absences',    icon: CalendarOff },
      { to: '/admin/recruitment', labelKey: 'nav.recruitment', icon: Briefcase },
      { to: '/admin/financials',  labelKey: 'nav.financials',  icon: Receipt },
    ],
  },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Derive initials from user name (fallback to 'FT')
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'FT'

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-lg">
          <Activity size={16} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm tracking-tight">{t('app.name')}</p>
          <p className="text-slate-500 text-[10px] uppercase tracking-wider leading-tight">
            {t('app.tagline')}
          </p>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3">
        {navSections.map((section) => (
          <div key={section.labelKey} className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-3 mb-2">
              {t(section.labelKey)}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to)
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={cn(
                        'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-brand-500/15 text-brand-400'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      )}
                    >
                      <item.icon
                        size={16}
                        className={cn(
                          'shrink-0 transition-colors',
                          isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
                        )}
                      />
                      <span className="truncate">{t(item.labelKey)}</span>
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-indicator"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400"
                        />
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User footer ──────────────────────────────────────────────── */}
      <div className="px-3 py-3 border-t border-white/5 space-y-1">
        {/* Identity row */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-xs font-semibold truncate">
              {user?.name || t('user.name')}
            </p>
            <p className="text-slate-500 text-[10px] truncate">{user?.roleLabel ?? t('user.role')}</p>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150 text-xs font-medium group"
        >
          <LogOut size={14} className="shrink-0 group-hover:text-red-400 transition-colors" />
          <span>{t('common.logout')}</span>
        </button>
      </div>
    </aside>
  )
}
