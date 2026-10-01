// Date & number helpers (Romanian formatting)

const DAY = 24 * 60 * 60 * 1000

// 'YYYY-MM-DD' -> Date at local midnight (avoids timezone shifts)
export function parseDateOnly(value) {
  if (!value) return null
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function todayMidnight() {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

// number of days from today until the given date (negative = in the past)
export function daysUntil(value) {
  const date = parseDateOnly(value)
  if (!date) return null
  return Math.round((date - todayMidnight()) / DAY)
}

const p2 = (n) => String(n).padStart(2, '0')
const dmy = (d) => `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}`
const hm = (d) => `${p2(d.getHours())}:${p2(d.getMinutes())}`

// always day.month.year (27.09.2026), whatever the phone/browser language
export function fmtDate(value) {
  const date = parseDateOnly(value)
  return date ? dmy(date) : '—'
}

export function fmtDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (isNaN(date)) return '—'
  return `${dmy(date)}, ${hm(date)}`
}

export function fmtMoney(value) {
  const n = Number(value) || 0
  return `${n.toLocaleString('ro-RO', { maximumFractionDigits: 2 })} RON`
}

export function fmtKm(value) {
  if (value === null || value === undefined || value === '') return '—'
  return `${Number(value).toLocaleString('ro-RO')} km`
}

// value for <input type="datetime-local">
export function toLocalInput(date = new Date()) {
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// Billable days as in the contract: calendar days, counting both the handover day and
// the return day, regardless of the hour. Minimum 1.
export function rentalDays(start, end) {
  const a = new Date(start)
  const b = new Date(end)
  if (isNaN(a) || isNaN(b)) return 1
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.max(1, Math.round((db - da) / DAY) + 1)
}

export function daysLabel(days) {
  if (days === null) return 'dată nesetată'
  if (days === 0) return 'expiră azi'
  if (days === 1) return 'expiră mâine'
  if (days > 1) return `expiră în ${days} zile`
  if (days === -1) return 'expirat ieri'
  return `expirat de ${Math.abs(days)} zile`
}

export function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`
}

export function fmtTime(value) {
  if (!value) return ''
  const d = new Date(value)
  return isNaN(d) ? '' : hm(d)
}

export function fmtDateOnly(value) {
  if (!value) return ''
  const d = new Date(value)
  return isNaN(d) ? '' : dmy(d)
}
