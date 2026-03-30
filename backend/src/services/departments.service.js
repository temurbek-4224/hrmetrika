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
  return prisma.department.delete({ where: { id } })
}

module.exports = { getAll, getById, create, update, remove }
