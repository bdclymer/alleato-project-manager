import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, { auth: { persistSession: false } });

async function test() {
  // Real data select
  const { data: d1, error: e1 } = await sb.from('directory_contacts').select('*').limit(1);
  console.log('directory_contacts SELECT:', e1 ? 'ERROR: ' + e1.message : 'OK - rows: ' + (d1?.length || 0));

  const { data: d2, error: e2 } = await sb.from('projects').select('*').limit(1);
  console.log('projects SELECT:', e2 ? 'ERROR: ' + e2.message : 'OK - rows: ' + (d2?.length || 0));

  // Try insert to existing table
  const testId = 'test-' + Date.now();
  const { error: e3 } = await sb.from('projects').insert({ id: testId, name: 'Test Project', status: 'active' });
  console.log('projects INSERT:', e3 ? 'ERROR: ' + e3.message : 'OK');
  if (!e3) {
    await sb.from('projects').delete().eq('id', testId);
    console.log('projects DELETE: OK');
  }

  // Try insert to new table via direct HTTP
  const res = await fetch(process.env.SUPABASE_URL + '/rest/v1/daily_logs', {
    method: 'GET',
    headers: {
      'apikey': process.env.SUPABASE_KEY,
      'Authorization': 'Bearer ' + process.env.SUPABASE_KEY,
    },
  });
  console.log('daily_logs HTTP GET:', res.status, res.status === 200 ? 'OK' : await res.text());
}

test();
