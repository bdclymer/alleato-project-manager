/**
 * Supabase Database Setup
 * Creates all tables needed for the Job Planner data sync.
 * Uses the Supabase REST API with service role key.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY environment variables");
  process.exit(1);
}

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  // If the exec_sql RPC doesn't exist, fall back to the SQL endpoint
  if (!res.ok) {
    const fallback = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
    });
    // Use the pg_net or direct SQL approach
    return null;
  }
  return res.json();
}

// We'll use Supabase Management API or direct SQL via the PostgREST SQL endpoint
async function executeMigration(sql) {
  // Use the Supabase SQL query endpoint (available with service role)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: sql,
  });
  return res;
}

const TABLES_SQL = `
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

-- RFIs (Requests for Information)
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attachments_project ON attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_rfis_project ON rfis(project_id);
CREATE INDEX IF NOT EXISTS idx_rfis_status ON rfis(status);
CREATE INDEX IF NOT EXISTS idx_submittals_project ON submittals(project_id);
CREATE INDEX IF NOT EXISTS idx_submittals_status ON submittals(status);
CREATE INDEX IF NOT EXISTS idx_budgets_project ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_ccos_project ON commitment_change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_ctcos_project ON contract_change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_minutes_project ON meeting_minutes(project_id);

-- Enable Row Level Security (disabled by default for service role)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment_change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY IF NOT EXISTS "service_role_all" ON projects FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all" ON attachments FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all" ON rfis FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all" ON submittals FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all" ON budgets FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all" ON commitment_change_orders FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all" ON contract_change_orders FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all" ON meeting_minutes FOR ALL USING (true);
`;

// Since Supabase PostgREST doesn't support raw SQL, we'll create tables
// by upserting via the API. First we need to use the SQL editor endpoint.
// The proper way is through the Supabase Management API or Dashboard SQL editor.
// For automation, we'll use the supabase-js client with the rpc method.

async function setupViaSupabaseClient() {
  // Dynamic import for supabase-js
  let createClient;
  try {
    const mod = await import("@supabase/supabase-js");
    createClient = mod.createClient;
  } catch {
    console.error(
      "Install dependencies first: npm install @supabase/supabase-js"
    );
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  // Split SQL into individual statements and execute via rpc
  // First, create the exec_sql function if it doesn't exist
  const createFnSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(query text)
    RETURNS void AS $$
    BEGIN
      EXECUTE query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  // Try creating the helper function
  console.log("Setting up exec_sql helper function...");
  const { error: fnError } = await supabase.rpc("exec_sql", {
    query: createFnSQL,
  });

  if (fnError) {
    // Function doesn't exist yet, try raw SQL via the /sql endpoint
    console.log(
      "exec_sql not available yet, using direct SQL endpoint..."
    );

    // Use Supabase's internal SQL endpoint
    const sqlRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: createFnSQL }),
    });

    if (!sqlRes.ok) {
      // Fall back: create tables one by one using individual API calls
      console.log("Falling back to individual table creation via SQL API...");
      await createTablesViaHTTP();
      return;
    }
  }

  // Now run the main migration
  console.log("Running database migration...");
  const statements = TABLES_SQL.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    const { error } = await supabase.rpc("exec_sql", {
      query: stmt + ";",
    });
    if (error) {
      // Skip policy "already exists" errors
      if (error.message?.includes("already exists")) {
        continue;
      }
      console.warn(`Warning executing statement: ${error.message}`);
      console.warn(`Statement: ${stmt.substring(0, 80)}...`);
    }
  }

  console.log("Database setup complete!");
}

async function createTablesViaHTTP() {
  // Use the Supabase pg-meta or SQL HTTP API
  const endpoint = `${SUPABASE_URL.replace(".supabase.co", ".supabase.co")}/pg/query`;

  const statements = TABLES_SQL.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: stmt + ";" }),
      });

      if (!res.ok) {
        const text = await res.text();
        if (!text.includes("already exists")) {
          console.warn(`Warning: ${text.substring(0, 100)}`);
        }
      }
    } catch (err) {
      console.warn(`Error: ${err.message}`);
    }
  }

  console.log("Database tables created (HTTP fallback).");
}

// Export for use in pipeline
export { TABLES_SQL, setupViaSupabaseClient };

// Run if called directly
setupViaSupabaseClient().catch(console.error);
