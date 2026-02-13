"use client";
import data from "../data/standings.json";

const teamLogos: Record<string, string> = {
  "Cam's Crunch": "/wally-cup-olympics/logos/cams-crunch.png",
  "Mark's Mafia": "/wally-cup-olympics/logos/marks-mafia.png",
  "Todd's Hitmen": "/wally-cup-olympics/logos/todds-hitmen.png",
  "Johnny's Scrubbers": "/wally-cup-olympics/logos/johnnys-scrubbers.png",
  "Bardown": "/wally-cup-olympics/logos/bardown.png",
  "Cross's Beavers": "/wally-cup-olympics/logos/crosss-beavers.png",
  "Big Shooters": "/wally-cup-olympics/logos/big-shooters.png",
  "Gators": "/wally-cup-olympics/logos/gators.png",
  "Gabe's Gangsters": "/wally-cup-olympics/logos/gabes-gangsters.png",
  "Willy's Warlocks": "/wally-cup-olympics/logos/willys-warlocks.png",
  "Owen's Otters": "/wally-cup-olympics/logos/owens-otters.png",
  "Ice Holes": "/wally-cup-olympics/logos/ice-holes.png",
};

const flagIso2: Record<string, string> = {
  CAN:"ca",USA:"us",SWE:"se",FIN:"fi",CZE:"cz",SUI:"ch",GER:"de",SVK:"sk",DEN:"dk",LAT:"lv",ITA:"it",FRA:"fr"
};
const countryNames: Record<string, string> = {
  CAN:"Canada",USA:"United States",SWE:"Sweden",FIN:"Finland",CZE:"Czechia",SUI:"Switzerland",
  GER:"Germany",SVK:"Slovakia",DEN:"Denmark",LAT:"Latvia",ITA:"Italy",FRA:"France"
};

function Flag({ code, size = 20 }: { code: string; size?: number }) {
  const iso = flagIso2[code];
  if (!iso) return <span>{code}</span>;
  return (
    <img src={`https://flagcdn.com/w40/${iso}.png`} srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
      alt={code} width={size} height={Math.round(size * 0.75)}
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }} />
  );
}

export default function PredictionsPage() {
  const predictions = (data as any).predictions;
  if (!predictions) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Predictions</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Predictions data not yet available.</p>
        </div>
      </div>
    );
  }

  const winProbs = Object.entries(predictions.win_probabilities as Record<string, number>)
    .sort(([,a], [,b]) => b - a);
  const podiumProbs = Object.entries(predictions.podium_probabilities as Record<string, number>)
    .sort(([,a], [,b]) => b - a);
  const projectedPts = Object.entries(predictions.projected_points as Record<string, number>)
    .sort(([,a], [,b]) => b - a);
  const medalOdds = Object.entries(predictions.country_medal_odds as Record<string, {gold: number; silver: number; bronze: number}>)
    .sort(([,a], [,b]) => b.gold - a.gold);

  // Find current rank for each team
  const currentRanks: Record<string, number> = {};
  ((data as any).standings || []).forEach((s: any) => { currentRanks[s.team] = s.rank; });

  const maxWinProb = Math.max(...winProbs.map(([,p]) => p), 0.01);

  return (
    <div>
      {/* Page title */}
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Predictions
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Monte Carlo simulation · 5,000 iterations · Based on current stats, per-game rates, and tournament advancement probabilities
        </p>
      </div>

      {/* Win Probabilities */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Wally Cup Win Probability</h3>
        <div className="glass-card p-4">
          <div className="space-y-3">
            {winProbs.map(([team, prob]) => {
              const logoSrc = teamLogos[team];
              const pct = (prob * 100);
              const barWidth = Math.max((prob / maxWinProb) * 100, 1);
              return (
                <div key={team} className="flex items-center gap-3">
                  <div className="w-40 flex items-center gap-2 shrink-0">
                    {logoSrc ? (
                      <img src={logoSrc} alt="" className="w-5 h-5 rounded-sm object-contain" />
                    ) : (
                      <span className="w-5 h-5 rounded-sm flex items-center justify-center text-xs" style={{ background: 'rgba(37,99,235,0.1)' }}>🏒</span>
                    )}
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{team}</span>
                  </div>
                  <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="h-full rounded-full flex items-center justify-end px-2"
                      style={{ width: `${barWidth}%`, background: pct > 50 ? 'var(--accent-blue)' : pct > 10 ? 'rgba(37,99,235,0.6)' : 'rgba(37,99,235,0.3)', minWidth: pct > 0 ? '2rem' : '0' }}>
                      {pct >= 1 && <span className="text-xs font-bold text-white">{pct.toFixed(1)}%</span>}
                    </div>
                  </div>
                  {pct < 1 && (
                    <span className="text-xs font-medium w-12 text-right shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {pct > 0 ? `${pct.toFixed(1)}%` : '0%'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Projected Final Standings */}
        <div>
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Projected Final Standings</h3>
          <div className="glass-card p-4">
            <div className="space-y-2">
              {projectedPts.map(([team, pts], idx) => {
                const logoSrc = teamLogos[team];
                const currentRank = currentRanks[team] || 0;
                const projRank = idx + 1;
                const rankDiff = currentRank - projRank;
                return (
                  <div key={team} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold w-6 text-center" style={{ color: idx < 3 ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                        {projRank}
                      </span>
                      {logoSrc && <img src={logoSrc} alt="" className="w-5 h-5 rounded-sm object-contain" />}
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{team}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {rankDiff !== 0 && (
                        <span className="text-xs font-medium" style={{ color: rankDiff > 0 ? '#22c55e' : '#ef4444' }}>
                          {rankDiff > 0 ? `↑${rankDiff}` : `↓${Math.abs(rankDiff)}`}
                        </span>
                      )}
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{pts.toFixed(1)} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top 3 Finish Probability */}
        <div>
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Top 3 Finish Probability</h3>
          <div className="glass-card p-4">
            <div className="space-y-2">
              {podiumProbs.map(([team, prob]) => {
                const logoSrc = teamLogos[team];
                const pct = prob * 100;
                return (
                  <div key={team} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      {logoSrc && <img src={logoSrc} alt="" className="w-5 h-5 rounded-sm object-contain" />}
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{team}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: pct > 50 ? 'var(--accent-blue)' : pct > 10 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Country Medal Probabilities */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Country Medal Probabilities</h3>
        <div className="glass-card overflow-hidden">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: 'rgba(37, 99, 235, 0.04)' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Country</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase" style={{ color: '#ffd700' }}>🥇 Gold</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase" style={{ color: '#c0c0c0' }}>🥈 Silver</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase" style={{ color: '#cd7f32' }}>🥉 Bronze</th>
              </tr>
            </thead>
            <tbody>
              {medalOdds.map(([country, odds]) => (
                <tr key={country} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Flag code={country} size={18} />
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {countryNames[country] || country}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {(odds.gold * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {(odds.silver * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {(odds.bronze * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology */}
      <div className="glass-card p-5">
        <h3 className="text-base font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Methodology</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Simulation</p>
            <ul className="space-y-1 text-xs">
              <li>• 5,000 Monte Carlo iterations</li>
              <li>• Team-correlated + individual player noise</li>
              <li>• Country advancement weighted by pre-tournament odds</li>
              <li>• Per-game stat rates projected across remaining games</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Variance Factors</p>
            <ul className="space-y-1 text-xs">
              <li>• Team-level Gaussian noise (σ=0.25) for correlated outcomes</li>
              <li>• Player-level Gaussian noise (σ=0.20) for individual variance</li>
              <li>• Remaining game estimates vary by ±3 based on tournament performance</li>
              <li>• Roto scoring with proper tie splitting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
