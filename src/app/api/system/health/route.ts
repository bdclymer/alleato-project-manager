import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  let dbStatus = "unknown";
  let dbLatency = 0;

  // Check Supabase connectivity
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const dbStart = Date.now();
      const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id&limit=1`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      dbLatency = Date.now() - dbStart;
      dbStatus = res.ok ? "connected" : "error";
    } catch {
      dbStatus = "unreachable";
    }
  }

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: process.uptime(),
    database: {
      status: dbStatus,
      latency_ms: dbLatency,
    },
    response_ms: Date.now() - start,
  });
}
