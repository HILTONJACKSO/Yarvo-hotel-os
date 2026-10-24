'use client';

import { useAuth } from '@/lib/auth-provider';
import { useCurrency } from '@/lib/currency';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { getDefaultReceiptInvoiceSettings } from '@/lib/receipt-invoice-helper';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLoading from './loading';

import { 
  Compass,
  Home, 
  CalendarCheck, 
  Users, 
  Building2,
  BedDouble, 
  Tags, 
  ConciergeBell, 
  Sparkles, 
  Wrench, 
  CreditCard, 
  BarChart3, 
  Settings,
  Utensils,
  ChefHat,
  Martini,
  Package,
  Coffee,
  Wallet,
  Receipt,
  Moon,
  Landmark,
  Ticket,
  CalendarDays,
  Clock,
  RotateCcw,
  Activity,
  Globe
} from 'lucide-react';

type NavItem = 
  | { icon: any; label: string; href: string; id: string; type?: never; allowedRoles: string[]; requiredFeature?: string }
  | { type: 'divider' };

const NAV_ITEMS: NavItem[] = [
  { icon: Home, label: 'Dashboard', href: '/dashboard', id: 'nav-dashboard', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'cashier', 'pos_cashier', 'supervisor', 'front_desk'] },
  { icon: CalendarCheck, label: 'Reservations', href: '/dashboard/reservations', id: 'nav-reservations', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'supervisor', 'front_desk'], requiredFeature: 'FRONT_DESK' },
  { icon: Users, label: 'Guests', href: '/dashboard/guests', id: 'nav-guests', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'supervisor', 'front_desk'], requiredFeature: 'FRONT_DESK' },
  { icon: Building2, label: 'Companies', href: '/dashboard/companies', id: 'nav-companies', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'front_desk'], requiredFeature: 'STAFF_MANAGEMENT' },
  { icon: Users, label: 'Staff', href: '/dashboard/staff', id: 'nav-staff', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'staff_waiter'], requiredFeature: 'STAFF_MANAGEMENT' },
  { type: 'divider' },
  { icon: BedDouble, label: 'Rooms', href: '/dashboard/rooms', id: 'nav-rooms', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'supervisor', 'front_desk'], requiredFeature: 'FRONT_DESK' },
  { icon: Tags, label: 'Room Types', href: '/dashboard/room-types', id: 'nav-room-types', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'supervisor'], requiredFeature: 'FRONT_DESK' },
  { icon: ConciergeBell, label: 'Front Desk', href: '/dashboard/front-desk', id: 'nav-frontdesk', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'supervisor', 'front_desk', 'housekeeping'], requiredFeature: 'FRONT_DESK' },
  { icon: Sparkles, label: 'Housekeeping', href: '/dashboard/housekeeping', id: 'nav-housekeeping', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'supervisor', 'front_desk', 'housekeeping'], requiredFeature: 'OPERATIONS' },
  { icon: Wrench, label: 'Maintenance', href: '/dashboard/maintenance', id: 'nav-maintenance', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'supervisor', 'front_desk'], requiredFeature: 'OPERATIONS' },
  { type: 'divider' },
  { icon: Compass, label: 'Tours, Events & Packages', href: '/dashboard/tours-events', id: 'nav-tours-events', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'front_desk'], requiredFeature: 'EVENTS' },
  { icon: Ticket, label: 'Tickets', href: '/dashboard/tickets', id: 'nav-tickets', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'supervisor', 'cashier', 'pos_cashier', 'front_desk', 'ticketing_staff'], requiredFeature: 'EVENTS' },
  { icon: CalendarDays, label: 'Events', href: '/dashboard/events', id: 'nav-events', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'supervisor', 'cashier', 'pos_cashier', 'front_desk', 'staff_waiter'], requiredFeature: 'EVENTS' },
  { type: 'divider' },
  { icon: CreditCard, label: 'Billing', href: '/dashboard/billing', id: 'nav-billing', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'accounting', 'cashier', 'pos_cashier', 'front_desk'], requiredFeature: 'FINANCE' },
  { icon: Receipt, label: 'Expenses', href: '/dashboard/expenses', id: 'nav-expenses', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'accounting', 'cashier', 'pos_cashier'], requiredFeature: 'FINANCE' },
  { icon: Clock, label: 'Night Audit', href: '/dashboard/night-audit', id: 'nav-night-audit', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'accounting', 'cashier', 'pos_cashier', 'front_desk'], requiredFeature: 'FINANCE' },
  { icon: Landmark, label: 'Financials', href: '/dashboard/financials', id: 'nav-financials', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'accounting'], requiredFeature: 'FINANCE' },
  { icon: BarChart3, label: 'Reports', href: '/dashboard/reports', id: 'nav-reports', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'accounting'], requiredFeature: 'FINANCE' },
  { icon: Activity, label: 'Audit Tracking', href: '/dashboard/audit-logs', id: 'nav-audit-logs', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'accounting'], requiredFeature: 'FINANCE' },
  { type: 'divider' },
  { icon: Utensils, label: 'Point of Sale', href: '/dashboard/pos', id: 'nav-pos', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'supervisor', 'cashier', 'pos_cashier', 'pos', 'front_desk', 'staff_waiter', 'waitstaff'], requiredFeature: 'POS' },
  { icon: ChefHat, label: 'Kitchen KDS', href: '/dashboard/kitchen', id: 'nav-kitchen', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'supervisor', 'kitchen_chef', 'chef', 'cashier', 'pos_cashier'], requiredFeature: 'POS' },
  { icon: Martini, label: 'Bar Drinks', href: '/dashboard/bar', id: 'nav-bar', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'supervisor', 'cashier', 'pos_cashier', 'bartender'], requiredFeature: 'POS' },
  { icon: Coffee, label: 'Waitstaff', href: '/dashboard/waitstaff', id: 'nav-waitstaff', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'supervisor', 'cashier', 'pos_cashier', 'staff_waiter', 'waitstaff'], requiredFeature: 'POS' },
  { icon: RotateCcw, label: 'Returns & Discounts', href: '/dashboard/returns', id: 'nav-returns', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'supervisor', 'cashier', 'pos_cashier', 'front_desk'], requiredFeature: 'POS' },
  { icon: Package, label: 'Inventory', href: '/dashboard/inventory', id: 'nav-inventory', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'cashier', 'pos_cashier', 'supervisor'], requiredFeature: 'INVENTORY' },
  { type: 'divider' },
  { icon: Wallet, label: 'POS Cashier', href: '/dashboard/cashier', id: 'nav-cashier', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'supervisor', 'cashier', 'pos_cashier', 'front_desk'], requiredFeature: 'POS' },
  { type: 'divider' },
  { icon: Globe, label: 'Website CMS', href: '/dashboard/cms', id: 'nav-cms', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager'] },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings', id: 'nav-settings', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager'] },
];


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const { currency, currencySymbol } = useCurrency();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [currentTime, setCurrentTime] = useState<string>('');

  const property = useLiveQuery(() => db.properties.toCollection().first());
  const receiptSettings = getDefaultReceiptInvoiceSettings(property);
  const propertyName = user?.propertyName || property?.name || receiptSettings.businessName || 'Kwalee Beach Resort';
  const logoUrl = receiptSettings.logoUrl || '/kwalee-logo.png';

  useEffect(() => {
    setCurrentPath(window.location.pathname);
    
    // Default sidebar to closed on tablet and mobile
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
    
    // Check if user is trying to access a restricted path
    if (user && user.roles) {
      const userRoles = (user.roles || []).map((r: any) => 
        (typeof r === 'string' ? r : r?.name || '').toLowerCase()
      );

      const isOwnerOrAdmin = userRoles.some((role: string) => 
        ['admin', 'ceo', 'super_admin'].includes(role)
      );

      const checkAccess = (item: NavItem) => {
        if (item.type === 'divider') return false;
        if (isOwnerOrAdmin) return true;
        return item.allowedRoles.some(r => userRoles.includes(r.toLowerCase()));
      };

      // Find the most specific matching route by sorting descending by href length
      const matchableItems = NAV_ITEMS.filter(item => item.type !== 'divider');
      matchableItems.sort((a, b) => (b.href?.length || 0) - (a.href?.length || 0));
      
      const currentItem = matchableItems.find(item => window.location.pathname.startsWith(item.href!));
      if (currentItem) {
        const hasAccess = checkAccess(currentItem);

        if (!hasAccess) {
          // Find the first route this user IS allowed to access
          const firstAllowed = NAV_ITEMS.find(item => checkAccess(item));
          if (firstAllowed && firstAllowed.type !== 'divider' && firstAllowed.href) {
            router.replace(firstAllowed.href);
          } else {
            router.replace('/login');
          }
        }
      }
    }
    
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [user, router]);

  if (isLoading || !user) {
    return <DashboardLoading />;
  }

  return (
    <div className="dashboard-root">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="mobile-backdrop" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo flex items-center min-w-0">
            {sidebarOpen ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <img 
                  src={logoUrl} 
                  alt={propertyName} 
                  className="w-7 h-7 rounded-full object-contain border border-[#CA9851]/40 shadow-sm flex-shrink-0 bg-[#070F1E] p-0.5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/kwalee-logo.png';
                  }}
                />
                <span className="font-serif font-bold text-white tracking-widest text-sm truncate" title={propertyName}>
                  {propertyName.toUpperCase()}
                </span>
              </div>
            ) : (
              <img 
                src={logoUrl} 
                alt={propertyName} 
                title={propertyName}
                className="w-7 h-7 rounded-full object-contain border border-[#CA9851]/40 shadow-sm bg-[#070F1E] p-0.5"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/kwalee-logo.png';
                }}
              />
            )}
          </div>
          <button
            id="sidebar-toggle"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarOpen
                ? <path d="M15 18l-6-6 6-6" />
                : <path d="M9 18l6-6-6-6" />}
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {(() => {
            const userRoles = (user.roles || []).map((r: any) => 
              (typeof r === 'string' ? r : r?.name || '').toLowerCase()
            );
            const isOwnerOrAdmin = userRoles.some((role: string) => 
              ['admin', 'ceo', 'super_admin'].includes(role)
            );

            // Filter items by role
            const visibleItems = NAV_ITEMS.filter((item) => {
              if (item.type === 'divider') return true;
              return isOwnerOrAdmin || item.allowedRoles.some(r => userRoles.includes(r.toLowerCase()));
            });

            // Clean up dividers: remove leading, trailing, and consecutive dividers
            const cleanedItems: NavItem[] = [];
            for (let i = 0; i < visibleItems.length; i++) {
              const current = visibleItems[i];
              if (current.type === 'divider') {
                if (cleanedItems.length === 0 || cleanedItems[cleanedItems.length - 1].type === 'divider') {
                  continue;
                }
              }
              cleanedItems.push(current);
            }
            if (cleanedItems.length > 0 && cleanedItems[cleanedItems.length - 1].type === 'divider') {
              cleanedItems.pop();
            }

            return cleanedItems.map((item, index) => {
              if (item.type === 'divider') {
                return <div key={`divider-${index}`} className="nav-divider" />;
              }

              const IconComponent = item.icon!;
              return (
                <a
                  key={item.href}
                  id={item.id}
                  href={item.href}
                  className={`nav-item ${currentPath === item.href ? 'nav-item-active' : ''}`}
                  title={!sidebarOpen ? item.label : undefined}
                  onClick={() => window.innerWidth <= 1024 && setSidebarOpen(false)}
                >
                  <span className="nav-icon">
                    <IconComponent size={20} />
                  </span>
                  {sidebarOpen && <span className="nav-label">{item.label}</span>}
                  {currentPath === item.href && <div className="nav-active-bar" />}
                </a>
              );
            });
          })()}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="user-card">
              <div className="user-avatar">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              {sidebarOpen && (
                <div className="user-info">
                  <div className="user-name">{user.firstName} {user.lastName}</div>
                  <div className="user-role">{user.roles?.[0]?.replace(/_/g, ' ') || 'No Role'}</div>
                </div>
              )}
              <button
                id="logout-btn"
                className="logout-btn"
                onClick={logout}
                title="Sign out"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h1 className="page-title">Dashboard</h1>
          </div>
          <div className="topbar-right">
            <a
              href="/dashboard/settings"
              className="topbar-currency-badge"
              title="Click to change currency in Settings"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'hsl(222, 35%, 12%)',
                border: '1px solid hsl(217, 20%, 22%)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'hsl(210, 40%, 96%)',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ color: 'hsl(142, 70%, 50%)', fontWeight: 'bold' }}>{currencySymbol}</span>
              <span>{currency}</span>
            </a>
            <div className="topbar-badge">
              <span className="status-dot" />
              Live
            </div>
            <div className="topbar-time">
              {currentTime}
            </div>
          </div>
        </header>
        <div className="dashboard-content">
          {children}
        </div>
      </main>

      <style>{`
        .modern-loader-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: hsl(224, 39%, 4%);
          z-index: 9999;
          overflow: hidden;
        }

        .glass-backdrop {
          position: absolute;
          inset: -20%;
          background: radial-gradient(circle at 50% 50%, hsl(221, 83%, 53%, 0.05) 0%, transparent 50%);
          animation: pulse-bg 4s ease-in-out infinite alternate;
        }

        .loader-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
        }

        .loader-logo-wrapper {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .glow-orb {
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #CA9851;
          filter: blur(30px);
          opacity: 0.3;
          animation: orb-pulse 2s ease-in-out infinite alternate;
        }

        .glow-rect {
          animation: rect-pulse 2s ease-in-out infinite alternate;
        }

        .outline-rect {
          animation: spin-gradient 4s linear infinite;
          transform-origin: center;
        }

        .logo-path {
          stroke-dasharray: 120;
          stroke-dashoffset: 120;
          animation: drawPath 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .logo-dot {
          animation: dotBounce 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .loader-text-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .loader-text {
          font-family: var(--font-inter), sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: hsl(210, 40%, 96%);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-shadow: 0 0 10px rgba(202, 152, 81, 0.4);
        }

        .loader-dots {
          display: flex;
          gap: 6px;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #CA9851;
          opacity: 0.4;
          animation: dotFade 1.4s ease-in-out infinite;
        }

        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes drawPath {
          0% { stroke-dashoffset: 120; opacity: 0; }
          40% { stroke-dashoffset: 0; opacity: 1; }
          80% { stroke-dashoffset: -120; opacity: 0; }
          100% { stroke-dashoffset: -120; opacity: 0; }
        }

        @keyframes dotBounce {
          0%, 20% { transform: scale(0); opacity: 0; }
          40% { transform: scale(1.2); opacity: 1; }
          60% { transform: scale(1); opacity: 1; }
          80%, 100% { transform: scale(0); opacity: 0; }
        }

        @keyframes pulse-bg {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.2); opacity: 1; }
        }

        @keyframes orb-pulse {
          0% { transform: scale(0.8); opacity: 0.2; }
          100% { transform: scale(1.2); opacity: 0.4; }
        }

        @keyframes rect-pulse {
          0% { fill-opacity: 0.05; }
          100% { fill-opacity: 0.15; }
        }

        @keyframes spin-gradient {
          100% { transform: rotate(360deg); }
        }

        @keyframes dotFade {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }

        .dashboard-root {
          display: flex;
          min-height: 100vh;
          background: #050B14;
        }

        /* Sidebar */
        .sidebar {
          display: flex;
          flex-direction: column;
          background: #070F1E;
          border-right: 1px solid rgba(202, 152, 81, 0.15);
          transition: width 0.25s ease;
          flex-shrink: 0;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow: hidden;
        }
        .sidebar-open { width: 250px; }
        .sidebar-collapsed { width: 68px; }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 16px;
          border-bottom: 1px solid rgba(202, 152, 81, 0.12);
          min-height: 64px;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow: hidden;
          min-width: 0;
        }

        .sidebar-brand {
          font-weight: 700;
          font-size: 1rem;
          color: hsl(210, 40%, 96%);
          white-space: nowrap;
          letter-spacing: -0.02em;
        }

        .sidebar-toggle {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 5px 7px;
          color: hsl(215, 20%, 60%);
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .sidebar-toggle:hover {
          background: rgba(202, 152, 81, 0.12);
          color: #DFB776;
          border-color: rgba(202, 152, 81, 0.4);
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 14px 10px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(202, 152, 81, 0.2) transparent;
        }
        
        .sidebar-nav::-webkit-scrollbar {
          width: 5px;
        }
        .sidebar-nav::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(202, 152, 81, 0.2);
          border-radius: 10px;
        }
        .sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: rgba(202, 152, 81, 0.35);
        }

        .nav-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin: 6px 10px;
          flex-shrink: 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          color: hsl(215, 20%, 65%);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.01em;
          position: relative;
          transition: all 0.15s ease;
          white-space: nowrap;
          overflow: hidden;
        }
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.04);
          color: hsl(210, 40%, 95%);
        }
        .nav-item-active {
          background: linear-gradient(90deg, rgba(202, 152, 81, 0.16), rgba(202, 152, 81, 0.04));
          color: #DFB776;
          font-weight: 600;
          border: 1px solid rgba(202, 152, 81, 0.25);
        }
        .nav-item-active:hover { 
          background: linear-gradient(90deg, rgba(202, 152, 81, 0.22), rgba(202, 152, 81, 0.08));
          color: #E9C78C;
        }

        .nav-icon { font-size: 1rem; flex-shrink: 0; }
        .nav-label { flex: 1; }

        .nav-active-bar {
          position: absolute;
          right: 0;
          top: 6px;
          bottom: 6px;
          width: 3px;
          background: linear-gradient(to bottom, #DFB776, #CA9851);
          border-radius: 2px 0 0 2px;
          box-shadow: 0 0 8px rgba(202, 152, 81, 0.6);
        }

        .sidebar-footer {
          padding: 12px 10px;
          border-top: 1px solid rgba(202, 152, 81, 0.12);
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 12px;
          background: #0B1D33;
          border: 1px solid rgba(202, 152, 81, 0.2);
          overflow: hidden;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #DFB776, #CA9851);
          color: #070F1E;
          font-size: 0.6875rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          letter-spacing: 0.02em;
          box-shadow: 0 0 10px rgba(202, 152, 81, 0.35);
        }

        .user-info { flex: 1; min-width: 0; }
        .user-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: hsl(210, 40%, 92%);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-role {
          font-size: 0.6875rem;
          color: #DFB776;
          text-transform: capitalize;
          white-space: nowrap;
          font-weight: 600;
        }

        .logout-btn {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: hsl(215, 20%, 45%);
          display: flex;
          align-items: center;
          border-radius: 4px;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .logout-btn:hover {
          background: hsl(0,84%,60%,0.12);
          color: hsl(0, 84%, 65%);
        }

        /* Main area */
        .dashboard-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 100vh;
        }

        .dashboard-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          height: 64px;
          border-bottom: 1px solid rgba(202, 152, 81, 0.12);
          background: #070F1E;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .page-title {
          font-size: 1.0625rem;
          font-weight: 600;
          color: hsl(210, 40%, 92%);
          margin: 0;
          letter-spacing: -0.01em;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .topbar-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: hsl(142, 76%, 55%);
          background: hsl(142, 76%, 45%, 0.12);
          border: 1px solid hsl(142, 76%, 45%, 0.2);
          padding: 4px 10px;
          border-radius: 20px;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: hsl(142, 76%, 55%);
          animation: pulse-dot 2s ease infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .topbar-time {
          font-size: 0.75rem;
          color: hsl(215, 20%, 50%);
        }

        .dashboard-content {
          flex: 1;
          padding: 28px;
        }

        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: hsl(210, 40%, 92%);
          cursor: pointer;
          padding: 8px;
          margin-right: 12px;
          border-radius: 6px;
        }

        .mobile-backdrop {
          display: none;
        }

        /* --- RESPONSIVE 2026 OVERHAUL --- */
        @media (max-width: 1024px) {
          .mobile-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .mobile-menu-btn:hover {
            background: hsl(217, 20%, 14%);
          }

          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .sidebar-open {
            transform: translateX(0);
            width: 260px;
          }

          .mobile-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 40;
            animation: fadeIn 0.3s ease;
          }

          .dashboard-topbar {
            padding: 0 16px;
          }
          
          .topbar-left {
            display: flex;
            align-items: center;
          }

          .dashboard-content {
            padding: 16px;
          }

          .page-title {
            font-size: 1rem;
          }

          .topbar-time {
            display: none; /* Hide time on small mobile screens to save space */
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

