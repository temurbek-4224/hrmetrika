/**
 * Mock employee, department, absence, recruitment, and financial data.
 *
 * Consistency rules applied:
 *   - departments headcount sums to 247 (= kpiData headcount, Dec snapshot)
 *   - financialRecords revenuePerEmp / profitPerEmp = revenue/headcount (rounded)
 *   - financialRecords covers all 12 months to match revenueProfit chart series
 *   - avgSalary per department matches salaryByDept chart data
 */

// ─── Employees ─────────────────────────────────────────────────────────────────
export const employees = [
  { id: 1,  name: 'Azizbek Karimov',    email: 'a.karimov@company.com',    department: 'Engineering', position: 'Senior Developer',     salary: 8200,  startDate: '2021-03-15', status: 'active'   },
  { id: 2,  name: 'Maria Ivanova',       email: 'm.ivanova@company.com',    department: 'Product',     position: 'Product Manager',      salary: 7500,  startDate: '2020-07-01', status: 'active'   },
  { id: 3,  name: 'James Wilson',        email: 'j.wilson@company.com',     department: 'Sales',       position: 'Sales Lead',           salary: 6200,  startDate: '2022-01-10', status: 'active'   },
  { id: 4,  name: 'Nilufar Yusupova',    email: 'n.yusupova@company.com',   department: 'HR',          position: 'HR Manager',           salary: 5800,  startDate: '2019-09-20', status: 'active'   },
  { id: 5,  name: 'Dmitri Sokolov',      email: 'd.sokolov@company.com',    department: 'Finance',     position: 'CFO',                  salary: 11000, startDate: '2018-04-01', status: 'active'   },
  { id: 6,  name: 'Sarah Chen',          email: 's.chen@company.com',       department: 'Marketing',   position: 'Marketing Director',   salary: 8000,  startDate: '2020-11-15', status: 'active'   },
  { id: 7,  name: 'Bobur Toshmatov',     email: 'b.toshmatov@company.com',  department: 'Engineering', position: 'Frontend Developer',   salary: 5500,  startDate: '2023-02-01', status: 'active'   },
  { id: 8,  name: 'Elena Petrova',       email: 'e.petrova@company.com',    department: 'Operations',  position: 'Operations Manager',   salary: 6500,  startDate: '2021-08-10', status: 'on_leave' },
  { id: 9,  name: 'Alex Morgan',         email: 'a.morgan@company.com',     department: 'Engineering', position: 'Backend Developer',    salary: 7000,  startDate: '2022-05-20', status: 'active'   },
  { id: 10, name: 'Ferangiz Tolibova',   email: 'ferangiz@hrmetrika.uz',    department: 'HR',          position: 'HR Analyst',           salary: 4800,  startDate: '2023-06-15', status: 'active'   },
]

// ─── Departments ───────────────────────────────────────────────────────────────
// Sum of headCount = 68+22+45+28+14+18+32+20 = 247  ✓
export const departments = [
  { id: 1, name: 'Engineering', headCount: 68, avgSalary: 7200, manager: 'Azizbek Karimov'  },
  { id: 2, name: 'Product',     headCount: 22, avgSalary: 6800, manager: 'Maria Ivanova'    },
  { id: 3, name: 'Sales',       headCount: 45, avgSalary: 5400, manager: 'James Wilson'     },
  { id: 4, name: 'Marketing',   headCount: 28, avgSalary: 5100, manager: 'Sarah Chen'       },
  { id: 5, name: 'HR',          headCount: 14, avgSalary: 4600, manager: 'Nilufar Yusupova' },
  { id: 6, name: 'Finance',     headCount: 18, avgSalary: 5800, manager: 'Dmitri Sokolov'   },
  { id: 7, name: 'Operations',  headCount: 32, avgSalary: 4200, manager: 'Elena Petrova'    },
  { id: 8, name: 'Design',      headCount: 20, avgSalary: 4800, manager: 'Alex Morgan'      },
]

// ─── Absence records ───────────────────────────────────────────────────────────
export const absenceRecords = [
  { id: 1, employee: 'Azizbek Karimov',  department: 'Engineering', type: 'Sick Leave',      startDate: '2024-11-04', endDate: '2024-11-06', days: 3,  status: 'approved' },
  { id: 2, employee: 'Maria Ivanova',    department: 'Product',     type: 'Annual Leave',    startDate: '2024-11-11', endDate: '2024-11-22', days: 10, status: 'approved' },
  { id: 3, employee: 'James Wilson',     department: 'Sales',       type: 'Personal Leave',  startDate: '2024-12-02', endDate: '2024-12-02', days: 1,  status: 'pending'  },
  { id: 4, employee: 'Elena Petrova',    department: 'Operations',  type: 'Maternity Leave', startDate: '2024-10-01', endDate: '2025-01-01', days: 90, status: 'approved' },
  { id: 5, employee: 'Bobur Toshmatov',  department: 'Engineering', type: 'Sick Leave',      startDate: '2024-12-10', endDate: '2024-12-11', days: 2,  status: 'pending'  },
  { id: 6, employee: 'Sarah Chen',       department: 'Marketing',   type: 'Annual Leave',    startDate: '2024-12-23', endDate: '2024-12-27', days: 5,  status: 'approved' },
]

// ─── Recruitment records ───────────────────────────────────────────────────────
export const recruitmentRecords = [
  { id: 1, title: 'Senior Backend Engineer', department: 'Engineering', status: 'open',      openedDate: '2024-10-01', candidates: 45, interviews: 8  },
  { id: 2, title: 'Product Designer',        department: 'Product',     status: 'filled',    openedDate: '2024-09-15', candidates: 62, interviews: 12, hireDate: '2024-11-01' },
  { id: 3, title: 'Sales Executive',         department: 'Sales',       status: 'open',      openedDate: '2024-10-20', candidates: 28, interviews: 5  },
  { id: 4, title: 'DevOps Engineer',         department: 'Engineering', status: 'open',      openedDate: '2024-11-01', candidates: 18, interviews: 3  },
  { id: 5, title: 'Marketing Specialist',    department: 'Marketing',   status: 'cancelled', openedDate: '2024-09-01', candidates: 35, interviews: 6  },
]

// ─── Financial records (12 months, Jan–Dec 2024) ───────────────────────────────
// revenuePerEmp = Math.round(revenue / headcount)
// profitPerEmp  = Math.round(profit  / headcount)
// Headcount values are consistent with headcountTrend chart series.
export const financialRecords = [
  { id:  1, month: 'January 2024',   revenue: 1850000, profit: 370000, headcount: 210, revenuePerEmp: 8810,  profitPerEmp: 1762 },
  { id:  2, month: 'February 2024',  revenue: 1920000, profit: 396000, headcount: 215, revenuePerEmp: 8930,  profitPerEmp: 1842 },
  { id:  3, month: 'March 2024',     revenue: 2050000, profit: 432000, headcount: 218, revenuePerEmp: 9404,  profitPerEmp: 1982 },
  { id:  4, month: 'April 2024',     revenue: 2100000, profit: 441000, headcount: 225, revenuePerEmp: 9333,  profitPerEmp: 1960 },
  { id:  5, month: 'May 2024',       revenue: 2080000, profit: 428000, headcount: 228, revenuePerEmp: 9123,  profitPerEmp: 1877 },
  { id:  6, month: 'June 2024',      revenue: 2200000, profit: 462000, headcount: 230, revenuePerEmp: 9565,  profitPerEmp: 2009 },
  { id:  7, month: 'July 2024',      revenue: 2300000, profit: 494000, headcount: 234, revenuePerEmp: 9829,  profitPerEmp: 2111 },
  { id:  8, month: 'August 2024',    revenue: 2280000, profit: 487000, headcount: 236, revenuePerEmp: 9661,  profitPerEmp: 2064 },
  { id:  9, month: 'September 2024', revenue: 2400000, profit: 520000, headcount: 238, revenuePerEmp: 10084, profitPerEmp: 2185 },
  { id: 10, month: 'October 2024',   revenue: 2450000, profit: 538000, headcount: 241, revenuePerEmp: 10166, profitPerEmp: 2232 },
  { id: 11, month: 'November 2024',  revenue: 2380000, profit: 512000, headcount: 244, revenuePerEmp: 9754,  profitPerEmp: 2098 },
  { id: 12, month: 'December 2024',  revenue: 2500000, profit: 550000, headcount: 247, revenuePerEmp: 10121, profitPerEmp: 2227 },
]
