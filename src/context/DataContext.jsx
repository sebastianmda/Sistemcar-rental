import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { computeAlerts, urgentCount } from '../lib/alerts'
import { friendlyError } from '../lib/errors'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [state, setState] = useState({
    vehicles: [],
    clients: [],
    rentals: [],
    settings: { tarif_zilnic_default: 150 },
    photoUrls: {},
    loading: true,
    error: null,
  })

  const reload = useCallback(async () => {
    try {
      const [vehicles, clients, rentals, settings] = await Promise.all([
        api.listVehicles(),
        api.listClients(),
        api.listRentals(),
        api.getSettings(),
      ])
      // profile photos: private files need temporary links; a failure here must not block the app
      let photoUrls = {}
      try {
        photoUrls = await api.signedUrls(vehicles.map((v) => v.foto_profil))
      } catch (err) {
        console.warn('Poze profil indisponibile', err)
      }
      setState({ vehicles, clients, rentals, settings, photoUrls, loading: false, error: null })
    } catch (err) {
      console.error(err)
      setState((s) => ({ ...s, loading: false, error: friendlyError(err) }))
    }
  }, [])

  useEffect(() => {
    reload()
    // refresh when you come back to the app (e.g. changes made from the phone)
    const onVisible = () => document.visibilityState === 'visible' && reload()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [reload])

  const alerts = useMemo(() => computeAlerts(state.vehicles, state.rentals), [state.vehicles, state.rentals])

  const value = useMemo(
    () => ({
      ...state,
      reload,
      alerts,
      urgent: urgentCount(alerts),
      defaultTariff: Number(state.settings?.tarif_zilnic_default) || 0,
    }),
    [state, reload, alerts]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  return useContext(DataContext)
}
