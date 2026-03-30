import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default function DashboardLayout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Sidebar />

      <div className="flex flex-col min-h-screen" style={{ marginLeft: 'var(--sidebar-width)' }}>
        <Topbar />

        {/* Main content */}
        <main className="flex-1" style={{ paddingTop: 'var(--topbar-height)' }}>
          <div className="p-6">
            <Outlet />
          </div>
        </main>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer className="border-t border-slate-200/70 bg-white/50 backdrop-blur-sm px-6 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5">
            {/* Dissertation attribution */}
            <p className="text-[11px] text-slate-400 text-center sm:text-left">
              {t('footer.dissertation')}
            </p>

            {/* Copyright */}
            <p className="text-[11px] text-slate-400 shrink-0">
              &copy; {new Date().getFullYear()} HR Metrika &mdash; {t('footer.rights')}
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
