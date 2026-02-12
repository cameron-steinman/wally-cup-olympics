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
        <header className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 no-underline">
              <span className="text-2xl">🏒</span>
              <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  WALLY CUP OLYMPICS
                </h1>
                <p className="text-xs font-medium tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                  MILANO CORTINA 2026 🇮🇹
                </p>
              </div>
            </a>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              🥇🥈🥉
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
