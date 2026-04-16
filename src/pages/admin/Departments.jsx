import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Building2, AlertCircle, RefreshCw, Download, Loader2 } from 'lucide-react'
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
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '@/api/departments.api'
import { formatSoum } from '@/utils/formatters'

// ─── Stable module-level fetcher ──────────────────────────────────────────────
const fetchDepartments = () => getDepartments()

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DEPT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f97316', '#ec4899', '#14b8a6']
const EMPTY_FORM  = { name: '' }

const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-colors'
const labelCls = 'block text-xs font-semibold text-slate-500 mb-1.5'

function validate(form) {
  const errs = {}
  if (!form.name.trim()) errs.name = 'Department name is required.'
  return errs
}

// ─── Department form (inside Modal) ───────────────────────────────────────────
function DepartmentForm({ form, setForm, errors, saving, onSubmit, onClose, isEdit, t }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Department Name</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="e.g. Engineering"
          className={inputCls}
          autoFocus
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name}</p>
        )}
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
          {saving ? 'Saving…' : isEdit ? t('common.save') : 'Add Department'}
        </button>
      </div>
    </form>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function Departments() {
  const { t } = useTranslation()
  const { toast, showToast } = useToast()
  const { isAdmin } = useRole()

  const [search, setSearch]       = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem,  setEditItem]  = useState(null)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [errors,    setErrors]    = useState({})
  const [saving,    setSaving]    = useState(false)
  const [confirmId,  setConfirmId]  = useState(null)
  const [deleting,   setDeleting]   = useState(null)
  const [exporting,  setExporting]  = useState(false)

  const { data: departments, loading, error, refetch } = useApi(fetchDepartments)

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!departments) return []
    return departments.filter(d =>
      d.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [departments, search])

  const totalHeadcount = useMemo(
    () => (departments ?? []).reduce((s, d) => s + d.headCount, 0),
    [departments]
  )

  const avgSalaryAll = useMemo(() => {
    if (!departments || departments.length === 0) return 0
    const withSalary = departments.filter(d => d.avgSalary > 0)
    if (!withSalary.length) return 0
    return Math.round(withSalary.reduce((s, d) => s + d.avgSalary, 0) / withSalary.length)
  }, [departments])

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openAdd = useCallback(() => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((row) => {
    setEditItem(row)
    setForm({ name: row.name })
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
    if (!filtered.length) return
    setExporting(true)
    try {
      downloadExcel(
        filtered,
        [
          { header: 'Department',            key: 'name',      width: 28 },
          { header: 'Headcount',             key: 'headCount', width: 12 },
          { header: 'Avg Monthly Salary (USD)', key: 'avgSalary', width: 22 },
        ],
        `HR_Metrika_Departments_${new Date().toISOString().slice(0, 10)}`,
        'Departments',
      )
      showToast('Departments exported to Excel.')
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
      if (editItem) {
        await updateDepartment(editItem.id, { name: form.name.trim() })
        showToast('Department updated successfully.')
      } else {
        await createDepartment({ name: form.name.trim() })
        showToast('Department added successfully.')
      }
      closeModal()
      refetch()
    } catch (err) {
      showToast(err?.message ?? 'Failed to save department.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await deleteDepartment(id)
      showToast('Department deleted.')
      setConfirmId(null)
      refetch()
    } catch (err) {
      showToast(err?.message ?? 'Failed to delete department.', 'error')
    } finally {
      setDeleting(null)
    }
  }

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'name',
      label: t('table.department'),
      render: (val, _, i) => {
        const idx   = (departments ?? []).findIndex(d => d.name === val) % DEPT_COLORS.length
        const color = DEPT_COLORS[idx < 0 ? 0 : idx]
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}18` }}
            >
              <Building2 size={16} style={{ color }} />
            </div>
            <span className="font-semibold text-slate-800">{val}</span>
          </div>
        )
      },
    },
    {
      key: 'headCount',
      label: t('table.headcount') || 'Headcount',
      render: (val) => (
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">{val}</span>
          <div className="flex-1 max-w-[80px] bg-slate-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-brand-500"
              style={{ width: totalHeadcount ? `${(val / totalHeadcount) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-xs text-slate-400">
            {totalHeadcount ? ((val / totalHeadcount) * 100).toFixed(1) : 0}%
          </span>
        </div>
      ),
    },
    {
      key: 'avgSalary',
      label: t('table.avgSalary') || 'Avg Salary',
      render: (val) => (
        <span className="font-semibold text-slate-700">
          {val > 0 ? formatSoum(val) : '—'}
        </span>
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
        <PageHeader title={t('admin.departmentsTitle')} subtitle={t('admin.departmentsSubtitle')} />
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
        title={t('admin.departmentsTitle')}
        subtitle={t('admin.departmentsSubtitle')}
        action={isAdmin ? (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-600 hover:to-violet-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-500/20 transition-all duration-200"
          >
            <Plus size={16} />
            {t('admin.addDepartment')}
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
          { label: t('admin.totalDepartments') || 'Total Departments', value: loading ? '—' : (departments?.length ?? 0), color: '#6366f1' },
          { label: t('admin.totalEmployees')   || 'Total Employees',   value: loading ? '—' : totalHeadcount,             color: '#10b981' },
          { label: t('admin.avgDeptSize')       || 'Avg Dept Size',     value: loading ? '—' : (departments?.length ? Math.round(totalHeadcount / departments.length) : 0), color: '#f59e0b' },
          { label: t('admin.avgSalary')         || 'Avg Salary',        value: loading ? '—' : formatSoum(avgSalaryAll), color: '#8b5cf6' },
        ].map((stat) => (
          <div key={stat.label} className="card-base p-4">
            <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Search + Export */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-slate-200 flex-1 max-w-sm shadow-card">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('table.search')}
            className="bg-transparent text-sm text-slate-600 placeholder-slate-400 outline-none w-full"
          />
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || !filtered?.length}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white shadow-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {exporting ? 'Exporting…' : t('common.export')}
        </button>
      </div>

      <TableWrapper columns={columns} data={filtered} loading={loading} />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'Edit Department' : 'Add Department'}
        size="sm"
      >
        <DepartmentForm
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
