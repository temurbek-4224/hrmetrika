import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import PageHeader from '@/components/shared/PageHeader'
import ChartCard from '@/components/shared/ChartCard'
import MetricSummaryRow from '@/components/shared/MetricSummaryRow'
import { useApi } from '@/hooks/useApi'
import { getMetricsSalary } from '@/api/metrics.api'

const BAR_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f97316', '#ec4899']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-card-lg border border-slate-100 p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-slate-600 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span>{p.name}:</span>
          <span className="font-semibold text-slate-800">${p.value?.toLocaleString()}</span>
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
        <div className="h-64 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  )
}

export default function Salary() {
  const { t } = useTranslation()
  const { data, loading, error, refetch } = useApi(getMetricsSalary)

  if (loading) return <LoadingSkeleton />
  if (error) return (
    <div className="card-base p-10 flex flex-col items-center gap-4">
      <p className="text-red-500 text-sm">{error}</p>
      <button onClick={refetch} className="text-sm text-indigo-600 font-medium hover:underline">
        {t('common.refresh')}
      </button>
    </div>
  )

  const { summary, byDepartment, salaryBands } = data

  const summaryMetrics = [
    { label: 'kpi.avgSalary',    value: `$${summary.average.toLocaleString()}`, unit: 'common.perMonth', color: 'emerald' },
    { label: 'kpi.medianSalary', value: `$${summary.median.toLocaleString()}`,  unit: 'common.perMonth', color: 'indigo'  },
    { label: 'kpi.headcount',    value: String(summary.headcount), unit: 'common.employees', color: 'cyan' },
    { label: 'kpi.totalPayroll', value: `$${(summary.total_payroll / 1000).toFixed(0)}k`, unit: 'common.monthly', color: 'violet' },
  ]

  // Map backend 'department' → 'dept' for chart dataKeys
  const deptChartData = byDepartment.map(d => ({
    dept: d.department,
    avg:  d.avg,
    min:  d.min,
    max:  d.max,
    payrollShare: d.payrollShare,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pages.salary.title')}
        subtitle={t('pages.salary.subtitle')}
      />

      <MetricSummaryRow metrics={summaryMetrics} />

      {/* Main horizontal bar chart */}
      <ChartCard
        title={t('charts.salaryByDept')}
        subtitle="Average monthly salary by department (USD)"
        action={t('dashboard.viewAll')}
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={deptChartData}
            layout="vertical"
            margin={{ top: 5, right: 60, left: 20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="dept"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg" name="Avg Salary" radius={[0, 6, 6, 0]}>
              {deptChartData.map((_, index) => (
                <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
              <LabelList
                dataKey="avg"
                position="right"
                formatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                style={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary range chart */}
        <ChartCard title="Salary Range by Department" subtitle="Min, Avg, and Max salary bands">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deptChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="dept" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="min" name="Min" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avg" name="Avg" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="max" name="Max" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Payroll share — uses pre-computed payrollShare from backend */}
        <ChartCard title="Department Share of Payroll" subtitle="Relative salary spend by department">
          <div className="space-y-3 mt-2">
            {deptChartData.map((d, i) => (
              <div key={d.dept} className="flex items-center gap-3">
                <div className="w-24 text-xs text-slate-500 font-medium shrink-0">{d.dept}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${d.payrollShare}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                  />
                </div>
                <div className="w-12 text-xs font-semibold text-slate-600 text-right">{d.payrollShare}%</div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Salary bands */}
      {salaryBands?.length > 0 && (
        <ChartCard title="Salary Distribution" subtitle="Number of employees per salary band">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salaryBands} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v, name) => [v, 'Employees']}
                contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f1f5f9' }}
              />
              <Bar dataKey="count" name="Employees" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}
