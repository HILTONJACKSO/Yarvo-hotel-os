'use client';

import { useAuth } from '@/lib/auth-provider';
import { useCurrency } from '@/lib/currency';
import { fetchWithAuth } from '@/lib/sync';
import { useState, useEffect } from 'react';
import { Building2, CheckCircle2, ClipboardList, DollarSign, AlertCircle, Activity as ActivityIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

type DashboardMetrics = {
  occupancyRate: string;
  checkInsToday: number;
  pendingReservations: number;
  todaysRevenue: string;
  outstandingRevenue: string;
};

type ChartData = { date: string; revenue: number; };
type ActivityItem = { id: string; type: string; title: string; description: string; timestamp: string; };

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { format, currencySymbol } = useCurrency();
  const [greeting, setGreeting] = useState('');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      logout();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(c => c !== null ? c - 1 : null);
      setError(`Session expired. Logging out in ${countdown - 1} seconds...`);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, logout]);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('morning');
    else if (h < 17) setGreeting('afternoon');
    else setGreeting('evening');

    const fetchMetrics = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setLoading(false);
        return;
      }
      try {
        const [metRes, revRes, actRes] = await Promise.all([
          fetchWithAuth('/api/v1/analytics/dashboard'),
          fetchWithAuth('/api/v1/analytics/revenue-chart'),
          fetchWithAuth('/api/v1/analytics/recent-activity')
        ]);
        
        const metData = await metRes.json();
        if (!metRes.ok) throw new Error(metData.message || 'Failed to fetch metrics');
        
        const revData = await revRes.json();
        const actData = await actRes.json();

        setError(null);
        setMetrics(metData.data);
        setRevenueData(revData.data || []);
        setRecentActivity(actData.data || []);
      } catch (err: any) {
        if (err.message && (err.message.includes('authentication token') || err.message.includes('Unauthorized'))) {
          setError('Session expired. Logging out in 5 seconds...');
          setCountdown(c => c === null ? 5 : c);
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-home">
      <div className="welcome-banner">
        <div className="welcome-text">
          <p className="welcome-greeting">Good {greeting || 'day'},</p>
          <h2 className="welcome-name">{user?.firstName} {user?.lastName}</h2>
          <p className="welcome-sub">Here&apos;s what&apos;s happening at your property today.</p>
        </div>
        <div className="welcome-badge">
          <span className="role-chip">{user?.roles?.[0]?.replace('_', ' ')}</span>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="coming-soon-grid">
        {[
          { title: 'Occupancy Rate', value: loading ? '...' : (metrics?.occupancyRate || '0.0%'), Icon: Building2, desc: 'Live occupancy' },
          { title: 'Check-Ins Today', value: loading ? '...' : (metrics?.checkInsToday || 0), Icon: CheckCircle2, desc: 'Scheduled arrivals' },
          { title: "Collected Revenue", value: loading ? '...' : format(metrics?.todaysRevenue || '0.00'), Icon: DollarSign, desc: 'Payments received today' },
          { title: 'Outstanding Revenue', value: loading ? '...' : format(metrics?.outstandingRevenue || '0.00'), Icon: ClipboardList, desc: 'Unpaid folios & corporate accounts' },
        ].map((card) => {
          const IconComponent = card.Icon;
          return (
            <div key={card.title} className="stat-card">
              <div className="stat-icon"><IconComponent size={24} className="text-[#CA9851]" /></div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-title">{card.title}</div>
              <div className="stat-desc">{card.desc}</div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-content-grid">
        <div className="chart-section">
          <div className="section-header">
            <h3>Revenue (Last 7 Days)</h3>
          </div>
          <div className="chart-container" style={{ height: '350px', width: '100%', position: 'relative' }}>
            {loading ? (
              <div style={{ color: 'hsl(215, 20%, 65%)', padding: '40px', textAlign: 'center' }}>Loading chart...</div>
            ) : revenueData.length > 0 ? (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#CA9851" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#CA9851" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 20%, 18%)" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(215, 20%, 50%)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      stroke="hsl(215, 20%, 50%)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(v) => `${currencySymbol}${v}`}
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#070F1E', borderColor: 'rgba(202, 152, 81, 0.3)', borderRadius: '10px', color: 'white' }}
                      itemStyle={{ color: '#DFB776' }}
                      formatter={(value: any) => [format(value), 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#DFB776" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ color: 'hsl(215, 20%, 65%)', padding: '40px', textAlign: 'center' }}>No revenue data available</div>
            )}
          </div>
        </div>

        <div className="activity-section">
          <div className="section-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-list">
            {loading ? (
              <div style={{ color: 'hsl(215, 20%, 65%)', padding: '20px', textAlign: 'center' }}>Loading activity...</div>
            ) : recentActivity.length > 0 ? (
              recentActivity.map(item => (
                <div key={item.id} className="activity-item">
                  <div className="activity-icon">
                    {item.type === 'RESERVATION' ? <ClipboardList size={16} /> : 
                     item.type === 'POS_ORDER' ? <DollarSign size={16} /> : 
                     <ActivityIcon size={16} />}
                  </div>
                  <div className="activity-details">
                    <p className="activity-title">{item.title}</p>
                    <p className="activity-desc">{item.description}</p>
                  </div>
                  <div className="activity-time">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'hsl(215, 20%, 65%)', padding: '20px', textAlign: 'center' }}>No recent activity</div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-home {
          display: flex;
          flex-direction: column;
          gap: 28px;
          max-width: 1200px;
        }

        .welcome-banner {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding: 28px 32px;
          background: linear-gradient(135deg, #070F1E 0%, #0B1D33 100%);
          border: 1px solid rgba(202, 152, 81, 0.22);
          border-radius: 18px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .welcome-banner::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(202, 152, 81, 0.14), transparent 70%);
          border-radius: 50%;
        }

        .welcome-greeting {
          font-size: 0.875rem;
          color: hsl(215, 20%, 55%);
          margin: 0 0 4px;
        }
        .welcome-name {
          font-size: 1.75rem;
          font-weight: 700;
          color: hsl(210, 40%, 96%);
          margin: 0 0 6px;
          letter-spacing: -0.025em;
        }
        .welcome-sub {
          font-size: 0.875rem;
          color: hsl(215, 20%, 50%);
          margin: 0;
        }

        .role-chip {
          display: inline-block;
          padding: 6px 14px;
          background: rgba(202, 152, 81, 0.15);
          border: 1px solid rgba(202, 152, 81, 0.35);
          border-radius: 20px;
          color: #DFB776;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

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

        .coming-soon-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }

        .stat-card {
          padding: 24px;
          background: #070F1E;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: all 0.2s ease;
        }
        .stat-card:hover {
          border-color: rgba(202, 152, 81, 0.35);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        }

        .stat-icon { font-size: 1.5rem; margin-bottom: 4px; }
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: hsl(210, 40%, 96%);
          letter-spacing: -0.04em;
        }
        .stat-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(210, 40%, 80%);
        }
        .stat-desc {
          font-size: 0.75rem;
          color: hsl(215, 16%, 38%);
        }

        .dashboard-content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-top: 8px;
          align-items: start;
        }

        .chart-section, .activity-section {
          background: #070F1E;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .section-header {
          margin-bottom: 24px;
        }
        .section-header h3 {
          margin: 0;
          color: white;
          font-size: 1.125rem;
        }

        .chart-container {
          flex: 1;
          min-height: 300px;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding-bottom: 16px;
          border-bottom: 1px solid hsl(217, 20%, 14%);
        }
        .activity-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(202, 152, 81, 0.12);
          color: #DFB776;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activity-details {
          flex: 1;
          min-width: 0;
        }
        .activity-title {
          margin: 0 0 4px 0;
          color: hsl(210, 40%, 96%);
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .activity-desc {
          margin: 0;
          color: hsl(215, 20%, 65%);
          font-size: 0.75rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .activity-time {
          font-size: 0.75rem;
          color: hsl(215, 20%, 50%);
          white-space: nowrap;
        }

        @media (max-width: 1024px) {
          .dashboard-content-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 768px) {
          .welcome-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            padding: 20px;
          }
          
          .welcome-name {
            font-size: 1.5rem;
          }
          
          .coming-soon-grid {
            grid-template-columns: 1fr;
          }
          
          .dashboard-home {
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}

