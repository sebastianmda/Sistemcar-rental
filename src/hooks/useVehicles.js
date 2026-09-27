import { useEffect, useState } from 'react'
import { vehiclesService } from '../services/vehiclesService'
import { supabase } from '../services/supabase'

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await vehiclesService.getAll()
      setVehicles(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()

    const subscription = supabase
      .channel('vehicles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehicles' },
        (payload) => {
          if (payload.eventType === 'DELETE' || payload.new?.is_archived) {
            setVehicles(v => v.filter(vehicle => vehicle.id !== payload.old.id))
          } else if (payload.eventType === 'INSERT') {
            setVehicles(v => [payload.new, ...v])
          } else if (payload.eventType === 'UPDATE') {
            setVehicles(v => v.map(vehicle =>
              vehicle.id === payload.new.id ? payload.new : vehicle
            ))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const create = async (vehicleData) => {
    try {
      setError(null)
      const newVehicle = await vehiclesService.create(vehicleData)
      setVehicles(v => [newVehicle, ...v])
      return newVehicle
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const update = async (id, updates) => {
    try {
      setError(null)
      const updatedVehicle = await vehiclesService.update(id, updates)
      setVehicles(v => v.map(vehicle =>
        vehicle.id === id ? updatedVehicle : vehicle
      ))
      return updatedVehicle
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const archive = async (id) => {
    try {
      setError(null)
      await vehiclesService.archive(id)
      setVehicles(v => v.filter(vehicle => vehicle.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    vehicles,
    loading,
    error,
    create,
    update,
    archive,
    refetch: fetchVehicles
  }
}
