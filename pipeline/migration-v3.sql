-- Alleato Project Manager v3 — Missing Procore modules
-- Run in Supabase SQL Editor

-- ============================================================
-- COMPANY-LEVEL TABLES
-- ============================================================

-- Cost Catalog (centralized cost code library)
CREATE TABLE IF NOT EXISTS cost_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  description TEXT,
  category TEXT, -- labor, material, equipment, subcontract, other
  unit TEXT, -- LS, LF, SF, EA, HR, CY, etc
  unit_cost NUMERIC(15,2),
  division TEXT, -- CSI division
  status TEXT DEFAULT 'active', -- active, inactive
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company Documents
CREATE TABLE IF NOT EXISTS company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  folder TEXT DEFAULT '/',
  file_name TEXT,
  file_url TEXT,
  file_size BIGINT,
  content_type TEXT,
  version INTEGER DEFAULT 1,
  document_type TEXT DEFAULT 'general', -- template, policy, procedure, form, general
  uploaded_by TEXT,
  description TEXT,
  tags JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active', -- active, archived
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (payment processing and lien waivers)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  payment_type TEXT DEFAULT 'outgoing', -- outgoing, incoming
  payee TEXT,
  payer TEXT,
  amount NUMERIC(15,2),
  payment_date DATE,
  payment_method TEXT DEFAULT 'check', -- check, ach, wire, credit_card
  reference_number TEXT,
  invoice_number TEXT,
  commitment_id UUID REFERENCES commitments(id) ON DELETE SET NULL,
  lien_waiver_status TEXT DEFAULT 'not_required', -- not_required, pending, conditional, unconditional, received
  lien_waiver_type TEXT, -- conditional_progress, unconditional_progress, conditional_final, unconditional_final
  status TEXT DEFAULT 'pending', -- pending, approved, issued, cleared, void
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflows (approval workflow definitions)
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  workflow_type TEXT DEFAULT 'approval', -- approval, review, notification
  trigger_module TEXT, -- rfis, submittals, change_events, owner_invoices, etc
  trigger_event TEXT DEFAULT 'on_create', -- on_create, on_status_change, on_submit
  steps JSONB DEFAULT '[]', -- [{step_number, approver_role, action: approve|review|notify, timeout_days}]
  conditions JSONB DEFAULT '{}', -- {field: value} conditions for triggering
  status TEXT DEFAULT 'active', -- active, inactive, draft
  description TEXT,
  created_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECT-LEVEL TABLES
-- ============================================================

-- Tasks (project task management)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open', -- open, in_progress, completed, on_hold, cancelled
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  assigned_to TEXT,
  created_by TEXT,
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  category TEXT, -- general, safety, quality, design, financial, closeout
  related_module TEXT, -- rfi, submittal, punch_list, inspection, etc
  related_id UUID,
  percent_complete NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forms (custom form templates)
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  form_type TEXT DEFAULT 'checklist', -- checklist, inspection, survey, report, custom
  description TEXT,
  template JSONB DEFAULT '[]', -- [{field_name, field_type, required, options}]
  status TEXT DEFAULT 'active', -- active, archived, draft
  created_by TEXT,
  category TEXT, -- safety, quality, daily, closeout, general
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form Submissions
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  submitted_by TEXT,
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  responses JSONB DEFAULT '{}',
  status TEXT DEFAULT 'submitted', -- draft, submitted, reviewed, approved
  reviewer TEXT,
  reviewed_date TIMESTAMPTZ,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment (project equipment tracking)
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  equipment_type TEXT, -- crane, excavator, loader, forklift, scaffold, generator, compressor, other
  make TEXT,
  model TEXT,
  serial_number TEXT,
  vendor TEXT,
  ownership TEXT DEFAULT 'rented', -- owned, rented, leased
  daily_rate NUMERIC(15,2),
  mobilization_date DATE,
  demobilization_date DATE,
  location TEXT,
  status TEXT DEFAULT 'active', -- active, idle, maintenance, demobilized
  operator TEXT,
  inspection_date DATE,
  inspection_status TEXT, -- pass, fail, due
  hours_used NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials (material tracking and delivery)
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- concrete, steel, lumber, electrical, plumbing, finishes, other
  vendor TEXT,
  quantity_ordered NUMERIC(15,2),
  quantity_received NUMERIC(15,2) DEFAULT 0,
  quantity_installed NUMERIC(15,2) DEFAULT 0,
  unit TEXT, -- EA, LF, SF, CY, TON, GAL, etc
  unit_cost NUMERIC(15,2),
  total_cost NUMERIC(15,2),
  cost_code TEXT,
  order_date DATE,
  expected_delivery DATE,
  actual_delivery DATE,
  location TEXT,
  status TEXT DEFAULT 'ordered', -- ordered, in_transit, received, installed, returned
  po_number TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crews (crew management)
CREATE TABLE IF NOT EXISTS crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trade TEXT,
  foreman TEXT,
  size INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, inactive, mobilizing
  shift TEXT DEFAULT 'day', -- day, night, swing
  start_date DATE,
  end_date DATE,
  daily_rate NUMERIC(15,2),
  cost_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funding (funding source tracking)
CREATE TABLE IF NOT EXISTS funding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  funding_type TEXT DEFAULT 'owner', -- owner, bank, bond, grant, insurance, other
  total_amount NUMERIC(15,2),
  drawn_amount NUMERIC(15,2) DEFAULT 0,
  remaining_amount NUMERIC(15,2) DEFAULT 0,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  account_number TEXT,
  start_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'active', -- active, exhausted, expired, pending
  terms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- T&M Tickets (Time & Material Tickets)
CREATE TABLE IF NOT EXISTS tm_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft', -- draft, submitted, approved, rejected, invoiced
  ticket_date DATE,
  submitted_by TEXT,
  approved_by TEXT,
  vendor TEXT,
  cost_code TEXT,
  labor_hours NUMERIC(10,2) DEFAULT 0,
  labor_amount NUMERIC(15,2) DEFAULT 0,
  material_amount NUMERIC(15,2) DEFAULT 0,
  equipment_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) DEFAULT 0,
  markup_percent NUMERIC(5,2) DEFAULT 0,
  change_event_id UUID REFERENCES change_events(id) ON DELETE SET NULL,
  signature TEXT,
  photos JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cost_catalog_code ON cost_catalog(code);
CREATE INDEX IF NOT EXISTS idx_cost_catalog_category ON cost_catalog(category);
CREATE INDEX IF NOT EXISTS idx_company_docs_folder ON company_documents(folder);
CREATE INDEX IF NOT EXISTS idx_payments_project ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_workflows_module ON workflows(trigger_module);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_forms_project ON forms(project_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_project ON form_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_equipment_project ON equipment(project_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_materials_project ON materials(project_id);
CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);
CREATE INDEX IF NOT EXISTS idx_crews_project ON crews(project_id);
CREATE INDEX IF NOT EXISTS idx_funding_project ON funding(project_id);
CREATE INDEX IF NOT EXISTS idx_tm_tickets_project ON tm_tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_tm_tickets_status ON tm_tickets(status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'cost_catalog','company_documents','payments','workflows',
      'tasks','forms','form_submissions','equipment','materials',
      'crews','funding','tm_tickets'
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
