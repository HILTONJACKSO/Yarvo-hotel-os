'use client';

import { useAuth } from '@/lib/auth-provider';
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
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('morning');
    else if (h < 17) setGreeting('afternoon');
    else setGreeting('evening');

    const fetchMetrics = async () => {
      try {
        const [metRes, revRes, actRes] = await Promise.all([
          fetch('/api/v1/analytics/dashboard'),
          fetch('/api/v1/analytics/revenue-chart'),
          fetch('/api/v1/analytics/recent-activity')
        ]);
        
        const metData = await metRes.json();
        if (!metRes.ok) throw new Error(metData.message || 'Failed to fetch metrics');
        
        const revData = await revRes.json();
        const actData = await actRes.json();

        setMetrics(metData.data);
        setRevenueData(revData.data || []);
        setRecentActivity(actData.data || []);
      } catch (err: any) {
        setError(err.message);
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
          <p className="welcome-sub">Here&apos;s what&apos;s happening at Yarvo today.</p>
        </div>
        <div className="welcome-badge">
          <span className="role-chip">{user?.role?.replace('_', ' ')}</span>
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
          { title: "Collected Revenue", value: loading ? '...' : `$${metrics?.todaysRevenue || '0.00'}`, Icon: DollarSign, desc: 'Payments received today' },
          { title: 'Outstanding Revenue', value: loading ? '...' : `$${metrics?.outstandingRevenue || '0.00'}`, Icon: ClipboardList, desc: 'Unpaid folios & corporate accounts' },
        ].map((card) => {
          const IconComponent = card.Icon;
          return (
            <div key={card.title} className="stat-card">
              <div className="stat-icon"><IconComponent size={24} color="hsl(215, 20%, 55%)" /></div>
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
          <div className="chart-container">
            {loading ? (
              <div style={{ color: 'hsl(215, 20%, 65%)', padding: '40px', textAlign: 'center' }}>Loading chart...</div>
            ) : revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 20%, 18%)" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(215, 20%, 50%)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(215, 20%, 50%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(222, 35%, 10%)', borderColor: 'hsl(217, 20%, 20%)', borderRadius: '8px', color: 'white' }}
                    itemStyle={{ color: 'hsl(142, 76%, 50%)' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(142, 76%, 45%)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
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
          background: linear-gradient(135deg, hsl(222,35%,9%) 0%, hsl(224,39%,8%) 100%);
          border: 1px solid hsl(217, 20%, 14%);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
        }
        .welcome-banner::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, hsl(43,96%,56%,0.08), transparent 70%);
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
          background: hsl(43,96%,56%,0.12);
          border: 1px solid hsl(43,96%,56%,0.25);
          border-radius: 20px;
          color: hsl(43,96%,70%);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
          letter-spacing: 0.04em;
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
          background: hsl(222, 35%, 8%);
          border: 1px solid hsl(217, 20%, 14%);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .stat-card:hover {
          border-color: hsl(217, 20%, 22%);
          transform: translateY(-2px);
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
        }

        .chart-section, .activity-section {
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 16%);
          border-radius: 12px;
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
          background: hsl(217, 20%, 16%);
          color: hsl(43,96%,56%);
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

