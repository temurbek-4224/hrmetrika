import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileDown, Loader2 } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import PageHeader        from '@/components/shared/PageHeader'
import KpiCard           from '@/components/shared/KpiCard'
import ChartCard         from '@/components/shared/ChartCard'
import MetricSummaryRow  from '@/components/shared/MetricSummaryRow'
import Toast             from '@/components/shared/Toast'
import { useApi }        from '@/hooks/useApi'
import { useToast }      from '@/hooks/useToast'
import { exportDashboardPDF } from '@/utils/exportPdf'
import {
  getMetricsOverview,
  getMetricsHeadcount,
  getMetricsSalary,
  getMetricsTurnover,
} from '@/api/metrics.api'

// ─── Module-level fetcher (stable reference — no deps) ──────────────────────
const fetchDashboardData = () =>
  Promise.all([
    getMetricsOverview(),
    getMetricsHeadcount(),
    getMetricsSalary(),
    getMetricsTurnover(),
  ]).then(([overview, headcount, salary, turnover]) => ({
    overview, headcount, salary, turnover,
  }))

// ─── Chart palette ──────────────────────────────────────────────────────────
const COLORS = {
  primary: '#6366f1',
  emerald: '#10b981',
  amber:   '#f59e0b',
}

// ─── KPI card builder ───────────────────────────────────────────────────────
function buildKpiData(ov) {
  return [
    {
      id: 'headcount', key: 'kpi.headcount', value: ov.headcount.value,
      trend: 0, format: 'number', icon: 'Users', color: 'indigo', inverse: false,
    },
    {
      id: 'absenceRate', key: 'kpi.absenceRate', value: ov.absenceRate.value,
      trend: 0, format: 'percent', icon: 'CalendarX2', color: 'amber', inverse: true,
    },
    {
      id: 'avgSalary', key: 'kpi.avgSalary', value: ov.avgSalary.value,
      trend: 0, format: 'currency', icon: 'DollarSign', color: 'emerald', inverse: false,
    },
    {
      id: 'turnoverRate', key: 'kpi.turnoverRate', value: ov.turnoverRate.value,
      trend: 0, format: 'percent', icon: 'TrendingDown', color: 'red', inverse: true,
    },
    {
      id: 'offerAcceptance', key: 'kpi.offerAcceptance', value: ov.offerAcceptance.value,
      trend: 0, format: 'percent', icon: 'CheckCircle', color: 'violet', inverse: false,
    },
    {
      id: 'revenuePerEmployee', key: 'kpi.revenuePerEmployee',
      value: ov.revenuePerEmployee.value,
      trend: ov.revenuePerEmployee.trend,
      format: 'currency', icon: 'BarChart3', color: 'cyan', inverse: false,
    },
  ]
}

// ─── Summary row builder ────────────────────────────────────────────────────
function buildSummaryMetrics(ov) {
  return [
    { label: 'kpi.timeToHire',        value: String(ov.timeToHire.value),      unit: 'common.days',      color: 'indigo' },
    { label: 'kpi.openPositions',     value: String(ov.openPositions.value),   unit: '',                 color: 'amber'  },
    { label: 'kpi.newHires',          value: String(ov.newHires.value),         unit: 'common.employees', color: 'emerald'},
    { label: 'kpi.profitPerEmployee', value: `$${ov.profitPerEmployee.value.toLocaleString()}`, unit: 'common.monthly', color: 'violet' },
  ]
}

// ─── Shared tooltip ─────────────────────────────────────────────────────────
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
            {typeof p.value === 'number' && p.value > 1000 ? `$${p.value.toLocaleString()}` : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Loading skeleton ───────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-2xl" />
        ))}
      </div>
      <div className="h-20 bg-slate-100 rounded-2xl" />
      <div className="h-64 bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-56 bg-slate-100 rounded-2xl" />
        <div className="h-56 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function Overview() {
  const { t }                        = useTranslation()
  const { toast, showToast }         = useToast()
  const { data, loading, error, refetch } = useApi(fetchDashboardData)
  const [pdfExporting, setPdfExporting]   = useState(false)

  // Refs for html2canvas chart capture
  const headcountChartRef = useRef(null)
  const salaryChartRef    = useRef(null)
  const turnoverChartRef  = useRef(null)

  if (loading) return <LoadingSkeleton />
  if (error) return (
    <div className="card-base p-10 flex flex-col items-center gap-4">
      <p className="text-red-500 text-sm">{error}</p>
      <button onClick={refetch} className="text-sm text-indigo-600 font-medium hover:underline">
        {t('common.refresh')}
      </button>
    </div>
  )

  const kpiData        = buildKpiData(data.overview)
  const summaryMetrics = buildSummaryMetrics(data.overview)

  // Headcount trend — backend monthly trend has {month, headcount}
  const headcountTrend = data.headcount.monthlyTrend

  // Salary by dept — map 'department' → 'dept' for the chart dataKey
  const salaryByDept = data.salary.byDepartment.map(d => ({
    dept: d.department,
    avg:  d.avg,
  }))

  // Turnover trend — has {month, rate, hires, exits}
  const turnoverTrend = data.turnover.monthlyTrend

  // ── PDF export ─────────────────────────────────────────────────────────────
  const handlePdfExport = async () => {
    setPdfExporting(true)
    try {
      const kpis = kpiData.map((kpi) => ({
        label:  t(kpi.key),
        value:  kpi.value,
        format: kpi.format,
      }))
      const summary = summaryMetrics.map((m) => ({
        label: t(m.label),
        value: m.value + (m.unit ? ` ${t(m.unit)}` : ''),
      }))
      await exportDashboardPDF({
        title:     t('dashboard.title'),
        kpis,
        summary,
        chartRefs: [
          { label: t('charts.headcountTrend'), ref: headcountChartRef },
          { label: t('charts.salaryByDept'),   ref: salaryChartRef    },
          { label: t('charts.turnoverTrend'),  ref: turnoverChartRef  },
        ],
      })
      showToast('Dashboard report exported as PDF.')
    } catch {
      showToast('PDF export failed. Please try again.', 'error')
    } finally {
      setPdfExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        action={
          <button
            onClick={handlePdfExport}
            disabled={pdfExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 shadow-card disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {pdfExporting
              ? <Loader2 size={15} className="animate-spin text-brand-500" />
              : <FileDown size={15} className="text-brand-500" />
            }
            {pdfExporting ? 'Generating PDF…' : 'Export PDF'}
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiData.map((kpi, i) => (
          <KpiCard key={kpi.id} kpi={kpi} index={i} />
        ))}
      </div>

      {/* Metric Summary Row */}
      <MetricSummaryRow metrics={summaryMetrics} />

      {/* Headcount Trend — full width */}
      <div ref={headcountChartRef}>
      <ChartCard
        title={t('charts.headcountTrend')}
        subtitle="24-month workforce overview"
        action={t('dashboard.viewAll')}
      >
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={headcountTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradHeadcount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.15} />
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="headcount"
              name="Total"
              stroke={COLORS.primary}
              strokeWidth={2.5}
              fill="url(#gradHeadcount)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      </div>

      {/* Bottom row charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div ref={salaryChartRef}>
        <ChartCard title={t('charts.salaryByDept')} subtitle="Average monthly salary (USD)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salaryByDept} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="dept" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg" name="Avg Salary" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        </div>

        <div ref={turnoverChartRef}>
        <ChartCard title={t('charts.turnoverTrend')} subtitle="Monthly turnover rate (%)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={turnoverTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="rate"
                name="Turnover %"
                stroke={COLORS.amber}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: COLORS.amber }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        </div>
      </div>
    </div>
  )
}
