import data from "../../data/standings.json";

const flagMap: Record<string, string> = {
  CAN:"🇨🇦",USA:"🇺🇸",SWE:"🇸🇪",FIN:"🇫🇮",CZE:"🇨🇿",SUI:"🇨🇭",GER:"🇩🇪",SVK:"🇸🇰",DEN:"🇩🇰",LAT:"🇱🇻",ITA:"🇮🇹",FRA:"🇫🇷"
};

const countryNames: Record<string, string> = {
  CAN:"Canada",USA:"United States",SWE:"Sweden",FIN:"Finland",CZE:"Czechia",SUI:"Switzerland",GER:"Germany",SVK:"Slovakia",DEN:"Denmark",LAT:"Latvia",ITA:"Italy",FRA:"France"
};

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

const medalEmoji: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
const medalColors: Record<number, string> = { 1: "#ffd700", 2: "#c0c0c0", 3: "#cd7f32" };

export function generateStaticParams() {
  return Object.keys(data.teams).map(t => ({ slug: teamSlug(t) }));
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const teamName = teamFromSlug(slug);
  if (!teamName) return <div style={{ color: 'var(--text-primary)', padding: 40 }}>Team not found</div>;

  const team = (data.teams as Record<string, TeamData>)[teamName];
  const standing = (data.standings as Standing[]).find(s => s.team === teamName)!;
  const countryStatus = data.country_status as Record<string, { status: string; name: string; flag: string; next_game: { vs: string; date: string; time: string } | null }>;

  const skaters = team.players.filter(p => p.pos !== 'G' && p.status !== 'not_in_olympics');
  const goalies = team.players.filter(p => p.pos === 'G' && p.status !== 'not_in_olympics');
  const notPlaying = team.players.filter(p => p.status === 'not_in_olympics');

  const catLabels: Record<string, string> = {
    goals: "Goals", assists: "Assists", plus_minus: "+/-", pim: "PIM", goalie_wins: "Goalie W", save_pct: "Save %"
  };

  return (
    <div>
      <a href="/" className="text-sm no-underline mb-4 inline-block" style={{ color: 'var(--accent-blue)' }}>
        ← Back to Standings
      </a>

      <div className="flex items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {medalEmoji[standing.rank] || ''} {teamName}
          </h2>
          <p className="text-lg mt-1" style={{ color: medalColors[standing.rank] || 'var(--text-secondary)' }}>
            #{standing.rank} · {standing.total_roto_points} roto points
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
        {Object.entries(standing.categories).map(([cat, info]) => (
          <div key={cat} className="rounded-lg p-3 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
              {catLabels[cat]}
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {cat === 'save_pct' ? (info.value > 0 ? info.value.toFixed(3).replace(/^0/, '') : '-') : info.value}
              {cat === 'save_pct' && info.qualified === false && (
                <span className="ml-1 inline-block w-2 h-2 rounded-full" style={{ background: 'var(--accent-red)', verticalAlign: 'middle' }} />
              )}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              #{info.rank} · {info.roto_points} pts
            </div>
          </div>
        ))}
      </div>

      {/* Skaters */}
      <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        Skaters <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>({skaters.length} in Olympics)</span>
      </h3>
      <div className="overflow-x-auto rounded-lg mb-8" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Player</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Country</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Pos</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>GP</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>G</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>A</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>+/-</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>PIM</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Next Game</th>
            </tr>
          </thead>
          <tbody>
            {skaters.map((p, idx) => {
              const cs = p.country ? countryStatus[p.country] : null;
              const eliminated = p.status === 'eliminated';
              return (
                <tr key={p.name + idx} style={{
                  background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)',
                  borderBottom: '1px solid var(--border)',
                  opacity: eliminated ? 0.4 : 1,
                }}>
                  <td className="px-3 py-2 text-sm font-medium" style={{ color: eliminated ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {eliminated && '❌ '}{p.name}
                  </td>
                  <td className="px-3 py-2 text-center text-sm">
                    {p.country && <span title={countryNames[p.country]}>{flagMap[p.country]}</span>}
                  </td>
                  <td className="px-3 py-2 text-center text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{p.pos}</td>
                  <td className="px-3 py-2 text-center text-sm">{p.stats?.gp ?? '-'}</td>
                  <td className="px-3 py-2 text-center text-sm font-semibold" style={{ color: (p.stats?.goals ?? 0) > 0 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                    {p.stats?.goals ?? 0}
                  </td>
                  <td className="px-3 py-2 text-center text-sm">{p.stats?.assists ?? 0}</td>
                  <td className="px-3 py-2 text-center text-sm" style={{
                    color: (p.stats?.plus_minus ?? 0) > 0 ? 'var(--accent-green)' : (p.stats?.plus_minus ?? 0) < 0 ? 'var(--accent-red)' : 'var(--text-primary)'
                  }}>
                    {(p.stats?.plus_minus ?? 0) > 0 ? '+' : ''}{p.stats?.plus_minus ?? 0}
                  </td>
                  <td className="px-3 py-2 text-center text-sm">{p.stats?.pim ?? 0}</td>
                  <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {eliminated ? 'Eliminated' : cs?.next_game ? `vs ${flagMap[cs.next_game.vs]} ${cs.next_game.time}` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Goalies */}
      <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        Goalies
        {!team.goalie_stats.aggregate.qualified && (
          <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.2)', color: 'var(--accent-red)' }}>
            Not qualified for SV% ({team.goalie_stats.aggregate.shots_against} SA &lt; 20 required)
          </span>
        )}
      </h3>
      <div className="overflow-x-auto rounded-lg mb-8" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Goalie</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Country</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>GP</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>W</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>SA</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>SV%</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Next Game</th>
            </tr>
          </thead>
          <tbody>
            {goalies.map((p, idx) => {
              const cs = p.country ? countryStatus[p.country] : null;
              return (
                <tr key={p.name + idx} style={{
                  background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <td className="px-3 py-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</td>
                  <td className="px-3 py-2 text-center">{p.country && <span title={countryNames[p.country]}>{flagMap[p.country]}</span>}</td>
                  <td className="px-3 py-2 text-center text-sm">{p.stats?.gp ?? 0}</td>
                  <td className="px-3 py-2 text-center text-sm font-semibold">{p.stats?.wins ?? 0}</td>
                  <td className="px-3 py-2 text-center text-sm">{p.stats?.shots_against ?? 0}</td>
                  <td className="px-3 py-2 text-center text-sm font-semibold">
                    {(p.stats?.save_pct ?? 0) > 0 ? (p.stats?.save_pct ?? 0).toFixed(3).replace(/^0/, '') : '-'}
                  </td>
                  <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {cs?.next_game ? `vs ${flagMap[cs.next_game.vs]} ${cs.next_game.time}` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
              <td className="px-3 py-2 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Team Aggregate</td>
              <td />
              <td />
              <td className="px-3 py-2 text-center text-sm font-bold">{team.goalie_stats.aggregate.wins}</td>
              <td className="px-3 py-2 text-center text-sm font-bold">{team.goalie_stats.aggregate.shots_against}</td>
              <td className="px-3 py-2 text-center text-sm font-bold">
                {team.goalie_stats.aggregate.save_pct > 0 ? team.goalie_stats.aggregate.save_pct.toFixed(3).replace(/^0/, '') : '-'}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Not in Olympics */}
      <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-muted)' }}>
        Not in Olympics <span className="text-sm font-normal">({notPlaying.length} players)</span>
      </h3>
      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            {notPlaying.map((p, idx) => (
              <tr key={p.name + idx} style={{
                background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)',
                borderBottom: '1px solid var(--border)',
                opacity: 0.4,
              }}>
                <td className="px-3 py-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>{p.name}</td>
                <td className="px-3 py-1.5 text-xs text-right" style={{ color: 'var(--text-muted)' }}>{p.pos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
