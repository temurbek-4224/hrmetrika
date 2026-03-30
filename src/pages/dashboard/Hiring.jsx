import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import PageHeader from '@/components/shared/PageHeader'
import ChartCard from '@/components/shared/ChartCard'
import MetricSummaryRow from '@/components/shared/MetricSummaryRow'
import { useApi } from '@/hooks/useApi'
import { getMetricsHiring, getMetricsTurnover } from '@/api/metrics.api'

const COLORS = {
  primary: '#6366f1',
  emerald: '#10b981',
  red:     '#fca5a5',
}

const FUNNEL_COLORS = ['#6366f1', '#7c3aed', '#8b5cf6', '#a78bfa']

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

// ─── Module-level fetcher — parallel ────────────────────────────────────────
const fetchHiringData = () =>
  Promise.all([getMetricsHiring(), getMetricsTurnover()])
    .then(([hiring, turnover]) => ({ hiring, turnover }))

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 bg-slate-100 rounded-2xl" />
      <div className="h-20 bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-slate-100 rounded-2xl" />
        <div className="h-72 bg-slate-100 rounded-2xl" />
      </div>
      <div className="h-56 bg-slate-100 rounded-2xl" />
    </div>
  )
}

export default function Hiring() {
  const { t } = useTranslation()
  const { data, loading, error, refetch } = useApi(fetchHiringData)

  if (loading) return <LoadingSkeleton />
  if (error) return (
    <div className="card-base p-10 flex flex-col items-center gap-4">
      <p className="text-red-500 text-sm">{error}</p>
      <button onClick={refetch} className="text-sm text-indigo-600 font-medium hover:underline">
        {t('common.refresh')}
      </button>
    </div>
  )

  const { hiring, turnover } = data
  const hs = hiring.summary

  const summaryMetrics = [
    { label: 'kpi.openPositions',  value: String(hs.openPositions),                 unit: '',              color: 'amber'  },
    { label: 'admin.filledPositions', value: String(hs.totalFilled),                unit: 'common.employees', color: 'emerald'},
    { label: 'kpi.timeToHire',     value: String(hs.timeToHire),                    unit: 'common.days',   color: 'indigo' },
    { label: 'kpi.offerAcceptance',value: `${hs.offerAcceptance}%`,                 unit: '',              color: 'violet' },
  ]

  // Build funnel display array from backend's flat funnel object
  const funnelStages = [
    { stage: 'Candidates',  count: hiring.funnel.candidates },
    { stage: 'Interviews',  count: hiring.funnel.interviews },
    { stage: 'Offers',      count: hiring.funnel.offers     },
    { stage: 'Hired',       count: hiring.funnel.hired      },
  ]

  const maxCount = funnelStages[0]?.count || 1

  // Hires vs Exits from turnover monthly trend
  const hiresExits = turnover.monthlyTrend.map(d => ({
    month: d.month,
    Hires: d.hires,
    Exits: d.exits,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pages.hiring.title')}
        subtitle={t('pages.hiring.subtitle')}
      />

      <MetricSummaryRow metrics={summaryMetrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hiring funnel */}
        <ChartCard
          title={t('charts.hiringFunnel')}
          subtitle="Recruitment pipeline — all time"
        >
          <div className="space-y-2 mt-2">
            {funnelStages.map((stage, i) => {
              const pct      = (stage.count / maxCount) * 100
              const convPct  = i > 0
                ? ((stage.count / funnelStages[i - 1].count) * 100).toFixed(0)
                : 100
              return (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">{stage.stage}</span>
                    <div className="flex items-center gap-3">
                      {i > 0 && (
                        <span className="text-slate-400">{convPct}% conv.</span>
                      )}
                      <span className="font-bold text-slate-800 w-12 text-right">
                        {stage.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center justify-end pr-3 transition-all duration-700"
                      style={{
                        width:      `${pct}%`,
                        background: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                      }}
                    >
                      <span className="text-white text-xs font-bold">{stage.count.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Total candidates: <strong className="text-slate-700">{hiring.funnel.candidates.toLocaleString()}</strong>
            </span>
            <span>
              Offer → Hire: <strong className="text-emerald-600">{hiring.funnel.offerToHire}%</strong>
            </span>
          </div>
        </ChartCard>

        {/* Hires vs Exits */}
        <ChartCard title="Hires vs Exits" subtitle="Monthly headcount movement">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hiresExits} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Hires" fill={COLORS.emerald} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Exits" fill={COLORS.red}     radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Monthly hiring activity */}
      <ChartCard title="Monthly Hiring Activity" subtitle="New hires per month (filled positions)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={hiring.monthlyHires}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="hires" name="New Hires" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
