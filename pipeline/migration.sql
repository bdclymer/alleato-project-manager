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

-- Error Log (for runtime error monitoring)
CREATE TABLE IF NOT EXISTS error_log (
  id BIGSERIAL PRIMARY KEY,
  error_message TEXT,
  stack_trace TEXT,
  component_stack TEXT,
  page_url TEXT,
  user_agent TEXT,
  fixed BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_error_log_fixed ON error_log(fixed);
CREATE INDEX IF NOT EXISTS idx_error_log_timestamp ON error_log(timestamp);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment_change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Extended Tables — Full Procore Feature Parity
-- ============================================================

-- Directory Contacts (Company Level)
CREATE TABLE IF NOT EXISTS directory_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT,
  contact_type TEXT,
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
  prequalified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  tags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bids (Company Level)
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_number TEXT,
  project_name TEXT,
  trade TEXT,
  scope TEXT,
  bidder TEXT,
  amount NUMERIC(15,2),
  bid_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prequalifications
CREATE TABLE IF NOT EXISTS prequalifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT,
  trade TEXT,
  emr NUMERIC(5,2),
  bonding_capacity NUMERIC(15,2),
  annual_revenue NUMERIC(15,2),
  years_in_business INT,
  safety_score NUMERIC(5,2),
  financial_score NUMERIC(5,2),
  overall_score NUMERIC(5,2),
  status TEXT DEFAULT 'pending',
  expiry_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training Records
CREATE TABLE IF NOT EXISTS training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name TEXT,
  training_type TEXT,
  course_name TEXT,
  provider TEXT,
  completion_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  certificate_number TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost Catalog (Company Level)
CREATE TABLE IF NOT EXISTS cost_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT,
  description TEXT,
  category TEXT,
  division TEXT,
  unit TEXT,
  unit_cost NUMERIC(15,2),
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company Documents
CREATE TABLE IF NOT EXISTS company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  folder TEXT DEFAULT '/',
  document_type TEXT,
  version INT DEFAULT 1,
  uploaded_by TEXT,
  status TEXT DEFAULT 'active',
  file_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (Company Level)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  payment_type TEXT DEFAULT 'outgoing',
  payee TEXT,
  payer TEXT,
  amount NUMERIC(15,2),
  payment_date TIMESTAMPTZ,
  payment_method TEXT,
  reference_number TEXT,
  invoice_number TEXT,
  status TEXT DEFAULT 'pending',
  lien_waiver_status TEXT DEFAULT 'not_required',
  lien_waiver_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflows (Company Level)
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  workflow_type TEXT,
  trigger_module TEXT,
  trigger_event TEXT,
  status TEXT DEFAULT 'draft',
  created_by TEXT,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Planroom (Company Level)
CREATE TABLE IF NOT EXISTS planroom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  project_name TEXT,
  bid_date TIMESTAMPTZ,
  trade TEXT,
  status TEXT DEFAULT 'draft',
  description TEXT,
  documents_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resource Planning (Company Level)
CREATE TABLE IF NOT EXISTS resource_planning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_name TEXT,
  resource_type TEXT,
  project_name TEXT,
  role TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  allocation_pct INT,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company Schedule
CREATE TABLE IF NOT EXISTS company_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  project_name TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  milestone TEXT DEFAULT 'no',
  assigned_to TEXT,
  status TEXT DEFAULT 'not_started',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timecards (Company Level)
CREATE TABLE IF NOT EXISTS timecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name TEXT,
  date TIMESTAMPTZ,
  project_name TEXT,
  cost_code TEXT,
  hours_regular NUMERIC(5,2),
  hours_overtime NUMERIC(5,2),
  hours_double NUMERIC(5,2),
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (Company Level)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT,
  channel TEXT,
  participants TEXT,
  message TEXT,
  last_message_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permission Templates (Company Level)
CREATE TABLE IF NOT EXISTS permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  role TEXT,
  tools_access TEXT,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drawings
CREATE TABLE IF NOT EXISTS drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT,
  discipline TEXT,
  set_name TEXT,
  revision TEXT,
  status TEXT DEFAULT 'current',
  received_date TIMESTAMPTZ,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drawing Sets
CREATE TABLE IF NOT EXISTS drawing_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT,
  discipline TEXT,
  received_date TIMESTAMPTZ,
  drawing_count INT DEFAULT 0,
  status TEXT DEFAULT 'current',
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
  issued_date TIMESTAMPTZ,
  status TEXT DEFAULT 'current',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule Tasks
CREATE TABLE IF NOT EXISTS schedule_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  wbs TEXT,
  task_name TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  duration_days INT,
  percent_complete INT DEFAULT 0,
  predecessor TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'not_started',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prime Contracts
CREATE TABLE IF NOT EXISTS prime_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT,
  owner TEXT,
  original_value NUMERIC(15,2),
  revised_value NUMERIC(15,2),
  executed_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commitments (Subcontracts / POs)
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT,
  vendor TEXT,
  commitment_type TEXT,
  original_value NUMERIC(15,2),
  revised_value NUMERIC(15,2),
  executed_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Change Events
CREATE TABLE IF NOT EXISTS change_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT,
  description TEXT,
  origin TEXT,
  scope TEXT,
  estimated_amount NUMERIC(15,2),
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  created_by TEXT,
  due_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Owner Invoices
CREATE TABLE IF NOT EXISTS owner_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  billing_period TEXT,
  invoice_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  original_contract NUMERIC(15,2),
  approved_changes NUMERIC(15,2),
  completed_work NUMERIC(15,2),
  stored_materials NUMERIC(15,2),
  retainage NUMERIC(15,2),
  amount_due NUMERIC(15,2),
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcontractor Invoices
CREATE TABLE IF NOT EXISTS subcontractor_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  vendor TEXT,
  commitment_id TEXT,
  billing_period TEXT,
  invoice_date TIMESTAMPTZ,
  amount NUMERIC(15,2),
  retainage NUMERIC(15,2),
  net_amount NUMERIC(15,2),
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Direct Costs
CREATE TABLE IF NOT EXISTS direct_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT,
  cost_type TEXT,
  vendor TEXT,
  cost_code TEXT,
  amount NUMERIC(15,2),
  date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Logs
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  log_date TIMESTAMPTZ,
  weather TEXT,
  temperature_high INT,
  temperature_low INT,
  wind TEXT,
  precipitation TEXT,
  work_performed TEXT,
  manpower_count INT,
  visitors TEXT,
  deliveries TEXT,
  delays TEXT,
  safety_notes TEXT,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Punch List Items
CREATE TABLE IF NOT EXISTS punch_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT,
  description TEXT,
  location TEXT,
  assigned_to TEXT,
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  status TEXT DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT,
  folder TEXT DEFAULT '/',
  document_type TEXT,
  version INT DEFAULT 1,
  uploaded_by TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'current',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT,
  album TEXT,
  taken_date TIMESTAMPTZ,
  location TEXT,
  taken_by TEXT,
  file_url TEXT,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timesheets
CREATE TABLE IF NOT EXISTS timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  employee_name TEXT,
  date TIMESTAMPTZ,
  hours_regular NUMERIC(5,2),
  hours_overtime NUMERIC(5,2),
  cost_code TEXT,
  location TEXT,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inspections
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  number TEXT,
  title TEXT,
  inspection_type TEXT,
  inspector TEXT,
  inspection_date TIMESTAMPTZ,
  location TEXT,
  result TEXT,
  deficiencies INT DEFAULT 0,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Observations
CREATE TABLE IF NOT EXISTS observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  title TEXT,
  observation_type TEXT,
  category TEXT,
  observed_by TEXT,
  observed_date TIMESTAMPTZ,
  location TEXT,
  assigned_to TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  number TEXT,
  title TEXT,
  incident_type TEXT,
  severity TEXT,
  incident_date TIMESTAMPTZ,
  location TEXT,
  reported_by TEXT,
  injured_party TEXT,
  osha_recordable BOOLEAN DEFAULT FALSE,
  lost_time BOOLEAN DEFAULT FALSE,
  days_lost INT DEFAULT 0,
  root_cause TEXT,
  corrective_action TEXT,
  status TEXT DEFAULT 'open',
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Action Plans
CREATE TABLE IF NOT EXISTS action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  title TEXT,
  plan_type TEXT,
  assigned_to TEXT,
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Correspondence
CREATE TABLE IF NOT EXISTS correspondence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  number TEXT,
  subject TEXT,
  correspondence_type TEXT,
  from_party TEXT,
  to_party TEXT,
  sent_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  body TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emails
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  subject TEXT,
  from_address TEXT,
  to_address TEXT,
  cc TEXT,
  sent_date TIMESTAMPTZ,
  body TEXT,
  status TEXT DEFAULT 'sent',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transmittals
CREATE TABLE IF NOT EXISTS transmittals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  number TEXT,
  subject TEXT,
  to_party TEXT,
  from_party TEXT,
  sent_date TIMESTAMPTZ,
  items_count INT DEFAULT 0,
  purpose TEXT,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warranties
CREATE TABLE IF NOT EXISTS warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  item_name TEXT,
  warranty_type TEXT,
  vendor TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  duration_years INT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  scope TEXT,
  terms TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Directory
CREATE TABLE IF NOT EXISTS project_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  role TEXT,
  notes TEXT,
  added_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (Project Level)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium',
  assigned_to TEXT,
  created_by TEXT,
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  percent_complete INT DEFAULT 0,
  related_module TEXT,
  status TEXT DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forms (Project Level)
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  title TEXT,
  form_type TEXT,
  category TEXT,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment (Project Level)
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  name TEXT,
  equipment_type TEXT,
  make TEXT,
  model TEXT,
  serial_number TEXT,
  vendor TEXT,
  ownership TEXT DEFAULT 'rented',
  daily_rate NUMERIC(15,2),
  operator TEXT,
  location TEXT,
  mobilization_date TIMESTAMPTZ,
  demobilization_date TIMESTAMPTZ,
  inspection_date TIMESTAMPTZ,
  inspection_status TEXT,
  hours_used NUMERIC(10,2),
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials (Project Level)
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  name TEXT,
  category TEXT,
  vendor TEXT,
  quantity_ordered NUMERIC(15,2),
  quantity_received NUMERIC(15,2),
  quantity_installed NUMERIC(15,2),
  unit TEXT,
  unit_cost NUMERIC(15,2),
  total_cost NUMERIC(15,2),
  cost_code TEXT,
  po_number TEXT,
  tracking_number TEXT,
  order_date TIMESTAMPTZ,
  expected_delivery TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  location TEXT,
  description TEXT,
  status TEXT DEFAULT 'ordered',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crews (Project Level)
CREATE TABLE IF NOT EXISTS crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  name TEXT,
  trade TEXT,
  foreman TEXT,
  size INT,
  shift TEXT DEFAULT 'day',
  daily_rate NUMERIC(15,2),
  cost_code TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funding (Project Level)
CREATE TABLE IF NOT EXISTS funding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  source_name TEXT,
  funding_type TEXT DEFAULT 'owner',
  total_amount NUMERIC(15,2),
  drawn_amount NUMERIC(15,2),
  remaining_amount NUMERIC(15,2),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  account_number TEXT,
  start_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  terms TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- T&M Tickets (Project Level)
CREATE TABLE IF NOT EXISTS tm_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  number TEXT,
  title TEXT,
  vendor TEXT,
  ticket_date TIMESTAMPTZ,
  cost_code TEXT,
  submitted_by TEXT,
  approved_by TEXT,
  labor_hours NUMERIC(10,2),
  labor_amount NUMERIC(15,2),
  material_amount NUMERIC(15,2),
  equipment_amount NUMERIC(15,2),
  markup_percent NUMERIC(5,2),
  total_amount NUMERIC(15,2),
  description TEXT,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instructions (Project Level)
CREATE TABLE IF NOT EXISTS instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  number TEXT,
  title TEXT,
  description TEXT,
  issued_by TEXT,
  issued_to TEXT,
  issued_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress Billings (Project Level)
CREATE TABLE IF NOT EXISTS progress_billings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  number TEXT,
  vendor_name TEXT,
  commitment_id TEXT,
  billing_period TEXT,
  billing_date TIMESTAMPTZ,
  scheduled_value NUMERIC(15,2),
  previous_completed NUMERIC(15,2),
  work_completed NUMERIC(15,2),
  materials_stored NUMERIC(15,2),
  total_completed NUMERIC(15,2),
  retainage NUMERIC(15,2),
  net_amount NUMERIC(15,2),
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimates (Project Level)
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  cost_code TEXT,
  description TEXT,
  category TEXT,
  quantity NUMERIC(15,2),
  unit TEXT,
  unit_cost NUMERIC(15,2),
  total_cost NUMERIC(15,2),
  markup_pct NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lien Waivers (Project Level)
CREATE TABLE IF NOT EXISTS lien_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  vendor_name TEXT,
  waiver_type TEXT,
  amount NUMERIC(15,2),
  through_date TIMESTAMPTZ,
  signed_date TIMESTAMPTZ,
  status TEXT DEFAULT 'requested',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BIM Models (Project Level)
CREATE TABLE IF NOT EXISTS bim_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  name TEXT,
  discipline TEXT,
  version TEXT,
  file_format TEXT,
  file_url TEXT,
  uploaded_by TEXT,
  uploaded_date TIMESTAMPTZ,
  file_size_mb NUMERIC(10,2),
  status TEXT DEFAULT 'current',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coordination Issues (Project Level)
CREATE TABLE IF NOT EXISTS coordination_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  number TEXT,
  title TEXT,
  description TEXT,
  discipline TEXT,
  issue_type TEXT,
  assigned_to TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  location TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Bidding (Project Level)
CREATE TABLE IF NOT EXISTS project_bidding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  number TEXT,
  package_name TEXT,
  trade TEXT,
  description TEXT,
  bid_due_date TIMESTAMPTZ,
  pre_bid_date TIMESTAMPTZ,
  estimated_value NUMERIC(15,2),
  invitees_count INT DEFAULT 0,
  bids_received INT DEFAULT 0,
  awarded_to TEXT,
  awarded_amount NUMERIC(15,2),
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Workflows (Project Level)
CREATE TABLE IF NOT EXISTS project_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  name TEXT,
  trigger_tool TEXT,
  trigger_record_id TEXT,
  current_step TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'pending',
  steps JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drawing Revisions (version history)
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

-- Drawing Markups (annotations)
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

-- Drawing Pins (location-linked items)
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

-- Drawing Transmittals
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

-- Drawing Transmittal Items
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

-- Drawing Markup Layers
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

-- ============================================================
-- Indexes for new tables
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_forms_project ON forms(project_id);
CREATE INDEX IF NOT EXISTS idx_equipment_project ON equipment(project_id);
CREATE INDEX IF NOT EXISTS idx_materials_project ON materials(project_id);
CREATE INDEX IF NOT EXISTS idx_crews_project ON crews(project_id);
CREATE INDEX IF NOT EXISTS idx_funding_project ON funding(project_id);
CREATE INDEX IF NOT EXISTS idx_tm_tickets_project ON tm_tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_instructions_project ON instructions(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_billings_project ON progress_billings(project_id);
CREATE INDEX IF NOT EXISTS idx_estimates_project ON estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_lien_waivers_project ON lien_waivers(project_id);
CREATE INDEX IF NOT EXISTS idx_bim_models_project ON bim_models(project_id);
CREATE INDEX IF NOT EXISTS idx_coordination_issues_project ON coordination_issues(project_id);
CREATE INDEX IF NOT EXISTS idx_project_bidding_project ON project_bidding(project_id);
CREATE INDEX IF NOT EXISTS idx_project_workflows_project ON project_workflows(project_id);
CREATE INDEX IF NOT EXISTS idx_drawings_project ON drawings(project_id);
CREATE INDEX IF NOT EXISTS idx_drawing_revisions_drawing ON drawing_revisions(drawing_id);
CREATE INDEX IF NOT EXISTS idx_drawing_markups_drawing ON drawing_markups(drawing_id);
CREATE INDEX IF NOT EXISTS idx_drawing_pins_drawing ON drawing_pins(drawing_id);
CREATE INDEX IF NOT EXISTS idx_drawing_transmittals_project ON drawing_transmittals(project_id);
CREATE INDEX IF NOT EXISTS idx_drawing_transmittal_items_transmittal ON drawing_transmittal_items(transmittal_id);
CREATE INDEX IF NOT EXISTS idx_markup_layers_drawing ON drawing_markup_layers(drawing_id);
CREATE INDEX IF NOT EXISTS idx_specifications_project ON specifications(project_id);
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_project ON schedule_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_prime_contracts_project ON prime_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_commitments_project ON commitments(project_id);
CREATE INDEX IF NOT EXISTS idx_change_events_project ON change_events(project_id);
CREATE INDEX IF NOT EXISTS idx_owner_invoices_project ON owner_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_sub_invoices_project ON subcontractor_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_direct_costs_project ON direct_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_project ON daily_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_punch_list_project ON punch_list_items(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_photos_project ON photos(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_project ON payments(project_id);

-- ============================================================
-- RLS for all new tables
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'directory_contacts','bids','prequalifications','training',
    'cost_catalog','company_documents','payments','workflows','planroom',
    'resource_planning','company_schedule','timecards','conversations',
    'permission_templates','drawings','drawing_sets','specifications',
    'schedule_tasks','prime_contracts','commitments','change_events',
    'owner_invoices','subcontractor_invoices','direct_costs','daily_logs',
    'punch_list_items','documents','photos','timesheets','inspections',
    'observations','incidents','action_plans','correspondence','emails',
    'transmittals','warranties','project_directory','tasks','forms',
    'equipment','materials','crews','funding','tm_tickets',
    'instructions','progress_billings','estimates','lien_waivers',
    'bim_models','coordination_issues','project_bidding','project_workflows',
    'drawing_revisions','drawing_markups','drawing_pins','drawing_transmittals',
    'drawing_transmittal_items','drawing_markup_layers'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all' AND tablename = tbl) THEN
      EXECUTE format('CREATE POLICY allow_all ON %I FOR ALL USING (true) WITH CHECK (true)', tbl);
    END IF;
  END LOOP;
END $$;

-- Allow authenticated + anon read access for original tables (service role always has full access)
DO $$
BEGIN
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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_write' AND tablename = 'error_log') THEN
    CREATE POLICY public_write ON error_log FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
