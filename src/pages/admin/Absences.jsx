import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, AlertCircle, RefreshCw, Download, Loader2 } from 'lucide-react'
import { downloadExcel, fmtDate, fmtLabel } from '@/utils/exportExcel'
import { motion } from 'framer-motion'
import PageHeader   from '@/components/shared/PageHeader'
import TableWrapper from '@/components/shared/TableWrapper'
import StatusBadge  from '@/components/shared/StatusBadge'
import Modal        from '@/components/shared/Modal'
import Toast        from '@/components/shared/Toast'
import { useApi }   from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import { useRole }  from '@/hooks/useRole'
import {
  getAbsences,
  createAbsence,
  updateAbsence,
  approveAbsence,
  rejectAbsence,
  deleteAbsence,
  ABSENCE_TYPES,
  TYPE_LABELS,
} from '@/api/absences.api'
import { getEmployees } from '@/api/employees.api'

// ─── Stable module-level fetchers ─────────────────────────────────────────────
const fetchAbsences  = () => getAbsences()
const fetchEmployees = () => getEmployees()

// ─── Type → badge colour map ──────────────────────────────────────────────────
const absenceTypeColors = {
  'Sick Leave':      'bg-red-50    text-red-600',
  'Annual Leave':    'bg-blue-50   text-blue-600',
  'Personal Leave':  'bg-violet-50 text-violet-600',
  'Maternity Leave': 'bg-pink-50   text-pink-600',
  'Paternity Leave': 'bg-cyan-50   text-cyan-600',
  'Unpaid Leave':    'bg-amber-50  text-amber-600',
  'Other Leave':     'bg-slate-100 text-slate-600',
}

const formatDate = (val) =>
  new Date(val).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })

// ─── Form helpers ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  employee_id: '',
  type:        'SICK',
  start_date:  '',
  end_date:    '',
  days:        '',
  approved:    false,
}

function absenceToForm(row) {
  return {
    employee_id: String(row.employee_id ?? ''),
    type:        row.rawType ?? 'SICK',
    start_date:  row.startDate ?? '',
    end_date:    row.endDate   ?? '',
    days:        String(row.days ?? ''),
    approved:    row.approved ?? false,
  }
}

function validate(form) {
  const errs = {}
  if (!form.employee_id)  errs.employee_id = 'Employee is required.'
  if (!form.start_date)   errs.start_date  = 'Start date is required.'
  if (!form.end_date)     errs.end_date    = 'End date is required.'
  if (!form.days || Number(form.days) < 1) errs.days = 'Days must be at least 1.'
  return errs
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-colors'
const labelCls = 'block text-xs font-semibold text-slate-500 mb-1.5'

// ─── Absence form (inside Modal) ──────────────────────────────────────────────
function AbsenceForm({ form, setForm, errors, saving, onSubmit, onClose, isEdit, employees, t }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Employee select */}
      <div>
        <label className={labelCls}>Employee</label>
        <select
          value={form.employee_id}
          onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))}
          className={inputCls}
          disabled={isEdit}
        >
          <option value="">Select employee…</option>
          {(employees ?? []).map(emp => (
            <option key={emp.id} value={String(emp.id)}>{emp.name}</option>
          ))}
        </select>
        {errors.employee_id && <p className="mt-1 text-xs text-red-500">{errors.employee_id}</p>}
      </div>

      {/* Absence Type */}
      <div>
        <label className={labelCls}>Absence Type</label>
        <select
          value={form.type}
          onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
          className={inputCls}
        >
          {ABSENCE_TYPES.map(type => (
            <option key={type} value={type}>{TYPE_LABELS[type]}</option>
          ))}
        </select>
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Start Date</label>
          <input
            type="date"
            value={form.start_date}
            onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
            className={inputCls}
          />
          {errors.start_date && <p className="mt-1 text-xs text-red-500">{errors.start_date}</p>}
        </div>
        <div>
          <label className={labelCls}>End Date</label>
          <input
            type="date"
            value={form.end_date}
            onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
            className={inputCls}
          />
          {errors.end_date && <p className="mt-1 text-xs text-red-500">{errors.end_date}</p>}
        </div>
      </div>

      {/* Days */}
      <div>
        <label className={labelCls}>Number of Days</label>
        <input
          type="number"
          min="1"
          value={form.days}
          onChange={e => setForm(p => ({ ...p, days: e.target.value }))}
          placeholder="e.g. 3"
          className={inputCls}
        />
        {errors.days && <p className="mt-1 text-xs text-red-500">{errors.days}</p>}
      </div>

      {/* Approved toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setForm(p => ({ ...p, approved: !p.approved }))}
          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
            form.approved ? 'bg-brand-500' : 'bg-slate-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
              form.approved ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm text-slate-600">Mark as approved</span>
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
          {saving ? 'Saving…' : isEdit ? t('common.save') : 'Add Absence'}
        </button>
      </div>
    </form>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AdminAbsences() {
  const { t } = useTranslation()
  const { toast, showToast } = useToast()
  const { isAdmin } = useRole()

  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editItem,     setEditItem]     = useState(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [errors,       setErrors]       = useState({})
  const [saving,       setSaving]       = useState(false)
  const [confirmId,    setConfirmId]    = useState(null)
  const [deleting,     setDeleting]     = useState(null)
  const [actioning,    setActioning]    = useState(null)  // id being approved/rejected
  const [exporting,    setExporting]    = useState(false)

  const statuses = ['All', 'approved', 'pending']

  const { data: absenceRecords, loading, error, refetch } = useApi(fetchAbsences)
  const { data: employees }                               = useApi(fetchEmployees)

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!absenceRecords) return []
    return absenceRecords.filter(r => {
      const q = search.toLowerCase()
      const matchSearch =
        r.employee.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
      const matchStatus = filterStatus === 'All' || r.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [absenceRecords, search, filterStatus])

  const stats = useMemo(() => {
    const all = absenceRecords ?? []
    return {
      total:     all.length,
      pending:   all.filter(r => r.status === 'pending').length,
      approved:  all.filter(r => r.status === 'approved').length,
      totalDays: all.reduce((s, r) => s + r.days, 0),
    }
  }, [absenceRecords])

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openAdd = useCallback(() => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((row) => {
    setEditItem(row)
    setForm(absenceToForm(row))
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
          { header: 'Employee',     key: 'employee',   width: 26 },
          { header: 'Department',   key: 'department', width: 18 },
          { header: 'Absence Type', key: 'type',       width: 18 },
          { header: 'Start Date',   key: 'startDate',  width: 14, format: fmtDate },
          { header: 'End Date',     key: 'endDate',    width: 14, format: fmtDate },
          { header: 'Days',         key: 'days',       width:  8 },
          { header: 'Status',       key: 'status',     width: 12, format: fmtLabel },
        ],
        `HR_Metrika_Absences_${new Date().toISOString().slice(0, 10)}`,
        'Absences',
      )
      showToast('Absences exported to Excel.')
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
        employee_id: Number(form.employee_id),
        type:        form.type,
        start_date:  form.start_date,
        end_date:    form.end_date,
        days:        Number(form.days),
        approved:    form.approved,
      }
      if (editItem) {
        await updateAbsence(editItem.id, body)
        showToast('Absence updated successfully.')
      } else {
        await createAbsence(body)
        showToast('Absence added successfully.')
      }
      closeModal()
      refetch()
    } catch (err) {
      showToast(err?.message ?? 'Failed to save absence.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Approve / Reject ───────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setActioning(id)
    try {
      await approveAbsence(id)
      showToast('Absence approved.')
      refetch()
    } catch (err) {
      showToast(err?.message ?? 'Failed to approve.', 'error')
    } finally {
      setActioning(null)
    }
  }

  const handleReject = async (id) => {
    setActioning(id)
    try {
      await rejectAbsence(id)
      showToast('Absence rejected.')
      refetch()
    } catch (err) {
      showToast(err?.message ?? 'Failed to reject.', 'error')
    } finally {
      setActioning(null)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await deleteAbsence(id)
      showToast('Absence record deleted.')
      setConfirmId(null)
      refetch()
    } catch (err) {
      showToast(err?.message ?? 'Failed to delete.', 'error')
    } finally {
      setDeleting(null)
    }
  }

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'employee',
      label: t('table.name'),
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {val.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{val}</p>
            <p className="text-xs text-slate-400">{row.department}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: t('table.type') || 'Type',
      render: (val) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${absenceTypeColors[val] ?? 'bg-slate-100 text-slate-600'}`}>
          {val}
        </span>
      ),
    },
    {
      key: 'startDate',
      label: t('table.startDate') || 'Start Date',
      render: (val) => <span className="text-slate-600 text-sm">{formatDate(val)}</span>,
    },
    {
      key: 'endDate',
      label: t('table.endDate') || 'End Date',
      render: (val) => <span className="text-slate-600 text-sm">{formatDate(val)}</span>,
    },
    {
      key: 'days',
      label: t('table.days') || 'Days',
      render: (val) => (
        <span className="font-semibold text-slate-700">
          {val} <span className="text-slate-400 font-normal">days</span>
        </span>
      ),
    },
    {
      key: 'status',
      label: t('table.status'),
      render: (val) => <StatusBadge status={val} />,
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
          <div className="flex items-center gap-2 flex-wrap">
            {row.status === 'pending' && (
              <>
                <button
                  onClick={() => handleApprove(id)}
                  disabled={actioning === id}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-60"
                >
                  {t('status.approved')}
                </button>
                <span className="text-slate-200">|</span>
                <button
                  onClick={() => handleReject(id)}
                  disabled={actioning === id}
                  className="text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-60"
                >
                  {t('status.rejected')}
                </button>
                <span className="text-slate-200">|</span>
              </>
            )}
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
        <PageHeader title={t('admin.absencesTitle')} subtitle={t('admin.absencesSubtitle')} />
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
        title={t('admin.absencesTitle')}
        subtitle={t('admin.absencesSubtitle')}
        action={isAdmin ? (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-600 hover:to-violet-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-500/20 transition-all duration-200"
          >
            <Plus size={16} />
            {t('admin.addAbsence')}
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
          { label: t('admin.totalRecords')  || 'Total Records', value: loading ? '—' : stats.total,     color: '#6366f1' },
          { label: t('admin.pending')       || 'Pending',       value: loading ? '—' : stats.pending,   color: '#f59e0b' },
          { label: t('admin.approved')      || 'Approved',      value: loading ? '—' : stats.approved,  color: '#10b981' },
          { label: t('admin.totalDays')     || 'Total Days',    value: loading ? '—' : stats.totalDays, color: '#8b5cf6' },
        ].map((stat) => (
          <div key={stat.label} className="card-base p-4">
            <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
        <div className="flex items-center gap-1.5">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                filterStatus === s
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s === 'All' ? 'All' : t(`status.${s}`)}
            </button>
          ))}
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || !filtered?.length}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white shadow-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-auto"
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
        title={editItem ? 'Edit Absence Record' : 'Add Absence Record'}
        size="md"
      >
        <AbsenceForm
          form={form}
          setForm={setForm}
          errors={errors}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={closeModal}
          isEdit={!!editItem}
          employees={employees}
          t={t}
        />
      </Modal>
    </div>
  )
}
