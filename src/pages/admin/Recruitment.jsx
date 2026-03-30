import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Users, Calendar, AlertCircle, RefreshCw, Download, Loader2 } from 'lucide-react'
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
  getRecruitment,
  createRecruitment,
  updateRecruitment,
  deleteRecruitment,
  RECRUITMENT_STATUSES,
} from '@/api/recruitment.api'
import { getDepartments } from '@/api/departments.api'

// ─── Stable module-level fetchers ─────────────────────────────────────────────
const fetchRecruitment  = () => getRecruitment()
const fetchDepartments  = () => getDepartments()

// ─── Form helpers ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  department_id:    '',
  job_title:        '',
  opened_date:      '',
  status:           'OPEN',
  candidates_count: '',
  interviews_count: '',
}

function recruitToForm(row) {
  return {
    department_id:    String(row.department_id ?? ''),
    job_title:        row.title ?? '',
    opened_date:      row.openedDate ?? '',
    status:           row.raw_status ?? 'OPEN',
    candidates_count: String(row.candidates ?? ''),
    interviews_count: String(row.interviews ?? ''),
  }
}

function validate(form) {
  const errs = {}
  if (!form.department_id) errs.department_id = 'Department is required.'
  if (!form.job_title.trim()) errs.job_title  = 'Job title is required.'
  if (!form.opened_date)  errs.opened_date    = 'Opened date is required.'
  return errs
}

const formatDate = (val) =>
  new Date(val).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })

const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-colors'
const labelCls = 'block text-xs font-semibold text-slate-500 mb-1.5'

// ─── Recruitment form (inside Modal) ──────────────────────────────────────────
function RecruitmentForm({ form, setForm, errors, saving, onSubmit, onClose, isEdit, departments, t }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Department */}
      <div>
        <label className={labelCls}>Department</label>
        <select
          value={form.department_id}
          onChange={e => setForm(p => ({ ...p, department_id: e.target.value }))}
          className={inputCls}
        >
          <option value="">Select department…</option>
          {(departments ?? []).map(d => (
            <option key={d.id} value={String(d.id)}>{d.name}</option>
          ))}
        </select>
        {errors.department_id && <p className="mt-1 text-xs text-red-500">{errors.department_id}</p>}
      </div>

      {/* Job Title */}
      <div>
        <label className={labelCls}>Job Title</label>
        <input
          type="text"
          value={form.job_title}
          onChange={e => setForm(p => ({ ...p, job_title: e.target.value }))}
          placeholder="e.g. Senior Engineer"
          className={inputCls}
        />
        {errors.job_title && <p className="mt-1 text-xs text-red-500">{errors.job_title}</p>}
      </div>

      {/* Opened Date */}
      <div>
        <label className={labelCls}>Opened Date</label>
        <input
          type="date"
          value={form.opened_date}
          onChange={e => setForm(p => ({ ...p, opened_date: e.target.value }))}
          className={inputCls}
        />
        {errors.opened_date && <p className="mt-1 text-xs text-red-500">{errors.opened_date}</p>}
      </div>

      {/* Status */}
      <div>
        <label className={labelCls}>Status</label>
        <select
          value={form.status}
          onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
          className={inputCls}
        >
          {RECRUITMENT_STATUSES.map(s => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>

      {/* Candidates & Interviews */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Candidates</label>
          <input
            type="number"
            min="0"
            value={form.candidates_count}
            onChange={e => setForm(p => ({ ...p, candidates_count: e.target.value }))}
            placeholder="0"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Interviews</label>
          <input
            type="number"
            min="0"
            value={form.interviews_count}
            onChange={e => setForm(p => ({ ...p, interviews_count: e.target.value }))}
            placeholder="0"
            className={inputCls}
          />
        </div>
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
          {saving ? 'Saving…' : isEdit ? t('common.save') : 'Add Position'}
        </button>
      </div>
    </form>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function Recruitment() {
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
  const [closing,      setClosing]      = useState(null)  // id being marked filled
  const [exporting,    setExporting]    = useState(false)

  const statuses = ['All', 'open', 'filled', 'cancelled']

  const { data: recruitmentRecords, loading, error, refetch } = useApi(fetchRecruitment)
  const { data: departments }                                  = useApi(fetchDepartments)

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!recruitmentRecords) return []
    return recruitmentRecords.filter(r => {
      const q = search.toLowerCase()
      const matchSearch =
        r.title.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q)
      const matchStatus = filterStatus === 'All' || r.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [recruitmentRecords, search, filterStatus])

  const stats = useMemo(() => {
    const all = recruitmentRecords ?? []
    return {
      open:       all.filter(r => r.status === 'open').length,
      filled:     all.filter(r => r.status === 'filled').length,
      candidates: all.reduce((s, r) => s + r.candidates, 0),
      interviews: all.reduce((s, r) => s + r.interviews, 0),
    }
  }, [recruitmentRecords])

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openAdd = useCallback(() => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((row) => {
    setEditItem(row)
    setForm(recruitToForm(row))
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
          { header: 'Position',    key: 'title',       width: 28 },
          { header: 'Department',  key: 'department',  width: 18 },
          { header: 'Opened Date', key: 'openedDate',  width: 14, format: fmtDate },
          { header: 'Status',      key: 'status',      width: 12, format: fmtLabel },
          { header: 'Candidates',  key: 'candidates',  width: 12 },
          { header: 'Interviews',  key: 'interviews',  width: 12 },
        ],
        `HR_Metrika_Recruitment_${new Date().toISOString().slice(0, 10)}`,
        'Recruitment',
      )
      showToast('Recruitment data exported to Excel.')
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
        department_id:    Number(form.department_id),
        job_title:        form.job_title.trim(),
        opened_date:      form.opened_date,
        status:           form.status,
        candidates_count: form.candidates_count !== '' ? Number(form.candidates_count) : undefined,
        interviews_count: form.interviews_count !== '' ? Number(form.interviews_count) : undefined,
      }
      if (editItem) {
        await updateRecruitment(editItem.id, body)
        showToast('Position updated successfully.')
      } else {
        await createRecruitment(body)
        showToast('Position added successfully.')
      }
      closeModal()
      refetch()
    } catch (err) {
      showToast(err?.message ?? 'Failed to save position.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Close (mark filled) ────────────────────────────────────────────────────
  const handleClose = async (id) => {
    setClosing(id)
    try {
      await updateRecruitment(id, { status: 'FILLED' })
      showToast('Position marked as filled.')
      refetch()
    } catch (err) {
      showToast(err?.message ?? 'Failed to update status.', 'error')
    } finally {
      setClosing(null)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await deleteRecruitment(id)
      showToast('Position deleted.')
      setConfirmId(null)
      refetch()
    } catch (err) {
      showToast(err?.message ?? 'Failed to delete position.', 'error')
    } finally {
      setDeleting(null)
    }
  }

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'title',
      label: t('table.position') || 'Position',
      render: (val, row) => (
        <div>
          <p className="font-semibold text-slate-800 text-sm">{val}</p>
          <p className="text-xs text-slate-400 mt-0.5">{row.department}</p>
        </div>
      ),
    },
    {
      key: 'openedDate',
      label: t('table.opened') || 'Opened',
      render: (val) => (
        <div className="flex items-center gap-1.5 text-slate-500 text-sm">
          <Calendar size={13} />
          {formatDate(val)}
        </div>
      ),
    },
    {
      key: 'candidates',
      label: t('table.candidates') || 'Candidates',
      render: (val) => (
        <div className="flex items-center gap-1.5">
          <Users size={13} className="text-brand-400" />
          <span className="font-semibold text-slate-700">{val}</span>
        </div>
      ),
    },
    {
      key: 'interviews',
      label: t('table.interviews') || 'Interviews',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">{val}</span>
          <span className="text-xs text-slate-400">
            ({row.candidates > 0 ? ((val / row.candidates) * 100).toFixed(0) : 0}% of apps)
          </span>
        </div>
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
            <button
              onClick={() => openEdit(row)}
              className="text-xs text-brand-500 hover:text-brand-700 font-medium"
            >
              {t('common.edit')}
            </button>
            {row.status === 'open' && (
              <>
                <span className="text-slate-200">|</span>
                <button
                  onClick={() => handleClose(id)}
                  disabled={closing === id}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-60"
                >
                  {closing === id ? 'Updating…' : 'Mark Filled'}
                </button>
              </>
            )}
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
        <PageHeader title={t('admin.recruitmentTitle')} subtitle={t('admin.recruitmentSubtitle')} />
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
        title={t('admin.recruitmentTitle')}
        subtitle={t('admin.recruitmentSubtitle')}
        action={isAdmin ? (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-600 hover:to-violet-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-500/20 transition-all duration-200"
          >
            <Plus size={16} />
            {t('admin.addPosition')}
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
          { label: t('admin.openPositions')   || 'Open Positions',     value: loading ? '—' : stats.open,       color: '#6366f1' },
          { label: t('admin.filledPositions') || 'Filled This Period', value: loading ? '—' : stats.filled,     color: '#10b981' },
          { label: t('admin.totalCandidates') || 'Total Candidates',   value: loading ? '—' : stats.candidates, color: '#f59e0b' },
          { label: t('admin.totalInterviews') || 'Total Interviews',   value: loading ? '—' : stats.interviews, color: '#8b5cf6' },
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
              {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
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
        title={editItem ? 'Edit Position' : 'Add Open Position'}
        size="md"
      >
        <RecruitmentForm
          form={form}
          setForm={setForm}
          errors={errors}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={closeModal}
          isEdit={!!editItem}
          departments={departments}
          t={t}
        />
      </Modal>
    </div>
  )
}
