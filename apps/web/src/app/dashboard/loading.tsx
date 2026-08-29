export default function DashboardLoading() {
  return (
    <div className="modern-loader-container">
      <div className="glass-backdrop" />
      <div className="loader-content">
        <div className="loader-logo-wrapper">
          <svg width="64" height="64" viewBox="0 0 48 48" fill="none">
            {/* Glowing background rect */}
            <rect className="glow-rect" width="48" height="48" rx="16" fill="hsl(43,96%,56%)" fillOpacity="0.1" />
            <rect className="outline-rect" width="48" height="48" rx="16" stroke="url(#gradient)" strokeWidth="1" strokeOpacity="0.5" />
            <path className="logo-path" d="M24 10L38 18V30L24 38L10 30V18L24 10Z" stroke="hsl(43,96%,56%)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle className="logo-dot" cx="24" cy="24" r="4" fill="hsl(43,96%,56%)" />
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="hsl(43,96%,56%)" />
                <stop offset="1" stopColor="hsl(43,96%,56%)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <div className="glow-orb" />
        </div>
        <div className="loader-text-wrapper">
          <div className="loader-text">Loading Workspace</div>
          <div className="loader-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>

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
          background: radial-gradient(circle at 50% 50%, hsl(43, 96%, 56%, 0.05) 0%, transparent 50%);
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
          background: hsl(43, 96%, 56%);
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
          text-shadow: 0 0 10px hsl(43, 96%, 56%, 0.3);
        }

        .loader-dots {
          display: flex;
          gap: 6px;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: hsl(43, 96%, 56%);
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
      `}</style>
    </div>
  );
}

