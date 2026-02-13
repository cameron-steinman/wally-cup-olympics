"use client";
import { useState } from "react";
import data from "./data/standings.json";

// Team logos — path relative to public/
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

const medalClasses: Record<number, string> = {
  1: "medal-badge medal-gold",
  2: "medal-badge medal-silver",
  3: "medal-badge medal-bronze",
};

const categoryLabels = [
  { key: "goals", short: "G", full: "Goals" },
  { key: "assists", short: "A", full: "Assists" },
  { key: "plus_minus", short: "+/−", full: "Plus/Minus" },
  { key: "pim", short: "PIM", full: "Penalties" },
  { key: "goalie_wins", short: "W", full: "Goalie Wins" },
  { key: "save_pct", short: "SV%", full: "Save %" },
];

function teamSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function CategoryHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <th className="px-3 py-4 text-center text-[11px] font-semibold uppercase tracking-wider category-header-mobile" style={{ color: 'var(--text-muted)' }}>
      <div className="font-bold text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {sub && <div className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </th>
  );
}

function CategoryCell({ value, rotoPoints, rank, qualified, isSavePct, isPlusMinus }: {
  value: number; rotoPoints: number; rank: number; qualified?: boolean; isSavePct?: boolean; isPlusMinus?: boolean;
}) {
  const displayVal = isSavePct ? (value > 0 ? value.toFixed(3).replace(/^0/, '') : '—') : isPlusMinus ? `${value > 0 ? '+' : ''}${value}` : value;
  const unqualified = isSavePct && qualified === false;

  return (
    <td className="px-3 py-4 text-center cat-cell" style={{ verticalAlign: 'top' }}>
      <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
        {displayVal}
        {unqualified && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-red)', verticalAlign: 'middle' }} title="Not qualified (<20 SA)" />}
      </div>
      <div className="cat-rank mt-1 inline-flex">
        <span>{rotoPoints} pts</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>#{rank}</span>
      </div>
    </td>
  );
}

export default function Home() {
  const standings = data.standings as Array<{
    team: string;
    rank: number;
    total_roto_points: number;
    categories: Record<string, { value: number; roto_points: number; rank: number; qualified?: boolean }>;
  }>;

  const teams = (data as any).teams as Record<string, {
    players: Array<{ name: string; country: string | null; pos: string; stats: any; status: string }>;
  }>;

  // Get eliminated countries from data (empty initially — all countries active)
  const countryStatus = (data as any).country_status || {};
  const eliminatedCountries = new Set(
    Object.entries(countryStatus)
      .filter(([_, v]: [string, any]) => v.status === 'eliminated')
      .map(([k]) => k)
  );

  // Calculate total GP per team (sum of all Olympic players' games played)
  const gpPerTeam: Record<string, number> = {};
  for (const [teamName, teamData] of Object.entries(teams)) {
    gpPerTeam[teamName] = teamData.players
      .filter((p: any) => p.status !== 'not_in_olympics' && p.stats)
      .reduce((sum: number, p: any) => sum + (p.stats?.gp ?? 0), 0);
  }

  // Calculate active Olympic players per team
  const activePlayersPerTeam: Record<string, { active: number; total: number }> = {};
  for (const [teamName, teamData] of Object.entries(teams)) {
    const olympicPlayers = teamData.players.filter((p: any) => p.country !== null);
    const activePlayers = olympicPlayers.filter((p: any) => !eliminatedCountries.has(p.country));
    activePlayersPerTeam[teamName] = {
      active: activePlayers.length,
      total: olympicPlayers.length,
    };
  }

  // Recalculate ranks with proper tie handling
  const rankedStandings = standings.map((s) => {
    const teamsAbove = standings.filter(t => t.total_roto_points > s.total_roto_points).length;
    const actualRank = teamsAbove + 1;
    const isTied = standings.filter(t => t.total_roto_points === s.total_roto_points).length > 1;
    return { ...s, displayRank: actualRank, isTied };
  });

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>('total_roto_points');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Sort function
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort the data
  const sortedStandings = [...rankedStandings].sort((a, b) => {
    let aVal: any, bVal: any;
    
    if (sortColumn === 'displayRank') {
      aVal = a.displayRank;
      bVal = b.displayRank;
    } else if (sortColumn === 'team') {
      aVal = a.team;
      bVal = b.team;
    } else if (sortColumn === 'gp') {
      aVal = gpPerTeam[a.team] ?? 0;
      bVal = gpPerTeam[b.team] ?? 0;
    } else if (sortColumn === 'total_roto_points') {
      aVal = a.total_roto_points;
      bVal = b.total_roto_points;
    } else if (sortColumn === 'players_remaining') {
      aVal = activePlayersPerTeam[a.team]?.active ?? 0;
      bVal = activePlayersPerTeam[b.team]?.active ?? 0;
    } else if (categoryLabels.some(c => c.key === sortColumn)) {
      // Category column - sort by value
      aVal = a.categories[sortColumn]?.value ?? 0;
      bVal = b.categories[sortColumn]?.value ?? 0;
    } else {
      return 0;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Sort indicator function
  const getSortIndicator = (column: string) => {
    if (sortColumn !== column) return '';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  // Last game processed info
  const schedule = (data as any).schedule;
  const games = schedule?.games || [];
  const finalGames = games.filter((g: any) => g.status === 'FINAL');
  const lastGame = finalGames.length > 0 ? finalGames[finalGames.length - 1] : null;

  const updatedDate = new Date(data.updated_at).toLocaleString('en-US', {
    timeZone: 'America/Toronto',
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  const lastGameDate = lastGame ? new Date(lastGame.date + 'T20:00:00Z').toLocaleString('en-US', {
    timeZone: 'America/Toronto',
    month: 'short', day: 'numeric',
  }) : null;

  // Live game ticker data
  const scheduleGames = ((data as any).schedule?.games || []) as Array<{
    id: number; date: string; away: string; home: string; status: string;
    away_score: number; home_score: number; period?: number | null; clock?: string | null; time?: string;
  }>;
  const todayGames = scheduleGames.filter(g => g.status === 'LIVE' || g.status === 'FINAL' || g.status === 'FUT');
  const liveGames = scheduleGames.filter(g => g.status === 'LIVE');
  const todayDate = scheduleGames.filter(g => g.status === 'LIVE').length > 0
    ? scheduleGames.find(g => g.status === 'LIVE')!.date
    : scheduleGames.filter(g => g.status === 'FUT')[0]?.date || scheduleGames[scheduleGames.length - 1]?.date;
  const dayGames = scheduleGames.filter(g => g.date === todayDate || g.status === 'LIVE');

  return (
    <div>
      {/* Live Game Ticker */}
      {dayGames.length > 0 && (
        <div className="glass-card mb-5 px-4 py-3 overflow-x-auto" style={{ borderLeft: liveGames.length > 0 ? '3px solid var(--accent-red, #ef4444)' : '3px solid var(--accent-blue)' }}>
          <div className="flex items-center gap-5" style={{ minWidth: 'max-content' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider shrink-0" style={{ color: liveGames.length > 0 ? 'var(--accent-red, #ef4444)' : 'var(--accent-blue)' }}>
              {liveGames.length > 0 ? '🔴 LIVE' : '📅 Today'}
            </span>
            {dayGames.map(g => (
              <div key={g.id} className="flex items-center gap-2 shrink-0" style={{ opacity: g.status === 'FUT' ? 0.5 : 1 }}>
                <div className="flex items-center gap-1.5">
                  <Flag code={g.away} size={16} />
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{g.away_score}</span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>-</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{g.home_score}</span>
                  <Flag code={g.home} size={16} />
                </div>
                <span className="text-[10px] font-semibold ml-1" style={{
                  color: g.status === 'LIVE' ? 'var(--accent-red, #ef4444)' : g.status === 'FINAL' ? 'var(--accent-green, #22c55e)' : 'var(--text-muted)'
                }}>
                  {g.status === 'LIVE' ? `P${g.period} ${g.clock}` : g.status === 'FINAL' ? 'F' : g.time ? new Date(g.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }) : 'TBD'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mobile-stack mobile-stack-header mobile-compact">
        <div className="section-header-mobile">
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Standings
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Rotisserie scoring across 6 categories: {categoryLabels.map(c => c.full).join(', ')}
          </p>
          <div className="mt-1 flex flex-col sm:flex-row gap-2">
            <a href="/wally-cup-olympics/players" className="text-sm font-semibold no-underline hover:underline mobile-text-sm" style={{ color: 'var(--accent-blue)' }}>
              View All Olympic Players Rankings →
            </a>
            <a href="/wally-cup-olympics/radar" className="text-sm font-semibold no-underline hover:underline mobile-text-sm" style={{ color: 'var(--accent-blue)' }}>
              View Team Radar Charts →
            </a>
            <a href="/wally-cup-olympics/bracket" className="text-sm font-semibold no-underline hover:underline mobile-text-sm" style={{ color: 'var(--accent-blue)' }}>
              View Tournament Bracket →
            </a>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {lastGame && (
            <div className="glass-card inline-flex items-center gap-3 px-4 py-2.5 last-game-mobile" style={{ borderRadius: '10px' }}>
              <span className="text-xs font-semibold mobile-text-xs" style={{ color: 'var(--accent-blue)' }}>Last game</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold mobile-text-sm" style={{ color: 'var(--text-primary)' }}>
                <Flag code={lastGame.away} /> {lastGame.away_score}–{lastGame.home_score} <Flag code={lastGame.home} />
              </span>
              <span className="text-xs mobile-text-xs" style={{ color: 'var(--text-muted)' }}>
                {lastGameDate}
              </span>
            </div>
          )}
          <div className="glass-card text-[11px] px-3 py-1.5" style={{ color: 'var(--text-secondary)', borderRadius: '8px' }}>
            Updated {updatedDate} ET
          </div>
        </div>
      </div>

      {/* Hot Players - Top 3 Performers */}
      {(() => {
        const hotPlayers = ((data as any).hot_players || []).slice(0, 3);
        if (hotPlayers.length === 0) return null;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {hotPlayers.map((p: any, i: number) => {
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
              const logo = p.wally_team ? teamLogos[p.wally_team] : null;
              const hs = p.hot_48h_stats || {};
              const isGoalie = p.pos === 'G';
              return (
                <div key={p.name} className="glass-card px-4 py-3 flex items-center gap-3" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
                  <div className="text-xl">{medal}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        🔥 {p.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Flag code={p.country} size={14} />
                      {logo && <img src={logo} alt="" className="w-4 h-4 rounded-sm object-contain" />}
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {isGoalie
                          ? `${hs.wins ?? 0}W · ${hs.shots_against > 0 ? (hs.saves / hs.shots_against).toFixed(3).replace(/^0/, '') : '—'} SV%`
                          : `${hs.goals ?? 0}G · ${hs.assists ?? 0}A · ${(hs.plus_minus ?? 0) > 0 ? '+' : ''}${hs.plus_minus ?? 0} · ${hs.pim ?? 0}PIM`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Standings table */}
      <div className="glass-card overflow-hidden glass-card-mobile">
        <div className="overflow-x-auto mobile-table-scroll">
          <table className="w-full mobile-table standings-table" style={{ borderCollapse: 'separate', borderSpacing: 0,  }}>
            <thead>
              <tr style={{ background: 'rgba(37, 99, 235, 0.04)' }}>
                <th 
                  className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-wider w-14 standings-rank-col cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSort('displayRank')}
                >
                  Rank{getSortIndicator('displayRank')}
                </th>
                <th 
                  className="px-3 py-4 text-left text-[11px] font-semibold uppercase tracking-wider standings-team-col cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSort('team')}
                >
                  Team{getSortIndicator('team')}
                </th>
                <th 
                  className="px-2 py-4 text-center text-[11px] font-semibold uppercase tracking-wider category-header-mobile cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSort('gp')}
                >
                  <div className="font-bold text-xs" style={{ color: 'var(--text-muted)' }}>GP{getSortIndicator('gp')}</div>
                  <div className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Games</div>
                </th>
                {categoryLabels.map(c => (
                  <th 
                    key={c.key} 
                    className="px-3 py-4 text-center text-[11px] font-semibold uppercase tracking-wider category-header-mobile cursor-pointer hover:bg-gray-50" 
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => handleSort(c.key)}
                  >
                    <div className="font-bold text-xs" style={{ color: 'var(--text-secondary)' }}>{c.short}{getSortIndicator(c.key)}</div>
                    <div className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.full}</div>
                  </th>
                ))}
                <th 
                  className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--accent-blue)' }}
                  onClick={() => handleSort('total_roto_points')}
                >
                  <div className="text-xs">PTS{getSortIndicator('total_roto_points')}</div>
                  <div className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Total</div>
                </th>
                <th 
                  className="px-3 py-4 text-center text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)', minWidth: '80px' }}
                  onClick={() => handleSort('players_remaining')}
                >
                  <div className="font-bold text-[10px]" style={{ color: 'var(--text-secondary)' }}>Players{getSortIndicator('players_remaining')}</div>
                  <div className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Remaining</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStandings.map((s, idx) => {
                const medalClass = medalClasses[s.displayRank];
                const isTop3 = s.displayRank <= 3;
                const logoSrc = teamLogos[s.team];
                const ap = activePlayersPerTeam[s.team] || { active: 0, total: 0 };
                const allActive = ap.active === ap.total;

                return (
                  <tr
                    key={s.team}
                    className="table-row-hover"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isTop3 ? 'rgba(37, 99, 235, 0.02)' : 'transparent',
                    }}
                  >
                    <td className="px-4 py-4" style={{ verticalAlign: 'top' }}>
                      {medalClass ? (
                        <span className={medalClass}>{s.displayRank}</span>
                      ) : (
                        <span className="text-sm font-bold pl-1.5" style={{ color: 'var(--text-muted)' }}>
                          {s.displayRank}
                          {s.isTied && <span className="tie-indicator">T</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4" style={{ verticalAlign: 'top' }}>
                      <a href={`/wally-cup-olympics/team/${teamSlug(s.team)}`} className="flex items-center gap-2.5 text-sm font-bold no-underline hover:underline mobile-text-sm" style={{ color: 'var(--accent-blue)' }}>
                        {logoSrc ? (
                          <img src={logoSrc} alt={s.team} className="w-7 h-7 rounded-md object-contain team-logo-mobile" />
                        ) : (
                          <span className="w-7 h-7 rounded-md flex items-center justify-center text-sm team-logo-mobile" style={{ background: 'rgba(37, 99, 235, 0.1)' }}>🏒</span>
                        )}
                        {s.team}
                      </a>
                    </td>
                    <td className="px-2 py-4 text-center" style={{ verticalAlign: 'top' }}>
                      <div className="text-base font-medium" style={{ color: 'var(--text-muted)' }}>
                        {gpPerTeam[s.team] ?? 0}
                      </div>
                      <div className="cat-rank mt-1 inline-flex" style={{ visibility: 'hidden' }}>
                        <span>&nbsp;</span>
                      </div>
                    </td>
                    {categoryLabels.map(c => {
                      const cat = s.categories[c.key];
                      return (
                        <CategoryCell
                          key={c.key}
                          value={cat.value}
                          rotoPoints={cat.roto_points}
                          rank={cat.rank}
                          isSavePct={c.key === 'save_pct'}
                          isPlusMinus={c.key === 'plus_minus'}
                          qualified={cat.qualified}
                        />
                      );
                    })}
                    <td className="px-5 py-4 text-center" style={{ verticalAlign: 'top' }}>
                      <span className={`points-pill ${isTop3 ? 'points-pill-top' : ''}`}>
                        {s.total_roto_points}
                        {s.isTied && <span className="tie-indicator ml-1">T</span>}
                      </span>
                      <div className="cat-rank mt-1 inline-flex" style={{ visibility: 'hidden' }}>
                        <span>&nbsp;</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center" style={{ verticalAlign: 'top' }}>
                      <div className="text-base font-bold" style={{ color: allActive ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                        {ap.active}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        of {ap.total}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer legend */}
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-red)' }} />
          Save % not qualified (&lt;20 SA)
        </span>
        <span><strong>T</strong> = tied on total roto points</span>
        <span>Players Remaining = players on teams still competing</span>
        <span>Roto: 12 pts for 1st, 1 pt for 12th. Ties split evenly.</span>
      </div>
    </div>
  );
}
