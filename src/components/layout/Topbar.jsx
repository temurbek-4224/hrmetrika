import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, Settings, LogOut, User, ChevronDown } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import { useAuth } from '@/context/AuthContext'

export default function Topbar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'FT'

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-slate-100 px-6"
      style={{ left: 'var(--sidebar-width)', height: 'var(--topbar-height)' }}
    >
      {/* ── Search ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 w-64 border border-slate-200/60 focus-within:border-brand-400/50 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder={t('table.search')}
          className="bg-transparent text-sm text-slate-600 placeholder-slate-400 outline-none w-full"
        />
      </div>

      {/* ── Right actions ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher variant="light" />

        {/* Notification bell */}
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white" />
        </button>

        {/* Settings */}
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <Settings size={17} />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* ── User menu ──────────────────────────────────────────────── */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-700 leading-tight">
                {user?.name || t('user.name')}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">{t('user.role')}</p>
            </div>
            <ChevronDown
              size={13}
              className={`text-slate-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-card-lg border border-slate-100 overflow-hidden z-50"
              >
                {/* User info header */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                  <p className="text-xs font-semibold text-slate-700">
                    {user?.name || t('user.name')}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{user?.email}</p>
                </div>

                {/* Actions */}
                <div className="p-1.5">
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors text-left">
                    <User size={14} className="text-slate-400" />
                    {t('common.profile')}
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors text-left">
                    <Settings size={14} className="text-slate-400" />
                    {t('common.settings')}
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut size={14} />
                    {t('common.logout')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
