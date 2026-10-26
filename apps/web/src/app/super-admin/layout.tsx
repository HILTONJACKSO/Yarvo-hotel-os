'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { LayoutDashboard, Building2, MessageSquare, LogOut, ShieldCheck, Users } from 'lucide-react';

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    { name: 'Overview', href: '/super-admin', icon: LayoutDashboard },
    { name: 'Properties', href: '/super-admin/properties', icon: Building2 },
    { name: 'Users', href: '/super-admin/users', icon: Users },
    { name: 'Support & Sales', href: '/super-admin/support', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[#050B14] text-gray-200 font-sans flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#070F1E] border-r border-[#CA9851]/15 flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <Link href="/super-admin" className="flex items-center gap-2">
            <img 
              src="/kwalee-logo.png" 
              alt="Kwalee Beach Resort" 
              onError={(e) => {
                e.currentTarget.src = "/logo.jpg";
              }}
              className="h-8 w-auto object-contain"
            />
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-[#CA9851]/15 text-[#DFB776] font-semibold border border-[#CA9851]/30 shadow-[0_0_15px_rgba(202,152,81,0.15)]' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-[#DFB776]' : ''} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-sm font-medium"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-white/10 bg-[#070F1E]/80 backdrop-blur-md flex items-center px-8 justify-between">
          <h1 className="text-xl font-bold text-white">Yarvo Operating System</h1>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#CA9851]/15 text-[#DFB776] border border-[#CA9851]/30">
            Super Admin
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
