import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useToast } from './Toast'
import { api } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { toLocalInput, rentalDays, fmtMoney, fmtDateTime, fmtKm } from '../lib/format'
import { Modal, Button, Field, Input, Select, Textarea, FormSection, ErrorText, InfoRow, Card } from './ui'
import { MediaPicker, UploadProgress } from './Media'
import { FUEL_LEVELS } from './HandoverForm'

export default function ReturnForm({ rental, onClose, onDone }) {
  const toast = useToast()
  const initialReturn = toLocalInput(new Date())
  const initialDays = rentalDays(rental.data_predare, initialReturn)
  const [form, setForm] = useState({
    data_returnare: initialReturn,
    km_primire: rental.km_predare ?? '',
    combustibil_primire: rental.combustibil_predare || 'Plin',
    observatii_primire: '',
    total_final: initialDays * Number(rental.tarif_zilnic || 0),
    trimite_service: false,
  })
  const [totalEdited, setTotalEdited] = useState(false)
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)

  const days = rentalDays(rental.data_predare, form.data_returnare)
  const computed = days * Number(rental.tarif_zilnic || 0)
  const kmDriven =
    form.km_primire !== '' && rental.km_predare !== null ? Number(form.km_primire) - Number(rental.km_predare) : null

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const changeReturnDate = (e) => {
    const value = e.target.value
    setForm((f) => ({
      ...f,
      data_returnare: value,
      total_final: totalEdited ? f.total_final : rentalDays(rental.data_predare, value) * Number(rental.tarif_zilnic || 0),
    }))
  }

  const submit = async () => {
    setError(null)
    if (kmDriven !== null && kmDriven < 0) return setError('Kilometrajul la primire nu poate fi mai mic decât la predare.')
    setSaving(true)
    try {
      setProgress('Se salvează primirea…')
      await api.finishRental(rental, form)
      if (files.length) {
        const failed = await api.uploadMany(rental.id, 'primire', files, (i, n) => setProgress(`Se încarcă pozele ${i}/${n}…`))
        if (failed.length) toast(`${failed.length} poză(e) nu s-au încărcat. Le poți adăuga din detaliile închirierii.`, 'error')
      }
      toast('Mașina a fost primită')
      onDone()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSaving(false)
      setProgress(null)
    }
  }

  return (
    <Modal
      open
      onClose={saving ? undefined : onClose}
      title="Primire mașină"
      subtitle={`${rental.vehicle?.nume_model ?? ''} · ${rental.vehicle?.inmatriculare ?? ''} — ${rental.client?.nume ?? ''}`}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Anulează
          </Button>
          <Button icon={CheckCircle2} loading={saving} onClick={submit}>
            Confirmă primirea
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        <Card className="bg-slate-50 px-4 py-2">
          <InfoRow label="Predată la">{fmtDateTime(rental.data_predare)}</InfoRow>
          <InfoRow label="Km la predare">{fmtKm(rental.km_predare)}</InfoRow>
          <InfoRow label="Combustibil la predare">{rental.combustibil_predare}</InfoRow>
          <InfoRow label="Tarif zilnic">{fmtMoney(rental.tarif_zilnic)}</InfoRow>
          {Number(rental.garantie) > 0 && <InfoRow label="Garanție încasată">{fmtMoney(rental.garantie)}</InfoRow>}
        </Card>

        <FormSection title="Starea mașinii la primire">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Data și ora primirii">
              <Input type="datetime-local" value={form.data_returnare} onChange={changeReturnDate} />
            </Field>
            <Field label="Kilometraj la primire" hint={kmDriven !== null && kmDriven >= 0 ? `Parcurși: ${fmtKm(kmDriven)}` : null}>
              <Input type="number" inputMode="numeric" min={0} value={form.km_primire} onChange={set('km_primire')} />
            </Field>
            <Field label="Nivel combustibil">
              <Select value={form.combustibil_primire} onChange={set('combustibil_primire')}>
                {FUEL_LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Observații / daune noi">
            <Textarea value={form.observatii_primire} onChange={set('observatii_primire')} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.trimite_service}
              onChange={(e) => setForm((f) => ({ ...f, trimite_service: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300"
            />
            Trimite mașina în service după primire
          </label>
        </FormSection>

        <FormSection title="Poze la primire">
          <MediaPicker files={files} onChange={setFiles} />
        </FormSection>

        <FormSection title="Decont">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Calculat: {days} {days === 1 ? 'zi' : 'zile'} × {fmtMoney(rental.tarif_zilnic)} = <b className="text-slate-900">{fmtMoney(computed)}</b>
            </div>
            <Field label="Total de plată (RON)" hint="Poți modifica (reduceri, daune, combustibil lipsă)">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                value={form.total_final}
                onChange={(e) => {
                  setTotalEdited(true)
                  set('total_final')(e)
                }}
              />
            </Field>
          </div>
        </FormSection>

        <UploadProgress text={progress} />
        <ErrorText>{error}</ErrorText>
      </div>
    </Modal>
  )
}
