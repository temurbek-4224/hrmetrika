/**
 * HR Metrika — Excel (xlsx) export utility
 *
 * Usage:
 *   import { downloadExcel } from '@/utils/exportExcel'
 *
 *   downloadExcel(
 *     rows,       // array of plain objects
 *     columns,    // [{ header, key, width?, format? }]
 *     filename,   // without .xlsx extension
 *     sheetName,  // optional sheet label
 *   )
 */

import * as XLSX from 'xlsx'

/**
 * @param {Object[]}  rows       Data records
 * @param {Object[]}  columns    Column definitions:
 *                                 header  — display name in header row
 *                                 key     — field name from row object
 *                                 width   — approximate column width in chars
 *                                 format  — optional (val, row) => string | number
 * @param {string}    filename   Downloaded file name (no extension)
 * @param {string}    sheetName  Excel worksheet label
 */
export function downloadExcel(rows, columns, filename, sheetName = 'Data') {
  if (!rows?.length) {
    throw new Error('No data to export.')
  }

  // Build array-of-arrays: header row + data rows
  const header = columns.map((c) => c.header)

  const data = rows.map((row) =>
    columns.map((c) => {
      const val = row[c.key]
      if (c.format) return c.format(val, row)
      if (val === null || val === undefined) return ''
      return val
    })
  )

  const wsData = [header, ...data]

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Column widths
  ws['!cols'] = columns.map((c) => ({ wch: c.width ?? 15 }))

  // Bold header row cells
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
  for (let C = range.s.c; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C })
    if (!ws[addr]) continue
    ws[addr].s = { font: { bold: true } }
  }

  // Build workbook and trigger download
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ─── Column helpers ────────────────────────────────────────────────────────────

/** Format a date string as "Mar 30, 2026" */
export const fmtDate = (val) => {
  if (!val) return ''
  return new Date(val).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  })
}

/** Capitalize first letter, replace underscores with spaces */
export const fmtLabel = (val) => {
  if (!val) return ''
  return String(val).replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}
