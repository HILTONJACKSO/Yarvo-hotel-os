'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, BarChart3, ShieldCheck } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginError {
  message: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Login failed');
      }

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* Animated background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      <div className="login-container">
        {/* Left panel — branding */}
        <div className="login-brand-panel">
          <div className="brand-content">
            <div className="brand-logo" style={{ background: 'none', border: 'none' }}>
              <img src="/logo.jpg" alt="Yarvo Logo" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
            </div>
            <h1 className="brand-name">Yarvo</h1>
            <p className="brand-tagline">Hotel Management System</p>

            <div className="brand-features">
              <div className="brand-feature">
                <div className="feature-icon"><Building2 size={20} color="hsl(43,96%,56%)" /></div>
                <div>
                  <div className="feature-title">Complete PMS</div>
                  <div className="feature-desc">Full property management suite</div>
                </div>
              </div>
              <div className="brand-feature">
                <div className="feature-icon"><BarChart3 size={20} color="hsl(43,96%,56%)" /></div>
                <div>
                  <div className="feature-title">Real-Time Analytics</div>
                  <div className="feature-desc">Live revenue & occupancy reports</div>
                </div>
              </div>
              <div className="brand-feature">
                <div className="feature-icon"><ShieldCheck size={20} color="hsl(43,96%,56%)" /></div>
                <div>
                  <div className="feature-title">Enterprise Security</div>
                  <div className="feature-desc">Role-based access control</div>
                </div>
              </div>
            </div>

            <div className="brand-footer">
              Liberia • {new Date().getFullYear()}
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="login-form-panel">
          <div className="form-card">
            <div className="form-header">
              <div className="form-logo-sm">
                <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="hsl(43,96%,56%)" fillOpacity="0.15" />
                  <path d="M24 8L38 16V32L24 40L10 32V16L24 8Z" stroke="hsl(43,96%,56%)" strokeWidth="2" fill="none" />
                  <circle cx="24" cy="25" r="5" fill="hsl(43,96%,56%)" />
                </svg>
              </div>
              <h2 className="form-title">Welcome back</h2>
              <p className="form-subtitle">Sign in to continue to Yarvo HMS</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form" id="login-form" noValidate>
              {error && (
                <div className="error-banner" role="alert">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="field-group">
                <label className="field-label" htmlFor="email">Email address</label>
                <div className="field-wrapper">
                  <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@yarvo.com"
                    className="field-input"
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="password">Password</label>
                <div className="field-wrapper">
                  <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="field-input"
                  />
                  <button
                    type="button"
                    id="toggle-password"
                    className="field-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="login-btn"
              >
                {isLoading ? (
                  <span className="btn-loading">
                    <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p className="form-footer-text">
                Secured by JWT · AES-256 · Argon2id
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: hsl(224, 39%, 4%);
          position: relative;
          overflow: hidden;
        }

        /* Animated gradient orbs */
        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.25;
          animation: float 8s ease-in-out infinite;
          pointer-events: none;
        }
        .bg-orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, hsl(43,96%,56%), transparent 70%);
          top: -200px; left: -200px;
          animation-duration: 10s;
        }
        .bg-orb-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, hsl(217,91%,45%), transparent 70%);
          bottom: -150px; right: -100px;
          animation-duration: 8s;
          animation-delay: -3s;
        }
        .bg-orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, hsl(270,60%,50%), transparent 70%);
          top: 50%; left: 50%;
          animation-duration: 12s;
          animation-delay: -5s;
          opacity: 0.12;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -20px) scale(1.05); }
          66% { transform: translate(-10px, 15px) scale(0.97); }
        }

        .login-container {
          display: flex;
          width: 100%;
          max-width: 1100px;
          min-height: 640px;
          background: hsl(222, 35%, 7%);
          border: 1px solid hsl(217, 20%, 18%);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
          position: relative;
          z-index: 1;
          margin: 24px;
        }

        /* Brand panel */
        .login-brand-panel {
          flex: 1;
          background: linear-gradient(135deg, hsl(224, 39%, 7%) 0%, hsl(220, 35%, 10%) 100%);
          border-right: 1px solid hsl(217, 20%, 14%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          position: relative;
          overflow: hidden;
        }
        .login-brand-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 50%, hsl(43,96%,56%, 0.06) 0%, transparent 60%);
        }

        .brand-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .brand-logo {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: hsl(43,96%,56%,0.1);
          border: 1px solid hsl(43,96%,56%,0.2);
          border-radius: 16px;
        }
        .brand-logo svg { width: 40px; height: 40px; }

        .brand-name {
          font-size: 2.5rem;
          font-weight: 700;
          color: hsl(210, 40%, 96%);
          letter-spacing: -0.03em;
          line-height: 1;
          margin: 0;
        }

        .brand-tagline {
          color: hsl(43,96%,56%);
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin: 0;
        }

        .brand-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
          padding-top: 24px;
          border-top: 1px solid hsl(217, 20%, 18%);
        }

        .brand-feature {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .feature-icon {
          font-size: 1.25rem;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: hsl(217, 20%, 14%);
          border-radius: 8px;
          flex-shrink: 0;
        }

        .feature-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(210, 40%, 96%);
        }
        .feature-desc {
          font-size: 0.75rem;
          color: hsl(215, 20%, 55%);
          margin-top: 2px;
        }

        .brand-footer {
          margin-top: 24px;
          font-size: 0.75rem;
          color: hsl(215, 16%, 40%);
        }

        /* Form panel */
        .login-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          background: hsl(222, 35%, 7%);
        }

        .form-card {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .form-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-logo-sm {
          display: none;
          margin-bottom: 4px;
        }

        .form-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: hsl(210, 40%, 96%);
          letter-spacing: -0.025em;
          margin: 0;
        }

        .form-subtitle {
          font-size: 0.875rem;
          color: hsl(215, 20%, 55%);
          margin: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: hsl(0, 84%, 60%, 0.12);
          border: 1px solid hsl(0, 84%, 60%, 0.3);
          border-radius: 10px;
          color: hsl(0, 84%, 70%);
          font-size: 0.875rem;
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: hsl(215, 20%, 70%);
          letter-spacing: 0.01em;
        }

        .field-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-icon {
          position: absolute;
          left: 14px;
          color: hsl(215, 20%, 45%);
          pointer-events: none;
          transition: color 0.2s;
          flex-shrink: 0;
        }

        .field-input {
          width: 100%;
          height: 46px;
          padding: 0 42px 0 42px;
          background: hsl(220, 30%, 10%);
          border: 1px solid hsl(217, 20%, 18%);
          border-radius: 10px;
          color: hsl(210, 40%, 96%);
          font-size: 0.9375rem;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
          font-family: inherit;
        }
        .field-input::placeholder {
          color: hsl(215, 16%, 35%);
        }
        .field-input:hover {
          border-color: hsl(215, 20%, 28%);
        }
        .field-input:focus {
          border-color: hsl(43,96%,56%);
          box-shadow: 0 0 0 3px hsl(43,96%,56%, 0.12);
          background: hsl(220, 30%, 12%);
        }
        .field-input:focus + .field-icon,
        .field-wrapper:focus-within .field-icon {
          color: hsl(43,96%,56%);
        }

        .field-toggle {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          color: hsl(215, 20%, 45%);
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .field-toggle:hover { color: hsl(43,96%,56%); }

        .login-btn {
          height: 48px;
          width: 100%;
          background: linear-gradient(135deg, hsl(43,96%,56%) 0%, hsl(38,92%,48%) 100%);
          color: hsl(224, 39%, 6%);
          border: none;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px hsl(43,96%,56%,0.25);
          font-family: inherit;
          letter-spacing: 0.01em;
          margin-top: 4px;
        }
        .login-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px hsl(43,96%,56%,0.35);
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .login-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .btn-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .spinner {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .form-footer {
          padding-top: 16px;
          border-top: 1px solid hsl(217, 20%, 14%);
          text-align: center;
        }
        .form-footer-text {
          font-size: 0.75rem;
          color: hsl(215, 16%, 38%);
          margin: 0;
          letter-spacing: 0.02em;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .login-brand-panel { display: none; }
          .login-form-panel { padding: 32px 24px; }
          .form-logo-sm { display: flex; }
          .login-container { margin: 16px; border-radius: 16px; min-height: auto; }
        }
      `}</style>
    </div>
  );
}

