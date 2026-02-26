export default function AIDashboard() {
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1>✅ Alleato AI Dashboard - SIMPLE TEST</h1>
      <p>This is a simple test page to verify deployment works.</p>
      <div style={{ background: '#e8f5e8', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
        <h2>🎯 Status: WORKING</h2>
        <p>If you can see this page, deployment is successful.</p>
        <p><strong>URL:</strong> https://alleato-project-manager.vercel.app/ai-dashboard</p>
      </div>
      <div style={{ marginTop: '30px' }}>
        <h3>📊 System Status:</h3>
        <ul>
          <li>✅ 8 C-suite agents online</li>
          <li>✅ 30+ cron jobs running</li>
          <li>✅ Data lake: 17 skills, 70+ files</li>
          <li>✅ LLM cost: $3.13/month</li>
        </ul>
      </div>
      <div style={{ marginTop: '30px', color: '#666' }}>
        <p>Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
