import { supabase } from './supabase'
import { compressImage, mediaType, MAX_FILE_MB } from './media'

const BUCKET = 'rental-media'

const VEHICLE_FIELDS = [
  'nume_model', 'inmatriculare', 'vin', 'an_fabricatie', 'culoare', 'capacitate_pasageri',
  'tip_combustibil', 'cutie_viteze', 'km_actuali', 'status', 'tarif_zilnic',
  'rca_expira', 'itp_expira', 'rovinieta_expira', 'casco_expira', 'observatii',
]
const VEHICLE_NUMBERS = ['an_fabricatie', 'capacitate_pasageri', 'km_actuali', 'tarif_zilnic']

const CLIENT_FIELDS = [
  'nume', 'telefon', 'email', 'cnp', 'act_identitate', 'adresa',
  'permis_numar', 'permis_expira', 'firma', 'cui', 'observatii',
]

// keeps only known columns; empty strings become null (empty dates used to crash inserts)
function clean(data, fields, numbers = []) {
  const out = {}
  for (const f of fields) {
    if (!(f in data)) continue
    let v = data[f]
    if (typeof v === 'string') v = v.trim()
    if (v === '' || v === undefined) v = null
    if (v !== null && numbers.includes(f)) {
      v = Number(v)
      if (!isFinite(v)) v = null
    }
    out[f] = v
  }
  return out
}

async function run(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}

const RENTAL_SELECT =
  '*, vehicle:vehicles(id, nume_model, inmatriculare, km_actuali), client:clients(id, nume, telefon, email, permis_expira)'

export const api = {
  // ---------- vehicles ----------
  listVehicles() {
    return run(
      supabase.from('vehicles').select('*').eq('is_archived', false).order('nume_model', { ascending: true })
    )
  },

  createVehicle(data) {
    const row = clean(data, VEHICLE_FIELDS, VEHICLE_NUMBERS)
    row.inmatriculare = row.inmatriculare?.toUpperCase()
    row.status = row.status || 'Disponibil'
    return run(supabase.from('vehicles').insert(row).select().single())
  },

  updateVehicle(id, data) {
    const row = clean(data, VEHICLE_FIELDS, VEHICLE_NUMBERS)
    if (row.inmatriculare) row.inmatriculare = row.inmatriculare.toUpperCase()
    row.updated_at = new Date().toISOString()
    return run(supabase.from('vehicles').update(row).eq('id', id).select().single())
  },

  archiveVehicle(id) {
    return run(
      supabase.from('vehicles').update({ is_archived: true, updated_at: new Date().toISOString() }).eq('id', id)
    )
  },

  // ---------- clients ----------
  listClients() {
    return run(supabase.from('clients').select('*').order('nume', { ascending: true }))
  },

  createClient(data) {
    return run(supabase.from('clients').insert(clean(data, CLIENT_FIELDS)).select().single())
  },

  updateClient(id, data) {
    return run(supabase.from('clients').update(clean(data, CLIENT_FIELDS)).eq('id', id).select().single())
  },

  deleteClient(id) {
    return run(supabase.from('clients').delete().eq('id', id))
  },

  // ---------- rentals ----------
  listRentals() {
    return run(supabase.from('rentals').select(RENTAL_SELECT).order('data_predare', { ascending: false }))
  },

  async createRental(data) {
    const rental = await run(
      supabase
        .from('rentals')
        .insert({
          vehicle_id: data.vehicle_id,
          client_id: data.client_id,
          status: 'activa',
          data_predare: new Date(data.data_predare).toISOString(),
          data_returnare_planificata: new Date(data.data_returnare_planificata).toISOString(),
          tarif_zilnic: Number(data.tarif_zilnic) || 0,
          garantie: Number(data.garantie) || 0,
          km_predare: data.km_predare === '' ? null : Number(data.km_predare),
          combustibil_predare: data.combustibil_predare || null,
          observatii_predare: data.observatii_predare?.trim() || null,
        })
        .select(RENTAL_SELECT)
        .single()
    )
    const vehicleUpdate = { status: 'În chirie', updated_at: new Date().toISOString() }
    if (rental.km_predare !== null) vehicleUpdate.km_actuali = rental.km_predare
    await run(supabase.from('vehicles').update(vehicleUpdate).eq('id', data.vehicle_id))
    return rental
  },

  async finishRental(rental, data) {
    const updated = await run(
      supabase
        .from('rentals')
        .update({
          status: 'finalizata',
          data_returnare: new Date(data.data_returnare).toISOString(),
          km_primire: data.km_primire === '' ? null : Number(data.km_primire),
          combustibil_primire: data.combustibil_primire || null,
          observatii_primire: data.observatii_primire?.trim() || null,
          total_final: Number(data.total_final) || 0,
        })
        .eq('id', rental.id)
        .select(RENTAL_SELECT)
        .single()
    )
    const vehicleUpdate = {
      status: data.trimite_service ? 'Service' : 'Disponibil',
      updated_at: new Date().toISOString(),
    }
    if (updated.km_primire !== null) vehicleUpdate.km_actuali = updated.km_primire
    await run(supabase.from('vehicles').update(vehicleUpdate).eq('id', rental.vehicle_id))
    return updated
  },

  async cancelRental(rental) {
    await run(supabase.from('rentals').update({ status: 'anulata' }).eq('id', rental.id))
    await run(
      supabase
        .from('vehicles')
        .update({ status: 'Disponibil', updated_at: new Date().toISOString() })
        .eq('id', rental.vehicle_id)
    )
  },

  // ---------- settings ----------
  async getSettings() {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'default_tariff').maybeSingle()
    if (error) throw error
    return data || { id: 'default_tariff', tarif_zilnic_default: 150 }
  },

  saveDefaultTariff(value) {
    return run(
      supabase
        .from('settings')
        .upsert({ id: 'default_tariff', tarif_zilnic_default: Number(value) || 0, updated_at: new Date().toISOString() })
        .select()
        .single()
    )
  },

  // ---------- photos / videos ----------
  async listMedia(rentalId) {
    const rows = await run(
      supabase.from('rental_media').select('*').eq('rental_id', rentalId).order('created_at', { ascending: true })
    )
    if (!rows.length) return []
    const { data: signed, error } = await supabase.storage.from(BUCKET).createSignedUrls(rows.map((r) => r.path), 60 * 60)
    if (error) throw error
    const urls = Object.fromEntries((signed || []).map((s) => [s.path, s.signedUrl]))
    return rows.map((r) => ({ ...r, url: urls[r.path] || null }))
  },

  async uploadMedia(rentalId, etapa, originalFile) {
    const tip = mediaType(originalFile)
    const file = tip === 'foto' ? await compressImage(originalFile) : originalFile
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      throw new Error(`„${originalFile.name}” are peste ${MAX_FILE_MB} MB. Filmează clipuri mai scurte.`)
    }
    const ext = (file.name.split('.').pop() || (tip === 'video' ? 'mp4' : 'jpg')).toLowerCase()
    const path = `${rentalId}/${etapa}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || undefined, upsert: false })
    if (upErr) throw upErr
    return run(supabase.from('rental_media').insert({ rental_id: rentalId, etapa, tip, path }).select().single())
  },

  async uploadMany(rentalId, etapa, files, onProgress) {
    const failed = []
    for (let i = 0; i < files.length; i++) {
      onProgress?.(i + 1, files.length)
      try {
        await api.uploadMedia(rentalId, etapa, files[i])
      } catch (err) {
        failed.push({ file: files[i], err })
      }
    }
    return failed
  },

  async deleteMedia(item) {
    const { error } = await supabase.storage.from(BUCKET).remove([item.path])
    if (error) throw error
    return run(supabase.from('rental_media').delete().eq('id', item.id))
  },
}
