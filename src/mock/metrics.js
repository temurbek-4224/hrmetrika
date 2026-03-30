/**
 * Mock KPI data for the dashboard.
 *
 * Values are aligned with the December 2024 snapshot across all mock datasets:
 *   headcount      : 247   (matches headcountTrend Dec)
 *   absenceRate    : 4.2%  (matches absenceTrend Dec)
 *   avgSalary      : $5,750 (weighted avg across departments)
 *   turnoverRate   : 8.5%  (matches turnoverTrend Dec)
 *   revenuePerEmp  : $10,121/mo  (2,500,000 / 247  — Dec financials)
 *   profitPerEmp   : $2,227/mo   (550,000   / 247  — Dec financials)
 */

export const kpiData = [
  {
    id: 'headcount',
    key: 'kpi.headcount',
    value: 247,
    previousValue: 244,
    trend: 1.2,
    format: 'number',
    icon: 'Users',
    color: 'indigo',
    inverse: false,
  },
  {
    id: 'absenceRate',
    key: 'kpi.absenceRate',
    value: 4.2,
    previousValue: 4.3,
    trend: -2.3,
    format: 'percent',
    icon: 'CalendarX2',
    color: 'amber',
    inverse: true,          // lower is better
  },
  {
    id: 'avgSalary',
    key: 'kpi.avgSalary',
    value: 5750,
    previousValue: 5650,
    trend: 1.8,
    format: 'currency',
    icon: 'DollarSign',
    color: 'emerald',
    inverse: false,
  },
  {
    id: 'turnoverRate',
    key: 'kpi.turnoverRate',
    value: 8.5,
    previousValue: 8.5,
    trend: 0.0,
    format: 'percent',
    icon: 'TrendingDown',
    color: 'red',
    inverse: true,          // lower is better
  },
  {
    id: 'offerAcceptance',
    key: 'kpi.offerAcceptance',
    value: 78,
    previousValue: 74,
    trend: 5.4,
    format: 'percent',
    icon: 'CheckCircle',
    color: 'violet',
    inverse: false,
  },
  {
    id: 'revenuePerEmployee',
    key: 'kpi.revenuePerEmployee',
    value: 10121,           // Dec: 2,500,000 / 247 employees
    previousValue: 9754,   // Nov: 2,380,000 / 244 employees
    trend: 3.8,
    format: 'currency',
    icon: 'BarChart3',
    color: 'cyan',
    inverse: false,
  },
]

/**
 * Secondary summary metrics (shown as a metric row below KPI cards).
 * profitPerEmployee aligned with Dec 2024: 550,000 / 247 = ~$2,227/mo
 */
export const summaryMetrics = [
  { label: 'kpi.timeToHire',        value: '18',    unit: 'common.days',      color: 'indigo' },
  { label: 'kpi.openPositions',     value: '12',    unit: '',                 color: 'amber'  },
  { label: 'kpi.newHires',          value: '23',    unit: 'common.employees', color: 'emerald'},
  { label: 'kpi.profitPerEmployee', value: '$2,227', unit: 'common.monthly',  color: 'violet' },
]
