"use client";
import { useState } from "react";
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
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
      alt={code}
      width={size}
      height={Math.round(size * 0.75)}
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}
    />
  );
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatStats(performer: any): string {
  if (performer.pos === "G") {
    const s = performer.stats || {};
    const wins = s.wins || 0;
    const saves = s.saves || 0;
    const sa = s.shots_against || 0;
    const svPct = sa > 0 ? (saves / sa).toFixed(3).replace(/^0/, '') : '—';
    return `${wins}W, ${saves}SV, ${svPct} SV%`;
  }
  const s = performer.stats || {};
  const parts: string[] = [];
  if (s.goals) parts.push(`${s.goals}G`);
  if (s.assists) parts.push(`${s.assists}A`);
  if (s.plus_minus !== undefined && s.plus_minus !== 0) parts.push(`${s.plus_minus > 0 ? '+' : ''}${s.plus_minus}`);
  if (s.pim) parts.push(`${s.pim}PIM`);
  return parts.join(', ') || '—';
}

function RotoChangeDisplay({ rotoChange }: { rotoChange: number }) {
  // Always color based on actual direction of roto change, not rank direction
  const isPositive = rotoChange > 0;
  const color = isPositive ? '#22c55e' : rotoChange < 0 ? '#ef4444' : 'var(--text-muted)';
  const prefix = isPositive ? '+' : '';
  return (
    <span style={{ color }}> ({prefix}{rotoChange})</span>
  );
}

export default function RecapPage() {
  const dailyRecaps = (data as any).daily_recaps || {};
  const availableDates = Object.keys(dailyRecaps).sort().reverse();
  const [selectedDate, setSelectedDate] = useState(availableDates[0] || '');
  const currentRecap = dailyRecaps[selectedDate];

  // Normalize standings_changes — could be list or dict
  const getStandingsChanges = (recap: any) => {
    const sc = recap?.standings_changes;
    if (!sc) return { risers: [], fallers: [] };
    if (Array.isArray(sc)) {
      // Old format: flat list, split by rank_change sign
      return {
        risers: sc.filter((c: any) => c.rank_change > 0).sort((a: any, b: any) => b.rank_change - a.rank_change),
        fallers: sc.filter((c: any) => c.rank_change < 0).sort((a: any, b: any) => a.rank_change - b.rank_change),
      };
    }
    return { risers: sc.risers || [], fallers: sc.fallers || [] };
  };

  if (!currentRecap) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Daily Recap</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Daily summaries of Olympic hockey action and Wally Cup movement</p>
        </div>
        <div className="glass-card p-8 text-center">
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>No recaps available yet — check back after games are completed.</p>
        </div>
      </div>
    );
  }

  const sc = getStandingsChanges(currentRecap);

  return (
    <div>
      {/* Page title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Daily Recap</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Daily summaries of Olympic hockey action and Wally Cup movement</p>
        </div>
        {availableDates.length > 1 && (
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="glass-card px-3 py-2 rounded-lg text-sm font-medium"
            style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}
          >
            {availableDates.map(date => (
              <option key={date} value={date}>{formatDate(date)}</option>
            ))}
          </select>
        )}
      </div>

      {/* Recap narrative */}
      <div className="glass-card p-5 mb-6" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
        <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{formatDate(selectedDate)}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {currentRecap.recap_text}
        </p>
      </div>

      {/* Games Today */}
      {currentRecap.games?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Games Today</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentRecap.games.map((game: any, idx: number) => (
              <div key={idx} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flag code={game.away.code} size={22} />
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{game.away.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{game.away.score}</span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>–</span>
                  <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{game.home.score}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{game.home.name}</span>
                  <Flag code={game.home.code} size={22} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performers Today */}
      {currentRecap.top_performers?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Top Performers Today</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentRecap.top_performers.slice(0, 9).map((p: any, idx: number) => {
              const logoSrc = p.wally_team ? teamLogos[p.wally_team] : null;
              return (
                <div key={idx} className="glass-card p-3 flex items-center gap-3">
                  <Flag code={p.country} size={18} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {countryNames[p.country] || p.country}
                      </span>
                    </div>
                    <div className="text-xs mt-0.5 flex items-center gap-2">
                      <span style={{ color: 'var(--text-primary)' }}>{formatStats(p)}</span>
                      {p.wally_team && (
                        <a href={`/wally-cup-olympics/team/${p.wally_team.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`} className="flex items-center gap-1 no-underline hover:underline">
                          {logoSrc && <img src={logoSrc} alt="" className="w-3.5 h-3.5 rounded-sm object-contain" />}
                          <span style={{ color: 'var(--accent-blue)' }}>{p.wally_team}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Standings Movement Today */}
      {(sc.risers.length > 0 || sc.fallers.length > 0) && (
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Standings Movement Today</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Biggest Risers */}
            {sc.risers.length > 0 && (
              <div>
                <h4 className="text-sm font-bold mb-2" style={{ color: '#22c55e' }}>📈 Biggest Risers</h4>
                <div className="space-y-2">
                  {sc.risers.map((c: any, idx: number) => {
                    const logoSrc = teamLogos[c.team];
                    return (
                      <div key={idx} className="glass-card p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {logoSrc && <img src={logoSrc} alt="" className="w-5 h-5 rounded object-contain" />}
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.team}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold" style={{ color: '#22c55e' }}>
                            ↗ +{Math.abs(c.rank_change)} {Math.abs(c.rank_change) === 1 ? 'spot' : 'spots'}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            #{c.previous_rank} → #{c.current_rank} · {c.current_roto} pts
                            <RotoChangeDisplay rotoChange={c.roto_change} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Biggest Fallers */}
            {sc.fallers.length > 0 && (
              <div>
                <h4 className="text-sm font-bold mb-2" style={{ color: '#ef4444' }}>📉 Biggest Fallers</h4>
                <div className="space-y-2">
                  {sc.fallers.map((c: any, idx: number) => {
                    const logoSrc = teamLogos[c.team];
                    return (
                      <div key={idx} className="glass-card p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {logoSrc && <img src={logoSrc} alt="" className="w-5 h-5 rounded object-contain" />}
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.team}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold" style={{ color: '#ef4444' }}>
                            ↘ {Math.abs(c.rank_change)} {Math.abs(c.rank_change) === 1 ? 'spot' : 'spots'}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            #{c.previous_rank} → #{c.current_rank} · {c.current_roto} pts
                            <RotoChangeDisplay rotoChange={c.roto_change} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Milestones */}
      {currentRecap.milestones?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Milestones</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentRecap.milestones.map((m: any, idx: number) => (
              <div key={idx} className="glass-card p-3 flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{m.title}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
