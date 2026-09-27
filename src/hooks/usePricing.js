import { useEffect, useState } from 'react'
import { pricingService } from '../services/pricingService'

export const usePricing = () => {
  const [defaultTariff, setDefaultTariff] = useState(100)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDefaultTariff = async () => {
      try {
        setLoading(true)
        const tariff = await pricingService.getDefaultTariff()
        setDefaultTariff(tariff)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDefaultTariff()
  }, [])

  const setDefault = async (tariff) => {
    try {
      setError(null)
      await pricingService.setDefaultTariff(tariff)
      setDefaultTariff(tariff)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const setCustom = async (vehicleId, tariff, note) => {
    try {
      setError(null)
      return await pricingService.setCustomTariff(vehicleId, tariff, note)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const getEffective = async (vehicleId) => {
    try {
      return await pricingService.getEffectiveTariff(vehicleId)
    } catch (err) {
      return defaultTariff
    }
  }

  return {
    defaultTariff,
    loading,
    error,
    setDefault,
    setCustom,
    getEffective
  }
}
