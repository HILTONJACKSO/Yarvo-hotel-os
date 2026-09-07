import re

file_path = "apps/web/src/app/dashboard/tickets/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the stats cards section
old_stats_section = """      <div className="stats-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ background: 'hsl(222, 35%, 15%)', padding: '20px', borderRadius: '8px', border: '1px solid hsl(217, 20%, 25%)' }}>
          <h3 style={{ color: 'hsl(215, 20%, 65%)', fontSize: '0.875rem', margin: '0 0 8px 0' }}>Tickets Sold Today</h3>
          <p style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats?.totalOrders || 0}</p>
        </div>
        <div className="stat-card" style={{ background: 'hsl(222, 35%, 15%)', padding: '20px', borderRadius: '8px', border: '1px solid hsl(217, 20%, 25%)' }}>
          <h3 style={{ color: 'hsl(215, 20%, 65%)', fontSize: '0.875rem', margin: '0 0 8px 0' }}>Tickets Revenue Generated</h3>
          <p style={{ color: 'hsl(43,96%,56%)', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>${(stats?.totalRevenue || 0).toFixed(2)}</p>
        </div>
      </div>"""

new_stats_section = """      {/* Overall Stats */}
      <div className="stats-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '16px' }}>
        <div className="stat-card" style={{ background: 'hsl(222, 35%, 15%)', padding: '20px', borderRadius: '8px', border: '1px solid hsl(217, 20%, 25%)' }}>
          <h3 style={{ color: 'hsl(215, 20%, 65%)', fontSize: '0.875rem', margin: '0 0 8px 0' }}>Tickets Sold Today</h3>
          <p style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats?.totalOrders || 0}</p>
        </div>
        <div className="stat-card" style={{ background: 'hsl(222, 35%, 15%)', padding: '20px', borderRadius: '8px', border: '1px solid hsl(217, 20%, 25%)' }}>
          <h3 style={{ color: 'hsl(215, 20%, 65%)', fontSize: '0.875rem', margin: '0 0 8px 0' }}>Tickets Revenue Generated</h3>
          <p style={{ color: 'hsl(43,96%,56%)', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>${(stats?.totalRevenue || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Breakdown Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Entry Breakdown */}
        <div style={{ background: 'hsl(222, 35%, 15%)', padding: '16px', borderRadius: '8px', border: '1px solid hsl(217, 20%, 25%)' }}>
          <h3 style={{ color: 'hsl(215, 20%, 65%)', fontSize: '0.875rem', margin: '0 0 12px 0', borderBottom: '1px solid hsl(217, 20%, 25%)', paddingBottom: '8px' }}>Entry Tickets Breakdown</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'white' }}>Adults: {stats?.breakdown?.entryAdults?.count || 0}</span>
            <span style={{ color: 'hsl(43,96%,56%)', fontWeight: 'bold' }}>${(stats?.breakdown?.entryAdults?.revenue || 0).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'white' }}>Kids: {stats?.breakdown?.entryKids?.count || 0}</span>
            <span style={{ color: 'hsl(43,96%,56%)', fontWeight: 'bold' }}>${(stats?.breakdown?.entryKids?.revenue || 0).toFixed(2)}</span>
          </div>
        </div>
        
        {/* Pool Breakdown */}
        <div style={{ background: 'hsl(222, 35%, 15%)', padding: '16px', borderRadius: '8px', border: '1px solid hsl(217, 20%, 25%)' }}>
          <h3 style={{ color: 'hsl(215, 20%, 65%)', fontSize: '0.875rem', margin: '0 0 12px 0', borderBottom: '1px solid hsl(217, 20%, 25%)', paddingBottom: '8px' }}>Pool Tickets Breakdown</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'white' }}>Adults: {stats?.breakdown?.poolAdults?.count || 0}</span>
            <span style={{ color: 'hsl(43,96%,56%)', fontWeight: 'bold' }}>${(stats?.breakdown?.poolAdults?.revenue || 0).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'white' }}>Kids: {stats?.breakdown?.poolKids?.count || 0}</span>
            <span style={{ color: 'hsl(43,96%,56%)', fontWeight: 'bold' }}>${(stats?.breakdown?.poolKids?.revenue || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>"""

content = content.replace(old_stats_section, new_stats_section)

# Fix any types
content = content.replace("const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0 });", "const [stats, setStats] = useState<any>({ totalOrders: 0, totalRevenue: 0 });")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated tickets UI")
