const prisma = require('../lib/prisma')

async function getAll({ departmentId, status, search } = {}) {
  return prisma.employee.findMany({
    where: {
      ...(departmentId && { department_id: departmentId }),
      ...(status       && { status }),
      ...(search && {
        OR: [
          { first_name: { contains: search, mode: 'insensitive' } },
          { last_name:  { contains: search, mode: 'insensitive' } },
          { email:      { contains: search, mode: 'insensitive' } },
          { job_title:  { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    include: { department: { select: { id: true, name: true } } },
    orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
  })
}

async function getById(id) {
  return prisma.employee.findUnique({
    where:   { id },
    include: { department: true, absences: { orderBy: { start_date: 'desc' } } },
  })
}

async function create(data) {
  return prisma.employee.create({
    data: {
      first_name:      data.first_name,
      last_name:       data.last_name,
      email:           data.email,
      department_id:   Number(data.department_id),
      job_title:       data.job_title,
      employment_type: data.employment_type || 'FULL_TIME',
      status:          data.status          || 'ACTIVE',
      salary:          data.salary,
      hire_date:       new Date(data.hire_date),
      termination_date: data.termination_date ? new Date(data.termination_date) : null,
    },
    include: { department: { select: { id: true, name: true } } },
  })
}

async function update(id, data) {
  return prisma.employee.update({
    where: { id },
    data: {
      ...(data.first_name      && { first_name: data.first_name }),
      ...(data.last_name       && { last_name:  data.last_name  }),
      ...(data.email           && { email:      data.email      }),
      ...(data.department_id   && { department_id: Number(data.department_id) }),
      ...(data.job_title       && { job_title:  data.job_title  }),
      ...(data.employment_type && { employment_type: data.employment_type }),
      ...(data.status          && { status:     data.status     }),
      ...(data.salary          !== undefined && { salary: data.salary }),
      ...(data.hire_date       && { hire_date:  new Date(data.hire_date) }),
      ...(data.termination_date !== undefined && {
        termination_date: data.termination_date ? new Date(data.termination_date) : null,
      }),
    },
    include: { department: { select: { id: true, name: true } } },
  })
}

/** Soft-delete: set status to TERMINATED rather than deleting the row */
async function remove(id) {
  return prisma.employee.update({
    where: { id },
    data:  { status: 'TERMINATED', termination_date: new Date() },
  })
}

module.exports = { getAll, getById, create, update, remove }
