'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AlertCircle, TrendingUp, Utensils, Bed, Wallet } from 'lucide-react';
import ReportExportToolbar from '@/components/ReportExportToolbar';

type ChartData = { date: string; revenue: number; };
type FbMetrics = { todayFbRevenue: number; weekFbRevenue: number; monthFbRevenue: number; };
type TopItem = { id: string; name: string; quantity: number; revenue: number; };
type PaymentMethodData = { method: string; revenue: number; };

type HeatmapData = {
  dates: string[];
  roomTypes: {
    id: string;
    name: string;
    data: { date: string; occupancyPct: number; occupied: number; total: number; }[]
  }[];
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'HOTEL' | 'FB' | 'FINANCIAL'>('HOTEL');
  
  // Hotel state
  const [hotelData, setHotelData] = useState<ChartData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  
  // F&B state
  const [fbMetrics, setFbMetrics] = useState<FbMetrics | null>(null);
  const [fbChart, setFbChart] = useState<ChartData[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);

  // Financial state
  const [paymentData, setPaymentData] = useState<PaymentMethodData[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (start?: string, end?: string) => {
    setLoading(true);
    setError(null);
    let query = '';
    if (start && end) query = `?start=${start}&end=${end}`;
    
    try {
      if (activeTab === 'HOTEL') {
        const [resTrend, resHeatmap] = await Promise.all([
          fetch(`/api/v1/analytics/revenue-chart${query}`, { credentials: 'include' }).then(r => r.json()),
          fetch(`/api/v1/analytics/occupancy-heatmap${query}`, { credentials: 'include' }).then(r => r.json())
        ]);
          setHotelData(resTrend.data || []);
          setHeatmapData(resHeatmap.data || null);
        } else if (activeTab === 'FB') {
          const [resMetrics, resChart, resItems] = await Promise.all([
            fetch(`/api/v1/analytics/fb-metrics${query}`, { credentials: 'include' }).then(r => r.json()),
            fetch(`/api/v1/analytics/fb-chart${query}`, { credentials: 'include' }).then(r => r.json()),
            fetch(`/api/v1/analytics/fb-top-items${query}`, { credentials: 'include' }).then(r => r.json())
          ]);
          setFbMetrics(resMetrics.data);
          setFbChart(resChart.data);
          setTopItems(resItems.data);
        } else if (activeTab === 'FINANCIAL') {
          const res = await fetch(`/api/v1/analytics/revenue-by-method${query}`, { credentials: 'include' });
          const json = await res.json();
          if (!res.ok) throw new Error(json.message || 'Failed to fetch payment data');
          setPaymentData(json.data);
        }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDateChange = (start: string, end: string) => {
    fetchData(start, end);
  };

  const handleExport = (format: 'pdf' | 'csv' | 'print') => {
    if (format === 'print') {
      window.print();
    } else {
      alert(`Exporting Reports as ${format.toUpperCase()}`);
    }
  };

  const hotelTotalRevenue = hotelData.reduce((acc, curr) => acc + curr.revenue, 0);
  const fbTotalChartRevenue = fbChart.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalPaymentRevenue = paymentData.reduce((acc, curr) => acc + curr.revenue, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Reports & Analytics</h2>
      </div>

      <ReportExportToolbar onDateChange={handleDateChange} onExport={handleExport} />

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'HOTEL' ? 'active' : ''}`}
          onClick={() => setActiveTab('HOTEL')}
        >
          <Bed size={18} /> Hotel Performance
        </button>
        <button 
          className={`tab-btn ${activeTab === 'FB' ? 'active' : ''}`}
          onClick={() => setActiveTab('FB')}
        >
          <Utensils size={18} /> Food & Beverage
        </button>
        <button 
          className={`tab-btn ${activeTab === 'FINANCIAL' ? 'active' : ''}`}
          onClick={() => setActiveTab('FINANCIAL')}
        >
          <Wallet size={18} /> Payments & Financials
        </button>
      </div>

      {error && (
        <div className="error-alert">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'HOTEL' && (
        <div className="chart-grid">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Room Revenue Trend</h3>
                <p className="chart-subtitle">Last 7 Days</p>
              </div>
              <div className="chart-stat">
                <span className="stat-label">Total Period Revenue</span>
                <span className="stat-val">${hotelTotalRevenue.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="chart-body">
              {loading ? (
                <div className="chart-loading">Loading chart data...</div>
              ) : hotelData.length === 0 ? (
                <div className="chart-loading">No revenue data available.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hotelData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 20%, 14%)" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(215, 20%, 55%)" fontSize={12} tickFormatter={(val) => { const d = new Date(val); return `${d.getMonth() + 1}/${d.getDate()}`; }} />
                    <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickFormatter={(val) => `$${val}`} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(222, 35%, 10%)', borderColor: 'hsl(217, 20%, 20%)', borderRadius: '8px', color: 'hsl(210, 40%, 96%)' }}
                      itemStyle={{ color: 'hsl(43, 96%, 56%)' }}
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(43, 96%, 56%)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="chart-card heatmap-card" style={{ padding: '24px', overflowX: 'auto' }}>
            <div className="chart-header" style={{ marginBottom: '24px' }}>
              <div>
                <h3 className="chart-title">Occupancy Heatmap</h3>
                <p className="chart-subtitle">14-Day Rolling Window (Room Types)</p>
              </div>
            </div>
            
            <div className="heatmap-container">
              {loading && !heatmapData ? (
                <div className="chart-loading">Loading heatmap data...</div>
              ) : !heatmapData || heatmapData.dates.length === 0 ? (
                <div className="chart-loading">No occupancy data available.</div>
              ) : (
                <div className="heatmap-grid" style={{ minWidth: '600px' }}>
                  {/* Header Row (Dates) */}
                  <div className="heatmap-row header-row">
                    <div className="heatmap-cell type-cell"></div>
                    {heatmapData.dates.map(d => {
                      const dateObj = new Date(d);
                      const isToday = new Date().toISOString().split('T')[0] === d;
                      return (
                        <div key={d} className={`heatmap-cell date-cell ${isToday ? 'is-today' : ''}`}>
                          {dateObj.getMonth() + 1}/{dateObj.getDate()}
                        </div>
                      );
                    })}
                  </div>

                  {/* Body Rows (Room Types) */}
                  {heatmapData.roomTypes.map(rt => (
                    <div key={rt.id} className="heatmap-row">
                      <div className="heatmap-cell type-cell" title={rt.name}>
                        {rt.name}
                      </div>
                      {rt.data.map(cell => {
                        // Color intensity based on occupancy percentage (0 = very dark blue, 100 = bright gold)
                        const l = 15 + (cell.occupancyPct * 0.4); // 15% to 55% lightness
                        const s = 35 + (cell.occupancyPct * 0.6); // 35% to 95% saturation
                        // Shift hue from blue (222) to gold (43) based on occupancy
                        const h = 222 - (cell.occupancyPct * 1.79);
                        const bgColor = `hsl(${h}, ${s}%, ${l}%)`;
                        
                        return (
                          <div 
                            key={cell.date} 
                            className="heatmap-cell data-cell"
                            style={{ backgroundColor: bgColor }}
                            title={`${rt.name} on ${cell.date}:\n${cell.occupancyPct}% Occupied\n(${cell.occupied}/${cell.total} rooms)`}
                          >
                            {cell.occupancyPct}%
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'FB' && (
        <div className="fb-dashboard">
          <div className="summary-cards">
            <div className="summary-card">
              <span className="summary-label">Today's Revenue</span>
              <span className="summary-val">${fbMetrics?.todayFbRevenue.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">This Week's Revenue</span>
              <span className="summary-val">${fbMetrics?.weekFbRevenue.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">This Month's Revenue</span>
              <span className="summary-val">${fbMetrics?.monthFbRevenue.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          <div className="chart-grid">
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">F&B Revenue Trend</h3>
                  <p className="chart-subtitle">Last 7 Days</p>
                </div>
                <div className="chart-stat">
                  <span className="stat-label">7-Day Total</span>
                  <span className="stat-val">${fbTotalChartRevenue.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="chart-body">
                {loading ? (
                  <div className="chart-loading">Loading chart data...</div>
                ) : fbChart.length === 0 ? (
                  <div className="chart-loading">No revenue data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fbChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 20%, 14%)" vertical={false} />
                      <XAxis dataKey="date" stroke="hsl(215, 20%, 55%)" fontSize={12} tickFormatter={(val) => { const d = new Date(val); return `${d.getMonth() + 1}/${d.getDate()}`; }} />
                      <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickFormatter={(val) => `$${val}`} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(222, 35%, 10%)', borderColor: 'hsl(217, 20%, 20%)', borderRadius: '8px', color: 'hsl(210, 40%, 96%)' }}
                        itemStyle={{ color: 'hsl(142, 76%, 55%)' }}
                        cursor={{ fill: 'hsl(217, 20%, 14%)' }}
                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="hsl(142, 76%, 50%)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Top Selling Items</h3>
              </div>
              <div className="top-items-list">
                {topItems.length === 0 && !loading && <div className="chart-loading">No items sold yet.</div>}
                {topItems.map((item, idx) => (
                  <div key={item.id} className="top-item">
                    <div className="item-rank">{idx + 1}</div>
                    <div className="item-info">
                      <div className="item-name">{item.name}</div>
                      <div className="item-sales">{item.quantity} sold</div>
                    </div>
                    <div className="item-rev">${item.revenue.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'FINANCIAL' && (
        <div className="chart-grid">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Revenue by Payment Method</h3>
                <p className="chart-subtitle">All Time (POS + Front Desk)</p>
              </div>
              <div className="chart-stat">
                <span className="stat-label">Total Revenue</span>
                <span className="stat-val">${totalPaymentRevenue.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="chart-body flex justify-center">
              {loading ? (
                <div className="chart-loading">Loading payment data...</div>
              ) : paymentData.length === 0 ? (
                <div className="chart-loading">No payment data available.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="revenue"
                      nameKey="method"
                      label={({ name, percent }: any) => `${name?.replace('PAYMENT_', '') || ''} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                    >
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(222, 35%, 10%)', borderColor: 'hsl(217, 20%, 20%)', borderRadius: '8px', color: 'hsl(210, 40%, 96%)' }}
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Payment Method Breakdown</h3>
            </div>
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th style={{ textAlign: 'right' }}>Total Revenue</th>
                  <th style={{ textAlign: 'right' }}>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {paymentData.length === 0 && !loading && <tr><td colSpan={3} className="text-center text-muted">No data</td></tr>}
                {paymentData.map(p => (
                  <tr key={p.method}>
                    <td>
                      <span className="method-badge">{p.method.replace('PAYMENT_', '')}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>${p.revenue.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{((p.revenue / totalPaymentRevenue) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        .page-container { display: flex; flex-direction: column; gap: 24px; max-width: 1200px; }
        .page-header { display: flex; justify-content: space-between; align-items: center; }
        .page-header h2 { margin: 0; color: hsl(210, 40%, 96%); font-weight: 600; }
        
        .btn-secondary { 
          background: hsl(220, 30%, 12%); 
          color: hsl(210, 40%, 96%); 
          border: 1px solid hsl(217, 20%, 20%); 
          padding: 8px 16px; 
          border-radius: 6px; 
          font-weight: 500; 
          cursor: pointer; 
          transition: background 0.2s; 
        }
        .btn-secondary:hover { background: hsl(217, 20%, 18%); }

        .tabs { display: flex; gap: 12px; border-bottom: 1px solid hsl(217, 20%, 16%); padding-bottom: 1px; }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: hsl(215, 20%, 60%);
          border: none;
          padding: 12px 16px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .tab-btn:hover { color: hsl(210, 40%, 96%); }
        .tab-btn.active { color: hsl(43, 96%, 56%); border-bottom-color: hsl(43, 96%, 56%); }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: hsl(0, 84%, 60%, 0.1);
          border: 1px solid hsl(0, 84%, 60%, 0.3);
          border-radius: 8px;
          color: hsl(0, 84%, 65%);
        }

        .fb-dashboard { display: flex; flex-direction: column; gap: 24px; }
        
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .summary-card {
          background: hsl(222, 35%, 7%);
          border: 1px solid hsl(217, 20%, 14%);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .summary-label { color: hsl(215, 20%, 65%); font-size: 0.875rem; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; }
        .summary-val { color: hsl(142, 76%, 55%); font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; }

        .chart-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
        @media (max-width: 900px) { .chart-grid { grid-template-columns: 1fr; } .summary-cards { grid-template-columns: 1fr; } }

        .chart-card {
          background: hsl(222, 35%, 7%);
          border: 1px solid hsl(217, 20%, 14%);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .chart-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .chart-title { margin: 0 0 4px; font-size: 1.125rem; font-weight: 600; color: hsl(210, 40%, 96%); }
        .chart-subtitle { margin: 0; font-size: 0.875rem; color: hsl(215, 20%, 55%); }

        .chart-stat { text-align: right; display: flex; flex-direction: column; gap: 4px; }
        .stat-label { font-size: 0.75rem; color: hsl(215, 20%, 50%); text-transform: uppercase; font-weight: 600; }
        .stat-val { font-size: 1.5rem; font-weight: 700; color: hsl(43, 96%, 56%); letter-spacing: -0.02em; }

        .chart-body { height: 300px; width: 100%; }

        .chart-loading { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: hsl(215, 20%, 50%); font-size: 0.875rem; }

        .empty-card { align-items: center; justify-content: center; border-style: dashed; }
        .empty-content { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .empty-content p { margin: 0; color: hsl(215, 20%, 65%); font-weight: 500; }
        .empty-content span { font-size: 0.75rem; color: hsl(215, 20%, 40%); text-transform: uppercase; letter-spacing: 0.05em; }

        .top-items-list { display: flex; flex-direction: column; gap: 12px; height: 300px; overflow-y: auto; }
        .top-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          background: hsl(222, 35%, 10%);
          border-radius: 8px;
          border: 1px solid hsl(217, 20%, 16%);
        }
        .item-rank { 
          width: 28px; height: 28px; 
          border-radius: 50%; 
          background: hsl(43, 96%, 56%, 0.1); 
          color: hsl(43, 96%, 56%); 
          display: flex; align-items: center; justify-content: center; 
          font-weight: 700; font-size: 0.875rem; 
        }
        .item-info { flex: 1; }
        .item-name { color: white; font-weight: 500; margin-bottom: 4px; }
        .item-sales { color: hsl(215, 20%, 60%); font-size: 0.875rem; }
        .item-rev { font-weight: 700; color: hsl(142, 76%, 55%); }

        .payments-table {
          width: 100%;
          border-collapse: collapse;
        }
        .payments-table th {
          text-align: left;
          padding: 12px;
          color: hsl(215, 20%, 55%);
          font-weight: 500;
          font-size: 0.875rem;
          border-bottom: 1px solid hsl(217, 20%, 16%);
        }
        .payments-table td {
          padding: 16px 12px;
          color: white;
          border-bottom: 1px dashed hsl(217, 20%, 16%);
        }
        .method-badge {
          background: hsl(217, 20%, 16%);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.875rem;
          color: hsl(210, 40%, 96%);
        }
        .text-center { text-align: center; }
        .text-muted { color: hsl(215, 20%, 50%); }
        
        .flex { display: flex; }
        .justify-center { justify-content: center; }

        .heatmap-grid { display: flex; flex-direction: column; gap: 4px; }
        .heatmap-row { display: flex; gap: 4px; }
        .heatmap-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          color: white;
          border-radius: 4px;
        }
        .type-cell {
          width: 140px;
          flex-shrink: 0;
          justify-content: flex-start;
          color: hsl(215, 20%, 75%);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding-right: 8px;
        }
        .date-cell {
          flex: 1;
          color: hsl(215, 20%, 55%);
          padding: 8px 0;
          font-weight: 500;
        }
        .date-cell.is-today {
          color: hsl(43, 96%, 56%);
          font-weight: 700;
        }
        .data-cell {
          flex: 1;
          height: 36px;
          cursor: pointer;
          transition: transform 0.1s;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        .data-cell:hover {
          transform: scale(1.1);
          z-index: 10;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}

