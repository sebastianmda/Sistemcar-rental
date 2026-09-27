import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion } from 'lucide-react'
import { Badge } from './ui'
import { vehicleDocs } from '../lib/alerts'
import { daysLabel, fmtDate, daysUntil } from '../lib/format'

const LEVEL_TONE = { ok: 'green', warning: 'amber', critical: 'orange', expired: 'red', missing: 'gray' }
const LEVEL_ICON = { ok: ShieldCheck, warning: ShieldAlert, critical: ShieldAlert, expired: ShieldX, missing: ShieldQuestion }

export function DocChips({ vehicle }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {vehicleDocs(vehicle).map((doc) => {
        const Icon = LEVEL_ICON[doc.level]
        const text =
          doc.level === 'missing' ? 'nesetat' : doc.level === 'ok' ? fmtDate(doc.date) : daysLabel(doc.days).replace('expiră ', '')
        return (
          <Badge key={doc.key} tone={LEVEL_TONE[doc.level]} className="gap-1">
            <Icon className="h-3 w-3" />
            <span className="font-semibold">{doc.label}</span>
            <span className="opacity-80">{text}</span>
          </Badge>
        )
      })}
    </div>
  )
}

const VEHICLE_TONE = { Disponibil: 'green', 'În chirie': 'blue', Service: 'amber' }

export function VehicleStatus({ status }) {
  return <Badge tone={VEHICLE_TONE[status] || 'gray'}>{status || '—'}</Badge>
}

export function RentalStatus({ rental }) {
  if (rental.status === 'finalizata') return <Badge tone="gray">Finalizată</Badge>
  if (rental.status === 'anulata') return <Badge tone="red">Anulată</Badge>
  if (new Date(rental.data_returnare_planificata) < new Date()) return <Badge tone="red">Întârziată</Badge>
  return <Badge tone="blue">Activă</Badge>
}

export function LicenseWarning({ client }) {
  if (!client?.permis_expira) return null
  const days = daysUntil(client.permis_expira)
  if (days >= 0) return null
  return <Badge tone="red">Permis expirat ({fmtDate(client.permis_expira)})</Badge>
}
