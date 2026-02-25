-- Alleato Project Manager — Drawings Module Schema
-- Run in Supabase SQL Editor after migration-v2.sql

-- ============================================================
-- DRAWING SETS (groups of related drawings by discipline)
-- ============================================================
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
  status TEXT DEFAULT 'active', -- active, archived, superseded
  auto_number_prefix TEXT, -- e.g. "A-" for architectural sheets
  next_sheet_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawing_sets_project ON drawing_sets(project_id);

-- ============================================================
-- ALTER EXISTING DRAWINGS TABLE (add new columns)
-- ============================================================
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS drawing_set_id UUID REFERENCES drawing_sets(id) ON DELETE SET NULL;
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS current_revision_id UUID;
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS page_number INTEGER;
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS sheet_size TEXT; -- ARCH-D, ARCH-E, ANSI-D, etc.
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

CREATE INDEX IF NOT EXISTS idx_drawings_set ON drawings(drawing_set_id);
CREATE INDEX IF NOT EXISTS idx_drawings_discipline ON drawings(discipline);
CREATE INDEX IF NOT EXISTS idx_drawings_status ON drawings(status);

-- ============================================================
-- DRAWING REVISIONS (version history for each drawing)
-- ============================================================
CREATE TABLE IF NOT EXISTS drawing_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id UUID REFERENCES drawings(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  revision_number TEXT NOT NULL, -- Rev A, Rev B, 1, 2, 3
  revision_date TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  storage_path TEXT, -- path in Supabase Storage
  uploaded_by TEXT,
  status TEXT DEFAULT 'current', -- current, superseded
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawing_revisions_drawing ON drawing_revisions(drawing_id);
CREATE INDEX IF NOT EXISTS idx_drawing_revisions_status ON drawing_revisions(status);

-- ============================================================
-- DRAWING MARKUPS (annotations on drawings)
-- ============================================================
CREATE TABLE IF NOT EXISTS drawing_markups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id UUID REFERENCES drawings(id) ON DELETE CASCADE,
  revision_id UUID REFERENCES drawing_revisions(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  markup_type TEXT NOT NULL, -- pen, line, arrow, rectangle, circle, cloud, text, callout, stamp, dimension, hyperlink
  data JSONB NOT NULL DEFAULT '{}',
  -- data schema varies by type:
  -- pen: { points: [[x,y],...], strokeWidth: 2 }
  -- line/arrow: { x1, y1, x2, y2, strokeWidth: 2 }
  -- rectangle: { x, y, width, height, strokeWidth: 2, filled: false }
  -- circle: { cx, cy, rx, ry, strokeWidth: 2, filled: false }
  -- cloud: { points: [[x,y],...], strokeWidth: 2 }
  -- text/callout: { x, y, text, fontSize: 14, fontWeight: 'normal' }
  -- stamp: { x, y, stampType: 'approved', scale: 1 }
  -- dimension: { x1, y1, x2, y2, distance: '12\'-6"', unit: 'ft' }
  -- hyperlink: { x, y, width, height, linkType: 'drawing|rfi|submittal', linkedId: 'uuid' }
  color TEXT DEFAULT '#FF0000',
  layer TEXT DEFAULT 'default',
  created_by TEXT,
  created_by_color TEXT, -- unique color per user
  visible BOOLEAN DEFAULT true,
  locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawing_markups_drawing ON drawing_markups(drawing_id);
CREATE INDEX IF NOT EXISTS idx_drawing_markups_layer ON drawing_markups(layer);

-- ============================================================
-- DRAWING PINS (location-linked items on drawings)
-- ============================================================
CREATE TABLE IF NOT EXISTS drawing_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id UUID REFERENCES drawings(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  pin_type TEXT NOT NULL, -- punch_list, inspection, rfi, submittal, observation, incident
  linked_id TEXT, -- ID of the linked record (punch list item, inspection, etc.)
  linked_table TEXT, -- table name of linked record
  x_percent NUMERIC(7,4) NOT NULL, -- x position as % of drawing width (0-100)
  y_percent NUMERIC(7,4) NOT NULL, -- y position as % of drawing height (0-100)
  label TEXT,
  status TEXT, -- mirrors the linked item's status
  color TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawing_pins_drawing ON drawing_pins(drawing_id);
CREATE INDEX IF NOT EXISTS idx_drawing_pins_type ON drawing_pins(pin_type);
CREATE INDEX IF NOT EXISTS idx_drawing_pins_linked ON drawing_pins(linked_id);

-- ============================================================
-- DRAWING TRANSMITTALS
-- ============================================================
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
  purpose TEXT DEFAULT 'for_review', -- for_review, for_construction, for_approval, for_information, as_requested
  status TEXT DEFAULT 'draft', -- draft, sent, acknowledged, overdue
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

-- ============================================================
-- TRANSMITTAL ITEMS (drawings included in a transmittal)
-- ============================================================
CREATE TABLE IF NOT EXISTS drawing_transmittal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transmittal_id UUID REFERENCES drawing_transmittals(id) ON DELETE CASCADE,
  drawing_id UUID REFERENCES drawings(id) ON DELETE SET NULL,
  revision_id UUID REFERENCES drawing_revisions(id) ON DELETE SET NULL,
  drawing_number TEXT,
  title TEXT,
  revision TEXT,
  copies INTEGER DEFAULT 1,
  format TEXT DEFAULT 'pdf', -- pdf, dwg, print
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_date TIMESTAMPTZ,
  acknowledged_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transmittal_items_transmittal ON drawing_transmittal_items(transmittal_id);
CREATE INDEX IF NOT EXISTS idx_transmittal_items_drawing ON drawing_transmittal_items(drawing_id);

-- ============================================================
-- MARKUP LAYERS (for organizing markups)
-- ============================================================
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

-- ============================================================
-- ENABLE RLS ON ALL NEW TABLES
-- ============================================================
ALTER TABLE drawing_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_markups ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_transmittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_transmittal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_markup_layers ENABLE ROW LEVEL SECURITY;

-- Allow all operations (app uses service role key)
CREATE POLICY IF NOT EXISTS "allow_all" ON drawing_sets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "allow_all" ON drawing_revisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "allow_all" ON drawing_markups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "allow_all" ON drawing_pins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "allow_all" ON drawing_transmittals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "allow_all" ON drawing_transmittal_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "allow_all" ON drawing_markup_layers FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SUPABASE STORAGE BUCKET
-- ============================================================
-- Note: Create 'drawings' bucket via Supabase Dashboard or API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('drawings', 'drawings', true);
