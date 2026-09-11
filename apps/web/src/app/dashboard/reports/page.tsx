'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
import { downloadCSV } from '@/utils/export';

type ChartData = { date: string; revenue: number; };
type FbMetrics = { todayFbRevenue: number; todayFbIndex: number; weekFbRevenue: number; weekFbIndex: number; monthFbRevenue: number; monthFbIndex: number; customRangeRevenue?: number; };
type TopItem = { id: string; name: string; quantity: number; revenue: number; };
type PaymentMethodData = { method: string; revenue: number; };
type TicketMetrics = { adultTickets: number; kidTickets: number; poolTickets: number; totalRevenue: number; todayRevenue: number; weekRevenue: number; monthRevenue: number; customRangeRevenue?: number; validCount: number; usedCount: number; chart: { month: string; adults: number; kids: number; pool: number; revenue: number; }[]; };
type EventMetrics = { totalBookings: number; confirmedCount: number; totalRevenue: number; todayRevenue: number; weekRevenue: number; monthRevenue: number; customRangeRevenue?: number; bookings: any[]; };

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
  const [activeTab, setActiveTab] = useState<'HOTEL' | 'FB' | 'FINANCIAL' | 'TICKETS' | 'EVENTS'>('HOTEL');
  
  // Hotel state
  const [hotelData, setHotelData] = useState<ChartData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  
  // F&B state
  const [fbMetrics, setFbMetrics] = useState<FbMetrics | null>(null);
  const [fbChart, setFbChart] = useState<ChartData[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);

  // Financial state
  const [paymentData, setPaymentData] = useState<PaymentMethodData[]>([]);
  const [ticketMetrics, setTicketMetrics] = useState<TicketMetrics | null>(null);
  const [eventMetrics, setEventMetrics] = useState<EventMetrics | null>(null);

  const [dateRangeStr, setDateRangeStr] = useState<string>('Last 7 Days');
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
        } else if (activeTab === 'TICKETS') {
          const res = await fetch(`/api/v1/analytics/tickets-metrics${query}`, { credentials: 'include' });
          const json = await res.json();
          setTicketMetrics(json.data);
        } else if (activeTab === 'EVENTS') {
          const res = await fetch(`/api/v1/analytics/events-metrics${query}`, { credentials: 'include' });
          const json = await res.json();
          setEventMetrics(json.data);
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
    if (start && end) {
      if (start === end) {
        setDateRangeStr(start);
      } else {
        setDateRangeStr(`${start} - ${end}`);
      }
    } else {
      setDateRangeStr('Last 7 Days');
    }
    fetchData(start, end);
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'print') => {
    if (format === 'print') {
      window.print();
    } else if (format === 'pdf') {
      const element = document.querySelector('.page-container') as HTMLElement;
      if (!element) {
        alert('Could not generate PDF: page container not found.');
        return;
      }
      
      try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#0a0d14'
          });
          
          const imgData = canvas.toDataURL('image/png', 1.0);
          const pdfWidth = 210;
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? 'l' : 'p',
            unit: 'mm',
            format: [pdfWidth, pdfHeight]
          });
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Kwalee-Report-${activeTab}-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err: any) {
          console.error('PDF generation error:', err);
          alert(`Failed to generate PDF: ${err.message || 'Unknown error'}`);
        }
    } else if (format === 'csv') {
      if (activeTab === 'HOTEL') {
        downloadCSV(hotelData, 'hotel-revenue-report');
      } else if (activeTab === 'FB') {
        downloadCSV(fbChart, 'fb-revenue-report');
      } else if (activeTab === 'FINANCIAL') {
        downloadCSV(paymentData, 'financial-revenue-report');
      } else if (activeTab === 'TICKETS') {
        downloadCSV(ticketMetrics?.chart || [], 'tickets-revenue-report');
      } else if (activeTab === 'EVENTS') {
        downloadCSV(eventMetrics?.bookings || [], 'events-revenue-report');
      }
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
        <button 
          className={`tab-btn ${activeTab === 'TICKETS' ? 'active' : ''}`}
          onClick={() => setActiveTab('TICKETS')}
        >
          <TrendingUp size={18} /> Tickets & Pool
        </button>
        <button 
          className={`tab-btn ${activeTab === 'EVENTS' ? 'active' : ''}`}
          onClick={() => setActiveTab('EVENTS')}
        >
          <TrendingUp size={18} /> Events
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
                <p className="chart-subtitle">{dateRangeStr}</p>
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
            {fbMetrics?.customRangeRevenue != null && fbMetrics?.customRangeRevenue !== undefined && (
              <div className="summary-card" style={{ border: '1px solid hsl(43, 96%, 56%)' }}>
                <span className="summary-label" style={{ color: 'hsl(43, 96%, 56%)' }}>Custom Range Revenue</span>
                <span className="summary-val">${fbMetrics.customRangeRevenue.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="chart-grid">
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">F&B Revenue Trend</h3>
                  <p className="chart-subtitle">{dateRangeStr}</p>
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

      {activeTab === 'TICKETS' && (
        <div className="fb-dashboard">
          <div className="summary-cards">
            <div className="summary-card">
              <span className="summary-label">Today's Revenue</span>
              <span className="summary-val">${(ticketMetrics?.todayRevenue ?? 0).toFixed(2)}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">This Week's Revenue</span>
              <span className="summary-val">${(ticketMetrics?.weekRevenue ?? 0).toFixed(2)}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">This Month's Revenue</span>
              <span className="summary-val">${(ticketMetrics?.monthRevenue ?? 0).toFixed(2)}</span>
            </div>
            {ticketMetrics?.customRangeRevenue != null && ticketMetrics?.customRangeRevenue !== undefined && (
              <div className="summary-card" style={{ border: '1px solid hsl(43, 96%, 56%)' }}>
                <span className="summary-label" style={{ color: 'hsl(43, 96%, 56%)' }}>Custom Range Revenue</span>
                <span className="summary-val">${ticketMetrics.customRangeRevenue.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="chart-grid">
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Ticket Revenue by Month</h3>
                  <p className="chart-subtitle">Monthly breakdown</p>
                </div>
                <div className="chart-stat">
                  <span className="stat-label">Total Revenue</span>
                  <span className="stat-val">${(ticketMetrics?.totalRevenue ?? 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="chart-body">
                {loading ? (
                  <div className="chart-loading">Loading ticket data...</div>
                ) : !ticketMetrics?.chart?.length ? (
                  <div className="chart-loading">No ticket data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ticketMetrics.chart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 20%, 14%)" vertical={false} />
                      <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickFormatter={(val) => `$${val}`} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(222, 35%, 10%)', borderColor: 'hsl(217, 20%, 20%)', borderRadius: '8px', color: 'hsl(210, 40%, 96%)' }}
                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="hsl(43, 96%, 56%)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Ticket Breakdown</h3>
              </div>
              <div className="top-items-list">
                {loading && <div className="chart-loading">Loading...</div>}
                {ticketMetrics && (
                  <>
                    <div className="top-item">
                      <div className="item-rank">A</div>
                      <div className="item-info"><div className="item-name">Adult Tickets</div><div className="item-sales">Total issued</div></div>
                      <div className="item-rev">{ticketMetrics.adultTickets}</div>
                    </div>
                    <div className="top-item">
                      <div className="item-rank">K</div>
                      <div className="item-info"><div className="item-name">Kid Tickets</div><div className="item-sales">Total issued</div></div>
                      <div className="item-rev">{ticketMetrics.kidTickets}</div>
                    </div>
                    <div className="top-item">
                      <div className="item-rank">P</div>
                      <div className="item-info"><div className="item-name">Pool Tickets</div><div className="item-sales">Total issued</div></div>
                      <div className="item-rev">{ticketMetrics.poolTickets}</div>
                    </div>
                    <div className="top-item">
                      <div className="item-rank">✓</div>
                      <div className="item-info"><div className="item-name">Valid / Unused</div><div className="item-sales">Active tickets</div></div>
                      <div className="item-rev">{ticketMetrics.validCount}</div>
                    </div>
                    <div className="top-item">
                      <div className="item-rank">U</div>
                      <div className="item-info"><div className="item-name">Used Tickets</div><div className="item-sales">Redeemed</div></div>
                      <div className="item-rev">{ticketMetrics.usedCount}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'EVENTS' && (
        <div className="fb-dashboard">
          <div className="summary-cards">
            <div className="summary-card">
              <span className="summary-label">Today's Revenue</span>
              <span className="summary-val">${(eventMetrics?.todayRevenue ?? 0).toFixed(2)}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">This Week's Revenue</span>
              <span className="summary-val">${(eventMetrics?.weekRevenue ?? 0).toFixed(2)}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">This Month's Revenue</span>
              <span className="summary-val">${(eventMetrics?.monthRevenue ?? 0).toFixed(2)}</span>
            </div>
            {eventMetrics?.customRangeRevenue != null && eventMetrics?.customRangeRevenue !== undefined && (
              <div className="summary-card" style={{ border: '1px solid hsl(43, 96%, 56%)' }}>
                <span className="summary-label" style={{ color: 'hsl(43, 96%, 56%)' }}>Custom Range Revenue</span>
                <span className="summary-val">${eventMetrics.customRangeRevenue.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="chart-grid">
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Event Bookings</h3>
                  <p className="chart-subtitle">All bookings overview</p>
                </div>
                <div className="chart-stat">
                  <span className="stat-label">Total Revenue</span>
                  <span className="stat-val">${(eventMetrics?.totalRevenue ?? 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="top-items-list">
                {loading && <div className="chart-loading">Loading events...</div>}
                {!loading && !eventMetrics?.bookings?.length && <div className="chart-loading">No event bookings yet.</div>}
                {eventMetrics?.bookings?.map((b: any) => (
                  <div key={b.id} className="top-item">
                    <div className="item-rank" style={{ fontSize: '0.7rem', padding: '2px 4px' }}>{b.status?.slice(0,3)}</div>
                    <div className="item-info">
                      <div className="item-name">{b.eventType || 'Event'}</div>
                      <div className="item-sales">{new Date(b.date).toLocaleDateString()}</div>
                    </div>
                    <div className="item-rev">${Number(b.revenue).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Events Summary</h3>
              </div>
              <div className="top-items-list">
                {eventMetrics && (
                  <>
                    <div className="top-item">
                      <div className="item-rank">#</div>
                      <div className="item-info"><div className="item-name">Total Bookings</div><div className="item-sales">All time</div></div>
                      <div className="item-rev">{eventMetrics.totalBookings}</div>
                    </div>
                    <div className="top-item">
                      <div className="item-rank">✓</div>
                      <div className="item-info"><div className="item-name">Confirmed</div><div className="item-sales">Confirmed bookings</div></div>
                      <div className="item-rev">{eventMetrics.confirmedCount}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
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


