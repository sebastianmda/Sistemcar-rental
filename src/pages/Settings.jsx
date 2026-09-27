import { useState } from 'react'
import { Save, LogOut } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useToast } from '../components/Toast'
import { api } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { Button, Card, Field, Input, PageHeader } from '../components/ui'
import { WARNING_DAYS, CRITICAL_DAYS } from '../lib/alerts'

export default function SettingsPage({ email, onLogout }) {
  const { defaultTariff, reload } = useData()
  const toast = useToast()
  const [tariff, setTariff] = useState(defaultTariff)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!(Number(tariff) > 0)) return toast('Tariful trebuie să fie mai mare decât 0.', 'error')
    setSaving(true)
    try {
      await api.saveDefaultTariff(tariff)
      toast('Tarif implicit salvat')
      reload()
    } catch (err) {
      toast(friendlyError(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Setări" />
      <div className="grid grid-cols-1 max-w-3xl gap-6">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900">Tarif implicit</h2>
          <p className="mt-1 text-sm text-slate-500">
            Se folosește pentru mașinile care nu au un tarif propriu setat în fișa vehiculului.
          </p>
          <div className="mt-4 flex max-w-sm items-end gap-2">
            <Field label="RON / zi" className="flex-1">
              <Input type="number" inputMode="decimal" min={0} value={tariff} onChange={(e) => setTariff(e.target.value)} />
            </Field>
            <Button icon={Save} loading={saving} onClick={save}>
              Salvează
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-slate-900">Alerte documente</h2>
          <p className="mt-1 text-sm text-slate-500">
            RCA, ITP, rovinieta și CASCO apar în Panou cu {WARNING_DAYS} de zile înainte de expirare (galben) și cu{' '}
            {CRITICAL_DAYS} zile înainte (portocaliu). Documentele expirate apar cu roșu, iar predarea unei mașini cu RCA
            sau ITP expirat este blocată.
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-slate-900">Cont</h2>
          <p className="mt-1 text-sm text-slate-500">Conectat ca {email}</p>
          <Button variant="secondary" icon={LogOut} onClick={onLogout} className="mt-4">
            Deconectare
          </Button>
        </Card>
      </div>
    </>
  )
}
