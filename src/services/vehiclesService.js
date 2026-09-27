import { supabase } from './supabase'

export const vehiclesService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching vehicles:', err)
      return []
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error fetching vehicle:', err)
      return null
    }
  },

  async create(vehicleData) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([{
          ...vehicleData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error creating vehicle:', err)
      throw err
    }
  },

  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error updating vehicle:', err)
      throw err
    }
  },

  async archive(id) {
    try {
      return await this.update(id, { is_archived: true })
    } catch (err) {
      console.error('Error archiving vehicle:', err)
      throw err
    }
  }
}
