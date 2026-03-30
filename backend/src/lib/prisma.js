const { PrismaClient } = require('@prisma/client')

// Singleton pattern — reuse one PrismaClient instance across the app.
// Avoids "too many connections" in development with hot-reload.
const prisma = global.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma
}

module.exports = prisma
