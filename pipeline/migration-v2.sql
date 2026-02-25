-- Alleato Project Manager v2 — Full Procore-equivalent schema
-- Run in Supabase SQL Editor

-- ============================================================
-- COMPANY-LEVEL TABLES
-- ============================================================

-- Company Directory (employees, subs, vendors)
CREATE TABLE IF NOT EXISTS directory_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT,
  contact_type TEXT DEFAULT 'subcontractor', -- employee, subcontractor, vendor, architect, engineer, owner
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  title TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  license_number TEXT,
  insurance_expiry TIMESTAMPTZ,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  prequalified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active', -- active, inactive, pending
  notes TEXT,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bids
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  bid_package TEXT,
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft', -- draft, invited, submitted, awarded, rejected, withdrawn
  bidder_id UUID REFERENCES directory_contacts(id) ON DELETE SET NULL,
  bidder_name TEXT,
  bid_amount NUMERIC(15,2),
  due_date TIMESTAMPTZ,
  submitted_date TIMESTAMPTZ,
  awarded_date TIMESTAMPTZ,
  scope_of_work TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prequalification
CREATE TABLE IF NOT EXISTS prequalifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES directory_contacts(id) ON DELETE CASCADE,
  company_name TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, expired
  submitted_date TIMESTAMPTZ,
  reviewed_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  reviewer TEXT,
  score NUMERIC(5,2),
  financial_rating TEXT,
  safety_rating TEXT,
  experience_rating TEXT,
  bonding_capacity NUMERIC(15,2),
  emr NUMERIC(5,3),
  osha_recordable_rate NUMERIC(5,3),
  questionnaire JSONB DEFAULT '{}',
  documents JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Action Plans (company level)
CREATE TABLE IF NOT EXISTS action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  plan_type TEXT DEFAULT 'general', -- general, safety, quality, environmental
  status TEXT DEFAULT 'draft', -- draft, active, completed, cancelled
  assigned_to TEXT,
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  checklist JSONB DEFAULT '[]',
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Correspondence
CREATE TABLE IF NOT EXISTS correspondence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  correspondence_type TEXT DEFAULT 'letter', -- letter, notice, memo, rfi_response, transmittal
  number TEXT,
  subject TEXT,
  from_company TEXT,
  from_contact TEXT,
  to_company TEXT,
  to_contact TEXT,
  cc TEXT,
  body TEXT,
  status TEXT DEFAULT 'draft', -- draft, sent, received, replied
  sent_date TIMESTAMPTZ,
  received_date TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training
CREATE TABLE IF NOT EXISTS training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  training_type TEXT DEFAULT 'safety', -- safety, osha, equipment, orientation, other
  description TEXT,
  instructor TEXT,
  location TEXT,
  training_date TIMESTAMPTZ,
  duration_hours NUMERIC(5,2),
  attendees JSONB DEFAULT '[]',
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled
  certification_required BOOLEAN DEFAULT false,
  expiry_period_days INTEGER,
  materials JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECT-LEVEL TABLES
-- ============================================================

-- Daily Logs
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  weather_condition TEXT, -- sunny, cloudy, rain, snow, fog, wind
  temperature_high INTEGER,
  temperature_low INTEGER,
  wind_speed TEXT,
  precipitation TEXT,
  manpower JSONB DEFAULT '[]', -- [{company, trade, headcount, hours}]
  equipment JSONB DEFAULT '[]', -- [{name, quantity, hours, idle_hours}]
  visitors JSONB DEFAULT '[]', -- [{name, company, purpose}]
  work_performed TEXT,
  delays TEXT,
  safety_notes TEXT,
  materials_received TEXT,
  photos JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft', -- draft, submitted, approved
  created_by TEXT,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Punch List
CREATE TABLE IF NOT EXISTS punch_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number SERIAL,
  title TEXT,
  description TEXT,
  location TEXT,
  trade TEXT,
  status TEXT DEFAULT 'open', -- open, in_progress, ready_for_review, closed, void
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  assigned_to TEXT,
  ball_in_court TEXT,
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  approved_date TIMESTAMPTZ,
  created_by TEXT,
  photos JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drawings
CREATE TABLE IF NOT EXISTS drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  set_name TEXT,
  drawing_number TEXT,
  title TEXT,
  discipline TEXT, -- architectural, structural, mechanical, electrical, plumbing, civil
  revision TEXT,
  revision_date TIMESTAMPTZ,
  received_date TIMESTAMPTZ,
  status TEXT DEFAULT 'current', -- current, superseded, void
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  markups JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Specifications
CREATE TABLE IF NOT EXISTS specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  section_number TEXT,
  title TEXT,
  division TEXT,
  revision TEXT,
  revision_date TIMESTAMPTZ,
  status TEXT DEFAULT 'current',
  file_url TEXT,
  file_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule Tasks (Gantt)
CREATE TABLE IF NOT EXISTS schedule_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES schedule_tasks(id) ON DELETE SET NULL,
  task_name TEXT,
  wbs TEXT,
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  percent_complete NUMERIC(5,2) DEFAULT 0,
  assigned_to TEXT,
  predecessors JSONB DEFAULT '[]',
  milestone BOOLEAN DEFAULT false,
  critical_path BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed, delayed
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prime Contracts
CREATE TABLE IF NOT EXISTS prime_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft', -- draft, pending, approved, executed, closed
  owner_company TEXT,
  contract_amount NUMERIC(15,2),
  executed_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  retainage_percent NUMERIC(5,2) DEFAULT 10,
  billing_schedule TEXT DEFAULT 'monthly',
  schedule_of_values JSONB DEFAULT '[]', -- [{code, description, value, billed, remaining}]
  terms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commitments (Subcontracts & POs)
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT,
  commitment_type TEXT DEFAULT 'subcontract', -- subcontract, purchase_order
  vendor_id UUID REFERENCES directory_contacts(id) ON DELETE SET NULL,
  vendor_name TEXT,
  status TEXT DEFAULT 'draft', -- draft, pending, approved, executed, closed, void
  contract_amount NUMERIC(15,2),
  executed_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  retainage_percent NUMERIC(5,2) DEFAULT 10,
  scope_of_work TEXT,
  schedule_of_values JSONB DEFAULT '[]',
  cost_code TEXT,
  terms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Change Events (Potential Change Orders)
CREATE TABLE IF NOT EXISTS change_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'open', -- open, pending, approved, rejected, void
  event_type TEXT DEFAULT 'owner', -- owner, design, field, unforeseen
  estimated_amount NUMERIC(15,2),
  origin TEXT, -- rfi, field_directive, design_change, owner_request
  origin_id UUID,
  cost_code TEXT,
  assigned_to TEXT,
  created_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Owner Invoices (Billing Applications)
CREATE TABLE IF NOT EXISTS owner_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES prime_contracts(id) ON DELETE SET NULL,
  number TEXT,
  billing_period_start DATE,
  billing_period_end DATE,
  status TEXT DEFAULT 'draft', -- draft, submitted, approved, paid, rejected
  scheduled_value NUMERIC(15,2),
  work_completed_previous NUMERIC(15,2) DEFAULT 0,
  work_completed_current NUMERIC(15,2) DEFAULT 0,
  materials_stored NUMERIC(15,2) DEFAULT 0,
  total_completed NUMERIC(15,2) DEFAULT 0,
  retainage NUMERIC(15,2) DEFAULT 0,
  amount_due NUMERIC(15,2) DEFAULT 0,
  line_items JSONB DEFAULT '[]',
  submitted_date TIMESTAMPTZ,
  approved_date TIMESTAMPTZ,
  paid_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcontractor Invoices (Pay Applications)
CREATE TABLE IF NOT EXISTS subcontractor_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  commitment_id UUID REFERENCES commitments(id) ON DELETE SET NULL,
  vendor_name TEXT,
  number TEXT,
  billing_period_start DATE,
  billing_period_end DATE,
  status TEXT DEFAULT 'draft', -- draft, submitted, approved, paid, rejected
  scheduled_value NUMERIC(15,2),
  work_completed_previous NUMERIC(15,2) DEFAULT 0,
  work_completed_current NUMERIC(15,2) DEFAULT 0,
  materials_stored NUMERIC(15,2) DEFAULT 0,
  total_completed NUMERIC(15,2) DEFAULT 0,
  retainage NUMERIC(15,2) DEFAULT 0,
  amount_due NUMERIC(15,2) DEFAULT 0,
  line_items JSONB DEFAULT '[]',
  submitted_date TIMESTAMPTZ,
  approved_date TIMESTAMPTZ,
  paid_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Direct Costs
CREATE TABLE IF NOT EXISTS direct_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  cost_type TEXT DEFAULT 'expense', -- labor, expense, equipment, other
  description TEXT,
  vendor TEXT,
  cost_code TEXT,
  amount NUMERIC(15,2),
  quantity NUMERIC(10,2) DEFAULT 1,
  unit TEXT,
  unit_cost NUMERIC(15,2),
  invoice_number TEXT,
  cost_date DATE,
  status TEXT DEFAULT 'pending', -- pending, approved, paid
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  folder TEXT DEFAULT '/',
  name TEXT,
  file_name TEXT,
  file_url TEXT,
  file_size BIGINT,
  content_type TEXT,
  version INTEGER DEFAULT 1,
  is_private BOOLEAN DEFAULT false,
  uploaded_by TEXT,
  description TEXT,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  album TEXT DEFAULT 'General',
  title TEXT,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  location TEXT,
  trade TEXT,
  tags JSONB DEFAULT '[]',
  taken_date TIMESTAMPTZ,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timesheets
CREATE TABLE IF NOT EXISTS timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  employee_name TEXT,
  employee_id UUID REFERENCES directory_contacts(id) ON DELETE SET NULL,
  timesheet_date DATE,
  hours_regular NUMERIC(5,2) DEFAULT 0,
  hours_overtime NUMERIC(5,2) DEFAULT 0,
  hours_double NUMERIC(5,2) DEFAULT 0,
  cost_code TEXT,
  trade TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, submitted, approved, rejected
  approved_by TEXT,
  approved_date TIMESTAMPTZ,
  billable BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inspections
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT,
  inspection_type TEXT DEFAULT 'quality', -- quality, safety, code, pre-pour, MEP
  template TEXT,
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, passed, failed, requires_action
  inspector TEXT,
  trade TEXT,
  location TEXT,
  inspection_date TIMESTAMPTZ,
  checklist JSONB DEFAULT '[]', -- [{item, status, notes, photo}]
  result TEXT, -- pass, fail, conditional
  signature TEXT,
  deficiencies JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Observations
CREATE TABLE IF NOT EXISTS observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT,
  observation_type TEXT DEFAULT 'safety', -- safety, quality, commissioning, environmental
  status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed, void
  priority TEXT DEFAULT 'medium',
  location TEXT,
  trade TEXT,
  assigned_to TEXT,
  observed_by TEXT,
  observed_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  resolved_date TIMESTAMPTZ,
  description TEXT,
  corrective_action TEXT,
  photos JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT,
  incident_type TEXT DEFAULT 'near_miss', -- near_miss, first_aid, recordable, lost_time, property_damage, environmental
  severity TEXT DEFAULT 'low', -- low, medium, high, critical
  status TEXT DEFAULT 'reported', -- reported, investigating, corrective_action, closed
  incident_date TIMESTAMPTZ,
  incident_time TEXT,
  location TEXT,
  description TEXT,
  injured_party TEXT,
  injury_type TEXT,
  body_part TEXT,
  witness TEXT,
  root_cause TEXT,
  corrective_actions JSONB DEFAULT '[]',
  osha_recordable BOOLEAN DEFAULT false,
  osha_case_number TEXT,
  days_away INTEGER DEFAULT 0,
  days_restricted INTEGER DEFAULT 0,
  reported_by TEXT,
  investigated_by TEXT,
  photos JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emails
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  subject TEXT,
  from_address TEXT,
  to_addresses JSONB DEFAULT '[]',
  cc_addresses JSONB DEFAULT '[]',
  body TEXT,
  status TEXT DEFAULT 'draft', -- draft, sent, received
  sent_date TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]',
  related_type TEXT, -- rfi, submittal, change_order, etc
  related_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transmittals
CREATE TABLE IF NOT EXISTS transmittals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  subject TEXT,
  from_company TEXT,
  from_contact TEXT,
  to_company TEXT,
  to_contact TEXT,
  sent_via TEXT DEFAULT 'email', -- email, mail, hand_delivery, courier
  status TEXT DEFAULT 'draft', -- draft, sent, received, acknowledged
  sent_date TIMESTAMPTZ,
  items JSONB DEFAULT '[]', -- [{type, number, title, copies, status}]
  remarks TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warranties
CREATE TABLE IF NOT EXISTS warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  vendor TEXT,
  vendor_id UUID REFERENCES directory_contacts(id) ON DELETE SET NULL,
  warranty_type TEXT DEFAULT 'standard', -- standard, extended, manufacturer, labor
  start_date DATE,
  end_date DATE,
  duration_years NUMERIC(4,1),
  status TEXT DEFAULT 'active', -- active, expired, claimed, void
  scope TEXT,
  terms TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  documents JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Directory (project-specific contacts and roles)
CREATE TABLE IF NOT EXISTS project_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES directory_contacts(id) ON DELETE CASCADE,
  role TEXT, -- project_manager, superintendent, foreman, architect, engineer, owner_rep, inspector
  permissions JSONB DEFAULT '[]',
  added_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, contact_id)
);

-- Reports (saved/custom reports)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT,
  report_type TEXT DEFAULT 'custom', -- custom, standard, financial, safety, schedule
  description TEXT,
  filters JSONB DEFAULT '{}',
  columns JSONB DEFAULT '[]',
  data_source TEXT, -- rfis, submittals, budget, daily_logs, etc
  format TEXT DEFAULT 'table', -- table, chart, summary
  schedule TEXT, -- daily, weekly, monthly, on_demand
  last_run TIMESTAMPTZ,
  created_by TEXT,
  shared_with JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add project_type and stage columns to projects table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_type') THEN
    ALTER TABLE projects ADD COLUMN project_type TEXT DEFAULT 'commercial';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'stage') THEN
    ALTER TABLE projects ADD COLUMN stage TEXT DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'region') THEN
    ALTER TABLE projects ADD COLUMN region TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_manager') THEN
    ALTER TABLE projects ADD COLUMN project_manager TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'superintendent') THEN
    ALTER TABLE projects ADD COLUMN superintendent TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'contract_value') THEN
    ALTER TABLE projects ADD COLUMN contract_value NUMERIC(15,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'square_footage') THEN
    ALTER TABLE projects ADD COLUMN square_footage INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'owner_name') THEN
    ALTER TABLE projects ADD COLUMN owner_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'architect_name') THEN
    ALTER TABLE projects ADD COLUMN architect_name TEXT;
  END IF;
  -- Add ball_in_court to rfis
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rfis' AND column_name = 'ball_in_court') THEN
    ALTER TABLE rfis ADD COLUMN ball_in_court TEXT;
  END IF;
  -- Add ball_in_court to submittals
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submittals' AND column_name = 'ball_in_court') THEN
    ALTER TABLE submittals ADD COLUMN ball_in_court TEXT;
  END IF;
END $$;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_directory_type ON directory_contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_directory_status ON directory_contacts(status);
CREATE INDEX IF NOT EXISTS idx_bids_project ON bids(project_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);
CREATE INDEX IF NOT EXISTS idx_prequal_contact ON prequalifications(contact_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_project ON action_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_correspondence_project ON correspondence(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_project ON daily_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_punch_list_project ON punch_list_items(project_id);
CREATE INDEX IF NOT EXISTS idx_punch_list_status ON punch_list_items(status);
CREATE INDEX IF NOT EXISTS idx_drawings_project ON drawings(project_id);
CREATE INDEX IF NOT EXISTS idx_specifications_project ON specifications(project_id);
CREATE INDEX IF NOT EXISTS idx_schedule_project ON schedule_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_prime_contracts_project ON prime_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_commitments_project ON commitments(project_id);
CREATE INDEX IF NOT EXISTS idx_change_events_project ON change_events(project_id);
CREATE INDEX IF NOT EXISTS idx_owner_invoices_project ON owner_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_sub_invoices_project ON subcontractor_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_direct_costs_project ON direct_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_photos_project ON photos(project_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_project ON timesheets(project_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_date ON timesheets(timesheet_date);
CREATE INDEX IF NOT EXISTS idx_inspections_project ON inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_observations_project ON observations(project_id);
CREATE INDEX IF NOT EXISTS idx_incidents_project ON incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_emails_project ON emails(project_id);
CREATE INDEX IF NOT EXISTS idx_transmittals_project ON transmittals(project_id);
CREATE INDEX IF NOT EXISTS idx_warranties_project ON warranties(project_id);
CREATE INDEX IF NOT EXISTS idx_project_directory_project ON project_directory(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_project ON reports(project_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'directory_contacts','bids','prequalifications','action_plans','correspondence',
      'training','daily_logs','punch_list_items','drawings','specifications',
      'schedule_tasks','prime_contracts','commitments','change_events',
      'owner_invoices','subcontractor_invoices','direct_costs','documents',
      'photos','timesheets','inspections','observations','incidents',
      'emails','transmittals','warranties','project_directory','reports'
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

-- Also add write policies to existing tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'projects','attachments','rfis','submittals','budgets',
      'commitment_change_orders','contract_change_orders','meeting_minutes'
    ])
  LOOP
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
