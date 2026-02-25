-- System Logs Table for Autonomous Monitoring
-- Stores results from all GitHub Actions automation workflows
-- Read by the /system dashboard via Supabase REST API

CREATE TABLE IF NOT EXISTS system_logs (
  id BIGSERIAL PRIMARY KEY,
  job_type TEXT NOT NULL CHECK (job_type IN ('sync', 'backup', 'test', 'lighthouse', 'deploy', 'health')),
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failure', 'partial')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  summary JSONB DEFAULT '{}',
  error_message TEXT,
  run_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_system_logs_job_type ON system_logs(job_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at DESC);

-- Auto-cleanup: delete logs older than 90 days (run periodically)
-- DELETE FROM system_logs WHERE created_at < now() - interval '90 days';

-- Enable RLS but allow service role full access
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access" ON system_logs
  FOR ALL USING (true) WITH CHECK (true);
