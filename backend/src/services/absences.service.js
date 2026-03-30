const prisma = require('../lib/prisma')

async function getAll({ employeeId, approved } = {}) {
  return prisma.absence.findMany({
    where: {
      ...(employeeId !== undefined && { employee_id: employeeId }),
      ...(approved  !== undefined && { approved }),
    },
    include: {
      employee: {
        select: { id: true, first_name: true, last_name: true, department: { select: { name: true } } },
      },
    },
    orderBy: { start_date: 'desc' },
  })
}

async function getById(id) {
  return prisma.absence.findUnique({
    where:   { id },
    include: { employee: { include: { department: { select: { name: true } } } } },
  })
}

async function create(data) {
  return prisma.absence.create({
    data: {
      employee_id: Number(data.employee_id),
      type:        data.type,
      start_date:  new Date(data.start_date),
      end_date:    new Date(data.end_date),
      days:        Number(data.days),
      approved:    data.approved ?? false,
    },
    include: { employee: { select: { id: true, first_name: true, last_name: true } } },
  })
}

async function update(id, data) {
  return prisma.absence.update({
    where: { id },
    data: {
      ...(data.type       && { type:       data.type }),
      ...(data.start_date && { start_date: new Date(data.start_date) }),
      ...(data.end_date   && { end_date:   new Date(data.end_date)   }),
      ...(data.days       !== undefined && { days: Number(data.days) }),
      ...(data.approved   !== undefined && { approved: data.approved }),
    },
  })
}

async function setApproval(id, approved) {
  return prisma.absence.update({ where: { id }, data: { approved } })
}

async function remove(id) {
  return prisma.absence.delete({ where: { id } })
}

module.exports = { getAll, getById, create, update, setApproval, remove }
