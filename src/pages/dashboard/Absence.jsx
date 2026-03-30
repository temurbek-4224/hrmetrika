import { useTranslation } from 'react-i18next'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import PageHeader from '@/components/shared/PageHeader'
import ChartCard from '@/components/shared/ChartCard'
import MetricSummaryRow from '@/components/shared/MetricSummaryRow'
import { useApi } from '@/hooks/useApi'
import { getMetricsAbsence } from '@/api/metrics.api'

const COLORS = {
  amber:   '#f59e0b',
  primary: '#6366f1',
  emerald: '#10b981',
}

const RateTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-card-lg border border-slate-100 p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-slate-600 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span>{p.name}:</span>
          <span className="font-semibold text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 bg-slate-100 rounded-2xl" />
      <div className="h-20 bg-slate-100 rounded-2xl" />
      <div className="h-72 bg-slate-100 rounded-2xl" />
      <div className="h-60 bg-slate-100 rounded-2xl" />
    </div>
  )
}

export default function Absence() {
  const { t } = useTranslation()
  const { data, loading, error, refetch } = useApi(getMetricsAbsence)

  if (loading) return <LoadingSkeleton />
  if (error) return (
    <div className="card-base p-10 flex flex-col items-center gap-4">
      <p className="text-red-500 text-sm">{error}</p>
      <button onClick={refetch} className="text-sm text-indigo-600 font-medium hover:underline">
        {t('common.refresh')}
      </button>
    </div>
  )

  const { summary, monthlyTrend, byDepartment } = data

  const summaryMetrics = [
    { label: 'kpi.absenceRate', value: `${summary.rate}%`,        unit: '',          color: 'amber'  },
    { label: 'admin.totalDays', value: String(summary.approvedDays), unit: 'common.days', color: 'indigo' },
    { label: 'admin.approved',  value: String(summary.approved),  unit: 'common.employees', color: 'emerald'},
    { label: 'admin.pending',   value: String(summary.pending),   unit: 'common.employees', color: 'red'   },
  ]

  // Dept chart uses absence days per department
  const deptData = byDepartment.map(d => ({ dept: d.department, days: d.days }))

  // Dynamic reference line at median of monthly rates
  const rates = monthlyTrend.map(d => d.rate)
  const targetRate = rates.length
    ? parseFloat((rates.reduce((s, v) => s + v, 0) / rates.length).toFixed(1))
    : 5.0

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pages.absence.title')}
        subtitle={t('pages.absence.subtitle')}
      />

      <MetricSummaryRow metrics={summaryMetrics} />

      <ChartCard
        title={t('charts.absenceTrend')}
        subtitle={`Monthly absence rate (%) — avg: ${targetRate}%`}
        action={t('dashboard.viewAll')}
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={monthlyTrend} margin={{ top: 5, right: 30, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="absGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.amber} stopOpacity={0.18} />
                <stop offset="95%" stopColor={COLORS.amber} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<RateTooltip />} />
            <ReferenceLine
              y={targetRate}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: 'Avg', position: 'right', fontSize: 10, fill: '#ef4444' }}
            />
            <Area
              type="monotone"
              dataKey="rate"
              name="Absence Rate %"
              stroke={COLORS.amber}
              strokeWidth={2.5}
              fill="url(#absGrad)"
              dot={{ r: 3, fill: COLORS.amber, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Absence Days by Department" subtitle="Total approved absence days per department">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={deptData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="dept" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<RateTooltip />} />
            <Bar dataKey="days" name="Absence Days" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
