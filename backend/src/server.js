require('dotenv').config()

const app    = require('./app')
const prisma = require('./lib/prisma')

const PORT = process.env.PORT || 5000

async function main() {
  // Verify database connection on startup
  await prisma.$connect()
  console.log('✅ Database connected')

  app.listen(PORT, () => {
    console.log(`🚀 HR Metrika API running on http://localhost:${PORT}`)
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`)
    console.log(`   Health check: http://localhost:${PORT}/api/health`)
  })
}

main().catch((err) => {
  console.error('❌ Failed to start server:', err)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGINT',  async () => { await prisma.$disconnect(); process.exit(0) })
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0) })
