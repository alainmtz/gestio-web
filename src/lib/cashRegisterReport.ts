import type { CashSession, CashMovement } from '@/api/cashRegister'
import { CASH_MOVEMENT_TYPE_LABELS, CURRENCY_SYMBOLS } from '@/lib/constants'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('es-CU', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtAmount(amount: string | number, currency: string) {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency
  return `${sym}${Number(amount).toFixed(2)}`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function amountsToRows(amounts: Record<string, number> | null | undefined): [string, string][] {
  if (!amounts) return []
  return Object.entries(amounts)
    .filter(([, v]) => v !== 0)
    .map(([c, v]) => [c, fmtAmount(v, c)])
}

// ─── PDF (print-to-PDF) ──────────────────────────────────────────────────────

export function generateSessionPDF(session: CashSession, movements: CashMovement[]) {
  const openRows = amountsToRows(session.opening_amounts)
  const closingRows = amountsToRows(session.closing_amounts)
  const expectedRows = amountsToRows(session.expected_amounts)
  const diffRows = amountsToRows(session.differences)

  const maxRows = Math.max(openRows.length, closingRows.length, expectedRows.length, diffRows.length, 1)
  const summaryBody: string[][] = []
  for (let i = 0; i < maxRows; i++) {
    summaryBody.push([
      openRows[i]?.[0] ?? '', openRows[i]?.[1] ?? '',
      closingRows[i]?.[1] ?? '',
      expectedRows[i]?.[1] ?? '',
      diffRows[i]?.[1] ?? '',
    ])
  }

  // ── Income / Expense summary per currency
  const incomeByCurrency: Record<string, number> = {}
  const expenseByCurrency: Record<string, number> = {}
  for (const m of movements) {
    const c = m.currency ?? 'CUP'
    const amt = Number(m.amount)
    if (m.movement_type === 'INCOME' || m.movement_type === 'DEPOSIT') {
      incomeByCurrency[c] = (incomeByCurrency[c] ?? 0) + amt
    } else if (m.movement_type === 'EXPENSE' || m.movement_type === 'WITHDRAWAL') {
      expenseByCurrency[c] = (expenseByCurrency[c] ?? 0) + amt
    }
  }

  const currencies = [...new Set([...Object.keys(incomeByCurrency), ...Object.keys(expenseByCurrency)])]

  const statusLabel = { OPEN: 'Abierta', CLOSED: 'Cerrada', SUSPENDED: 'Suspendida' }[session.status] ?? session.status
  const generatedAt = fmtDate(new Date().toISOString())

  const summaryRowsHtml = summaryBody
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell || '—')}</td>`).join('')}</tr>`)
    .join('')

  const totalsRowsHtml = currencies
    .map((c) => {
      const inc = incomeByCurrency[c] ?? 0
      const exp = expenseByCurrency[c] ?? 0
      return `<tr><td>${escapeHtml(c)}</td><td>${escapeHtml(fmtAmount(inc, c))}</td><td>${escapeHtml(fmtAmount(exp, c))}</td><td>${escapeHtml(fmtAmount(inc - exp, c))}</td></tr>`
    })
    .join('')

  const movementRowsHtml = movements
    .map((m) => {
      const typeCfg = CASH_MOVEMENT_TYPE_LABELS[m.movement_type]
      const sign = typeCfg?.isPositive ? '+' : '-'
      return `<tr>
        <td>${escapeHtml(fmtDate(m.created_at))}</td>
        <td>${escapeHtml(typeCfg?.label ?? m.movement_type)}</td>
        <td>${escapeHtml(m.currency ?? '—')}</td>
        <td class="amount">${escapeHtml(`${sign}${fmtAmount(m.amount, m.currency ?? 'CUP')}`)}</td>
        <td>${escapeHtml(m.notes ?? '')}</td>
      </tr>`
    })
    .join('')

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Reporte de Sesión de Caja</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
    h1 { text-align: center; margin: 0 0 8px 0; font-size: 24px; }
    .meta { text-align: center; color: #4b5563; margin: 0 0 4px 0; font-size: 13px; }
    .section-title { font-size: 16px; margin: 20px 0 8px 0; font-weight: 700; }
    .status { margin-top: 12px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; }
    th { background: #f3f4f6; text-align: left; }
    .amount { text-align: right; white-space: nowrap; }
    .footer { margin-top: 24px; font-size: 11px; color: #6b7280; text-align: center; }
    @media print {
      body { margin: 12mm; }
      .print-note { display: none; }
      table, tr, td, th { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>Reporte de Sesión de Caja</h1>
  <p class="meta">Tienda: ${escapeHtml(session.store?.name ?? '—')} | Cajero: ${escapeHtml(session.user?.full_name ?? '—')}</p>
  <p class="meta">Apertura: ${escapeHtml(fmtDate(session.opened_at))}${session.closed_at ? ` | Cierre: ${escapeHtml(fmtDate(session.closed_at))}` : ''}</p>
  <p class="status"><strong>Estado:</strong> ${escapeHtml(statusLabel)}</p>

  <div class="section-title">Resumen</div>
  <table>
    <thead><tr><th>Moneda</th><th>Apertura</th><th>Cierre</th><th>Esperado</th><th>Diferencia</th></tr></thead>
    <tbody>${summaryRowsHtml}</tbody>
  </table>

  ${currencies.length > 0 ? `<div class="section-title">Totales por Moneda</div>
  <table>
    <thead><tr><th>Moneda</th><th>Total Ingresos</th><th>Total Egresos</th><th>Neto</th></tr></thead>
    <tbody>${totalsRowsHtml}</tbody>
  </table>` : ''}

  ${movements.length > 0 ? `<div class="section-title">Detalle de Movimientos</div>
  <table>
    <thead><tr><th>Fecha</th><th>Tipo</th><th>Moneda</th><th>Monto</th><th>Notas</th></tr></thead>
    <tbody>${movementRowsHtml}</tbody>
  </table>` : ''}

  <p class="footer">Generado el ${escapeHtml(generatedAt)}</p>
  <p class="print-note" style="text-align:center;font-size:11px;color:#6b7280;">Use "Guardar como PDF" en el diálogo de impresión.</p>
  <script>window.print();</script>
</body>
</html>`

  const popup = window.open('', '_blank', 'noopener,noreferrer')
  if (!popup) {
    return
  }

  popup.document.open()
  popup.document.write(html)
  popup.document.close()

  const filename = `caja_${session.store?.name ?? 'sesion'}_${session.opened_at.slice(0, 10)}.pdf`
    .replace(/\s+/g, '_')
    .toLowerCase()

  // Best effort to keep a contextual title in the print/save dialog.
  popup.document.title = filename
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

export function generateSessionCSV(session: CashSession, movements: CashMovement[]) {
  const rows: string[][] = [
    ['Fecha', 'Tipo', 'Moneda', 'Monto', 'Referencia', 'Notas'],
    ...movements.map((m) => [
      fmtDate(m.created_at),
      CASH_MOVEMENT_TYPE_LABELS[m.movement_type]?.label ?? m.movement_type,
      m.currency ?? '',
      Number(m.amount).toFixed(2),
      m.reference ?? '',
      m.notes ?? '',
    ]),
  ]

  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `caja_${session.store?.name ?? 'sesion'}_${session.opened_at.slice(0, 10)}.csv`
    .replace(/\s+/g, '_')
    .toLowerCase()
  a.click()
  URL.revokeObjectURL(url)
}
