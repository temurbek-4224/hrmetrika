import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

const colorClasses = {
  indigo: 'text-indigo-600 bg-indigo-50',
  amber: 'text-amber-600 bg-amber-50',
  emerald: 'text-emerald-600 bg-emerald-50',
  violet: 'text-violet-600 bg-violet-50',
  cyan: 'text-cyan-600 bg-cyan-50',
}

export default function MetricSummaryRow({ metrics }) {
  const { t } = useTranslation()
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.35 }}
      className="card-base p-4 grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100"
    >
      {metrics.map((m, i) => (
        <div key={i} className="px-4 first:pl-2 last:pr-2 flex flex-col gap-0.5">
          <span className={cn('text-xl font-bold', colorClasses[m.color]?.split(' ')[0] || 'text-slate-900')}>
            {m.value}
          </span>
          <span className="text-xs text-slate-500 font-medium">{t(m.label)}</span>
          {m.unit && <span className="text-[10px] text-slate-400">{t(m.unit)}</span>}
        </div>
      ))}
    </motion.div>
  )
}
