import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { formatCurrency, formatPercent, formatNumber, formatCompact } from '@/utils/formatters'

const colorMap = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'bg-indigo-100', ring: 'ring-indigo-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100', ring: 'ring-amber-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-100', ring: 'ring-emerald-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'bg-red-100', ring: 'ring-red-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'bg-violet-100', ring: 'ring-violet-100' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', icon: 'bg-cyan-100', ring: 'ring-cyan-100' },
}

function formatValue(value, format) {
  switch (format) {
    case 'currency': return formatCompact(value)
    case 'percent': return formatPercent(value)
    default: return formatNumber(value)
  }
}

export default function KpiCard({ kpi, index = 0 }) {
  const { t } = useTranslation()
  const colors = colorMap[kpi.color] || colorMap.indigo
  const IconComp = Icons[kpi.icon] || Icons.BarChart3
  const trend = kpi.trend
  const isGood = kpi.inverse ? trend < 0 : trend > 0
  const isNeutral = trend === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="card-base p-5 hover:shadow-card-hover transition-shadow duration-200 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.icon)}>
          <IconComp size={20} className={colors.text} />
        </div>
        <div className={cn(
          'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
          isNeutral ? 'bg-slate-100 text-slate-500' :
          isGood ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
        )}>
          {isNeutral ? <Minus size={10} /> : isGood ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">
          {kpi.format === 'currency' && '$'}{formatValue(kpi.value, kpi.format)}
        </p>
        <p className="text-sm text-slate-500 mt-0.5 font-medium">{t(kpi.key)}</p>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-50">
        <p className="text-xs text-slate-400">
          {t('dashboard.vsLastMonth')}
        </p>
      </div>
    </motion.div>
  )
}
