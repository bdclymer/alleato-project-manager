-- Alleato Project Manager — Supabase Migration
-- Run this in the Supabase SQL Editor or via the exec_sql RPC function.

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  number TEXT,
  description TEXT,
  status TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT,
  file_name TEXT,
  file_url TEXT,
  file_size BIGINT,
  content_type TEXT,
  category TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- RFIs
CREATE TABLE IF NOT EXISTS rfis (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  subject TEXT,
  question TEXT,
  answer TEXT,
  status TEXT,
  priority TEXT,
  assigned_to TEXT,
  created_by TEXT,
  due_date TIMESTAMPTZ,
  responded_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- Submittals
CREATE TABLE IF NOT EXISTS submittals (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT,
  description TEXT,
  status TEXT,
  spec_section TEXT,
  submitted_by TEXT,
  assigned_to TEXT,
  due_date TIMESTAMPTZ,
  approved_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  code TEXT,
  description TEXT,
  original_amount NUMERIC(15,2),
  revised_amount NUMERIC(15,2),
  committed_amount NUMERIC(15,2),
  actual_amount NUMERIC(15,2),
  variance NUMERIC(15,2),
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- Commitment Change Orders
CREATE TABLE IF NOT EXISTS commitment_change_orders (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT,
  description TEXT,
  status TEXT,
  amount NUMERIC(15,2),
  vendor TEXT,
  commitment_id TEXT,
  reason TEXT,
  approved_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- Contract Change Orders
CREATE TABLE IF NOT EXISTS contract_change_orders (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT,
  description TEXT,
  status TEXT,
  amount NUMERIC(15,2),
  contract_id TEXT,
  reason TEXT,
  approved_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- Meeting Minutes
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT,
  meeting_date TIMESTAMPTZ,
  location TEXT,
  attendees JSONB,
  agenda TEXT,
  notes TEXT,
  action_items JSONB,
  status TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attachments_project ON attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_rfis_project ON rfis(project_id);
CREATE INDEX IF NOT EXISTS idx_rfis_status ON rfis(status);
CREATE INDEX IF NOT EXISTS idx_submittals_project ON submittals(project_id);
CREATE INDEX IF NOT EXISTS idx_submittals_status ON submittals(status);
CREATE INDEX IF NOT EXISTS idx_budgets_project ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_ccos_project ON commitment_change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_ctcos_project ON contract_change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_minutes_project ON meeting_minutes(project_id);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment_change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated + anon read access (service role always has full access)
DO $$
BEGIN
  -- Projects
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read' AND tablename = 'projects') THEN
    CREATE POLICY public_read ON projects FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read' AND tablename = 'attachments') THEN
    CREATE POLICY public_read ON attachments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read' AND tablename = 'rfis') THEN
    CREATE POLICY public_read ON rfis FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read' AND tablename = 'submittals') THEN
    CREATE POLICY public_read ON submittals FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read' AND tablename = 'budgets') THEN
    CREATE POLICY public_read ON budgets FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read' AND tablename = 'commitment_change_orders') THEN
    CREATE POLICY public_read ON commitment_change_orders FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read' AND tablename = 'contract_change_orders') THEN
    CREATE POLICY public_read ON contract_change_orders FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read' AND tablename = 'meeting_minutes') THEN
    CREATE POLICY public_read ON meeting_minutes FOR SELECT USING (true);
  END IF;
END $$;
