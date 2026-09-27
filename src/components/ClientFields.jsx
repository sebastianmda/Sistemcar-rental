import { Field, Input, Textarea } from './ui'

export const EMPTY_CLIENT = {
  nume: '',
  telefon: '',
  email: '',
  cnp: '',
  act_identitate: '',
  adresa: '',
  permis_numar: '',
  permis_expira: '',
  firma: '',
  cui: '',
  observatii: '',
}

export function clientToForm(client) {
  if (!client) return { ...EMPTY_CLIENT }
  const out = { ...EMPTY_CLIENT }
  for (const k of Object.keys(EMPTY_CLIENT)) {
    const v = client[k]
    out[k] = v === null || v === undefined ? '' : k === 'permis_expira' ? String(v).slice(0, 10) : v
  }
  return out
}

export function validateClient(form) {
  if (!form.nume.trim()) return 'Completează numele clientului.'
  if (!form.telefon.trim()) return 'Completează telefonul clientului.'
  if (form.cnp && !/^\d{13}$/.test(form.cnp.trim())) return 'CNP-ul trebuie să aibă 13 cifre.'
  return null
}

export default function ClientFields({ form, setForm, compact }) {
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Nume și prenume" required>
        <Input value={form.nume} onChange={set('nume')} autoComplete="off" />
      </Field>
      <Field label="Telefon" required>
        <Input type="tel" inputMode="tel" value={form.telefon} onChange={set('telefon')} />
      </Field>
      <Field label="CNP">
        <Input inputMode="numeric" maxLength={13} value={form.cnp} onChange={set('cnp')} />
      </Field>
      <Field label="Act identitate (serie, nr.)">
        <Input value={form.act_identitate} onChange={set('act_identitate')} placeholder="ex: XH 123456" />
      </Field>
      <Field label="Nr. permis conducere">
        <Input value={form.permis_numar} onChange={set('permis_numar')} />
      </Field>
      <Field label="Permis valabil până la">
        <Input type="date" value={form.permis_expira} onChange={set('permis_expira')} />
      </Field>
      <Field label="Email">
        <Input type="email" value={form.email} onChange={set('email')} />
      </Field>
      <Field label="Adresă">
        <Input value={form.adresa} onChange={set('adresa')} />
      </Field>
      {!compact && (
        <>
          <Field label="Firmă (dacă e persoană juridică)">
            <Input value={form.firma} onChange={set('firma')} />
          </Field>
          <Field label="CUI">
            <Input value={form.cui} onChange={set('cui')} />
          </Field>
          <Field label="Observații" className="sm:col-span-2">
            <Textarea value={form.observatii} onChange={set('observatii')} />
          </Field>
        </>
      )}
    </div>
  )
}
