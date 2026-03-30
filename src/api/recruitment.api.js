import api from './client'

export const RECRUITMENT_STATUSES = ['OPEN', 'FILLED', 'CANCELLED']

/**
 * Maps a backend RecruitmentRecord to the shape the UI components expect.
 */
export function mapRecruitment(r) {
  return {
    id:             r.id,
    title:          r.job_title,
    department:     r.department?.name ?? '—',
    department_id:  r.department_id,
    openedDate:     r.opened_date,
    offerDate:      r.offer_date,
    hireDate:       r.hire_date,
    candidates:     r.candidates_count ?? 0,
    interviews:     r.interviews_count ?? 0,
    offer_accepted: r.offer_accepted,
    status:         (r.status ?? 'OPEN').toLowerCase(),
    raw_status:     r.status ?? 'OPEN',
  }
}

// ─── READ ──────────────────────────────────────────────────────────────────────

/** GET /api/recruitment  Optional filters: { status, department_id } */
export async function getRecruitment(filters = {}) {
  const params = new URLSearchParams()
  if (filters.status)        params.set('status',        filters.status)
  if (filters.department_id) params.set('department_id', filters.department_id)
  const qs   = params.toString() ? `?${params.toString()}` : ''
  const data = await api.get(`/recruitment${qs}`)
  return data.map(mapRecruitment)
}

// ─── MUTATIONS ─────────────────────────────────────────────────────────────────

/**
 * POST /api/recruitment
 * body: { department_id, job_title, opened_date, status?,
 *         candidates_count?, interviews_count? }
 */
export async function createRecruitment(body) {
  const data = await api.post('/recruitment', body)
  return mapRecruitment(data)
}

/** PUT /api/recruitment/:id  body: partial fields */
export async function updateRecruitment(id, body) {
  const data = await api.put(`/recruitment/${id}`, body)
  return mapRecruitment(data)
}

/** DELETE /api/recruitment/:id  Returns 204. */
export async function deleteRecruitment(id) {
  return api.delete(`/recruitment/${id}`)
}
