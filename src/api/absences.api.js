import api from './client'

// ─── Type label mapping ────────────────────────────────────────────────────────
// Backend enum → human-readable label used by the UI's absenceTypeColors map

export const TYPE_LABELS = {
  SICK:      'Sick Leave',
  VACATION:  'Annual Leave',
  PERSONAL:  'Personal Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
  UNPAID:    'Unpaid Leave',
  OTHER:     'Other Leave',
}

// Reverse map for form submission
export const LABEL_TO_TYPE = Object.fromEntries(
  Object.entries(TYPE_LABELS).map(([k, v]) => [v, k])
)

// All absence types for select dropdowns
export const ABSENCE_TYPES = Object.keys(TYPE_LABELS)

/**
 * Maps a backend Absence record to the shape the UI components expect.
 */
export function mapAbsence(a) {
  const emp      = a.employee ?? {}
  const fullName = `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.trim() || '—'
  const deptName = emp.department?.name ?? '—'

  return {
    id:          a.id,
    employee_id: a.employee_id,
    employee:    fullName,
    department:  deptName,
    type:        TYPE_LABELS[a.type] ?? a.type,
    rawType:     a.type,
    startDate:   a.start_date,
    endDate:     a.end_date,
    days:        a.days,
    status:      a.approved ? 'approved' : 'pending',
    approved:    a.approved,
  }
}

// ─── READ ──────────────────────────────────────────────────────────────────────

/** GET /api/absences  Optional filters: { employee_id, approved } */
export async function getAbsences(filters = {}) {
  const params = new URLSearchParams()
  if (filters.employee_id !== undefined) params.set('employee_id', filters.employee_id)
  if (filters.approved    !== undefined) params.set('approved',    filters.approved)
  const qs   = params.toString() ? `?${params.toString()}` : ''
  const data = await api.get(`/absences${qs}`)
  return data.map(mapAbsence)
}

// ─── MUTATIONS ─────────────────────────────────────────────────────────────────

/** POST /api/absences  body: { employee_id, type, start_date, end_date, days, approved? } */
export async function createAbsence(body) {
  const data = await api.post('/absences', body)
  return mapAbsence(data)
}

/** PUT /api/absences/:id  body: partial fields */
export async function updateAbsence(id, body) {
  const data = await api.put(`/absences/${id}`, body)
  return mapAbsence(data)
}

/** PATCH /api/absences/:id/approve */
export async function approveAbsence(id) {
  return api.patch(`/absences/${id}/approve`)
}

/** PATCH /api/absences/:id/reject */
export async function rejectAbsence(id) {
  return api.patch(`/absences/${id}/reject`)
}

/** DELETE /api/absences/:id  Returns 204. */
export async function deleteAbsence(id) {
  return api.delete(`/absences/${id}`)
}
