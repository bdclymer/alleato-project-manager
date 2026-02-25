import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

export async function POST(_request: NextRequest) {
  // No auth required — idempotent CREATE TABLE IF NOT EXISTS

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Missing database credentials" }, { status: 500 });
  }

  const host = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");

  try {
    // Dynamic import pg so it only loads server-side
    const { Client } = await import("pg");
    const client = new Client({
      connectionString: `postgresql://postgres:${SUPABASE_KEY}@db.${host}.supabase.co:5432/postgres`,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    await client.connect();

    // Create system_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id BIGSERIAL PRIMARY KEY,
        job_type TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        completed_at TIMESTAMPTZ,
        duration_ms INTEGER,
        summary JSONB DEFAULT '{}',
        error_message TEXT,
        run_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_system_logs_job_type ON system_logs(job_type, created_at DESC)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at DESC)"
    );

    // Reload PostgREST schema cache
    await client.query("NOTIFY pgrst, 'reload schema'");

    const count = await client.query("SELECT count(*) FROM system_logs");
    await client.end();

    return NextResponse.json({
      success: true,
      message: "system_logs table ready, schema cache reloaded",
      rows: parseInt(count.rows[0].count),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
