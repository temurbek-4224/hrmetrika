const employeesService = require('../services/employees.service')

async function getAll(req, res, next) {
  try {
    // Supported query params: ?department=Engineering&status=ACTIVE&search=john
    const filters = {
      departmentId: req.query.department_id ? Number(req.query.department_id) : undefined,
      status:       req.query.status,
      search:       req.query.search,
    }
    const data = await employeesService.getAll(filters)
    res.json(data)
  } catch (err) { next(err) }
}

async function getById(req, res, next) {
  try {
    const data = await employeesService.getById(Number(req.params.id))
    if (!data) return res.status(404).json({ error: 'Employee not found.' })
    res.json(data)
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const data = await employeesService.create(req.body)
    res.status(201).json(data)
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    const data = await employeesService.update(Number(req.params.id), req.body)
    res.json(data)
  } catch (err) { next(err) }
}

async function remove(req, res, next) {
  try {
    await employeesService.remove(Number(req.params.id))
    res.status(204).send()
  } catch (err) { next(err) }
}

module.exports = { getAll, getById, create, update, remove }
