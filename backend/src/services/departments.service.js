const prisma = require('../lib/prisma')

async function getAll() {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { employees: true } },
      employees: {
        where:  { status: 'ACTIVE' },
        select: { salary: true },
      },
    },
  })

  // Augment each department with computed summary fields
  return departments.map((dept) => {
    const salaries   = dept.employees.map((e) => Number(e.salary))
    const avgSalary  = salaries.length
      ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
      : 0

    return {
      id:           dept.id,
      name:         dept.name,
      headcount:    dept._count.employees,
      active_count: dept.employees.length,
      avg_salary:   avgSalary,
      created_at:   dept.created_at,
      updated_at:   dept.updated_at,
    }
  })
}

async function getById(id) {
  return prisma.department.findUnique({
    where:   { id },
    include: {
      _count:    { select: { employees: true } },
      employees: { orderBy: [{ last_name: 'asc' }] },
    },
  })
}

async function create({ name }) {
  return prisma.department.create({ data: { name } })
}

async function update(id, { name }) {
  return prisma.department.update({ where: { id }, data: { name } })
}

async function remove(id) {
  // ── 1. Block if any employees are still linked (any status) ────────────────
  // Terminated employees still hold a FK reference and will block the delete
  // just as much as active ones.
  const linkedEmployees = await prisma.employee.count({
    where: { department_id: id },
  })

  if (linkedEmployees > 0) {
    const noun = linkedEmployees === 1 ? 'employee' : 'employees'
    const err  = new Error(
      `Cannot delete this department — ${linkedEmployees} ${noun} still linked ` +
      `(including terminated records). Reassign or permanently delete them first.`
    )
    err.status = 409
    throw err
  }

  // ── 2. Cascade-delete recruitment records for this department ───────────────
  // RecruitmentRecord.department_id has a non-nullable FK → Department.
  // Recruitment records belong to the department and have no independent
  // existence, so it is safe to remove them automatically.
  await prisma.recruitmentRecord.deleteMany({ where: { department_id: id } })

  // ── 3. Now the department has no FK children — safe to delete ──────────────
  return prisma.department.delete({ where: { id } })
}

module.exports = { getAll, getById, create, update, remove }
