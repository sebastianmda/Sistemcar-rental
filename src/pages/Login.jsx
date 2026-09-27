import { useState } from 'react'
import { Car, LogIn } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { Button, Field, Input, ErrorText } from '../components/ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setError(friendlyError(error))
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
            <Car className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Sistemcar Rent a Car</h1>
          <p className="mt-1 text-sm text-slate-400">Gestionare flotă și închirieri</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 shadow-xl">
          <Field label="Email">
            <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Parolă">
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" loading={loading} icon={LogIn} className="w-full" size="lg">
            Intră în cont
          </Button>
        </form>
      </div>
    </div>
  )
}
