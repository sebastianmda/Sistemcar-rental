import { LayoutDashboard, Car, KeyRound, Users, Settings, LogOut } from 'lucide-react'
import { cx } from './ui'
import { useData } from '../context/DataContext'

export const NAV = [
  { id: 'dashboard', label: 'Panou', icon: LayoutDashboard },
  { id: 'fleet', label: 'Flotă', icon: Car },
  { id: 'rentals', label: 'Închirieri', icon: KeyRound },
  { id: 'clients', label: 'Clienți', icon: Users },
  { id: 'settings', label: 'Setări', icon: Settings },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
        <Car className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="font-bold text-white">Sistemcar</div>
        <div className="text-xs text-slate-400">Rent a Car</div>
      </div>
    </div>
  )
}

export default function Layout({ page, onNavigate, email, onLogout, children }) {
  const { urgent } = useData()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-slate-900 px-4 py-5 lg:flex">
        <Logo />
        <nav className="mt-8 flex-1 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = page === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={cx(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === 'dashboard' && urgent > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">{urgent}</span>
                )}
              </button>
            )
          })}
        </nav>
        <div className="border-t border-slate-800 pt-4">
          <div className="truncate px-3 text-xs text-slate-500">{email}</div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/60 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Deconectare
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-slate-900 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
        <Logo />
      </header>

      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pt-8">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = page === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cx(
                'relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
                active ? 'text-blue-600' : 'text-slate-500'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
              {item.id === 'dashboard' && urgent > 0 && (
                <span className="absolute right-1/4 top-1 min-w-[18px] rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-[18px] text-white">
                  {urgent}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
