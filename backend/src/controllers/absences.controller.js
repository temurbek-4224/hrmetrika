const absencesService = require('../services/absences.service')

async function getAll(req, res, next) {
  try {
    const filters = {
      employeeId: req.query.employee_id ? Number(req.query.employee_id) : undefined,
      approved:   req.query.approved !== undefined ? req.query.approved === 'true' : undefined,
    }
    const data = await absencesService.getAll(filters)
    res.json(data)
  } catch (err) { next(err) }
}

async function getById(req, res, next) {
  try {
    const data = await absencesService.getById(Number(req.params.id))
    if (!data) return res.status(404).json({ error: 'Absence record not found.' })
    res.json(data)
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const data = await absencesService.create(req.body)
    res.status(201).json(data)
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    const data = await absencesService.update(Number(req.params.id), req.body)
    res.json(data)
  } catch (err) { next(err) }
}

async function approve(req, res, next) {
  try {
    const data = await absencesService.setApproval(Number(req.params.id), true)
    res.json(data)
  } catch (err) { next(err) }
}

async function reject(req, res, next) {
  try {
    const data = await absencesService.setApproval(Number(req.params.id), false)
    res.json(data)
  } catch (err) { next(err) }
}

async function remove(req, res, next) {
  try {
    await absencesService.remove(Number(req.params.id))
    res.status(204).send()
  } catch (err) { next(err) }
}

module.exports = { getAll, getById, create, update, approve, reject, remove }
