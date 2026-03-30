/**
 * HR Metrika — Update / upsert demo user accounts
 *
 * Sets:
 *   ferangiz@hrmetrika.uz  →  ADMIN   password: ferangiz2025
 *   temur@hrmetrika.uz     →  ANALYST password: temur2025
 *
 * Run with:
 *   node backend/prisma/update-users.js
 *   (from project root, or cd backend && node prisma/update-users.js)
 */

require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const bcrypt           = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Updating demo users...\n')

  const [ferangizHash, temurHash] = await Promise.all([
    bcrypt.hash('ferangiz2025', 12),
    bcrypt.hash('temur2025',    12),
  ])

  // Upsert ferangiz → ADMIN
  const ferangiz = await prisma.user.upsert({
    where:  { email: 'ferangiz@hrmetrika.uz' },
    update: { name: 'Ferangiz Tolibova', role: 'ADMIN', password_hash: ferangizHash },
    create: { name: 'Ferangiz Tolibova', email: 'ferangiz@hrmetrika.uz', role: 'ADMIN', password_hash: ferangizHash },
  })

  // Upsert temur → ANALYST
  const temur = await prisma.user.upsert({
    where:  { email: 'temur@hrmetrika.uz' },
    update: { name: 'Temur Yusupov', role: 'ANALYST', password_hash: temurHash },
    create: { name: 'Temur Yusupov', email: 'temur@hrmetrika.uz', role: 'ANALYST', password_hash: temurHash },
  })

  console.log('✅  Users updated in database:\n')
  console.log(`   ${ferangiz.email.padEnd(30)} role: ${ferangiz.role}`)
  console.log(`   ${temur.email.padEnd(30)} role: ${temur.role}`)
  console.log('\n🔑 Login credentials:')
  console.log('   ┌─────────────────────────────────────────────────────┐')
  console.log('   │  ADMIN    ferangiz@hrmetrika.uz  /  ferangiz2025    │')
  console.log('   │  ANALYST  temur@hrmetrika.uz     /  temur2025       │')
  console.log('   └─────────────────────────────────────────────────────┘')
}

main()
  .catch((err) => {
    console.error('\n❌ Failed:', err.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
