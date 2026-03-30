import { useTranslation } from 'react-i18next'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import PageHeader from '@/components/shared/PageHeader'
import ChartCard from '@/components/shared/ChartCard'
import MetricSummaryRow from '@/components/shared/MetricSummaryRow'
import { useApi } from '@/hooks/useApi'
import { getMetricsTurnover } from '@/api/metrics.api'

const COLORS = {
  primary: '#6366f1',
  emerald: '#10b981',
  amber:   '#f59e0b',
  red:     '#ef4444',
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
          <span className="font-semibold text-slate-800">
            {typeof p.value === 'number' && (p.dataKey === 'rate' || p.dataKey === 'retention')
              ? `${p.value}%`
              : p.value}
          </span>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-60 bg-slate-100 rounded-2xl" />
        <div className="h-60 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  )
}

export default function Turnover() {
  const { t } = useTranslation()
  const { data, loading, error, refetch } = useApi(getMetricsTurnover)

  if (loading) return <LoadingSkeleton />
  if (error) return (
    <div className="card-base p-10 flex flex-col items-center gap-4">
      <p className="text-red-500 text-sm">{error}</p>
      <button onClick={refetch} className="text-sm text-indigo-600 font-medium hover:underline">
        {t('common.refresh')}
      </button>
    </div>
  )

  const { summary, monthlyTrend } = data

  const summaryMetrics = [
    { label: 'kpi.turnoverRate',   value: `${summary.turnoverRate}%`,  unit: '', color: 'amber'  },
    { label: 'kpi.retentionRate',  value: `${summary.retentionRate}%`, unit: '', color: 'emerald'},
    { label: 'status.active',      value: String(summary.activeCount), unit: 'common.employees', color: 'indigo'},
    { label: 'status.terminated',  value: String(summary.terminatedTotal), unit: 'common.employees', color: 'red' },
  ]

  // Retention = 100 - monthly turnover rate
  const retentionData = monthlyTrend.map(d => ({
    month:     d.month,
    retention: parseFloat((100 - d.rate).toFixed(1)),
    rate:      d.rate,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pages.turnover.title')}
        subtitle={t('pages.turnover.subtitle')}
      />

      <MetricSummaryRow metrics={summaryMetrics} />

      {/* Turnover rate trend */}
      <ChartCard
        title={t('charts.turnoverTrend')}
        subtitle="Monthly turnover rate (%) — 24-month view"
        action={t('dashboard.viewAll')}
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="turnGrad" x1="0" y1="0" x2="0" y2="1">
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
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="rate"
              name="Turnover Rate"
              stroke={COLORS.amber}
              strokeWidth={2.5}
              fill="url(#turnGrad)"
              dot={{ r: 3, fill: COLORS.amber, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hires vs Exits */}
        <ChartCard title="Hires vs Exits" subtitle="Monthly headcount movement">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="hires" name="Hires" stroke={COLORS.emerald} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="exits" name="Exits" stroke={COLORS.red}     strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Retention rate */}
        <ChartCard title="Retention Rate" subtitle="Monthly employee retention (%)">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={retentionData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="retention"
                name="Retention Rate"
                stroke={COLORS.emerald}
                strokeWidth={2.5}
                fill="url(#retGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
