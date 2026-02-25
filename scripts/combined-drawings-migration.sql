-- ============================================================
-- COMBINED DRAWINGS MODULE MIGRATION
-- Run this entire file in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/tsilifkuwjbafxorsdph/sql/new
-- ============================================================

-- Step 1: Create base drawings table (if not exists from migration-v2)
CREATE TABLE IF NOT EXISTS drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  set_name TEXT,
  drawing_number TEXT,
  title TEXT,
  discipline TEXT,
  revision TEXT,
  revision_date TIMESTAMPTZ,
  received_date TIMESTAMPTZ,
  status TEXT DEFAULT 'current',
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  markups JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Drawing Sets
CREATE TABLE IF NOT EXISTS drawing_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  set_number TEXT,
  discipline TEXT DEFAULT 'architectural',
  description TEXT,
  received_date TIMESTAMPTZ,
  issued_date TIMESTAMPTZ,
  issued_by TEXT,
  status TEXT DEFAULT 'active',
  auto_number_prefix TEXT,
  next_sheet_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawing_sets_project ON drawing_sets(project_id);

-- Step 3: Extend drawings table
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS drawing_set_id UUID REFERENCES drawing_sets(id) ON DELETE SET NULL;
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS current_revision_id UUID;
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS page_number INTEGER;
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS sheet_size TEXT;
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

CREATE INDEX IF NOT EXISTS idx_drawings_set ON drawings(drawing_set_id);
CREATE INDEX IF NOT EXISTS idx_drawings_discipline ON drawings(discipline);
CREATE INDEX IF NOT EXISTS idx_drawings_status ON drawings(status);

-- Step 4: Drawing Revisions
CREATE TABLE IF NOT EXISTS drawing_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id UUID REFERENCES drawings(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  revision_number TEXT NOT NULL,
  revision_date TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  storage_path TEXT,
  uploaded_by TEXT,
  status TEXT DEFAULT 'current',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawing_revisions_drawing ON drawing_revisions(drawing_id);
CREATE INDEX IF NOT EXISTS idx_drawing_revisions_status ON drawing_revisions(status);

-- Step 5: Drawing Markups
CREATE TABLE IF NOT EXISTS drawing_markups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id UUID REFERENCES drawings(id) ON DELETE CASCADE,
  revision_id UUID REFERENCES drawing_revisions(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  markup_type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  color TEXT DEFAULT '#FF0000',
  layer TEXT DEFAULT 'default',
  created_by TEXT,
  created_by_color TEXT,
  visible BOOLEAN DEFAULT true,
  locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawing_markups_drawing ON drawing_markups(drawing_id);
CREATE INDEX IF NOT EXISTS idx_drawing_markups_layer ON drawing_markups(layer);

-- Step 6: Drawing Pins
CREATE TABLE IF NOT EXISTS drawing_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id UUID REFERENCES drawings(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  pin_type TEXT NOT NULL,
  linked_id TEXT,
  linked_table TEXT,
  x_percent NUMERIC(7,4) NOT NULL,
  y_percent NUMERIC(7,4) NOT NULL,
  label TEXT,
  status TEXT,
  color TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawing_pins_drawing ON drawing_pins(drawing_id);
CREATE INDEX IF NOT EXISTS idx_drawing_pins_type ON drawing_pins(pin_type);
CREATE INDEX IF NOT EXISTS idx_drawing_pins_linked ON drawing_pins(linked_id);

-- Step 7: Drawing Transmittals
CREATE TABLE IF NOT EXISTS drawing_transmittals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  transmittal_number TEXT NOT NULL,
  subject TEXT,
  to_company TEXT,
  to_contact TEXT,
  to_email TEXT,
  from_company TEXT,
  from_contact TEXT,
  from_email TEXT,
  sent_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  purpose TEXT DEFAULT 'for_review',
  status TEXT DEFAULT 'draft',
  cover_notes TEXT,
  signature_required BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawing_transmittals_project ON drawing_transmittals(project_id);
CREATE INDEX IF NOT EXISTS idx_drawing_transmittals_status ON drawing_transmittals(status);

-- Auto-generate transmittal numbers
CREATE OR REPLACE FUNCTION generate_transmittal_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transmittal_number IS NULL OR NEW.transmittal_number = '' THEN
    NEW.transmittal_number := 'T-' || LPAD(
      (SELECT COALESCE(MAX(CAST(SUBSTRING(transmittal_number FROM 3) AS INTEGER)), 0) + 1
       FROM drawing_transmittals WHERE project_id = NEW.project_id)::TEXT,
      4, '0'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transmittal_number ON drawing_transmittals;
CREATE TRIGGER trg_transmittal_number
  BEFORE INSERT ON drawing_transmittals
  FOR EACH ROW EXECUTE FUNCTION generate_transmittal_number();

-- Step 8: Transmittal Items
CREATE TABLE IF NOT EXISTS drawing_transmittal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transmittal_id UUID REFERENCES drawing_transmittals(id) ON DELETE CASCADE,
  drawing_id UUID REFERENCES drawings(id) ON DELETE SET NULL,
  revision_id UUID REFERENCES drawing_revisions(id) ON DELETE SET NULL,
  drawing_number TEXT,
  title TEXT,
  revision TEXT,
  copies INTEGER DEFAULT 1,
  format TEXT DEFAULT 'pdf',
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_date TIMESTAMPTZ,
  acknowledged_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transmittal_items_transmittal ON drawing_transmittal_items(transmittal_id);
CREATE INDEX IF NOT EXISTS idx_transmittal_items_drawing ON drawing_transmittal_items(drawing_id);

-- Step 9: Markup Layers
CREATE TABLE IF NOT EXISTS drawing_markup_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id UUID REFERENCES drawings(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#FF0000',
  visible BOOLEAN DEFAULT true,
  locked BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_markup_layers_drawing ON drawing_markup_layers(drawing_id);

-- Step 10: Enable RLS
ALTER TABLE drawing_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_markups ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_transmittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_transmittal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_markup_layers ENABLE ROW LEVEL SECURITY;

-- Step 11: Allow all operations (app uses service role key)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drawing_sets' AND policyname = 'allow_all') THEN
    CREATE POLICY "allow_all" ON drawing_sets FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drawing_revisions' AND policyname = 'allow_all') THEN
    CREATE POLICY "allow_all" ON drawing_revisions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drawing_markups' AND policyname = 'allow_all') THEN
    CREATE POLICY "allow_all" ON drawing_markups FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drawing_pins' AND policyname = 'allow_all') THEN
    CREATE POLICY "allow_all" ON drawing_pins FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drawing_transmittals' AND policyname = 'allow_all') THEN
    CREATE POLICY "allow_all" ON drawing_transmittals FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drawing_transmittal_items' AND policyname = 'allow_all') THEN
    CREATE POLICY "allow_all" ON drawing_transmittal_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drawing_markup_layers' AND policyname = 'allow_all') THEN
    CREATE POLICY "allow_all" ON drawing_markup_layers FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Also ensure drawings and its RLS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drawings' AND policyname = 'allow_all') THEN
    ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "allow_all" ON drawings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- MIGRATION COMPLETE
-- The 'drawings' storage bucket should already be created.
-- ============================================================
