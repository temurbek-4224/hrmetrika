/**
 * Global Express error handler.
 * Catches any error passed to next(err) and returns a clean JSON response.
 */
function errorHandler(err, req, res, _next) {
  // Log in development only
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${req.method}] ${req.path}`, err)
  }

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflict — a record with this value already exists.',
      field: err.meta?.target,
    })
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' })
  }

  // JWT errors (should be caught in middleware, but kept as fallback)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.' })
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired.' })
  }

  // Generic fallback
  const status  = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  res.status(status).json({ error: message })
}

module.exports = errorHandler
