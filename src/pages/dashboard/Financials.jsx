import { useTranslation } from 'react-i18next'
import {
  ComposedChart, AreaChart, Area, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import PageHeader from '@/components/shared/PageHeader'
import ChartCard from '@/components/shared/ChartCard'
import MetricSummaryRow from '@/components/shared/MetricSummaryRow'
import { useApi } from '@/hooks/useApi'
import { getMetricsFinancials } from '@/api/metrics.api'

const COLORS = {
  primary: '#6366f1',
  emerald: '#10b981',
  amber:   '#f59e0b',
  cyan:    '#06b6d4',
  violet:  '#8b5cf6',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-card-lg border border-slate-100 p-3 text-xs min-w-[180px]">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-slate-600 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span>{p.name}:</span>
          <span className="font-semibold text-slate-800">
            {typeof p.value === 'number' && p.value > 10000
              ? `$${(p.value / 1000).toFixed(0)}k`
              : typeof p.value === 'number' && p.dataKey === 'margin'
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
      <div className="h-80 bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-60 bg-slate-100 rounded-2xl" />
        <div className="h-60 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  )
}

export default function Financials() {
  const { t } = useTranslation()
  const { data, loading, error, refetch } = useApi(getMetricsFinancials)

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
    { label: 'kpi.revenuePerEmployee', value: `$${summary.revenuePerEmp.toLocaleString()}`,   unit: 'common.monthly', color: 'indigo'  },
    { label: 'kpi.profitPerEmployee',  value: `$${summary.profitPerEmp.toLocaleString()}`,    unit: 'common.monthly', color: 'emerald' },
    { label: 'dashboard.thisMonth',    value: `$${(summary.latestRevenue / 1000000).toFixed(2)}M`, unit: '', color: 'cyan'   },
    { label: 'kpi.avgSalary',          value: `${summary.avgMargin}%`,                        unit: '',               color: 'amber'  },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pages.financials.title')}
        subtitle={t('pages.financials.subtitle')}
      />

      <MetricSummaryRow metrics={summaryMetrics} />

      {/* Revenue & Profit chart */}
      <ChartCard
        title={t('charts.revenueProfit')}
        subtitle="Monthly revenue and profit (USD)"
        action={t('dashboard.viewAll')}
      >
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.15} />
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
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
            <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill={COLORS.primary} radius={[4, 4, 0, 0]} opacity={0.85} />
            <Bar yAxisId="left" dataKey="profit"  name="Profit"  fill={COLORS.emerald} radius={[4, 4, 0, 0]} opacity={0.85} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="profit"
              name="Profit Trend"
              stroke={COLORS.amber}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue / Profit per employee */}
        <ChartCard title="Revenue per Employee" subtitle="Monthly revenue & profit divided by headcount">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar  dataKey="revenuePerEmp" name="Revenue/Emp" fill={COLORS.cyan}   radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="profitPerEmp" name="Profit/Emp" stroke={COLORS.violet} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Profit margin trend */}
        <ChartCard title="Profit Margin Trend" subtitle="Monthly profit as % of revenue">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
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
                dataKey="margin"
                name="Profit Margin"
                stroke={COLORS.emerald}
                strokeWidth={2.5}
                fill="url(#marginGrad)"
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
