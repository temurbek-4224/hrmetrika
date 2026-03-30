import { useTranslation } from 'react-i18next'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import PageHeader from '@/components/shared/PageHeader'
import ChartCard from '@/components/shared/ChartCard'
import MetricSummaryRow from '@/components/shared/MetricSummaryRow'
import { useApi } from '@/hooks/useApi'
import { getMetricsHeadcount } from '@/api/metrics.api'

const COLORS = {
  primary: '#6366f1',
  emerald: '#10b981',
}

const CustomTooltip = ({ active, payload, label }) => {
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
      <div className="h-72 bg-slate-100 rounded-2xl" />
    </div>
  )
}

export default function Headcount() {
  const { t } = useTranslation()
  const { data, loading, error, refetch } = useApi(getMetricsHeadcount)

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
    { label: 'kpi.headcount',    value: String(summary.active + summary.onLeave), unit: '', color: 'indigo' },
    { label: 'status.active',    value: String(summary.active),    unit: 'common.employees', color: 'emerald' },
    { label: 'status.onLeave',   value: String(summary.onLeave),   unit: 'common.employees', color: 'amber'   },
    { label: 'status.terminated',value: String(summary.terminated),unit: 'common.employees', color: 'red'     },
  ]

  // Dept bar data — backend returns {name, headcount, percentage}
  const deptData = byDepartment.map(d => ({ dept: d.name, count: d.headcount }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pages.headcount.title')}
        subtitle={t('pages.headcount.subtitle')}
      />

      <MetricSummaryRow metrics={summaryMetrics} />

      <ChartCard
        title={t('charts.headcountTrend')}
        subtitle="Monthly headcount — 24-month trend"
        action={t('dashboard.viewAll')}
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="hcGrad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.18} />
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
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
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="headcount"
              name="Total"
              stroke={COLORS.primary}
              strokeWidth={2.5}
              fill="url(#hcGrad1)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Headcount by Department" subtitle="Current workforce distribution">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={deptData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="dept" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Employees" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
