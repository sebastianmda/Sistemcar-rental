import { useState, useEffect } from 'react'

export default function VehicleForm({ vehicleId, vehicle, onClose, onCreate, onUpdate }) {
  const [formData, setFormData] = useState({
    nume_model: '',
    inmatriculare: '',
    vin: '',
    capacitate_pasageri: 5,
    tip_combustibil: 'Benzina',
    consum: 0,
    pret_achizitie: 0,
    data_achizitie: '',
    km_achizitie: 0,
    km_actuali: 0,
    status: 'Disponibil',
    locatie: ''
  })

  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle)
    }
  }, [vehicle])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacitate_pasageri' || name === 'consum' || name === 'pret_achizitie' || name === 'km_achizitie' || name === 'km_actuali'
        ? parseFloat(value) || 0
        : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (vehicleId) {
        await onUpdate(vehicleId, formData)
      } else {
        await onCreate(formData)
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Eroare la salvarea vehiculului')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {vehicleId ? 'Editare Vehicul' : 'Adaugă Vehicul Nou'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model Vehicul *
              </label>
              <input
                type="text"
                name="nume_model"
                value={formData.nume_model}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="ex: Toyota Camry 2020"
              />
            </div>

            {/* Registration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Înmatriculare *
              </label>
              <input
                type="text"
                name="inmatriculare"
                value={formData.inmatriculare}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="ex: B 123 ABC"
              />
            </div>

            {/* VIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VIN
              </label>
              <input
                type="text"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="ex: WVW000000000000000"
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacitate Pasageri
              </label>
              <input
                type="number"
                name="capacitate_pasageri"
                value={formData.capacitate_pasageri}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tip Combustibil
              </label>
              <select
                name="tip_combustibil"
                value={formData.tip_combustibil}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option>Benzina</option>
                <option>Diesel</option>
                <option>Hibrid</option>
                <option>Electric</option>
              </select>
            </div>

            {/* Consumption */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consum (L/100km)
              </label>
              <input
                type="number"
                name="consum"
                value={formData.consum}
                onChange={handleChange}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Purchase Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preț Achiziție (RON)
              </label>
              <input
                type="number"
                name="pret_achizitie"
                value={formData.pret_achizitie}
                onChange={handleChange}
                min="0"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Achiziției
              </label>
              <input
                type="date"
                name="data_achizitie"
                value={formData.data_achizitie}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* KM at Purchase */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KM la Achiziție
              </label>
              <input
                type="number"
                name="km_achizitie"
                value={formData.km_achizitie}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Current KM */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KM Actuali
              </label>
              <input
                type="number"
                name="km_actuali"
                value={formData.km_actuali}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option>Disponibil</option>
                <option>În chirie</option>
                <option>Service</option>
                <option>Sold</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Locație
              </label>
              <input
                type="text"
                name="locatie"
                value={formData.locatie}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="ex: Garaj 1"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Anulare
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Se salvează...' : (vehicleId ? 'Actualizează' : 'Adaugă Vehicul')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
