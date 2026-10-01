import { useEffect } from 'react'
import { X, Loader2, Search } from 'lucide-react'

export function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

const BUTTON_VARIANTS = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100',
  dangerGhost: 'text-red-600 hover:bg-red-50',
}

export function Button({ variant = 'primary', size = 'md', loading, icon: Icon, className, children, ...props }) {
  const sizes = { sm: 'px-2.5 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-3 text-base' }
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition',
        'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        BUTTON_VARIANTS[variant],
        sizes[size],
        className
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  )
}

const inputBase =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] text-slate-900 placeholder:text-slate-400 ' +
  'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-500'

export function Input({ className, ...props }) {
  return <input {...props} className={cx(inputBase, className)} />
}

export function Select({ className, children, ...props }) {
  return (
    <select {...props} className={cx(inputBase, 'pr-8', className)}>
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }) {
  return <textarea rows={3} {...props} className={cx(inputBase, className)} />
}

export function Field({ label, hint, required, className, children }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

export function FormSection({ title, description, children }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export function Card({ className, children, ...props }) {
  return (
    <div {...props} className={cx('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  )
}

const BADGE_TONES = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
}

export function Badge({ tone = 'gray', className, children }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        BADGE_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

export function Modal({ open, title, subtitle, onClose, footer, size = 'lg', children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  const widths = { md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }
  // phone: full screen (no dimmed strip on top, header always visible); desktop: centered window
  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-white sm:items-center sm:bg-slate-900/50 sm:p-4 sm:backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          'flex h-[100dvh] w-full flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:shadow-2xl',
          widths[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Închide"
            className="-mr-2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-6 w-6 sm:h-5 sm:w-5" />
          </button>
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-white px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Caută…', className }) {
  return (
    <div className={cx('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Card className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <div className="mb-3 rounded-full bg-slate-100 p-3">
          <Icon className="h-6 w-6 text-slate-500" />
        </div>
      )}
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  )
}

export function Spinner({ label = 'Se încarcă…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cx(
            'rounded-md px-3 py-1.5 text-sm font-medium transition',
            value === t.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function ErrorText({ children }) {
  if (!children) return null
  return <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{children}</div>
}

export function Plate({ children, className }) {
  return (
    <span
      className={cx(
        'inline-flex items-center overflow-hidden rounded border border-slate-400 bg-white font-mono text-xs font-semibold tracking-wider text-slate-900',
        className
      )}
    >
      <span className="bg-blue-700 px-1 py-0.5 text-[9px] leading-none text-white">RO</span>
      <span className="px-1.5 py-0.5">{children}</span>
    </span>
  )
}

export function InfoRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{children ?? '—'}</span>
    </div>
  )
}
