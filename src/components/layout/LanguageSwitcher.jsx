import { useTranslation } from 'react-i18next'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { cn } from '@/utils/cn'

// ─── Language definitions ───────────────────────────────────────────────────
const languages = [
  { code: 'uz', flag: '🇺🇿', label: 'UZ', name: "O'zbek"  },
  { code: 'ru', flag: '🇷🇺', label: 'RU', name: 'Русский' },
  { code: 'en', flag: '🇬🇧', label: 'EN', name: 'English' },
]

/**
 * LanguageSwitcher
 *
 * @prop {string} variant
 *   "light"  — for white/light surfaces (topbar, cards)   [default]
 *   "dark"   — for dark surfaces (auth page background)
 */
export default function LanguageSwitcher({ variant = 'light' }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = languages.find((l) => l.code === i18n.language) ?? languages[2]

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (code) => {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  const isDark = variant === 'dark'

  return (
    <div className="relative" ref={ref}>
      {/* ── Trigger ──────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch language"
        className={cn(
          'flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium transition-all duration-150 select-none',
          isDark
            ? [
                'text-slate-300 border border-white/10',
                'hover:bg-white/10 hover:border-white/20 hover:text-white',
                open && 'bg-white/10 border-white/20 text-white',
              ]
            : [
                'text-slate-600 border border-transparent',
                'hover:bg-slate-100 hover:border-slate-200 hover:text-slate-900',
                open && 'bg-slate-100 border-slate-200 text-slate-900',
              ]
        )}
      >
        {/* Globe icon — subtle visual anchor */}
        <Globe size={13} className={isDark ? 'text-slate-400' : 'text-slate-400'} />

        {/* Flag */}
        <span className="text-base leading-none">{current.flag}</span>

        {/* Short code */}
        <span className="text-xs font-semibold tracking-wide">{current.label}</span>

        {/* Chevron */}
        <ChevronDown
          size={12}
          className={cn(
            'transition-transform duration-200',
            open && 'rotate-180',
            isDark ? 'text-slate-400' : 'text-slate-400'
          )}
        />
      </button>

      {/* ── Dropdown ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className={cn(
              'absolute right-0 top-full mt-2 w-44 rounded-xl overflow-hidden z-[60]',
              isDark
                ? 'bg-slate-800 border border-white/10 shadow-2xl shadow-black/40'
                : 'bg-white border border-slate-100 shadow-card-lg'
            )}
          >
            {/* Header label */}
            <div
              className={cn(
                'px-3.5 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest',
                isDark ? 'text-slate-500' : 'text-slate-400'
              )}
            >
              Language
            </div>

            <div className="p-1.5 space-y-0.5">
              {languages.map((lang) => {
                const isActive = i18n.language === lang.code
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-100',
                      isActive
                        ? isDark
                          ? 'bg-brand-500/20 text-brand-300 font-semibold'
                          : 'bg-brand-50 text-brand-600 font-semibold'
                        : isDark
                          ? 'text-slate-300 hover:bg-white/8 font-medium'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                    )}
                  >
                    {/* Flag */}
                    <span className="text-base leading-none shrink-0">{lang.flag}</span>

                    {/* Full language name */}
                    <span className="flex-1 text-left">{lang.name}</span>

                    {/* Active checkmark */}
                    {isActive && (
                      <Check
                        size={13}
                        className={isDark ? 'text-brand-400 shrink-0' : 'text-brand-500 shrink-0'}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
