// ============================================================
// Alleato Project Manager — TypeScript Types
// ============================================================

export interface Project {
  id: string;
  name: string;
  number?: string;
  description?: string;
  status?: string;
  stage?: string;
  project_type?: string;
  region?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  start_date?: string;
  end_date?: string;
  project_manager?: string;
  superintendent?: string;
  contract_value?: number;
  square_footage?: number;
  owner_name?: string;
  architect_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DirectoryContact {
  id: string;
  company_name?: string;
  contact_type: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  license_number?: string;
  insurance_expiry?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  prequalified?: boolean;
  status: string;
  notes?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface RFI {
  id: string;
  project_id: string;
  number?: string;
  subject?: string;
  question?: string;
  answer?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  ball_in_court?: string;
  created_by?: string;
  due_date?: string;
  responded_date?: string;
  created_at?: string;
  projects?: { name: string };
}

export interface Submittal {
  id: string;
  project_id: string;
  number?: string;
  title?: string;
  description?: string;
  status?: string;
  spec_section?: string;
  submitted_by?: string;
  assigned_to?: string;
  ball_in_court?: string;
  due_date?: string;
  approved_date?: string;
  created_at?: string;
  projects?: { name: string };
}

// Generic record type for CRUD operations
export type DBRecord = Record<string, any>;

// Module configuration for generic CRUD pages
export interface ColumnDef {
  key: string;
  header: string;
  type?: "text" | "date" | "currency" | "status" | "number" | "badge";
  render?: (row: any) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "select" | "email" | "checkbox" | "currency" | "json";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: any;
  span?: 1 | 2; // grid column span
}

export interface ModuleConfig {
  table: string;
  singular: string;
  plural: string;
  icon: string;
  columns: ColumnDef[];
  formFields: FieldDef[];
  searchField?: string;
  defaultSort?: { column: string; ascending: boolean };
  projectScoped?: boolean; // whether this table has project_id
}
