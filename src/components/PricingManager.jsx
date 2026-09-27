import { useState } from 'react'
import { usePricing } from '../hooks/usePricing'

export default function PricingManager({ vehicles, onClose }) {
  const { defaultTariff, setDefault, setCustom, getEffective } = usePricing()
  const [activeTab, setActiveTab] = useState('global')
  const [newDefaultTariff, setNewDefaultTariff] = useState(defaultTariff)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [customTariffs, setCustomTariffs] = useState({})
  const [customNotes, setCustomNotes] = useState({})

  const handleSaveDefault = async () => {
    if (newDefaultTariff <= 0) {
      setError('Tariful trebuie să fie mai mare decât 0')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await setDefault(parseFloat(newDefaultTariff))
      setSuccess('Tariful implicit a fost actualizat')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || 'Eroare la salvarea tarифului')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCustom = async (vehicleId) => {
    const tariff = customTariffs[vehicleId]
    const note = customNotes[vehicleId] || ''

    if (!tariff || tariff <= 0) {
      setError('Tariful trebuie să fie mai mare decât 0')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await setCustom(vehicleId, parseFloat(tariff), note)
      setCustomTariffs(prev => {
        const newTariffs = { ...prev }
        delete newTariffs[vehicleId]
        return newTariffs
      })
      setCustomNotes(prev => {
        const newNotes = { ...prev }
        delete newNotes[vehicleId]
        return newNotes
      })
      setSuccess(`Tariful pentru ${vehicles.find(v => v.id === vehicleId)?.nume_model} a fost actualizat`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || 'Eroare la salvarea tarифului')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomChange = (vehicleId, value) => {
    setCustomTariffs(prev => ({
      ...prev,
      [vehicleId]: value
    }))
  }

  const handleNoteChange = (vehicleId, value) => {
    setCustomNotes(prev => ({
      ...prev,
      [vehicleId]: value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Gestionare Tarife</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 px-6 py-3">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-b border-green-200 text-green-700 px-6 py-3">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b flex gap-4 px-6">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-4 py-4 border-b-2 transition font-medium ${
              activeTab === 'global'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Tarif Implicit
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-4 border-b-2 transition font-medium ${
              activeTab === 'custom'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Tarife Personalizate
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'global' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  Tariful implicit este folosit pentru toate vehiculele care nu au un tarif personalizat.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarif Zilnic Implicit (RON)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newDefaultTariff}
                    onChange={(e) => setNewDefaultTariff(e.target.value)}
                    step="0.01"
                    min="0"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleSaveDefault}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Se salvează...' : 'Salvează'}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong>Tarif curent:</strong> {defaultTariff} RON/zi
                </p>
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-4">
              {vehicles.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nu sunt vehicule disponibile</p>
              ) : (
                <div className="space-y-3">
                  {vehicles.map(vehicle => (
                    <div key={vehicle.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{vehicle.nume_model}</h3>
                          <p className="text-sm text-gray-600">{vehicle.inmatriculare}</p>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          Tarif implicit: {defaultTariff} RON
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tarif Personalizat (RON)
                          </label>
                          <input
                            type="number"
                            value={customTariffs[vehicle.id] || ''}
                            onChange={(e) => handleCustomChange(vehicle.id, e.target.value)}
                            placeholder={`${defaultTariff} (tarif implicit)`}
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Observații (opțional)
                          </label>
                          <textarea
                            value={customNotes[vehicle.id] || ''}
                            onChange={(e) => handleNoteChange(vehicle.id, e.target.value)}
                            placeholder="ex: Client VIP, reducere sezon, etc."
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <button
                          onClick={() => handleSaveCustom(vehicle.id)}
                          disabled={loading || !customTariffs[vehicle.id]}
                          className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {loading ? 'Se salvează...' : 'Aplică Tarif Personalizat'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  )
}
