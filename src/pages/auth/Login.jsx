import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Activity } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

// Demo accounts
const DEMO_ACCOUNTS = [
  { label: 'Admin',   email: 'ferangiz@hrmetrika.uz', password: 'ferangiz2025', color: 'text-brand-600' },
  { label: 'Analyst', email: 'temur@hrmetrika.uz',    password: 'temur2025',    color: 'text-violet-600' },
]

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail]       = useState(DEMO_ACCOUNTS[0].email)
  const [password, setPassword] = useState(DEMO_ACCOUNTS[0].password)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)

    if (result.success) {
      navigate('/dashboard', { replace: true })
    } else {
      setError(result.error || t('login.error.invalidCredentials'))
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-md"
    >
      <div className="bg-white rounded-2xl shadow-card-lg border border-slate-100 p-8">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <p className="text-slate-900 font-bold text-sm">{t('app.name')}</p>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">{t('auth.login')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('auth.loginSubtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {t('auth.password')}
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember / Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" className="rounded accent-brand-500" />
              <span className="text-xs text-slate-500">{t('auth.rememberMe')}</span>
            </label>
            <a href="#" className="text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors">
              {t('auth.forgotPassword')}
            </a>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-600 hover:to-violet-600 text-white font-semibold text-sm py-3 rounded-xl transition-all duration-200 shadow-lg shadow-brand-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {t('auth.loginBtn')}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Demo quick-fill */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs text-center text-slate-400 mb-3">{t('auth.demoHint')}</p>
          <div className="flex items-center justify-center gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword(acc.password); setError('') }}
                className={`px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors ${acc.color}`}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dissertation attribution — below the card */}
      <p className="text-center text-[11px] text-slate-500/70 mt-5 leading-relaxed px-4">
        {t('footer.dissertation')}
      </p>
    </motion.div>
  )
}
