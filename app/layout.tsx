import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wally Cup Olympic Extravaganza 2026",
  description: "Wally Cup Fantasy Hockey Olympic Tracker — Milano Cortina 2026",
  openGraph: {
    title: "Wally Cup Olympic Extravaganza 2026",
    description: "Wally Cup Fantasy Hockey Olympic Tracker — Milano Cortina 2026",
    images: [
      {
        url: "https://cameron-steinman.github.io/wally-cup-olympics/og-image.png",
        width: 1200,
        height: 630,
        alt: "Wally Cup Olympic Extravaganza 2026",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wally Cup Olympic Extravaganza 2026",
    description: "Wally Cup Fantasy Hockey Olympic Tracker — Milano Cortina 2026",
    images: ["https://cameron-steinman.github.io/wally-cup-olympics/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="glass-card" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
          <div className="header-gradient" style={{ height: '3px' }} />
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
            <a href="/wally-cup-olympics/" className="flex items-center gap-4 no-underline group">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                   style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', border: '1px solid rgba(37,99,235,0.1)' }}>
                <svg width="38" height="22" viewBox="0 0 50 28" fill="none">
                  <circle cx="9" cy="10" r="7" stroke="#0081C8" strokeWidth="2.5" fill="none"/>
                  <circle cx="25" cy="10" r="7" stroke="#222222" strokeWidth="2.5" fill="none"/>
                  <circle cx="41" cy="10" r="7" stroke="#EE334E" strokeWidth="2.5" fill="none"/>
                  <circle cx="17" cy="17" r="7" stroke="#FCB131" strokeWidth="2.5" fill="none"/>
                  <circle cx="33" cy="17" r="7" stroke="#00A651" strokeWidth="2.5" fill="none"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  WALLY CUP OLYMPIC EXTRAVAGANZA
                </h1>
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--accent-blue)' }}>
                  Milano Cortina 2026 <img src="https://flagcdn.com/w40/it.png" srcSet="https://flagcdn.com/w80/it.png 2x" alt="Italy" width={20} height={15} style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2, marginLeft: 4 }} />
                </p>
              </div>
            </a>
            <nav className="flex items-center gap-5 flex-wrap">
              <a href="/wally-cup-olympics/" className="text-sm font-medium hover:underline" style={{ color: 'var(--text-secondary)' }}>Standings</a>
              <a href="/wally-cup-olympics/bracket" className="text-sm font-medium hover:underline" style={{ color: 'var(--text-secondary)' }}>Tournament</a>
              <a href="/wally-cup-olympics/recap" className="text-sm font-medium hover:underline" style={{ color: 'var(--text-secondary)' }}>Recap</a>
              <a href="/wally-cup-olympics/milestones" className="text-sm font-medium hover:underline" style={{ color: 'var(--text-secondary)' }}>Milestones</a>
              <a href="/wally-cup-olympics/predictions" className="text-sm font-medium hover:underline" style={{ color: 'var(--text-secondary)' }}>Predictions</a>
              <a href="/wally-cup-olympics/players" className="text-sm font-medium hover:underline" style={{ color: 'var(--text-secondary)' }}>Players</a>
              <div className="flex items-center gap-1.5 text-lg ml-2">
                <span>🥇</span><span>🥈</span><span>🥉</span>
              </div>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
