import { useState } from 'react'
import { useVehicles } from '../hooks/useVehicles'
import { usePricing } from '../hooks/usePricing'
import VehicleForm from './VehicleForm'
import PricingManager from './PricingManager'

export default function VehicleList() {
  const { vehicles, loading, error, create, update, archive } = useVehicles()
  const { defaultTariff } = usePricing()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('All')

  const handleDelete = (id) => {
    if (confirm('Sigur dorești să ștergi acest vehicul?')) {
      archive(id)
    }
  }

  const filteredVehicles = filterStatus === 'All'
    ? vehicles
    : vehicles.filter(v => v.status === filterStatus)

  const statuses = ['Disponibil', 'În chirie', 'Service', 'Sold']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Se încarcă...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Flotă Vehicule</h1>
          <p className="text-gray-600 mt-1">Gestionează vehiculele companiei</p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{vehicles.length}</div>
          <div className="text-sm text-gray-600">Total vehicule</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{vehicles.filter(v => v.status === 'Disponibil').length}</div>
          <div className="text-sm text-gray-600">Disponibile</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-orange-600">{vehicles.filter(v => v.status === 'În chirie').length}</div>
          <div className="text-sm text-gray-600">În chirie</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{vehicles.filter(v => v.status === 'Service').length}</div>
          <div className="text-sm text-gray-600">În service</div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                setEditingId(null)
                setIsFormOpen(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              + Adaugă Vehicul
            </button>
            <button
              onClick={() => setIsPricingOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
            >
              ⚙️ Tarife
            </button>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-sm text-gray-600">Filtru:</span>
            {['All', ...statuses].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded text-sm transition ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Modals */}
      {isFormOpen && (
        <VehicleForm
          vehicleId={editingId}
          vehicle={editingId ? vehicles.find(v => v.id === editingId) : null}
          onClose={() => {
            setIsFormOpen(false)
            setEditingId(null)
          }}
          onCreate={create}
          onUpdate={update}
        />
      )}

      {isPricingOpen && (
        <PricingManager
          onClose={() => {
            setIsPricingOpen(false)
            setSelectedVehicleId(null)
          }}
          vehicles={vehicles}
        />
      )}

      {/* Table / Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Nu sunt vehicule în această categorie</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Model</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Înmatriculare</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Km</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tarif zilnic</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{vehicle.nume_model}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{vehicle.inmatriculare}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          vehicle.status === 'Disponibil' ? 'bg-green-100 text-green-800' :
                          vehicle.status === 'În chirie' ? 'bg-blue-100 text-blue-800' :
                          vehicle.status === 'Service' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{vehicle.km_actuali || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{defaultTariff} RON</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingId(vehicle.id)
                            setIsFormOpen(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                        >
                          Editare
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="text-red-600 hover:text-red-900 font-medium text-sm"
                        >
                          Ștergere
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900">{vehicle.nume_model}</h3>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      vehicle.status === 'Disponibil' ? 'bg-green-100 text-green-800' :
                      vehicle.status === 'În chirie' ? 'bg-blue-100 text-blue-800' :
                      vehicle.status === 'Service' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {vehicle.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p><span className="font-medium">Înmatriculare:</span> {vehicle.inmatriculare}</p>
                    <p><span className="font-medium">Km:</span> {vehicle.km_actuali || 0}</p>
                    <p><span className="font-medium">Tarif zilnic:</span> {defaultTariff} RON</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(vehicle.id)
                        setIsFormOpen(true)
                      }}
                      className="flex-1 text-blue-600 hover:text-blue-900 font-medium text-sm py-2"
                    >
                      Editare
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      className="flex-1 text-red-600 hover:text-red-900 font-medium text-sm py-2"
                    >
                      Ștergere
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
