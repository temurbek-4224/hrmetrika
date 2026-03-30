import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Activity, Users, BarChart3, Globe } from 'lucide-react'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher'

export default function AuthLayout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex relative">

      {/* ── Language switcher — fixed top-right, always visible ──── */}
      <div className="absolute top-5 right-6 z-50">
        <LanguageSwitcher variant="dark" />
      </div>

      {/* ── Left brand panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] p-12 relative overflow-hidden">
        {/* Background accents */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-violet-600/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-brand-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-violet-500/5 blur-2xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">{t('app.name')}</p>
            <p className="text-slate-400 text-xs">{t('app.tagline')}</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative space-y-7">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white leading-tight">
              {t('login.hero.titleLine1')}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">
                {t('login.hero.titleLine2')}
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              {t('login.hero.description')}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '247', labelKey: 'login.stats.employees', icon: Users },
              { value: '12',  labelKey: 'login.stats.metrics',   icon: BarChart3 },
              { value: '3',   labelKey: 'login.stats.languages', icon: Globe },
            ].map(({ value, labelKey, icon: Icon }) => (
              <div
                key={labelKey}
                className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/8 hover:border-white/15 transition-colors"
              >
                <Icon size={14} className="text-brand-400 mb-2" />
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-slate-400 text-xs mt-0.5">{t(labelKey)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative space-y-1">
          <p className="text-slate-500 text-xs font-medium">
            {t('footer.dissertation')}
          </p>
          <p className="text-slate-600 text-[11px]">
            &copy; {new Date().getFullYear()} HR Metrika &mdash; {t('footer.rights')}
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 pt-16 lg:pt-12">
        <Outlet />
      </div>
    </div>
  )
}
