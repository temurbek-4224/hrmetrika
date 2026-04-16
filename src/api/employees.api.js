import api from './client'

/**
 * Maps a backend Employee record to the shape the UI components expect.
 *
 * Backend fields:  id, first_name, last_name, email, department{name},
 *                  job_title, employment_type, status, salary, hire_date
 * Frontend fields: id, name, email, department, position, salary, startDate,
 *                  status (lowercase), raw_status (backend enum), employment_type
 */
export function mapEmployee(e) {
  const statusMap = {
    ACTIVE:     'active',
    ON_LEAVE:   'on_leave',
    TERMINATED: 'terminated',
  }

  return {
    id:              e.id,
    name:            `${e.first_name} ${e.last_name}`,
    first_name:      e.first_name,
    last_name:       e.last_name,
    email:           e.email,
    department:      e.department?.name ?? '—',
    department_id:   e.department_id,
    position:        e.job_title,
    employment_type: e.employment_type,
    salary:          Number(e.salary),
    startDate:       e.hire_date,
    status:          statusMap[e.status] ?? 'active',
    raw_status:      e.status,                        // 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED'
    termination_date: e.termination_date,
  }
}

// ─── READ ──────────────────────────────────────────────────────────────────────

/** GET /api/employees  Accepts optional filters: { department_id, status, search } */
export async function getEmployees(filters = {}) {
  const params = new URLSearchParams()
  if (filters.department_id) params.set('department_id', filters.department_id)
  if (filters.status)        params.set('status', filters.status)
  if (filters.search)        params.set('search', filters.search)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const data = await api.get(`/employees${qs}`)
  return data.map(mapEmployee)
}

/** GET /api/employees/:id */
export async function getEmployee(id) {
  const data = await api.get(`/employees/${id}`)
  return mapEmployee(data)
}

// ─── MUTATIONS ─────────────────────────────────────────────────────────────────

/**
 * POST /api/employees
 * body: { first_name, last_name, email, department_id, job_title,
 *         employment_type, status, salary, hire_date }
 */
export async function createEmployee(body) {
  const data = await api.post('/employees', body)
  return mapEmployee(data)
}

/**
 * PUT /api/employees/:id
 * body: same fields as create (all optional)
 */
export async function updateEmployee(id, body) {
  const data = await api.put(`/employees/${id}`, body)
  return mapEmployee(data)
}

/**
 * DELETE /api/employees/:id
 * Hard-delete — permanently removes the employee and their absence records.
 * Returns 204 No Content.
 */
export async function deleteEmployee(id) {
  return api.delete(`/employees/${id}`)
}
