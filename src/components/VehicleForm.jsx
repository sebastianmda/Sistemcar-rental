import { useState } from 'react'
import { Save } from 'lucide-react'
import { Modal, Button, Field, Input, Select, Textarea, FormSection, ErrorText } from './ui'
import { api } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { useToast } from './Toast'

const EMPTY = {
  nume_model: '',
  inmatriculare: '',
  vin: '',
  an_fabricatie: '',
  culoare: '',
  tip_combustibil: 'Benzină',
  cutie_viteze: 'Manuală',
  capacitate_pasageri: 5,
  km_actuali: '',
  tarif_zilnic: '',
  status: 'Disponibil',
  rca_expira: '',
  itp_expira: '',
  rovinieta_expira: '',
  casco_expira: '',
  observatii: '',
}

function toForm(vehicle) {
  if (!vehicle) return EMPTY
  const out = { ...EMPTY }
  for (const k of Object.keys(EMPTY)) {
    const v = vehicle[k]
    out[k] = v === null || v === undefined ? '' : k.endsWith('_expira') ? String(v).slice(0, 10) : v
  }
  return out
}

export default function VehicleForm({ vehicle, defaultTariff, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(() => toForm(vehicle))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const rented = vehicle?.status === 'În chirie'

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e?.preventDefault()
    setError(null)
    if (!form.nume_model.trim() || !form.inmatriculare.trim()) {
      setError('Completează marca/modelul și numărul de înmatriculare.')
      return
    }
    const year = Number(form.an_fabricatie)
    if (form.an_fabricatie && (year < 1980 || year > new Date().getFullYear() + 1)) {
      setError('Anul de fabricație nu este valid.')
      return
    }
    setSaving(true)
    try {
      const data = { ...form }
      if (rented) delete data.status
      if (vehicle) await api.updateVehicle(vehicle.id, data)
      else await api.createVehicle(data)
      toast(vehicle ? 'Vehicul actualizat' : 'Vehicul adăugat')
      onSaved()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={vehicle ? 'Editează vehicul' : 'Adaugă vehicul'}
      subtitle={vehicle ? `${vehicle.nume_model} · ${vehicle.inmatriculare}` : 'Datele mașinii și documentele'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Anulează
          </Button>
          <Button icon={Save} loading={saving} onClick={submit}>
            Salvează
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-7">
        <FormSection title="Identificare">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Marcă și model" required>
              <Input value={form.nume_model} onChange={set('nume_model')} placeholder="ex: Dacia Logan 1.0 TCe" />
            </Field>
            <Field label="Nr. înmatriculare" required>
              <Input
                value={form.inmatriculare}
                onChange={(e) => setForm((f) => ({ ...f, inmatriculare: e.target.value.toUpperCase() }))}
                placeholder="ex: BH 12 SIS"
              />
            </Field>
            <Field label="Serie șasiu (VIN)">
              <Input value={form.vin} onChange={set('vin')} maxLength={17} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="An fabricație">
                <Input type="number" inputMode="numeric" value={form.an_fabricatie} onChange={set('an_fabricatie')} />
              </Field>
              <Field label="Culoare">
                <Input value={form.culoare} onChange={set('culoare')} />
              </Field>
            </div>
            <Field label="Combustibil">
              <Select value={form.tip_combustibil} onChange={set('tip_combustibil')}>
                {['Benzină', 'Motorină', 'Hibrid', 'Electric', 'GPL'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cutie viteze">
                <Select value={form.cutie_viteze} onChange={set('cutie_viteze')}>
                  <option>Manuală</option>
                  <option>Automată</option>
                </Select>
              </Field>
              <Field label="Locuri">
                <Input type="number" inputMode="numeric" min={1} value={form.capacitate_pasageri} onChange={set('capacitate_pasageri')} />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Documente"
          description="Primești alertă cu 30 de zile și cu 7 zile înainte de expirare."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="RCA valabil până la">
              <Input type="date" value={form.rca_expira} onChange={set('rca_expira')} />
            </Field>
            <Field label="ITP valabil până la">
              <Input type="date" value={form.itp_expira} onChange={set('itp_expira')} />
            </Field>
            <Field label="Rovinietă valabilă până la">
              <Input type="date" value={form.rovinieta_expira} onChange={set('rovinieta_expira')} />
            </Field>
            <Field label="CASCO valabil până la" hint="Opțional">
              <Input type="date" value={form.casco_expira} onChange={set('casco_expira')} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Exploatare">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Kilometraj actual">
              <Input type="number" inputMode="numeric" min={0} value={form.km_actuali} onChange={set('km_actuali')} />
            </Field>
            <Field label="Tarif zilnic (RON)" hint={`Gol = tarif implicit (${defaultTariff} RON)`}>
              <Input type="number" inputMode="decimal" min={0} value={form.tarif_zilnic} onChange={set('tarif_zilnic')} />
            </Field>
            <Field label="Status">
              {rented ? (
                <Input value="În chirie" disabled />
              ) : (
                <Select value={form.status} onChange={set('status')}>
                  <option>Disponibil</option>
                  <option>Service</option>
                </Select>
              )}
            </Field>
          </div>
          <Field label="Observații">
            <Textarea value={form.observatii} onChange={set('observatii')} placeholder="Dotări, daune existente, note interne…" />
          </Field>
        </FormSection>
        <ErrorText>{error}</ErrorText>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
