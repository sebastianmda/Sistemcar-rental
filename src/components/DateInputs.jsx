// Date fields that always show day.month.year (27.09.2026) and 24h time (14:30),
// whatever the language of the phone or browser. Values stay ISO for the rest of the app:
// DateInput -> 'YYYY-MM-DD', DateTimeInput -> 'YYYY-MM-DDTHH:mm'.
import { useEffect, useState } from 'react'
import { CalendarDays, Clock } from 'lucide-react'
import { cx } from './ui'

const pad = (n) => String(n).padStart(2, '0')

export function isoToRo(iso) {
  if (!iso) return ''
  const [y, m, d] = String(iso).slice(0, 10).split('-')
  return y && m && d ? `${d}.${m}.${y}` : ''
}

export function roToIso(text) {
  const m = String(text).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!m) return null
  const d = Number(m[1])
  const mo = Number(m[2])
  const y = Number(m[3])
  const dt = new Date(y, mo - 1, d)
  if (y < 1900 || y > 2200 || dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return `${y}-${pad(mo)}-${pad(d)}`
}

function validTime(t) {
  const m = String(t).match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  return h < 24 && min < 60 ? `${pad(h)}:${pad(min)}` : null
}

// "27092026" -> "27.09.2026", "1.5." -> "01.05."
function maskDate(raw, prev) {
  if (raw.length < prev.length) return raw // deleting: leave as typed
  let s = raw.replace(/[^\d.]/g, '')
  s = s.replace(/(^|\.)(\d)\./g, '$10$2.').replace(/(^|\.)(\d)\./g, '$10$2.')
  const digits = s.replace(/\D/g, '').slice(0, 8)
  let out = digits.slice(0, 2)
  if (digits.length >= 2) out += '.' + digits.slice(2, 4)
  if (digits.length >= 4) out += '.' + digits.slice(4, 8)
  return out
}

// "1430" -> "14:30", "9:" -> "09:"
function maskTime(raw, prev) {
  if (raw.length < prev.length) return raw
  let s = raw.replace(/[^\d:]/g, '').replace(/^(\d):/, '0$1:')
  const digits = s.replace(/\D/g, '').slice(0, 4)
  let out = digits.slice(0, 2)
  if (digits.length >= 2) out += ':' + digits.slice(2, 4)
  return out
}

const box =
  'w-full min-w-0 rounded-lg border bg-white py-2 pl-3 pr-10 text-[15px] text-slate-900 placeholder:text-slate-400 ' +
  'focus:outline-none focus:ring-2 disabled:bg-slate-100'

// invisible native picker on top of the calendar icon (opens the phone's wheel / the browser calendar)
function NativePicker({ type, value, onPick, icon: Icon }) {
  return (
    <span className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400">
      <Icon className="h-4 w-4" />
      <input
        type={type}
        tabIndex={-1}
        aria-hidden="true"
        value={value || ''}
        onChange={(e) => e.target.value && onPick(e.target.value)}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker?.()
          } catch {
            /* older browsers open it on tap anyway */
          }
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </span>
  )
}

export function DateInput({ value, onChange, className, placeholder = 'zz.ll.aaaa', ...props }) {
  const [text, setText] = useState(isoToRo(value))
  const [invalid, setInvalid] = useState(false)

  // follow changes made from outside (e.g. form reset)
  useEffect(() => {
    if ((roToIso(text) || '') !== (value || '')) setText(isoToRo(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const emit = (v) => onChange?.({ target: { value: v } })

  const type = (e) => {
    const t = maskDate(e.target.value, text)
    setText(t)
    setInvalid(false)
    const iso = roToIso(t)
    if (iso) emit(iso)
    else if (t === '') emit('')
  }

  const blur = () => {
    let t = text.trim()
    const short = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/) // 27.09.26 -> 27.09.2026
    if (short) t = `${pad(short[1])}.${pad(short[2])}.20${short[3]}`
    const iso = roToIso(t)
    if (iso) {
      setText(isoToRo(iso))
      emit(iso)
    }
    setInvalid(t !== '' && !iso)
  }

  return (
    <span className={cx('relative block', className)}>
      <input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={10}
        placeholder={placeholder}
        value={text}
        onChange={type}
        onBlur={blur}
        className={cx(box, invalid ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20')}
      />
      <NativePicker
        type="date"
        value={value}
        icon={CalendarDays}
        onPick={(v) => {
          setText(isoToRo(v))
          setInvalid(false)
          emit(v)
        }}
      />
      {invalid && <span className="mt-1 block text-xs text-red-600">Dată invalidă. Scrie ca în exemplu: 27.09.2026</span>}
    </span>
  )
}

function TimeInput({ value, onChange }) {
  const [text, setText] = useState(value || '')
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if ((validTime(text) || '') !== (value || '')) setText(value || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <span className="relative block">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={5}
        placeholder="hh:mm"
        aria-label="Ora"
        value={text}
        onChange={(e) => {
          const t = maskTime(e.target.value, text)
          setText(t)
          setInvalid(false)
          const ok = validTime(t)
          if (ok) onChange(ok)
        }}
        onBlur={() => {
          const ok = validTime(text)
          if (ok) setText(ok)
          setInvalid(text !== '' && !ok)
        }}
        className={cx(box, invalid ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20')}
      />
      <NativePicker
        type="time"
        value={value}
        icon={Clock}
        onPick={(v) => {
          setText(v.slice(0, 5))
          setInvalid(false)
          onChange(v.slice(0, 5))
        }}
      />
    </span>
  )
}

// date + time side by side; value 'YYYY-MM-DDTHH:mm'
export function DateTimeInput({ value, onChange }) {
  const [date, time] = String(value || '').split('T')
  const emit = (d, t) => onChange?.({ target: { value: d && t ? `${d}T${t}` : '' } })
  return (
    <span className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
      <DateInput value={date || ''} onChange={(e) => emit(e.target.value, (time || '').slice(0, 5) || '09:00')} />
      <TimeInput value={(time || '').slice(0, 5)} onChange={(t) => emit(date, t)} />
    </span>
  )
}
