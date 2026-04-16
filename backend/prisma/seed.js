/**
 * HR Metrika — Full Database Seed Script
 *
 * Run with:  npm run db:seed
 * Reset + reseed:  npm run db:reset  (drops & remigrates), then npm run db:seed
 *
 * Safe to rerun: clears all rows in correct FK order before inserting.
 *
 * Produces:
 *   - 2   users       (admin + analyst)
 *   - 8   departments
 *   - 160 employees   (realistic distribution across departments)
 *   - ~480 absences   (linked to active/on-leave employees)
 *   - 68  recruitment records (spanning 24 months)
 *   - 24  financial entries  (Jan 2024 – Dec 2025)
 */

require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const bcrypt           = require('bcryptjs')
const { faker }        = require('@faker-js/faker')

const prisma = new PrismaClient()

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Return a random element from an array */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

/** Return a random integer between min and max (inclusive) */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

/** Return a random float rounded to 2 decimal places */
const randFloat = (min, max) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100

/** Return a Date for the first day of a given month offset (0 = Jan 2024) */
const monthStart = (offsetFromJan2024) => {
  const d = new Date(2024, 0 + offsetFromJan2024, 1)
  return d
}

/** Add calendar days to a date */
const addDays = (date, days) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** Random date between two Date objects */
const randDate = (from, to) =>
  faker.date.between({ from, to })

/** Normalise a date to midnight UTC so @db.Date comparisons are clean */
const toDateOnly = (d) => {
  const nd = new Date(d)
  nd.setUTCHours(0, 0, 0, 0)
  return nd
}

// ─── Department config ─────────────────────────────────────────────────────────

const DEPT_CONFIG = [
  {
    name: 'Engineering',
    count: 40,
    salaryRange: [9_500_000, 13_000_000],
    titles: [
      'Software Engineer', 'Senior Software Engineer', 'Tech Lead',
      'Backend Engineer', 'Frontend Engineer', 'DevOps Engineer',
      'QA Engineer', 'Data Engineer', 'Platform Engineer',
    ],
  },
  {
    name: 'Sales',
    count: 28,
    salaryRange: [8_000_000, 11_000_000],
    titles: [
      'Sales Representative', 'Senior Sales Representative',
      'Account Executive', 'Sales Manager', 'Business Development Manager',
      'Regional Sales Manager', 'Sales Director',
    ],
  },
  {
    name: 'Operations',
    count: 22,
    salaryRange: [8_000_000, 10_500_000],
    titles: [
      'Operations Manager', 'Operations Analyst', 'Project Manager',
      'Process Improvement Specialist', 'Supply Chain Analyst',
      'Operations Coordinator', 'Logistics Manager',
    ],
  },
  {
    name: 'Marketing',
    count: 16,
    salaryRange: [8_000_000, 11_000_000],
    titles: [
      'Marketing Manager', 'Content Specialist', 'SEO Specialist',
      'Digital Marketing Manager', 'Brand Manager',
      'Social Media Manager', 'Marketing Analyst',
    ],
  },
  {
    name: 'Product',
    count: 14,
    salaryRange: [9_000_000, 13_000_000],
    titles: [
      'Product Manager', 'Senior Product Manager', 'Product Owner',
      'Business Analyst', 'Product Director', 'Associate Product Manager',
    ],
  },
  {
    name: 'Design',
    count: 14,
    salaryRange: [8_500_000, 11_500_000],
    titles: [
      'UX Designer', 'UI Designer', 'Product Designer',
      'Graphic Designer', 'UX Researcher', 'Senior UX Designer',
      'Visual Designer',
    ],
  },
  {
    name: 'Finance',
    count: 13,
    salaryRange: [9_000_000, 12_500_000],
    titles: [
      'Financial Analyst', 'Senior Financial Analyst', 'Finance Manager',
      'Accountant', 'Controller', 'FP&A Analyst', 'Treasury Analyst',
    ],
  },
  {
    name: 'HR',
    count: 13,
    salaryRange: [8_000_000, 11_000_000],
    titles: [
      'HR Manager', 'HR Specialist', 'Recruiter', 'Senior Recruiter',
      'HR Business Partner', 'Compensation & Benefits Analyst',
      'HR Coordinator', 'L&D Specialist',
    ],
  },
]
// Total: 40+28+22+16+14+14+13+13 = 160

// ─── Main seed function ────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 HR Metrika — starting seed...\n')

  // ── 1. Clear tables in reverse FK order ──────────────────────────────────────
  console.log('🗑️  Clearing existing data...')
  await prisma.absence.deleteMany({})
  await prisma.recruitmentRecord.deleteMany({})
  await prisma.employee.deleteMany({})
  await prisma.financial.deleteMany({})
  await prisma.department.deleteMany({})
  await prisma.user.deleteMany({})
  console.log('   ✅ All tables cleared\n')

  // ── 2. Users ─────────────────────────────────────────────────────────────────
  console.log('👤 Seeding users...')
  const [ferangizHash, temurHash] = await Promise.all([
    bcrypt.hash('ferangiz2025', 12),
    bcrypt.hash('temur2025',    12),
  ])

  await prisma.user.createMany({
    data: [
      {
        name:          'Ferangiz Tolibova',
        email:         'ferangiz@hrmetrika.uz',
        password_hash: ferangizHash,
        role:          'ADMIN',
      },
      {
        name:          'Temur Yusupov',
        email:         'temur@hrmetrika.uz',
        password_hash: temurHash,
        role:          'ANALYST',
      },
    ],
  })
  console.log('   ✅ 2 users created\n')

  // ── 3. Departments ───────────────────────────────────────────────────────────
  console.log('🏢 Seeding departments...')
  const deptRecords = await Promise.all(
    DEPT_CONFIG.map((d) =>
      prisma.department.create({ data: { name: d.name } })
    )
  )
  // Map department name → DB record
  const deptByName = Object.fromEntries(deptRecords.map((d) => [d.name, d]))
  console.log(`   ✅ ${deptRecords.length} departments created\n`)

  // ── 4. Employees ─────────────────────────────────────────────────────────────
  console.log('👥 Seeding 160 employees...')

  const usedEmails = new Set()
  const employeeRows = []

  for (const cfg of DEPT_CONFIG) {
    const dept = deptByName[cfg.name]

    for (let i = 0; i < cfg.count; i++) {
      const firstName = faker.person.firstName()
      const lastName  = faker.person.lastName()

      // Guarantee unique email
      let email
      let attempt = 0
      do {
        const suffix = attempt === 0 ? '' : attempt
        email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${suffix}@hrmetrika.uz`
          .replace(/[^a-z0-9.@]/g, '')
        attempt++
      } while (usedEmails.has(email))
      usedEmails.add(email)

      // Hire date: anywhere from 4 years ago to 14 months ago (to allow some tenure)
      const hireDate = toDateOnly(
        randDate(new Date('2020-01-01'), new Date('2024-09-30'))
      )

      // Status distribution: 85% ACTIVE, 8% TERMINATED, 7% ON_LEAVE
      const roll = Math.random()
      let status = 'ACTIVE'
      let terminationDate = null
      if (roll < 0.08) {
        status = 'TERMINATED'
        terminationDate = toDateOnly(
          randDate(addDays(hireDate, 180), new Date('2025-12-31'))
        )
      } else if (roll < 0.15) {
        status = 'ON_LEAVE'
      }

      // Employment type: 80% FULL_TIME, 12% PART_TIME, 8% CONTRACTOR
      const typeRoll = Math.random()
      const employmentType =
        typeRoll < 0.80 ? 'FULL_TIME'
        : typeRoll < 0.92 ? 'PART_TIME'
        : 'CONTRACTOR'

      const salary = randFloat(cfg.salaryRange[0], cfg.salaryRange[1])

      employeeRows.push({
        first_name:      firstName,
        last_name:       lastName,
        email,
        department_id:   dept.id,
        job_title:       pick(cfg.titles),
        employment_type: employmentType,
        status,
        salary,
        hire_date:       hireDate,
        termination_date: terminationDate,
      })
    }
  }

  // Insert in batches of 50 to avoid payload limits
  const BATCH = 50
  for (let i = 0; i < employeeRows.length; i += BATCH) {
    await prisma.employee.createMany({ data: employeeRows.slice(i, i + BATCH) })
  }

  const allEmployees = await prisma.employee.findMany()
  console.log(`   ✅ ${allEmployees.length} employees created\n`)

  // ── 5. Absences ──────────────────────────────────────────────────────────────
  console.log('📅 Seeding absence records...')

  const eligibleEmployees = allEmployees.filter(
    (e) => e.status === 'ACTIVE' || e.status === 'ON_LEAVE'
  )

  const ABSENCE_TYPES = ['SICK', 'VACATION', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'UNPAID', 'OTHER']
  const ABSENCE_WEIGHTS = [0.30, 0.35, 0.15, 0.07, 0.05, 0.05, 0.03] // probability weights

  function pickAbsenceType() {
    const r = Math.random()
    let cumulative = 0
    for (let i = 0; i < ABSENCE_TYPES.length; i++) {
      cumulative += ABSENCE_WEIGHTS[i]
      if (r <= cumulative) return ABSENCE_TYPES[i]
    }
    return 'OTHER'
  }

  // Duration rules per type (working days)
  const DURATION = {
    SICK:      { min: 1, max: 10  },
    VACATION:  { min: 5, max: 21  },
    PERSONAL:  { min: 1, max: 5   },
    MATERNITY: { min: 56, max: 84 },
    PATERNITY: { min: 5, max: 14  },
    UNPAID:    { min: 3, max: 30  },
    OTHER:     { min: 1, max: 7   },
  }

  const absenceRows = []

  for (const emp of eligibleEmployees) {
    // Generate 2–5 absence records per employee over 2024–2025
    const count = randInt(2, 5)
    for (let a = 0; a < count; a++) {
      const absType   = pickAbsenceType()
      const dur       = DURATION[absType]
      const days      = randInt(dur.min, dur.max)
      const startDate = toDateOnly(randDate(new Date('2024-01-01'), new Date('2025-11-30')))
      const endDate   = toDateOnly(addDays(startDate, days))

      absenceRows.push({
        employee_id: emp.id,
        type:        absType,
        start_date:  startDate,
        end_date:    endDate,
        days,
        approved:    Math.random() > 0.15, // 85% approved
      })
    }
  }

  // Insert in batches
  for (let i = 0; i < absenceRows.length; i += BATCH) {
    await prisma.absence.createMany({ data: absenceRows.slice(i, i + BATCH) })
  }

  const absenceCount = await prisma.absence.count()
  console.log(`   ✅ ${absenceCount} absence records created\n`)

  // ── 6. Recruitment records ───────────────────────────────────────────────────
  console.log('📋 Seeding recruitment records...')

  // We'll create a realistic pipeline for 2024–2025:
  // ~40 FILLED, ~14 CANCELLED, ~14 OPEN
  const recruitmentPlan = [
    // [deptName, jobTitle, status, openedOffset_days_from_Jan2024]
    ...buildRecruitmentBatch(deptByName, deptRecords),
  ]

  await prisma.recruitmentRecord.createMany({ data: recruitmentPlan })
  const recCount = await prisma.recruitmentRecord.count()
  console.log(`   ✅ ${recCount} recruitment records created\n`)

  // ── 7. Financial records (24 months: Jan 2024 – Dec 2025) ───────────────────
  console.log('💰 Seeding 24 months of financial data...')

  // Headcount snapshot grows from 140 → 160 over the 24 months
  // Revenue grows from $1.75M → $2.3M with seasonal variation
  // Profit margin oscillates between 15% – 24%

  const financialRows = []
  for (let m = 0; m < 24; m++) {
    const period    = monthStart(m)
    const headcount = Math.round(140 + (m / 23) * 20) // 140 → 160

    // Base revenue with gentle growth + seasonal bump in Q2/Q3
    const baseRevenue = 1_750_000 + m * 25_000
    const monthInYear = m % 12
    const seasonal    = [0.97, 0.98, 1.00, 1.04, 1.06, 1.07, 1.05, 1.04, 1.02, 1.00, 0.98, 0.94][monthInYear]
    const noise       = 1 + (Math.random() - 0.5) * 0.04  // ±2% noise
    const revenue     = Math.round(baseRevenue * seasonal * noise)

    // Margin varies between 15% and 23%
    const margin     = 0.15 + Math.random() * 0.08
    const net_profit = Math.round(revenue * margin)

    financialRows.push({ period, revenue, net_profit, headcount })
  }

  await prisma.financial.createMany({ data: financialRows })
  const finCount = await prisma.financial.count()
  console.log(`   ✅ ${finCount} financial records created\n`)

  // ── Final summary ────────────────────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.department.count(),
    prisma.employee.count(),
    prisma.absence.count(),
    prisma.recruitmentRecord.count(),
    prisma.financial.count(),
  ])

  console.log('═══════════════════════════════════════')
  console.log('✅  Seed complete — row counts:')
  console.log(`   users               : ${counts[0]}`)
  console.log(`   departments         : ${counts[1]}`)
  console.log(`   employees           : ${counts[2]}`)
  console.log(`   absences            : ${counts[3]}`)
  console.log(`   recruitment_records : ${counts[4]}`)
  console.log(`   financials          : ${counts[5]}`)
  console.log('═══════════════════════════════════════')
  console.log('\n🔑 Demo credentials:')
  console.log('   Admin   → ferangiz@hrmetrika.uz / ferangiz2025')
  console.log('   Analyst → temur@hrmetrika.uz    / temur2025')
}

// ─── Recruitment batch builder ─────────────────────────────────────────────────

function buildRecruitmentBatch(deptByName, deptRecords) {
  const rows = []
  const now  = new Date('2026-03-29')

  // Template: [deptName, title, targetStatus]
  const templates = [
    // Engineering — most hires
    ['Engineering', 'Software Engineer',        'FILLED'],
    ['Engineering', 'Senior Software Engineer', 'FILLED'],
    ['Engineering', 'DevOps Engineer',          'FILLED'],
    ['Engineering', 'Frontend Engineer',        'FILLED'],
    ['Engineering', 'Backend Engineer',         'FILLED'],
    ['Engineering', 'QA Engineer',              'FILLED'],
    ['Engineering', 'Data Engineer',            'FILLED'],
    ['Engineering', 'Tech Lead',                'FILLED'],
    ['Engineering', 'Platform Engineer',        'CANCELLED'],
    ['Engineering', 'Senior Software Engineer', 'OPEN'],
    ['Engineering', 'DevOps Engineer',          'OPEN'],

    // Sales
    ['Sales', 'Sales Representative',        'FILLED'],
    ['Sales', 'Account Executive',           'FILLED'],
    ['Sales', 'Sales Manager',               'FILLED'],
    ['Sales', 'Business Development Manager','FILLED'],
    ['Sales', 'Regional Sales Manager',      'CANCELLED'],
    ['Sales', 'Account Executive',           'OPEN'],

    // Operations
    ['Operations', 'Operations Manager',     'FILLED'],
    ['Operations', 'Project Manager',        'FILLED'],
    ['Operations', 'Operations Analyst',     'FILLED'],
    ['Operations', 'Logistics Manager',      'CANCELLED'],
    ['Operations', 'Operations Coordinator', 'OPEN'],

    // Marketing
    ['Marketing', 'Marketing Manager',       'FILLED'],
    ['Marketing', 'Content Specialist',      'FILLED'],
    ['Marketing', 'Digital Marketing Manager','FILLED'],
    ['Marketing', 'SEO Specialist',          'FILLED'],
    ['Marketing', 'Social Media Manager',    'CANCELLED'],
    ['Marketing', 'Brand Manager',           'OPEN'],

    // Product
    ['Product', 'Product Manager',           'FILLED'],
    ['Product', 'Senior Product Manager',    'FILLED'],
    ['Product', 'Product Owner',             'FILLED'],
    ['Product', 'Business Analyst',          'CANCELLED'],
    ['Product', 'Associate Product Manager', 'OPEN'],

    // Design
    ['Design', 'UX Designer',                'FILLED'],
    ['Design', 'Product Designer',           'FILLED'],
    ['Design', 'Senior UX Designer',         'FILLED'],
    ['Design', 'UX Researcher',              'CANCELLED'],
    ['Design', 'UI Designer',                'OPEN'],

    // Finance
    ['Finance', 'Financial Analyst',         'FILLED'],
    ['Finance', 'Senior Financial Analyst',  'FILLED'],
    ['Finance', 'FP&A Analyst',              'FILLED'],
    ['Finance', 'Accountant',                'CANCELLED'],
    ['Finance', 'Controller',                'OPEN'],

    // HR
    ['HR', 'HR Specialist',                  'FILLED'],
    ['HR', 'Recruiter',                      'FILLED'],
    ['HR', 'Senior Recruiter',               'FILLED'],
    ['HR', 'HR Business Partner',            'FILLED'],
    ['HR', 'L&D Specialist',                 'CANCELLED'],
    ['HR', 'HR Coordinator',                 'OPEN'],

    // Extra OPEN positions (current open roles, created recently)
    ['Engineering', 'Staff Engineer',        'OPEN'],
    ['Sales',       'Sales Director',        'OPEN'],
    ['Product',     'Product Director',      'OPEN'],
    ['Marketing',   'Marketing Analyst',     'OPEN'],
    ['Design',      'Visual Designer',       'OPEN'],
  ]

  for (const [deptName, jobTitle, targetStatus] of templates) {
    const dept = deptByName[deptName]
    if (!dept) continue

    // Spread opened dates across 2024–2025
    const openedDate = toDateOnly(randDate(new Date('2024-01-01'), new Date('2025-10-01')))

    const candidatesCount = randInt(8, 45)
    const interviewsCount = randInt(
      Math.floor(candidatesCount * 0.2),
      Math.floor(candidatesCount * 0.6)
    )

    let offerDate     = null
    let offerAccepted = null
    let hireDate      = null
    let status        = targetStatus

    if (targetStatus === 'FILLED') {
      offerDate     = toDateOnly(addDays(openedDate, randInt(25, 60)))
      offerAccepted = true
      hireDate      = toDateOnly(addDays(offerDate,  randInt(14, 30)))
    } else if (targetStatus === 'CANCELLED') {
      // Some cancelled roles had offers that were rejected
      if (Math.random() > 0.5) {
        offerDate     = toDateOnly(addDays(openedDate, randInt(30, 55)))
        offerAccepted = false
      }
    }
    // OPEN: no offer yet

    rows.push({
      department_id:    dept.id,
      job_title:        jobTitle,
      opened_date:      openedDate,
      status,
      candidates_count: candidatesCount,
      interviews_count: interviewsCount,
      offer_date:       offerDate,
      offer_accepted:   offerAccepted,
      hire_date:        hireDate,
    })
  }

  return rows
}

// ─── Run ───────────────────────────────────────────────────────────────────────

main()
  .catch((err) => {
    console.error('\n❌ Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
