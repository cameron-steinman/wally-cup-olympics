import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wally Cup Olympics 2026",
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
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" 
                   style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
                🏒
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  WALLY CUP OLYMPICS
                </h1>
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--gradient-start)' }}>
                  Milano Cortina 2026 🇮🇹
                </p>
              </div>
            </a>
            <div className="flex items-center gap-2">
              <span className="text-xl">🥇</span>
              <span className="text-lg">🥈</span>
              <span className="text-base">🥉</span>
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
