-- ============================================================
-- AI AGENT MONITORING DASHBOARD MIGRATION
-- Run this entire file in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/tsilifkuwjbafxorsdph/sql/new
-- ============================================================

-- Step 1: Agent Status table — tracks each agent's current state
CREATE TABLE IF NOT EXISTS agent_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL UNIQUE,
  agent_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline',
  current_task TEXT,
  last_activity TIMESTAMPTZ,
  uptime_started TIMESTAMPTZ,
  uptime_seconds BIGINT DEFAULT 0,
  version TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_status_name ON agent_status(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_status_status ON agent_status(status);

-- Step 2: Agent Logs table — stores recent actions and events
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  log_level TEXT NOT NULL DEFAULT 'info',
  action TEXT NOT NULL,
  message TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_agent ON agent_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_logs_level ON agent_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON agent_logs(created_at DESC);

-- Step 3: Agent Metrics table — system metrics snapshots
CREATE TABLE IF NOT EXISTS agent_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  memory_usage_mb NUMERIC(10,2),
  cpu_usage_percent NUMERIC(5,2),
  api_calls_count INTEGER DEFAULT 0,
  llm_tokens_input INTEGER DEFAULT 0,
  llm_tokens_output INTEGER DEFAULT 0,
  llm_cost_usd NUMERIC(10,4) DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent ON agent_metrics(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_recorded ON agent_metrics(recorded_at DESC);

-- Step 4: Seed initial agent records
INSERT INTO agent_status (agent_name, agent_role, status) VALUES
  ('FRIDAY', 'CTO - Chief Technology Officer', 'offline'),
  ('CFO', 'Chief Financial Officer', 'offline'),
  ('COO', 'Chief Operating Officer', 'offline'),
  ('CMO', 'Chief Marketing Officer', 'offline'),
  ('CPO', 'Chief Product Officer', 'offline'),
  ('CLO', 'Chief Legal Officer', 'offline'),
  ('CHRO', 'Chief Human Resources Officer', 'offline'),
  ('CIO', 'Chief Information Officer', 'offline')
ON CONFLICT (agent_name) DO NOTHING;

-- Step 5: Enable RLS
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;

-- Step 6: Allow all operations (app uses service role key)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_status' AND policyname = 'allow_all') THEN
    CREATE POLICY "allow_all" ON agent_status FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_logs' AND policyname = 'allow_all') THEN
    CREATE POLICY "allow_all" ON agent_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_metrics' AND policyname = 'allow_all') THEN
    CREATE POLICY "allow_all" ON agent_metrics FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- MIGRATION COMPLETE
-- Tables created: agent_status, agent_logs, agent_metrics
-- Seeded 8 AI agent records
-- ============================================================
