const prisma = require('../lib/prisma')

async function getAll({ status, departmentId } = {}) {
  return prisma.recruitmentRecord.findMany({
    where: {
      ...(status       && { status }),
      ...(departmentId && { department_id: departmentId }),
    },
    include: { department: { select: { id: true, name: true } } },
    orderBy: { opened_date: 'desc' },
  })
}

async function getById(id) {
  return prisma.recruitmentRecord.findUnique({
    where:   { id },
    include: { department: true },
  })
}

async function create(data) {
  return prisma.recruitmentRecord.create({
    data: {
      department_id:    Number(data.department_id),
      job_title:        data.job_title,
      opened_date:      new Date(data.opened_date),
      status:           data.status           || 'OPEN',
      candidates_count: data.candidates_count ? Number(data.candidates_count) : 0,
      interviews_count: data.interviews_count ? Number(data.interviews_count) : 0,
      offer_date:       data.offer_date       ? new Date(data.offer_date)     : null,
      offer_accepted:   data.offer_accepted   ?? null,
      hire_date:        data.hire_date        ? new Date(data.hire_date)      : null,
    },
    include: { department: { select: { id: true, name: true } } },
  })
}

async function update(id, data) {
  return prisma.recruitmentRecord.update({
    where: { id },
    data: {
      ...(data.department_id    && { department_id:    Number(data.department_id)    }),
      ...(data.job_title        && { job_title:        data.job_title               }),
      ...(data.status           && { status:           data.status                  }),
      ...(data.candidates_count !== undefined && { candidates_count: Number(data.candidates_count) }),
      ...(data.interviews_count !== undefined && { interviews_count: Number(data.interviews_count) }),
      ...(data.offer_date       && { offer_date:       new Date(data.offer_date)    }),
      ...(data.offer_accepted   !== undefined && { offer_accepted: data.offer_accepted }),
      ...(data.hire_date        && { hire_date:        new Date(data.hire_date)     }),
    },
    include: { department: { select: { id: true, name: true } } },
  })
}

async function remove(id) {
  return prisma.recruitmentRecord.delete({ where: { id } })
}

module.exports = { getAll, getById, create, update, remove }
