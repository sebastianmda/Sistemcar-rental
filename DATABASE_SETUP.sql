-- Tabel Vehicule
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nume_model TEXT NOT NULL,
  inmatriculare TEXT NOT NULL UNIQUE,
  vin TEXT,
  capacitate_pasageri INTEGER DEFAULT 5,
  combustibil TEXT DEFAULT 'Benzina',
  consum_mediu DECIMAL DEFAULT 0,
  pret_achizitie DECIMAL,
  data_achizitie DATE,
  km_actuali INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Disponibil',
  locatie TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Reguli Pricing
CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  tarif_zilnic_custom DECIMAL,
  data_inceput DATE DEFAULT CURRENT_DATE,
  data_sfarsit DATE,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Setări Globale
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  tarif_zilnic_default DECIMAL DEFAULT 100,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert setări default
INSERT INTO settings (id, tarif_zilnic_default)
VALUES ('default-settings', 100)
ON CONFLICT (id) DO NOTHING;

-- Create indexes pentru performance
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_archived ON vehicles(is_archived);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_vehicle_id ON pricing_rules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_data_sfarsit ON pricing_rules(data_sfarsit);

-- Enable RLS (Row Level Security)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all reads on vehicles" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on vehicles" ON vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on vehicles" ON vehicles FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on vehicles" ON vehicles FOR DELETE USING (true);

CREATE POLICY "Allow all reads on pricing_rules" ON pricing_rules FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on pricing_rules" ON pricing_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on pricing_rules" ON pricing_rules FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on pricing_rules" ON pricing_rules FOR DELETE USING (true);

CREATE POLICY "Allow all reads on settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on settings" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on settings" ON settings FOR UPDATE USING (true);
