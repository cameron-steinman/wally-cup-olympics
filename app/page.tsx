"use client";
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
    <th className="px-3 py-4 text-center text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
      <div className="font-bold text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {sub && <div className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </th>
  );
}

function CategoryCell({ value, rotoPoints, rank, qualified, isSavePct }: {
  value: number; rotoPoints: number; rank: number; qualified?: boolean; isSavePct?: boolean;
}) {
  const displayVal = isSavePct ? (value > 0 ? value.toFixed(3).replace(/^0/, '') : '—') : value;
  const unqualified = isSavePct && qualified === false;

  return (
    <td className="px-3 py-4 text-center cat-cell">
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

  return (
    <div>
      {/* Section header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Standings
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Rotisserie scoring across 6 categories: {categoryLabels.map(c => c.full).join(', ')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {lastGame && (
            <div className="glass-card inline-flex items-center gap-3 px-4 py-2.5" style={{ borderRadius: '10px' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--accent-blue)' }}>Last game</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                <Flag code={lastGame.away} /> {lastGame.away_score}–{lastGame.home_score} <Flag code={lastGame.home} />
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {lastGameDate}
              </span>
            </div>
          )}
          <div className="glass-card text-[11px] px-3 py-1.5" style={{ color: 'var(--text-secondary)', borderRadius: '8px' }}>
            Updated {updatedDate} ET
          </div>
        </div>
      </div>

      {/* Standings table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: 'rgba(37, 99, 235, 0.04)' }}>
                <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-wider w-14" style={{ color: 'var(--text-muted)' }}>Rank</th>
                <th className="px-3 py-4 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Team</th>
                {categoryLabels.map(c => (
                  <CategoryHeader key={c.key} label={c.short} sub={c.full} />
                ))}
                <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent-blue)' }}>
                  <div className="text-xs">PTS</div>
                  <div className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Total</div>
                </th>
                <th className="px-3 py-4 text-center text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', minWidth: '80px' }}>
                  <div className="font-bold text-[10px]" style={{ color: 'var(--text-secondary)' }}>Active</div>
                  <div className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Remaining</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rankedStandings.map((s, idx) => {
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
                    <td className="px-4 py-4">
                      {medalClass ? (
                        <span className={medalClass}>{s.displayRank}</span>
                      ) : (
                        <span className="text-sm font-bold pl-1.5" style={{ color: 'var(--text-muted)' }}>
                          {s.displayRank}
                          {s.isTied && <span className="tie-indicator">T</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <a href={`/wally-cup-olympics/team/${teamSlug(s.team)}`} className="flex items-center gap-2.5 text-sm font-bold no-underline hover:underline" style={{ color: 'var(--accent-blue)' }}>
                        {logoSrc ? (
                          <img src={logoSrc} alt={s.team} className="w-7 h-7 rounded-md object-contain" />
                        ) : (
                          <span className="w-7 h-7 rounded-md flex items-center justify-center text-sm" style={{ background: 'rgba(37, 99, 235, 0.1)' }}>🏒</span>
                        )}
                        {s.team}
                      </a>
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
                          qualified={cat.qualified}
                        />
                      );
                    })}
                    <td className="px-5 py-4 text-center">
                      <span className={`points-pill ${isTop3 ? 'points-pill-top' : ''}`}>
                        {s.total_roto_points}
                        {s.isTied && <span className="tie-indicator ml-1">T</span>}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center">
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
        <span>Active Remaining = players on teams still competing</span>
        <span>Roto: 12 pts for 1st, 1 pt for 12th. Ties split evenly.</span>
      </div>
    </div>
  );
}
