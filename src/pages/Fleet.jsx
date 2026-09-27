import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Car, Gauge, Fuel, KeyRound } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useToast } from '../components/Toast'
import { api } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { fmtKm, fmtMoney } from '../lib/format'
import { Button, Card, PageHeader, SearchInput, EmptyState, Plate, cx } from '../components/ui'
import { DocChips, VehicleStatus } from '../components/StatusBits'
import VehicleForm from '../components/VehicleForm'

const FILTERS = ['Toate', 'Disponibil', 'În chirie', 'Service']

export default function Fleet({ navigate }) {
  const { vehicles, defaultTariff, reload } = useData()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Toate')
  const [editing, setEditing] = useState(null) // null | 'new' | vehicle

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return vehicles.filter(
      (v) =>
        (filter === 'Toate' || v.status === filter) &&
        (!q || v.nume_model.toLowerCase().includes(q) || v.inmatriculare.toLowerCase().includes(q))
    )
  }, [vehicles, query, filter])

  const remove = async (v) => {
    if (v.status === 'În chirie') {
      toast('Vehiculul este în chirie. Închide mai întâi închirierea.', 'error')
      return
    }
    if (!confirm(`Ștergi ${v.nume_model} (${v.inmatriculare}) din flotă?\nIstoricul închirierilor se păstrează.`)) return
    try {
      await api.archiveVehicle(v.id)
      toast('Vehicul șters din flotă')
      reload()
    } catch (err) {
      toast(friendlyError(err), 'error')
    }
  }

  return (
    <>
      <PageHeader
        title="Flotă"
        subtitle={`${vehicles.length} vehicule`}
        actions={
          <Button icon={Plus} onClick={() => setEditing('new')}>
            Adaugă vehicul
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={query} onChange={setQuery} placeholder="Caută după model sau număr…" className="sm:w-80" />
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cx(
                'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition',
                filter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Nicio mașină în flotă"
          description="Adaugă primul vehicul împreună cu datele de expirare RCA, ITP și rovinietă."
          action={
            <Button icon={Plus} onClick={() => setEditing('new')}>
              Adaugă vehicul
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={Car} title="Niciun rezultat" description="Schimbă filtrul sau căutarea." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((v) => (
            <Card key={v.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900">{v.nume_model}</h3>
                  <div className="mt-1.5">
                    <Plate>{v.inmatriculare}</Plate>
                  </div>
                </div>
                <VehicleStatus status={v.status} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-slate-400" /> {fmtKm(v.km_actuali)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Fuel className="h-3.5 w-3.5 text-slate-400" /> {v.tip_combustibil || '—'}
                </div>
                <div className="text-right font-semibold text-slate-900">
                  {fmtMoney(v.tarif_zilnic ?? defaultTariff)}
                  <span className="font-normal text-slate-500">/zi</span>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <DocChips vehicle={v} />
              </div>

              <div className="mt-4 flex gap-2">
                {v.status === 'Disponibil' && (
                  <Button size="sm" variant="success" icon={KeyRound} onClick={() => navigate('rentals', { newForVehicle: v.id })}>
                    Predă
                  </Button>
                )}
                <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(v)} className="flex-1">
                  Editează
                </Button>
                <Button size="sm" variant="dangerGhost" icon={Trash2} onClick={() => remove(v)} aria-label="Șterge" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <VehicleForm
          vehicle={editing === 'new' ? null : editing}
          defaultTariff={defaultTariff}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </>
  )
}
