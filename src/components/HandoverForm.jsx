import { useMemo, useState } from 'react'
import { KeyRound, AlertTriangle } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useToast } from './Toast'
import { api } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { vehicleDocs } from '../lib/alerts'
import { toLocalInput, addDays, rentalDays, fmtMoney, daysLabel, daysUntil, fmtDate } from '../lib/format'
import { Modal, Button, Field, Input, Select, Textarea, FormSection, ErrorText, Tabs } from './ui'
import ClientFields, { EMPTY_CLIENT, validateClient } from './ClientFields'
import { MediaPicker, UploadProgress } from './Media'

export const FUEL_LEVELS = ['Rezervă', '1/4', '1/2', '3/4', 'Plin']

export default function HandoverForm({ initialVehicleId, onClose, onDone }) {
  const { vehicles, clients, defaultTariff } = useData()
  const toast = useToast()
  const available = vehicles.filter((v) => v.status === 'Disponibil')

  const firstVehicle = available.find((v) => v.id === initialVehicleId) || available[0]
  const now = new Date()
  const [form, setForm] = useState({
    vehicle_id: firstVehicle?.id || '',
    data_predare: toLocalInput(now),
    data_returnare_planificata: toLocalInput(addDays(now, 1)),
    tarif_zilnic: firstVehicle?.tarif_zilnic ?? defaultTariff,
    garantie: '',
    km_predare: firstVehicle?.km_actuali ?? '',
    combustibil_predare: 'Plin',
    observatii_predare: '',
  })
  const [clientMode, setClientMode] = useState(clients.length ? 'existing' : 'new')
  const [clientId, setClientId] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [newClient, setNewClient] = useState({ ...EMPTY_CLIENT })
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [createdClientId, setCreatedClientId] = useState(null) // avoids duplicate clients if saving is retried

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const vehicle = vehicles.find((v) => v.id === form.vehicle_id)

  const chooseVehicle = (id) => {
    const v = vehicles.find((x) => x.id === id)
    setForm((f) => ({ ...f, vehicle_id: id, tarif_zilnic: v?.tarif_zilnic ?? defaultTariff, km_predare: v?.km_actuali ?? '' }))
  }

  const docs = vehicle ? vehicleDocs(vehicle) : []
  const blocking = docs.filter((d) => (d.key === 'rca_expira' || d.key === 'itp_expira') && d.level === 'expired')
  const warnings = docs.filter((d) => !blocking.includes(d) && d.level !== 'ok')

  const days = rentalDays(form.data_predare, form.data_returnare_planificata)
  const estimate = days * (Number(form.tarif_zilnic) || 0)

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase()
    return clients.filter((c) => !q || c.nume.toLowerCase().includes(q) || (c.telefon || '').includes(q))
  }, [clients, clientSearch])
  const selectedClient = clients.find((c) => c.id === clientId)
  const licenseDays = daysUntil(clientMode === 'existing' ? selectedClient?.permis_expira : newClient.permis_expira)

  const submit = async () => {
    setError(null)
    if (!vehicle) return setError('Alege vehiculul.')
    if (blocking.length) return setError(`Nu poți preda mașina: ${blocking.map((d) => d.label).join(' și ')} expirat. Actualizează datele vehiculului.`)
    if (clientMode === 'existing' && !clientId) return setError('Alege clientul.')
    if (clientMode === 'new') {
      const problem = validateClient(newClient)
      if (problem) return setError(problem)
    }
    if (new Date(form.data_returnare_planificata) <= new Date(form.data_predare))
      return setError('Data returnării trebuie să fie după data predării.')

    setSaving(true)
    try {
      let cid = clientId
      if (clientMode === 'new') {
        cid = createdClientId
        if (!cid) {
          setProgress('Se salvează clientul…')
          cid = (await api.createClient(newClient)).id
          setCreatedClientId(cid)
        }
      }
      setProgress('Se salvează predarea…')
      const rental = await api.createRental({ ...form, client_id: cid })
      if (files.length) {
        const failed = await api.uploadMany(rental.id, 'predare', files, (i, n) => setProgress(`Se încarcă pozele ${i}/${n}…`))
        if (failed.length) toast(`${failed.length} poză(e) nu s-au încărcat. Le poți adăuga din detaliile închirierii.`, 'error')
      }
      toast('Mașina a fost predată')
      onDone(rental)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSaving(false)
      setProgress(null)
    }
  }

  if (!available.length) {
    return (
      <Modal open onClose={onClose} title="Predare mașină" size="md">
        <p className="text-sm text-slate-600">Nu există vehicule disponibile. Toate sunt în chirie sau în service.</p>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={saving ? undefined : onClose}
      title="Predare mașină"
      subtitle="Contract nou de închiriere"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Anulează
          </Button>
          <Button variant="success" icon={KeyRound} loading={saving} onClick={submit}>
            Confirmă predarea
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        <FormSection title="1. Vehicul">
          <Select value={form.vehicle_id} onChange={(e) => chooseVehicle(e.target.value)}>
            {available.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nume_model} — {v.inmatriculare}
              </option>
            ))}
          </Select>
          {(blocking.length > 0 || warnings.length > 0) && (
            <div
              className={`flex gap-2 rounded-lg px-3 py-2 text-sm ${
                blocking.length ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'
              }`}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                {[...blocking, ...warnings].map((d) => (
                  <div key={d.key}>
                    <b>{d.label}</b>: {d.level === 'missing' ? 'dată nesetată' : `${daysLabel(d.days)} (${fmtDate(d.date)})`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </FormSection>

        <FormSection title="2. Client">
          <Tabs
            value={clientMode}
            onChange={setClientMode}
            tabs={[
              { value: 'existing', label: 'Client existent' },
              { value: 'new', label: 'Client nou' },
            ]}
          />
          {clientMode === 'existing' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Caută nume sau telefon…" />
              <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">— alege clientul —</option>
                {filteredClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nume} {c.telefon ? `· ${c.telefon}` : ''}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <ClientFields form={newClient} setForm={setNewClient} compact />
          )}
          {licenseDays !== null && licenseDays < 0 && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Atenție: permisul clientului este expirat.</div>
          )}
        </FormSection>

        <FormSection title="3. Perioadă și preț">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Data și ora predării">
              <Input type="datetime-local" value={form.data_predare} onChange={set('data_predare')} />
            </Field>
            <Field label="Returnare planificată">
              <Input type="datetime-local" value={form.data_returnare_planificata} onChange={set('data_returnare_planificata')} />
            </Field>
            <Field label="Tarif zilnic (RON)">
              <Input type="number" inputMode="decimal" min={0} value={form.tarif_zilnic} onChange={set('tarif_zilnic')} />
            </Field>
            <Field label="Garanție (RON)">
              <Input type="number" inputMode="decimal" min={0} value={form.garantie} onChange={set('garantie')} placeholder="0" />
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-600">
              Estimat: {days} {days === 1 ? 'zi' : 'zile'} × {fmtMoney(form.tarif_zilnic)}
            </span>
            <span className="text-base font-semibold text-slate-900">{fmtMoney(estimate)}</span>
          </div>
        </FormSection>

        <FormSection title="4. Starea mașinii la predare">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Kilometraj la predare">
              <Input type="number" inputMode="numeric" min={0} value={form.km_predare} onChange={set('km_predare')} />
            </Field>
            <Field label="Nivel combustibil">
              <Select value={form.combustibil_predare} onChange={set('combustibil_predare')}>
                {FUEL_LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Observații / daune existente">
            <Textarea value={form.observatii_predare} onChange={set('observatii_predare')} placeholder="ex: zgârietură bară spate dreapta" />
          </Field>
        </FormSection>

        <FormSection title="5. Poze la predare" description="Fotografiază mașina din toate unghiurile, bordul (km, combustibil) și daunele existente.">
          <MediaPicker files={files} onChange={setFiles} />
        </FormSection>

        <UploadProgress text={progress} />
        <ErrorText>{error}</ErrorText>
      </div>
    </Modal>
  )
}
