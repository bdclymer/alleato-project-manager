import pg from 'pg';

// Try common Supabase database connection patterns
const projectRef = 'tsilifkuwjbafxorsdph';
const password = process.env.SUPABASE_KEY;

const configs = [
  {
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: password,
    ssl: { rejectUnauthorized: false },
  },
  {
    host: `aws-0-us-west-1.pooler.supabase.com`,
    port: 6543,
    database: 'postgres',
    user: `postgres.${projectRef}`,
    password: password,
    ssl: { rejectUnauthorized: false },
  },
  {
    host: `aws-0-us-east-1.pooler.supabase.com`,
    port: 6543,
    database: 'postgres',
    user: `postgres.${projectRef}`,
    password: password,
    ssl: { rejectUnauthorized: false },
  },
  {
    host: `aws-0-us-east-2.pooler.supabase.com`,
    port: 6543,
    database: 'postgres',
    user: `postgres.${projectRef}`,
    password: password,
    ssl: { rejectUnauthorized: false },
  },
];

async function tryConnect(config, label) {
  const client = new pg.Client({ ...config, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    console.log(`Connected via ${label}`);

    // Reload PostgREST schema cache
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('Sent NOTIFY pgrst reload schema');

    // Check tables
    const result = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
    console.log('Tables in public schema:', result.rows.map(r => r.tablename).join(', '));

    await client.end();
    return true;
  } catch (err) {
    console.log(`${label}: ${err.message.substring(0, 80)}`);
    try { await client.end(); } catch {}
    return false;
  }
}

async function main() {
  for (let i = 0; i < configs.length; i++) {
    const connected = await tryConnect(configs[i], `config-${i}`);
    if (connected) return;
  }
  console.log('\nCould not connect directly. Trying Management API...');

  // Try Supabase Management API to restart PostgREST
  const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/pgsodium`, {
    headers: { 'Authorization': `Bearer ${password}` }
  });
  console.log('Management API status:', mgmtRes.status);
}

main();
