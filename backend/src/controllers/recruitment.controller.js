const recruitmentService = require('../services/recruitment.service')

async function getAll(req, res, next) {
  try {
    const filters = {
      status:       req.query.status,
      departmentId: req.query.department_id ? Number(req.query.department_id) : undefined,
    }
    const data = await recruitmentService.getAll(filters)
    res.json(data)
  } catch (err) { next(err) }
}

async function getById(req, res, next) {
  try {
    const data = await recruitmentService.getById(Number(req.params.id))
    if (!data) return res.status(404).json({ error: 'Recruitment record not found.' })
    res.json(data)
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const data = await recruitmentService.create(req.body)
    res.status(201).json(data)
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    const data = await recruitmentService.update(Number(req.params.id), req.body)
    res.json(data)
  } catch (err) { next(err) }
}

async function remove(req, res, next) {
  try {
    await recruitmentService.remove(Number(req.params.id))
    res.status(204).send()
  } catch (err) { next(err) }
}

module.exports = { getAll, getById, create, update, remove }
