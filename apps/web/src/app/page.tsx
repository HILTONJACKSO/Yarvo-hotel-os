import Link from 'next/link';
import { SystemStatus } from '@/components/system-status';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Hotel Logo / Brand */}
      <div className="flex flex-col items-center mb-12 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/20">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Yarvo Hotel
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Property Management System
        </p>
        <p className="text-slate-500 text-sm mt-1">Liberia</p>
      </div>

      {/* System Status Card */}
      <div className="w-full max-w-md">
        <SystemStatus />
      </div>

      {/* Phase 1 Notice */}
      <div className="mt-8 max-w-md w-full bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <p className="text-amber-300 text-sm font-medium">Phase 1 — Foundation</p>
        <p className="text-slate-400 text-sm mt-1">
          System infrastructure is being built. Authentication and the full
          management interface will be available in Phase 2.
        </p>
      </div>

      {/* Login button (placeholder for Phase 2) */}
      <div className="mt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/25 text-sm"
          aria-label="Go to login page"
        >
          Sign In to HMS
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>
    </main>
  );
}

