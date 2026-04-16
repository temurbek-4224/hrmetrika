/**
 * HR Metrika — One-shot salary update script
 *
 * Assigns every employee a random salary between 8,000,000 and 13,000,000 UZS.
 *
 * Run:  node backend/prisma/update-salaries.js
 *   (from the project root, with backend/.env loaded via dotenv)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const MIN_SALARY = 8_000_000
const MAX_SALARY = 13_000_000

function randSalary() {
  return Math.floor(Math.random() * (MAX_SALARY - MIN_SALARY + 1)) + MIN_SALARY
}

async function main() {
  console.log('💰 Updating all employee salaries to UZS range...')
  console.log(`   Range: ${MIN_SALARY.toLocaleString()} – ${MAX_SALARY.toLocaleString()} so'm\n`)

  const employees = await prisma.employee.findMany({ select: { id: true } })
  console.log(`   Found ${employees.length} employees\n`)

  let updated = 0
  for (const emp of employees) {
    const salary = randSalary()
    await prisma.employee.update({
      where: { id: emp.id },
      data:  { salary },
    })
    updated++
    if (updated % 20 === 0) {
      console.log(`   ✓ ${updated} / ${employees.length} updated…`)
    }
  }

  const agg = await prisma.employee.aggregate({ _avg: { salary: true }, _min: { salary: true }, _max: { salary: true } })
  console.log('\n═══════════════════════════════════════════════')
  console.log('✅  Salary update complete:')
  console.log(`   Total employees updated : ${updated}`)
  console.log(`   Min salary              : ${Number(agg._min.salary).toLocaleString('ru-RU')} so'm`)
  console.log(`   Max salary              : ${Number(agg._max.salary).toLocaleString('ru-RU')} so'm`)
  console.log(`   Avg salary              : ${Math.round(Number(agg._avg.salary)).toLocaleString('ru-RU')} so'm`)
  console.log('═══════════════════════════════════════════════')
}

main()
  .catch((err) => {
    console.error('\n❌ Update failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
