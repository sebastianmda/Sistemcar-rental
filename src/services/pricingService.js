import { supabase } from './supabase'

export const pricingService = {
  async getDefaultTariff() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('tarif_zilnic_default')
        .single()

      if (error) {
        console.warn('No default tariff found, using 100')
        return 100
      }
      return data?.tarif_zilnic_default || 100
    } catch (err) {
      console.error('Error fetching default tariff:', err)
      return 100
    }
  },

  async setDefaultTariff(tariff) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .upsert(
          {
            id: 'default-settings',
            tarif_zilnic_default: tariff
          },
          { onConflict: 'id' }
        )
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error setting default tariff:', err)
      throw err
    }
  },

  async getEffectiveTariff(vehicleId) {
    try {
      const { data: customTariff, error } = await supabase
        .from('pricing_rules')
        .select('tarif_zilnic_custom')
        .eq('vehicle_id', vehicleId)
        .is('data_sfarsit', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (customTariff?.tarif_zilnic_custom) {
        return customTariff.tarif_zilnic_custom
      }

      return this.getDefaultTariff()
    } catch (err) {
      return this.getDefaultTariff()
    }
  },

  async setCustomTariff(vehicleId, tarifZilnic, note = '') {
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .insert([{
          vehicle_id: vehicleId,
          tarif_zilnic_custom: tarifZilnic,
          data_inceput: new Date().toISOString().split('T')[0],
          note
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error setting custom tariff:', err)
      throw err
    }
  },

  async getTariffHistory(vehicleId) {
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching tariff history:', err)
      return []
    }
  }
}
