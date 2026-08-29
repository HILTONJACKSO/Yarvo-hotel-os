import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function OverviewTab() {
  const [data, setData] = useState<{ month: string, total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/v1/staff/payroll/stats');
        if (res.ok) {
          const json = await res.json();
          // Transform month string (YYYY-MM) to short month name (e.g., Aug 26)
          const transformed = (json.data || []).map((item: any) => {
            const date = new Date(item.month + '-01');
            const formatted = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            return { name: formatted, total: item.total };
          });
          setData(transformed);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const currentMonthTotal = data.length > 0 ? data[data.length - 1].total : 0;
  const previousMonthTotal = data.length > 1 ? data[data.length - 2].total : 0;
  const isUp = currentMonthTotal >= previousMonthTotal;

  return (
    <div className="overview-container">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">Monthly Payroll Expense</div>
          <div className="metric-value">${currentMonthTotal.toLocaleString()}</div>
          <div className={`metric-trend ${isUp ? 'text-danger' : 'text-success'}`}>
            {isUp ? '↑' : '↓'} ${Math.abs(currentMonthTotal - previousMonthTotal).toLocaleString()} vs last month
          </div>
        </div>
      </div>

      <div className="chart-card">
        <h3>Payroll Expense (Last 12 Months)</h3>
        {loading ? (
          <div className="loading-state">Loading chart data...</div>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                <XAxis dataKey="name" stroke="#a0aec0" tick={{ fill: '#a0aec0', fontSize: 12 }} />
                <YAxis stroke="#a0aec0" tick={{ fill: '#a0aec0', fontSize: 12 }} tickFormatter={value => `$${value}`} />
                <Tooltip 
                  cursor={{ fill: '#2d3748', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#1a202c', borderColor: '#2d3748', borderRadius: '8px', color: '#f7fafc' }}
                  itemStyle={{ color: '#48bb78', fontWeight: 'bold' }}
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cost']}
                />
                <Bar dataKey="total" fill="#48bb78" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <style>{`
        .overview-container { display: flex; flex-direction: column; gap: 24px; }
        
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
        .metric-card { background: hsl(222, 35%, 7%); border: 1px solid hsl(217, 20%, 18%); padding: 24px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px; }
        .metric-title { color: hsl(215, 20%, 65%); font-size: 0.875rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
        .metric-value { color: hsl(210, 40%, 96%); font-size: 2rem; font-weight: 700; }
        .metric-trend { font-size: 0.875rem; font-weight: 500; }
        .text-success { color: hsl(142, 76%, 55%); }
        .text-danger { color: hsl(0, 84%, 60%); }
        
        .chart-card { background: hsl(222, 35%, 7%); border: 1px solid hsl(217, 20%, 18%); padding: 24px; border-radius: 12px; display: flex; flex-direction: column; gap: 16px; }
        .chart-card h3 { margin: 0; color: hsl(210, 40%, 96%); font-weight: 600; font-size: 1.125rem; }
        .chart-wrapper { width: 100%; height: 300px; margin-top: 16px; }
        
        .loading-state { text-align: center; padding: 40px; color: hsl(215, 20%, 50%); }
      `}</style>
    </div>
  );
}

