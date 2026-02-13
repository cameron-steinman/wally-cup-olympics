import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wally Cup Olympic Extravaganza 2026",
  description: "Wally Cup Fantasy Hockey Olympic Tracker — Milano Cortina 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="glass-card" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
          <div className="header-gradient" style={{ height: '3px' }} />
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
            <a href="/wally-cup-olympics/" className="flex items-center gap-4 no-underline group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
                <svg width="28" height="16" viewBox="0 0 50 28" fill="none">
                  <circle cx="9" cy="10" r="7" stroke="#0081C8" strokeWidth="2" fill="none"/>
                  <circle cx="25" cy="10" r="7" stroke="#000000" strokeWidth="2" fill="none"/>
                  <circle cx="41" cy="10" r="7" stroke="#EE334E" strokeWidth="2" fill="none"/>
                  <circle cx="17" cy="17" r="7" stroke="#FCB131" strokeWidth="2" fill="none"/>
                  <circle cx="33" cy="17" r="7" stroke="#00A651" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  WALLY CUP OLYMPIC EXTRAVAGANZA
                </h1>
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--accent-blue)' }}>
                  Milano Cortina 2026 🇮🇹
                </p>
              </div>
            </a>
            <div className="flex items-center gap-1.5 text-lg">
              <span>🥇</span><span>🥈</span><span>🥉</span>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
