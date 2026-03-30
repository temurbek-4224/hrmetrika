/**
 * HR Metrika — Dashboard PDF export utility
 *
 * Generates a presentation-ready A4 PDF containing:
 *   - Branded header (HR Metrika, date)
 *   - KPI summary table
 *   - Secondary metrics table
 *   - Chart images (captured via html2canvas from React refs)
 *   - Page footer with page numbers
 *
 * Usage:
 *   import { exportDashboardPDF } from '@/utils/exportPdf'
 *
 *   await exportDashboardPDF({
 *     title,       // string — report heading
 *     kpis,        // [{ label, value, format }]
 *     summary,     // [{ label, value }]
 *     chartRefs,   // [{ label, ref }]  React refs to DOM chart wrappers
 *   })
 */

import jsPDF      from 'jspdf'
import autoTable  from 'jspdf-autotable'
import html2canvas from 'html2canvas'

// ─── Brand palette (RGB) ───────────────────────────────────────────────────────
const C = {
  brand:  [99,  102, 241],   // indigo-500
  slate9: [15,  23,  42 ],   // slate-900
  slate5: [100, 116, 139],   // slate-500
  slate1: [248, 250, 252],   // slate-50
  rule:   [226, 232, 240],   // slate-200
}

// ─── Value formatter ──────────────────────────────────────────────────────────
function fmt(value, format) {
  const n = Number(value)
  switch (format) {
    case 'currency': return `$${n.toLocaleString('en-US')}`
    case 'percent':  return `${n.toFixed(1)}%`
    default:         return String(value ?? '')
  }
}

// ─── Main export function ─────────────────────────────────────────────────────
export async function exportDashboardPDF({
  title     = 'HR Analytics Dashboard Report',
  kpis      = [],
  summary   = [],
  chartRefs = [],
} = {}) {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W    = doc.internal.pageSize.getWidth()   // 210 mm
  const H    = doc.internal.pageSize.getHeight()  // 297 mm
  let   y    = 0

  // ── Top brand stripe ──────────────────────────────────────────────────────
  doc.setFillColor(...C.brand)
  doc.rect(0, 0, W, 3, 'F')

  // ── Header block ──────────────────────────────────────────────────────────
  y = 18
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...C.slate9)
  doc.text('HR Metrika', 15, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...C.slate5)
  doc.text('HR Analytics Platform', 15, y + 5)

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  doc.text(dateStr, W - 15, y,     { align: 'right' })
  doc.text('Confidential',  W - 15, y + 5, { align: 'right' })

  // ── Report title + rule ───────────────────────────────────────────────────
  y += 16
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...C.slate9)
  doc.text(title, 15, y)

  y += 3
  doc.setDrawColor(...C.rule)
  doc.setLineWidth(0.4)
  doc.line(15, y, W - 15, y)
  y += 8

  // ── KPI table ─────────────────────────────────────────────────────────────
  if (kpis.length) {
    sectionLabel(doc, 'KEY PERFORMANCE INDICATORS', y)
    y += 4

    autoTable(doc, {
      startY: y,
      head:   [['Metric', 'Value']],
      body:   kpis.map((k) => [k.label, fmt(k.value, k.format)]),
      theme:  'grid',
      styles:           { fontSize: 9, cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 } },
      headStyles:       { fillColor: C.brand, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: C.slate1 },
      columnStyles: {
        0: { cellWidth: 105 },
        1: { cellWidth: 65, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 15, right: 15 },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // ── Summary metrics table ─────────────────────────────────────────────────
  if (summary.length) {
    sectionLabel(doc, 'SUMMARY METRICS', y)
    y += 4

    autoTable(doc, {
      startY: y,
      head:   [['Metric', 'Value']],
      body:   summary.map((m) => [m.label, m.value]),
      theme:  'striped',
      styles:           { fontSize: 9, cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 } },
      headStyles:       { fillColor: C.brand, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: C.slate1 },
      columnStyles: {
        0: { cellWidth: 105 },
        1: { cellWidth: 65, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 15, right: 15 },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // ── Charts ────────────────────────────────────────────────────────────────
  for (const { label, ref } of chartRefs) {
    if (!ref?.current) continue
    try {
      const canvas = await html2canvas(ref.current, {
        scale:           1.5,
        useCORS:         true,
        backgroundColor: '#ffffff',
        logging:         false,
      })
      const imgData = canvas.toDataURL('image/png')
      const imgW    = W - 30
      const imgH    = (canvas.height / canvas.width) * imgW

      // Page break if chart won't fit
      if (y + imgH + 16 > H - 18) {
        doc.addPage()
        y = 15
      }

      sectionLabel(doc, label.toUpperCase(), y)
      y += 4

      doc.addImage(imgData, 'PNG', 15, y, imgW, imgH)
      y += imgH + 10
    } catch {
      // Chart capture failed — skip silently and continue
    }
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(...C.rule)
    doc.setLineWidth(0.3)
    doc.line(15, H - 12, W - 15, H - 12)
    doc.setFontSize(7)
    doc.setTextColor(...C.slate5)
    doc.text('HR Metrika — HR Analytics Platform', 15, H - 7)
    doc.text(`Page ${i} / ${pages}`, W - 15, H - 7, { align: 'right' })
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const filename = `HR_Metrika_Report_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}

// ─── Internal helpers ─────────────────────────────────────────────────────────
function sectionLabel(doc, text, y) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)  // slate-600
  doc.text(text, 15, y)
}
