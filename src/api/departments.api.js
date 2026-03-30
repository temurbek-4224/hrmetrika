import api from './client'

/**
 * Maps a backend Department record to the shape the UI components expect.
 *
 * Backend fields:  id, name, headcount, active_count, avg_salary
 * Frontend fields: id, name, headCount, avgSalary, manager (not in backend → '—')
 */
export function mapDepartment(d) {
  return {
    id:         d.id,
    name:       d.name,
    headCount:  d.active_count ?? d.headcount ?? 0,
    avgSalary:  Number(d.avg_salary) || 0,
    manager:    '—',
    created_at: d.created_at,
  }
}

// ─── READ ──────────────────────────────────────────────────────────────────────

/** GET /api/departments */
export async function getDepartments() {
  const data = await api.get('/departments')
  return data.map(mapDepartment)
}

/** GET /api/departments/:id */
export async function getDepartment(id) {
  const data = await api.get(`/departments/${id}`)
  return mapDepartment(data)
}

// ─── MUTATIONS ─────────────────────────────────────────────────────────────────

/** POST /api/departments  body: { name } */
export async function createDepartment(body) {
  const data = await api.post('/departments', body)
  return mapDepartment(data)
}

/** PUT /api/departments/:id  body: { name } */
export async function updateDepartment(id, body) {
  const data = await api.put(`/departments/${id}`, body)
  return mapDepartment(data)
}

/** DELETE /api/departments/:id  Returns 204. */
export async function deleteDepartment(id) {
  return api.delete(`/departments/${id}`)
}
