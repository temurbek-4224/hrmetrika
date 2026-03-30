import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, TrendingUp, DollarSign, Users, AlertCircle, RefreshCw, Download, Loader2 } from 'lucide-react'
import { downloadExcel } from '@/utils/exportExcel'
import { motion } from 'framer-motion'
import PageHeader    from '@/components/shared/PageHeader'
import TableWrapper  from '@/components/shared/TableWrapper'
import Modal         from '@/components/shared/Modal'
import Toast         from '@/components/shared/Toast'
import { useApi }    from '@/hooks/useApi'
import { useToast }  from '@/hooks/useToast'
import { useRole }   from '@/hooks/useRole'
import {
  getFinancials,
  createFinancial,
  updateFinancial,
  deleteFinancial,
} from '@/api/financials.api'
import { formatCurrency } from '@/utils/formatters'

// ─── Stable module-level fetcher ──────────────────────────────────────────────
const fetchFinancials = () => getFinancials()

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const YEARS = ['2023', '2024', '2025', '2026']

// ─── Form helpers ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  month:     'January',
  year:      '2025',
  revenue:   '',
  profit:    '',
  headcount: '',
}

function recordToForm(row) {
  // row.period is like '2025-03-01'
  const d     = new Date(row.period + 'T00:00:00Z')
  const month = MONTHS[d.getUTCMonth()]
  const year  = String(d.getUTCFullYear())
  return {
    month,
    year,
    revenue:   String(row.revenue   ?? ''),
    profit:    String(row.profit    ?? ''),
    headcount: String(row.headcount ?? ''),
  }
}

function validate(form) {
  const errs = {}
  if (!form.revenue   || isNaN(Number(form.revenue)))   errs.revenue   = 'Valid revenue is required.'
  if (!form.profit    || isNaN(Number(form.profit)))     errs.profit    = 'Valid net profit is required.'
  if (!form.headcount || isNaN(Number(form.headcount)) || Number(form.headcount) < 1)
    errs.headcount = 'Headcount must be at least 1.'
  return errs
}

function buildPeriod(month, year) {
  const monthIndex = MONTHS.indexOf(month) + 1
  return `${year}-${String(monthIndex).padStart(2, '0')}-01`
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-colors'
const labelCls = 'block text-xs font-semibold text-slate-500 mb-1.5'

// ─── Financial form (inside Modal) ────────────────────────────────────────────
function FinancialForm({ form, setForm, errors, saving, onSubmit, onClose, isEdit, t }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Month + Year */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Month</label>
          <select
            value={form.month}
            onChange={e => setForm(p => ({ ...p, month: e.target.value }))}
            className={inputCls}
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Year</label>
          <select
            value={form.year}
            onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
            className={inputCls}
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Revenue */}
      <div>
        <label className={labelCls}>Revenue (USD)</label>
        <input
          type="number"
          value={form.revenue}
          onChange={e => setForm(p => ({ ...p, revenue: e.target.value }))}
          placeholder="e.g. 2500000"
          className={inputCls}
        />
        {errors.revenue && <p className="mt-1 text-xs text-red-500">{errors.revenue}</p>}
      </div>

      {/* Net Profit */}
      <div>
        <label className={labelCls}>Net Profit (USD)</label>
        <input
          type="number"
          value={form.profit}
          onChange={e => setForm(p => ({ ...p, profit: e.target.value }))}
          placeholder="e.g. 550000"
          className={inputCls}
        />
        {errors.profit && <p className="mt-1 text-xs text-red-500">{errors.profit}</p>}
      </div>

      {/* Headcount */}
      <div>
        <label className={labelCls}>Headcount</label>
        <input
          type="number"
          min="1"
          value={form.headcount}
          onChange={e => setForm(p => ({ ...p, headcount: e.target.value }))}
          placeholder="e.g. 160"
          className={inputCls}
        />
        {errors.headcount && <p className="mt-1 text-xs text-red-500">{errors.headcount}</p>}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-violet-500 text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-lg shadow-brand-500/20 hover:from-brand-600 hover:to-violet-600 transition-all disabled:opacity-70"
        >
          {saving ? 'Saving…' : isEdit ? t('common.save') : 'Add Entry'}
        </button>
      </div>
    </form>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AdminFinancials() {
  const { t } = useTranslation()
  const { toast, showToast } = useToast()
  const { isAdmin } = useRole()

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem,  setEditItem]  = useState(null)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [errors,    setErrors]    = useState({})
  const [saving,    setSaving]    = useState(false)
  const [confirmId,  setConfirmId]  = useState(null)
  const [deleting,   setDeleting]   = useState(null)
  const [exporting,  setExporting]  = useState(false)

  const { data: records, loading, error, refetch } = useApi(fetchFinancials)

  // ── Aggregate stats ────────────────────────────────────────────────────────
  const { totalRevenue, totalProfit, avgMargin } = useMemo(() => {
    if (!records || records.length === 0) return { totalRevenue: 0, totalProfit: 0, avgMargin: '0.0' }
    const rev  = records.reduce((s, r) => s + r.revenue, 0)
    const prof = records.reduce((s, r) => s + r.profit,  0)
    return {
      totalRevenue: rev,
      totalProfit:  prof,
      avgMargin:    rev > 0 ? ((prof / rev) * 100).toFixed(1) : '0.0',
    }
  }, [records])

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openAdd = useCallback(() => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((row) => {
    setEditItem(row)
    setForm(recordToForm(row))
    setErrors({})
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditItem(null)
    setForm(EMPTY_FORM)
    setErrors({})
  }, [])

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!records?.length) return
    setExporting(true)
    try {
      downloadExcel(
        records,
        [
          { header: 'Period',                    key: 'month',          width: 18 },
          { header: 'Revenue (USD)',              key: 'revenue',        width: 16 },
          { header: 'Net Profit (USD)',           key: 'profit',         width: 16 },
          { header: 'Headcount',                 key: 'headcount',      width: 12 },
          { header: 'Revenue / Employee (USD)',   key: 'revenuePerEmp',  width: 24 },
          { header: 'Profit / Employee (USD)',    key: 'profitPerEmp',   width: 24 },
        ],
        `HR_Metrika_Financials_${new Date().toISOString().slice(0, 10)}`,
        'Financials',
      )
      showToast('Financial data exported to Excel.')
    } catch (err) {
      showToast(err?.message ?? 'Export failed.', 'error')
    } finally {
      setExporting(false)
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const body = {
        period:     buildPeriod(form.month, form.year),
        revenue:    parseFloat(form.revenue),
        net_profit: parseFloat(form.profit),
        headcount:  parseInt(form.headcount, 10),
      }
      if (editItem) {
        await updateFinancial(editItem.id, body)
        showToast('Financial entry updated.')
      } else {
        await createFinancial(body)
        showToast('Financial entry added.')
      }
      closeModal()
      refetch()
    } catch (err) {
      showToast(err?.message ?? 'Failed to save entry.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await deleteFinancial(id)
      showToast('Financial entry deleted.')
      setConfirmId(null)
      refetch()
    } catch (err) {
      showToast(err?.message ?? 'Failed to delete entry.', 'error')
    } finally {
      setDeleting(null)
    }
  }

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'month',
      label: 'Period',
      render: (val) => <span className="font-semibold text-slate-800">{val}</span>,
    },
    {
      key: 'revenue',
      label: 'Revenue',
      render: (val) => (
        <span className="font-semibold text-indigo-600">{formatCurrency(val)}</span>
      ),
    },
    {
      key: 'profit',
      label: 'Net Profit',
      render: (val) => (
        <span className="font-semibold text-emerald-600">{formatCurrency(val)}</span>
      ),
    },
    {
      key: 'headcount',
      label: 'Headcount',
      render: (val) => <span className="text-slate-600">{val}</span>,
    },
    {
      key: 'revenuePerEmp',
      label: 'Revenue / Emp',
      render: (val) => (
        <span className="text-slate-700 font-medium">{formatCurrency(val)}</span>
      ),
    },
    {
      key: 'profitPerEmp',
      label: 'Profit / Emp',
      render: (val) => (
        <span className="text-slate-700 font-medium">{formatCurrency(val)}</span>
      ),
    },
    {
      key: 'id',
      label: t('table.actions'),
      render: (id, row) => {
        if (!isAdmin) return <span className="text-xs text-slate-400">View only</span>
        return confirmId === id ? (
          <span className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Delete?</span>
            <button
              onClick={() => handleDelete(id)}
              disabled={deleting === id}
              className="text-red-500 hover:text-red-700 font-semibold disabled:opacity-60"
            >
              {deleting === id ? 'Deleting…' : 'Yes'}
            </button>
            <span className="text-slate-200">/</span>
            <button
              onClick={() => setConfirmId(null)}
              className="text-slate-400 hover:text-slate-600 font-medium"
            >
              No
            </button>
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEdit(row)}
              className="text-xs text-brand-500 hover:text-brand-700 font-medium"
            >
              {t('common.edit')}
            </button>
            <span className="text-slate-200">|</span>
            <button
              onClick={() => setConfirmId(id)}
              className="text-xs text-red-400 hover:text-red-600 font-medium"
            >
              {t('common.delete')}
            </button>
          </div>
        )
      },
    },
  ]

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('admin.financialsTitle')} subtitle={t('admin.financialsSubtitle')} />
        <div className="card-base p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle size={22} className="text-red-400" />
          </div>
          <p className="text-sm text-slate-500">{error}</p>
          <button
            onClick={refetch}
            className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-700 font-medium"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <PageHeader
        title={t('admin.financialsTitle')}
        subtitle={t('admin.financialsSubtitle')}
        action={isAdmin ? (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-600 hover:to-violet-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-500/20 transition-all duration-200"
          >
            <Plus size={16} />
            {t('admin.addEntry') || 'Add Entry'}
          </button>
        ) : null}
      />

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Revenue',     value: loading ? '—' : `$${(totalRevenue / 1_000_000).toFixed(1)}M`, icon: DollarSign, color: '#6366f1' },
          { label: 'Total Net Profit',  value: loading ? '—' : `$${(totalProfit  / 1_000_000).toFixed(1)}M`, icon: TrendingUp, color: '#10b981' },
          { label: 'Avg Profit Margin', value: loading ? '—' : `${avgMargin}%`,                              icon: TrendingUp, color: '#f59e0b' },
          { label: 'Monthly Records',   value: loading ? '—' : (records?.length ?? 0),                       icon: Users,      color: '#8b5cf6' },
        ].map((stat) => (
          <div key={stat.label} className="card-base p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${stat.color}18` }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Export bar */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={exporting || !records?.length}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white shadow-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {exporting ? 'Exporting…' : t('common.export')}
        </button>
      </div>

      <TableWrapper columns={columns} data={records ?? []} loading={loading} />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'Edit Financial Entry' : 'Add Financial Entry'}
        size="md"
      >
        <FinancialForm
          form={form}
          setForm={setForm}
          errors={errors}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={closeModal}
          isEdit={!!editItem}
          t={t}
        />
      </Modal>
    </div>
  )
}
