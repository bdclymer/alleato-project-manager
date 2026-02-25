-- Alleato Project Manager v4 — Remaining module tables
-- Tables for linter-added modules not covered by v2/v3

-- ============================================================
-- COMPANY-LEVEL TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS company_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  project_name TEXT,
  start_date DATE,
  end_date DATE,
  milestone TEXT DEFAULT 'no',
  assigned_to TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  channel TEXT DEFAULT 'general',
  participants TEXT,
  last_message_at TIMESTAMPTZ,
  message TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS planroom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  project_name TEXT,
  bid_date DATE,
  trade TEXT,
  status TEXT DEFAULT 'active',
  description TEXT,
  documents_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_planning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_name TEXT NOT NULL,
  resource_type TEXT DEFAULT 'labor',
  project_name TEXT,
  role TEXT,
  start_date DATE,
  end_date DATE,
  allocation_pct NUMERIC(5,2) DEFAULT 100,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name TEXT NOT NULL,
  date DATE,
  project_name TEXT,
  cost_code TEXT,
  hours_regular NUMERIC(5,2) DEFAULT 0,
  hours_overtime NUMERIC(5,2) DEFAULT 0,
  hours_double NUMERIC(5,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT DEFAULT 'viewer',
  tools_access TEXT DEFAULT 'read_only',
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECT-LEVEL TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS bim_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  discipline TEXT,
  version TEXT,
  file_format TEXT DEFAULT 'ifc',
  file_url TEXT,
  uploaded_by TEXT,
  uploaded_date DATE,
  status TEXT DEFAULT 'current',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coordination_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  discipline TEXT,
  issue_type TEXT DEFAULT 'clash',
  assigned_to TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  location TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  cost_code TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  quantity NUMERIC(15,2),
  unit TEXT,
  unit_cost NUMERIC(15,2),
  total_cost NUMERIC(15,2),
  markup_pct NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  issued_by TEXT,
  issued_to TEXT,
  issued_date DATE,
  due_date DATE,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lien_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  waiver_type TEXT DEFAULT 'conditional_progress',
  amount NUMERIC(15,2),
  through_date DATE,
  status TEXT DEFAULT 'pending',
  signed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS progress_billings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  vendor_name TEXT,
  billing_period TEXT,
  billing_date DATE,
  scheduled_value NUMERIC(15,2),
  previous_completed NUMERIC(15,2) DEFAULT 0,
  work_completed NUMERIC(15,2) DEFAULT 0,
  materials_stored NUMERIC(15,2) DEFAULT 0,
  retainage NUMERIC(15,2) DEFAULT 0,
  net_amount NUMERIC(15,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_bidding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  package_name TEXT NOT NULL,
  trade TEXT,
  description TEXT,
  bid_due_date DATE,
  pre_bid_date DATE,
  estimated_value NUMERIC(15,2),
  invitees_count INTEGER DEFAULT 0,
  bids_received INTEGER DEFAULT 0,
  awarded_to TEXT,
  awarded_amount NUMERIC(15,2),
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_tool TEXT,
  trigger_record_id TEXT,
  current_step TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'pending',
  steps TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_company_schedule_status ON company_schedule(status);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_planroom_status ON planroom(status);
CREATE INDEX IF NOT EXISTS idx_resource_planning_type ON resource_planning(resource_type);
CREATE INDEX IF NOT EXISTS idx_timecards_date ON timecards(date);
CREATE INDEX IF NOT EXISTS idx_timecards_status ON timecards(status);
CREATE INDEX IF NOT EXISTS idx_bim_models_project ON bim_models(project_id);
CREATE INDEX IF NOT EXISTS idx_coordination_issues_project ON coordination_issues(project_id);
CREATE INDEX IF NOT EXISTS idx_estimates_project ON estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_instructions_project ON instructions(project_id);
CREATE INDEX IF NOT EXISTS idx_lien_waivers_project ON lien_waivers(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_billings_project ON progress_billings(project_id);
CREATE INDEX IF NOT EXISTS idx_project_bidding_project ON project_bidding(project_id);
CREATE INDEX IF NOT EXISTS idx_project_workflows_project ON project_workflows(project_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'company_schedule','conversations','planroom','resource_planning',
      'timecards','permission_templates','bim_models','coordination_issues',
      'estimates','instructions','lien_waivers','progress_billings',
      'project_bidding','project_workflows'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read' AND tablename = tbl) THEN
      EXECUTE format('CREATE POLICY public_read ON %I FOR SELECT USING (true)', tbl);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_insert' AND tablename = tbl) THEN
      EXECUTE format('CREATE POLICY public_insert ON %I FOR INSERT WITH CHECK (true)', tbl);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_update' AND tablename = tbl) THEN
      EXECUTE format('CREATE POLICY public_update ON %I FOR UPDATE USING (true)', tbl);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_delete' AND tablename = tbl) THEN
      EXECUTE format('CREATE POLICY public_delete ON %I FOR DELETE USING (true)', tbl);
    END IF;
  END LOOP;
END $$;
