import data from "../../data/standings.json";
import TeamPageClient from "./TeamPageClient";
import TeamPageClient from "./TeamPageClient";

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
  CAN:"Canada",USA:"United States",SWE:"Sweden",FIN:"Finland",CZE:"Czechia",SUI:"Switzerland",GER:"Germany",SVK:"Slovakia",DEN:"Denmark",LAT:"Latvia",ITA:"Italy",FRA:"France"
};

function Flag({ code, size = 18 }: { code: string; size?: number }) {
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

function teamSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function teamFromSlug(slug: string): string | undefined {
  const allTeams = Object.keys(data.teams);
  return allTeams.find(t => teamSlug(t) === slug);
}

type Player = {
  name: string;
  country: string | null;
  pos: string;
  stats: Record<string, number> | null;
  status: string;
};

type TeamData = {
  players: Player[];
  goalie_stats: {
    aggregate: {
      wins: number;
      saves: number;
      shots_against: number;
      save_pct: number;
      qualified: boolean;
    };
  };
};

type Standing = {
  team: string;
  rank: number;
  total_roto_points: number;
  categories: Record<string, { value: number; roto_points: number; rank: number; qualified?: boolean }>;
};

const medalLabels: Record<number, { emoji: string; label: string; bg: string; text: string }> = {
  1: { emoji: "🥇", label: "1st Place", bg: "linear-gradient(135deg, #fbbf24, #f59e0b)", text: "#78350f" },
  2: { emoji: "🥈", label: "2nd Place", bg: "linear-gradient(135deg, #d1d5db, #9ca3af)", text: "#1f2937" },
  3: { emoji: "🥉", label: "3rd Place", bg: "linear-gradient(135deg, #f59e0b, #d97706)", text: "#78350f" },
};

// Fantasy point calculation for player ranking
function calcFantasyPoints(p: Player): number {
  if (!p.stats) return 0;
  if (p.pos === 'G') {
    // Goalies: 16 * wins + 0.5 * (SV% - .904) scaled
    const wins = p.stats.wins ?? 0;
    const svPct = p.stats.save_pct ?? 0;
    const svBonus = svPct > 0 ? 0.5 * ((svPct - 0.904) * 1000) : 0;
    return 16 * wins + svBonus;
  }
  const g = p.stats.goals ?? 0;
  const a = p.stats.assists ?? 0;
  const pm = p.stats.plus_minus ?? 0;
  const pim = p.stats.pim ?? 0;
  return 10 * g + 8 * a + 10 * pm + 5 * pim;
}

// Compute global ranking of ALL Olympic players (not just Wally Cup teams)
function computeGlobalRankings(): Map<string, number> {
  const allPlayers: { name: string; country: string | null; points: number }[] = [];
  const teams = data.teams as unknown as Record<string, TeamData>;
  const seen = new Set<string>();

  for (const [, teamData] of Object.entries(teams)) {
    for (const p of teamData.players) {
      if (p.status === 'not_in_olympics' || !p.country) continue;
      const key = `${p.name}|${p.country}`;
      if (seen.has(key)) continue;
      seen.add(key);
      allPlayers.push({ name: p.name, country: p.country, points: calcFantasyPoints(p) });
    }
  }

  // Sort descending by points
  allPlayers.sort((a, b) => b.points - a.points);

  const rankings = new Map<string, number>();
  for (let i = 0; i < allPlayers.length; i++) {
    const key = `${allPlayers[i].name}|${allPlayers[i].country}`;
    // Handle ties: find first player with this score
    const rank = allPlayers.findIndex(x => x.points === allPlayers[i].points) + 1;
    rankings.set(key, rank);
  }
  return rankings;
}

export function generateStaticParams() {
  return Object.keys(data.teams).map(t => ({ slug: teamSlug(t) }));
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const teamName = teamFromSlug(slug);
  if (!teamName) return <div style={{ color: 'var(--text-primary)', padding: 40 }}>Team not found</div>;

  const team = (data.teams as unknown as Record<string, TeamData>)[teamName];
  const standing = (data.standings as Standing[]).find(s => s.team === teamName)!;
  const countryStatus = data.country_status as Record<string, { status: string; name: string; flag: string; next_game: { vs: string; date: string; time: string } | null }>;

  // Recalculate rank with ties
  const allStandings = data.standings as Standing[];
  const teamsAbove = allStandings.filter(t => t.total_roto_points > standing.total_roto_points).length;
  const displayRank = teamsAbove + 1;
  const isTied = allStandings.filter(t => t.total_roto_points === standing.total_roto_points).length > 1;

  const globalRankings = computeGlobalRankings();

  // Build hot player + zscore rank lookups from all_olympic_players
  const allOlympic = (data as any).all_olympic_players || [];
  const hotLookup = new Set(allOlympic.filter((p: any) => p.is_hot).map((p: any) => `${p.name}|${p.country}`));
  const zscoreRankLookup = new Map(allOlympic.map((p: any) => [`${p.name}|${p.country}`, p.zscore_rank ?? 999]));

  const skaters = team.players
    .filter(p => p.pos !== 'G' && p.status !== 'not_in_olympics')
    .map(p => ({
      ...p,
      fantasyPts: calcFantasyPoints(p),
      globalRank: Number(zscoreRankLookup.get(`${p.name}|${p.country}`) ?? 999),
      isHot: hotLookup.has(`${p.name}|${p.country}`)
    }))
    .sort((a, b) => a.globalRank - b.globalRank);

  const goalies = team.players
    .filter(p => p.pos === 'G' && p.status !== 'not_in_olympics')
    .map(p => ({
      ...p,
      fantasyPts: calcFantasyPoints(p),
      globalRank: Number(zscoreRankLookup.get(`${p.name}|${p.country}`) ?? 999),
      isHot: hotLookup.has(`${p.name}|${p.country}`)
    }))
    .sort((a, b) => a.globalRank - b.globalRank);

  const notPlaying = team.players.filter(p => p.status === 'not_in_olympics');

  const eliminatedCountries = new Set(
    Object.entries(countryStatus)
      .filter(([, v]) => v.status === 'eliminated')
      .map(([k]) => k)
  );

  // Default sorting (static)
  const skaterSortColumn = 'globalRank';
  const skaterSortDirection = 'asc';
  const goalieSortColumn = 'globalRank';
  const goalieSortDirection = 'asc';

  // Sort functions (static, no interactivity)
  const handleSkaterSort = (column: string) => {
    // Static sorting - no interactivity
  };

  const handleGoalieSort = (column: string) => {
    // Static sorting - no interactivity  
  };

  // Sort the skaters by globalRank (ascending)
  const sortedSkaters = [...skaters].sort((a, b) => a.globalRank - b.globalRank);

  // Sort the goalies
  // Sort the goalies by globalRank (ascending)
  const sortedGoalies = [...goalies].sort((a, b) => a.globalRank - b.globalRank);

  // Sort indicator functions
  const getSkaterSortIndicator = (column: string) => {
    if (skaterSortColumn !== column) return '';
    return skaterSortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const getGoalieSortIndicator = (column: string) => {
    if (goalieSortColumn !== column) return '';
    return goalieSortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const catLabels: Record<string, string> = {
    goals: "Goals", assists: "Assists", plus_minus: "+/−", pim: "PIM", goalie_wins: "Goalie W", save_pct: "Save %"
  };

  const medal = medalLabels[displayRank];

  function NextGameCell({ country }: { country: string | null }) {
    if (!country) return <span style={{ color: 'var(--text-muted)' }}>-</span>;
    const eliminated = eliminatedCountries.has(country);
    if (eliminated) return <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>Eliminated</span>;
    const cs = countryStatus[country];
    if (!cs?.next_game) return <span style={{ color: 'var(--text-muted)' }}>TBD</span>;
    const ng = cs.next_game;
    const dateStr = new Date(ng.date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return (
      <span className="inline-flex items-center gap-1.5">
        <span style={{ color: 'var(--text-muted)' }}>vs</span>
        <Flag code={ng.vs} size={16} />
        <span style={{ color: 'var(--text-secondary)' }}>{dateStr}</span>
      </span>
    );
  }

  return (
    <div>
      <a href="/wally-cup-olympics/" className="text-sm no-underline mb-5 inline-flex items-center gap-1.5 back-link-mobile" style={{ color: 'var(--accent-blue)' }}>
        ← Back to Standings
      </a>

      {/* Team header */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 team-header-mobile mobile-compact">
        <div className="glass-card px-6 py-4 flex-1 glass-card-mobile">
          <div className="flex items-center gap-4 team-header-content">
            {teamLogos[teamName] && (
              <img src={teamLogos[teamName]} alt={teamName} className="w-14 h-14 rounded-lg object-contain team-logo-header-mobile" style={{ background: 'rgba(255,255,255,0.5)' }} />
            )}
            <h2 className="text-2xl font-extrabold section-header-mobile" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {teamName}
            </h2>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-lg font-bold mobile-text-sm" style={{ color: 'var(--text-secondary)' }}>
              {standing.total_roto_points} Roto Points
            </span>
          </div>
        </div>
        <div className="glass-card px-5 py-4 flex items-center justify-center" style={medal ? { background: medal.bg } : {}}>
          <span className="text-2xl font-black" style={{ color: medal ? medal.text : 'var(--text-primary)' }}>
            {medal ? `${medal.emoji} #${displayRank}` : `#${displayRank}${isTied ? 'T' : ''}`}
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8 category-grid-mobile mobile-compact">
        {Object.entries(standing.categories).map(([cat, info]) => (
          <div key={cat} className="glass-card p-3 text-center glass-card-mobile">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1 mobile-text-xs" style={{ color: 'var(--text-muted)' }}>
              {catLabels[cat]}
            </div>
            <div className="text-xl font-bold mobile-text-sm" style={{ color: 'var(--text-primary)' }}>
              {cat === 'save_pct' ? (info.value > 0 ? info.value.toFixed(3).replace(/^0/, '') : '—') : info.value}
              {cat === 'save_pct' && info.qualified === false && (
                <span className="ml-1 inline-block w-2 h-2 rounded-full" style={{ background: 'var(--accent-red)', verticalAlign: 'middle' }} title="Not qualified (<20 SA)" />
              )}
            </div>
            <div className="text-xs mt-1 mobile-text-xs" style={{ color: 'var(--text-muted)' }}>
              #{info.rank} · {info.roto_points} pts
            </div>
          </div>
        ))}
      </div>

      {/* Skaters */}
      <h3 className="text-lg font-bold mb-3 section-header-mobile" style={{ color: 'var(--text-primary)' }}>
        Skaters <span className="text-sm font-normal mobile-text-sm" style={{ color: 'var(--text-secondary)' }}>({skaters.length} in Olympics)</span>
      </h3>
      <div className="glass-card overflow-hidden mb-8 glass-card-mobile mobile-compact">
        <div className="overflow-x-auto mobile-table-scroll">
          <table className="w-full mobile-table player-table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: 'rgba(37, 99, 235, 0.04)' }}>
                <th 
                  className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  
                >
                  Player{getSkaterSortIndicator('name')}
                </th>
                <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Country</th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--accent-blue)' }}
                  
                >
                  Rank{getSkaterSortIndicator('globalRank')}
                </th>
                <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Pos</th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  
                >
                  GP{getSkaterSortIndicator('gp')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  
                >
                  G{getSkaterSortIndicator('goals')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  
                >
                  A{getSkaterSortIndicator('assists')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  
                >
                  +/−{getSkaterSortIndicator('plus_minus')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  
                >
                  PIM{getSkaterSortIndicator('pim')}
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Next Game</th>
              </tr>
            </thead>
            <tbody>
              {sortedSkaters.map((p, idx) => {
                const eliminated = p.country ? eliminatedCountries.has(p.country) : false;
                const rowOpacity = eliminated ? 0.4 : 1;
                const pm = p.stats?.plus_minus ?? 0;
                return (
                  <tr key={p.name + idx} className="table-row-hover" style={{
                    borderBottom: '1px solid var(--border)',
                    opacity: rowOpacity,
                  }}>
                    <td className="px-3 py-2.5 text-sm font-medium mobile-text-sm" style={{ color: eliminated ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {p.name}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      {p.country && <Flag code={p.country} size={18} />}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full rank-badge-mobile" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent-blue)' }}>
                        #{p.globalRank}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{p.pos}</td>
                    <td className="px-2 py-2.5 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>{p.stats?.gp ?? '-'}</td>
                    <td className="px-2 py-2.5 text-center text-sm" style={{ color: 'var(--text-primary)' }}>{p.stats?.goals ?? 0}</td>
                    <td className="px-2 py-2.5 text-center text-sm" style={{ color: 'var(--text-primary)' }}>{p.stats?.assists ?? 0}</td>
                    <td className="px-2 py-2.5 text-center text-sm" style={{
                      color: pm > 0 ? 'var(--accent-green)' : pm < 0 ? 'var(--accent-red)' : 'var(--text-primary)'
                    }}>
                      {pm > 0 ? '+' : ''}{pm}
                    </td>
                    <td className="px-2 py-2.5 text-center text-sm" style={{ color: 'var(--text-primary)' }}>{p.stats?.pim ?? 0}</td>
                    <td className="px-3 py-2.5 text-sm next-game-mobile">
                      <NextGameCell country={p.country} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Goalies */}
      <h3 className="text-lg font-bold mb-3 section-header-mobile" style={{ color: 'var(--text-primary)' }}>
        Goalies <span className="text-sm font-normal mobile-text-sm" style={{ color: 'var(--text-secondary)' }}>({goalies.length} in Olympics)</span>
        {!team.goalie_stats.aggregate.qualified && (
          <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' }}>
            Not qualified for SV% ({team.goalie_stats.aggregate.shots_against} SA &lt; 20 required)
          </span>
        )}
      </h3>
      <div className="glass-card overflow-hidden mb-8 glass-card-mobile mobile-compact">
        <div className="overflow-x-auto mobile-table-scroll">
          <table className="w-full mobile-table player-table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: 'rgba(37, 99, 235, 0.04)' }}>
                <th 
                  className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  
                >
                  Goalie{getGoalieSortIndicator('name')}
                </th>
                <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Country</th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--accent-blue)' }}
                  
                >
                  Rank{getGoalieSortIndicator('globalRank')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  
                >
                  GP{getGoalieSortIndicator('gp')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  
                >
                  W{getGoalieSortIndicator('wins')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  
                >
                  SA{getGoalieSortIndicator('shots_against')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  
                >
                  SV%{getGoalieSortIndicator('save_pct')}
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Next Game</th>
              </tr>
            </thead>
            <tbody>
              {sortedGoalies.map((p, idx) => {
                const eliminated = p.country ? eliminatedCountries.has(p.country) : false;
                return (
                  <tr key={p.name + idx} className="table-row-hover" style={{
                    borderBottom: '1px solid var(--border)',
                    opacity: eliminated ? 0.4 : 1,
                  }}>
                    <td className="px-3 py-2.5 text-sm font-medium mobile-text-sm" style={{ color: 'var(--text-primary)' }}>{p.isHot && <span title="Hot (top 10 last 48h)">🔥 </span>}{p.name}</td>
                    <td className="px-2 py-2.5 text-center">{p.country && <Flag code={p.country} size={18} />}</td>
                    <td className="px-2 py-2.5 text-center">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full rank-badge-mobile" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent-blue)' }}>
                        #{p.globalRank}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>{p.stats?.gp ?? 0}</td>
                    <td className="px-2 py-2.5 text-center text-sm" style={{ color: 'var(--text-primary)' }}>{p.stats?.wins ?? 0}</td>
                    <td className="px-2 py-2.5 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>{p.stats?.shots_against ?? 0}</td>
                    <td className="px-2 py-2.5 text-center text-sm" style={{ color: 'var(--text-primary)' }}>
                      {(p.stats?.save_pct ?? 0) > 0 ? (p.stats?.save_pct ?? 0).toFixed(3).replace(/^0/, '') : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-sm next-game-mobile">
                      <NextGameCell country={p.country} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'rgba(37, 99, 235, 0.04)', borderTop: '2px solid var(--border)' }}>
                <td className="px-3 py-2.5 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Team Aggregate</td>
                <td />
                <td />
                <td />
                <td className="px-2 py-2.5 text-center text-sm font-bold">{team.goalie_stats.aggregate.wins}</td>
                <td className="px-2 py-2.5 text-center text-sm font-bold">{team.goalie_stats.aggregate.shots_against}</td>
                <td className="px-2 py-2.5 text-center text-sm font-bold">
                  {team.goalie_stats.aggregate.save_pct > 0 ? team.goalie_stats.aggregate.save_pct.toFixed(3).replace(/^0/, '') : '—'}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Not in Olympics */}
      {notPlaying.length > 0 && (
        <>
          <h3 className="text-lg font-bold mb-3 section-header-mobile" style={{ color: 'var(--text-muted)' }}>
            Not in Olympics <span className="text-sm font-normal mobile-text-sm">({notPlaying.length} players)</span>
          </h3>
          <div className="glass-card overflow-hidden glass-card-mobile" style={{ opacity: 0.6 }}>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <tbody>
                  {notPlaying.map((p, idx) => (
                    <tr key={p.name + idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-3 py-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>{p.name}</td>
                      <td className="px-3 py-1.5 text-xs text-right" style={{ color: 'var(--text-muted)' }}>{p.pos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
