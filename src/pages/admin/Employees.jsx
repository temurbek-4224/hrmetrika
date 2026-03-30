import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Download, Filter, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { downloadExcel, fmtDate, fmtLabel } from '@/utils/exportExcel'
import { motion } from 'framer-motion'
import PageHeader   from '@/components/shared/PageHeader'
import TableWrapper from '@/components/shared/TableWrapper'
import StatusBadge  from '@/components/shared/StatusBadge'
import Modal        from '@/components/shared/Modal'
import Toast        from '@/components/shared/Toast'
import { useApi }          from '@/hooks/useApi'
import { useToast }        from '@/hooks/useToast'
import { useRole }         from '@/hooks/useRole'
import {
  getEmployees, createEmployee, updateEmployee, deleteEmployee,
} from '@/api/employees.api'
import { getDepartments } from '@/api/departments.api'
import { formatCurrency } from '@/utils/formatters'

// ─── Styling constants ───────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-colors'
const labelCls = 'block text-xs font-semibold text-slate-500 mb-1.5'

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT']
const STATUSES         = ['ACTIVE', 'ON_LEAVE', 'TERMINATED']

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', department_id: '',
  job_title: '', employment_type: 'FULL_TIME', status: 'ACTIVE',
  salary: '', hire_date: '',
}

function employeeToForm(row) {
  return {
    first_name:      row.first_name ?? '',
    last_name:       row.last_name  ?? '',
    email:           row.email       ?? '',
    department_id:   String(row.department_id ?? ''),
    job_title:       row.position    ?? '',
    employment_type: row.employment_type ?? 'FULL_TIME',
    status:          row.raw_status  ?? 'ACTIVE',
    salary:          String(row.salary ?? ''),
    hire_date:       row.startDate ? new Date(row.startDate).toISOString().slice(0, 10) : '',
  }
}

function validate(form) {
  const e = {}
  if (!form.first_name.trim())  e.first_name  = 'Required'
  if (!form.last_name.trim())   e.last_name   = 'Required'
  if (!form.email.trim())       e.email       = 'Required'
  if (!form.department_id)      e.department_id = 'Required'
  if (!form.job_title.trim())   e.job_title   = 'Required'
  if (!form.salary || Number(form.salary) <= 0) e.salary = 'Enter a valid salary'
  if (!form.hire_date)          e.hire_date   = 'Required'
  return e
}

// ─── Employee Form ───────────────────────────────────────────────────────────
function EmployeeForm({ form, setForm, errors, departments, saving, onSubmit, onCancel, isEdit }) {
  const { t } = useTranslation()
  const field = (key, label, type = 'text', extra = {}) => (
    <div>
      <label className={labelCls}>{label}{extra.required !== false && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className={`${inputCls} ${errors[key] ? 'border-red-300 ring-1 ring-red-200' : ''}`}
        {...extra}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  )

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('first_name', 'First Name')}
        {field('last_name',  'Last Name')}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('email',     'Email',     'email')}
        {field('job_title', 'Job Title')}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Department <span className="text-red-400">*</span></label>
          <select
            value={form.department_id}
            onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}
            className={`${inputCls} ${errors.department_id ? 'border-red-300' : ''}`}
          >
            <option value="">Select department…</option>
            {(departments ?? []).map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {errors.department_id && <p className="text-xs text-red-500 mt-1">{errors.department_id}</p>}
        </div>
        <div>
          <label className={labelCls}>Employment Type</label>
          <select
            value={form.employment_type}
            onChange={e => setForm(f => ({ ...f, employment_type: e.target.value }))}
            className={inputCls}
          >
            {EMPLOYMENT_TYPES.map(t => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('salary',    'Monthly Salary (USD)', 'number', { min: 0, step: '0.01' })}
        {field('hire_date', 'Hire Date',            'date')}
      </div>
      {isEdit && (
        <div>
          <label className={labelCls}>Status</label>
          <select
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className={inputCls}
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-brand-500/20 hover:from-brand-600 hover:to-violet-600 disabled:opacity-60 transition-all"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving…' : t('common.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function Employees() {
  const { t } = useTranslation()
  const { toast, showToast } = useToast()
  const { isAdmin } = useRole()

  const [search,     setSearch]     = useState('')
  const [filterDept, setFilterDept] = useState('All')

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: employees, loading, error, refetch } = useApi(getEmployees)
  const { data: departments } = useApi(getDepartments)

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem,  setEditItem]  = useState(null)   // null = add, row = edit
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [errors,    setErrors]    = useState({})
  const [saving,    setSaving]    = useState(false)

  // ── Delete confirm state ──────────────────────────────────────────────────
  const [confirmId,  setConfirmId]  = useState(null)
  const [deleting,   setDeleting]   = useState(null)
  const [exporting,  setExporting]  = useState(false)

  // ── Derived data ──────────────────────────────────────────────────────────
  const deptList = useMemo(() => {
    if (!employees) return ['All']
    return ['All', ...new Set(employees.map(e => e.department))]
  }, [employees])

  const filtered = useMemo(() => {
    if (!employees) return []
    return employees.filter(e => {
      const q = search.toLowerCase()
      const matchSearch =
        e.name.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
      return matchSearch && (filterDept === 'All' || e.department === filterDept)
    })
  }, [employees, search, filterDept])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditItem(row)
    setForm(employeeToForm(row))
    setErrors({})
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditItem(null)
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        salary:        parseFloat(form.salary),
        department_id: parseInt(form.department_id, 10),
      }
      if (editItem) {
        await updateEmployee(editItem.id, payload)
        showToast('Employee updated successfully')
      } else {
        await createEmployee(payload)
        showToast('Employee added successfully')
      }
      closeModal()
      refetch()
    } catch (err) {
      showToast(err?.message ?? 'Operation failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = () => {
    if (!filtered.length) return
    setExporting(true)
    try {
      downloadExcel(
        filtered,
        [
          { header: 'Full Name',             key: 'name',            width: 26 },
          { header: 'Email',                 key: 'email',           width: 32 },
          { header: 'Department',            key: 'department',      width: 18 },
          { header: 'Position',              key: 'position',        width: 26 },
          { header: 'Employment Type',       key: 'employment_type', width: 18, format: fmtLabel },
          { header: 'Monthly Salary (USD)',  key: 'salary',          width: 20 },
          { header: 'Start Date',            key: 'startDate',       width: 14, format: fmtDate },
          { header: 'Status',                key: 'status',          width: 12, format: fmtLabel },
        ],
        `HR_Metrika_Employees_${new Date().toISOString().slice(0, 10)}`,
        'Employees',
      )
      showToast('Employees exported to Excel.')
    } catch (err) {
      showToast(err?.message ?? 'Export failed.', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await deleteEmployee(id)
      showToast('Employee terminated')
      setConfirmId(null)
      refetch()
    } catch (err) {
      showToast(err?.message ?? 'Delete failed', 'error')
    } finally {
      setDeleting(null)
    }
  }

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'name',
      label: t('table.name'),
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(row.first_name?.[0] ?? '') + (row.last_name?.[0] ?? '')}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{val}</p>
            <p className="text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'department', label: t('table.department') },
    { key: 'position',   label: t('table.position') },
    {
      key: 'salary',
      label: t('table.salary'),
      render: (val) => <span className="font-semibold text-slate-700">{formatCurrency(val)}</span>,
    },
    {
      key: 'startDate',
      label: t('table.startDate'),
      render: (val) => (
        <span className="text-slate-500 text-xs">
          {new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
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
        if (!isAdmin) {
          return <span className="text-xs text-slate-400">View only</span>
        }
        return confirmId === id ? (
          <span className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Terminate?</span>
            <button
              onClick={() => handleDelete(id)}
              disabled={deleting === id}
              className="text-red-600 font-bold hover:text-red-700"
            >
              {deleting === id ? <Loader2 size={12} className="animate-spin inline" /> : 'Yes'}
            </button>
            <span className="text-slate-300">/</span>
            <button onClick={() => setConfirmId(null)} className="text-slate-500 hover:text-slate-700">No</button>
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEdit(row)}
              className="text-xs text-brand-500 hover:text-brand-700 font-medium"
            >
              {t('common.edit')}
            </button>
            {row.status !== 'terminated' && (
              <>
                <span className="text-slate-200">|</span>
                <button
                  onClick={() => setConfirmId(id)}
                  className="text-xs text-red-400 hover:text-red-600 font-medium"
                >
                  {t('common.delete')}
                </button>
              </>
            )}
          </div>
        )
      },
    },
  ]

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('admin.employeesTitle')} subtitle={t('admin.employeesSubtitle')} />
        <div className="card-base p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle size={22} className="text-red-400" />
          </div>
          <p className="text-sm text-slate-500">{error}</p>
          <button onClick={refetch} className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-700 font-medium">
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
        title={t('admin.employeesTitle')}
        subtitle={t('admin.employeesSubtitle')}
        action={isAdmin ? (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-600 hover:to-violet-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-500/20 transition-all duration-200"
          >
            <Plus size={16} />
            {t('admin.addEmployee')}
          </button>
        ) : null}
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
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
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <div className="flex flex-wrap gap-1.5">
            {deptList.map(dept => (
              <button
                key={dept}
                onClick={() => setFilterDept(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterDept === dept
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || !filtered?.length}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white shadow-card ml-auto disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {exporting ? 'Exporting…' : t('common.export')}
        </button>
      </motion.div>

      {/* Stats row */}
      {!loading && employees && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-4 text-sm text-slate-500"
        >
          <span>{t('table.showing', { from: 1, to: filtered.length, total: filtered.length })}</span>
          <span className="w-px h-4 bg-slate-200" />
          <span className="text-emerald-600 font-medium">
            {filtered.filter(e => e.status === 'active').length} {t('status.active')}
          </span>
          <span className="text-amber-600 font-medium">
            {filtered.filter(e => e.status === 'on_leave').length} {t('status.onLeave')}
          </span>
        </motion.div>
      )}

      <TableWrapper columns={columns} data={filtered} loading={loading} />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'Edit Employee' : 'Add New Employee'}
        size="lg"
      >
        <EmployeeForm
          form={form}
          setForm={setForm}
          errors={errors}
          departments={departments}
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isEdit={!!editItem}
        />
      </Modal>
    </div>
  )
}
