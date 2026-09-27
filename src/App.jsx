import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase'
import { DataProvider, useData } from './context/DataContext'
import { ToastProvider } from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import { Spinner, ErrorText, Button } from './components/ui'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Fleet from './pages/Fleet'
import Rentals from './pages/Rentals'
import Clients from './pages/Clients'
import SettingsPage from './pages/Settings'

function Shell({ session }) {
  const { loading, error, reload } = useData()
  const [page, setPage] = useState('dashboard')
  const [params, setParams] = useState({})

  const navigate = useCallback((to, p = {}) => {
    setPage(to)
    setParams(p)
    window.scrollTo(0, 0)
  }, [])

  const logout = () => supabase.auth.signOut()

  let content
  if (loading) content = <Spinner />
  else if (error)
    content = (
      <div className="mx-auto max-w-lg space-y-3 py-10">
        <ErrorText>{error}</ErrorText>
        <Button variant="secondary" onClick={reload}>
          Încearcă din nou
        </Button>
      </div>
    )
  else {
    const props = { navigate, params }
    content = {
      dashboard: <Dashboard {...props} />,
      fleet: <Fleet {...props} />,
      rentals: <Rentals {...props} />,
      clients: <Clients {...props} />,
      settings: <SettingsPage {...props} email={session.user.email} onLogout={logout} />,
    }[page]
  }

  return (
    <Layout page={page} onNavigate={navigate} email={session.user.email} onLogout={logout}>
      <ErrorBoundary key={page}>{content}</ErrorBoundary>
    </Layout>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!supabaseConfigured) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <ErrorText>
          Lipsesc cheile Supabase. În Vercel → Settings → Environment Variables adaugă VITE_SUPABASE_URL și
          VITE_SUPABASE_ANON_KEY, apoi fă Redeploy.
        </ErrorText>
      </div>
    )
  }
  if (session === undefined) return <Spinner />
  if (!session) return <Login />

  return (
    <ToastProvider>
      <DataProvider key={session.user.id}>
        <Shell session={session} />
      </DataProvider>
    </ToastProvider>
  )
}
