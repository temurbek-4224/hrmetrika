const departmentsService = require('../services/departments.service')

async function getAll(req, res, next) {
  try {
    const data = await departmentsService.getAll()
    res.json(data)
  } catch (err) { next(err) }
}

async function getById(req, res, next) {
  try {
    const data = await departmentsService.getById(Number(req.params.id))
    if (!data) return res.status(404).json({ error: 'Department not found.' })
    res.json(data)
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const data = await departmentsService.create(req.body)
    res.status(201).json(data)
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    const data = await departmentsService.update(Number(req.params.id), req.body)
    res.json(data)
  } catch (err) { next(err) }
}

async function remove(req, res, next) {
  try {
    await departmentsService.remove(Number(req.params.id))
    res.status(204).send()
  } catch (err) { next(err) }
}

module.exports = { getAll, getById, create, update, remove }
