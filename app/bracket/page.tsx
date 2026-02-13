"use client";
import data from "../data/standings.json";

const flagIso2: Record<string, string> = {
  CAN:"ca",USA:"us",SWE:"se",FIN:"fi",CZE:"cz",SUI:"ch",GER:"de",SVK:"sk",DEN:"dk",LAT:"lv",ITA:"it",FRA:"fr"
};

function Flag({ code, size = 24 }: { code: string; size?: number }) {
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

const groups = {
  A: ["CAN", "SWE", "SUI", "LAT", "DEN", "FRA"],
  B: ["USA", "FIN", "CZE", "GER", "SVK", "ITA"]
};

const countryNames: Record<string, string> = {
  CAN:"Canada",USA:"United States",SWE:"Sweden",FIN:"Finland",CZE:"Czechia",SUI:"Switzerland",
  GER:"Germany",SVK:"Slovakia",DEN:"Denmark",LAT:"Latvia",ITA:"Italy",FRA:"France"
};

export default function BracketPage() {
  const allOlympicPlayers = (data as any).all_olympic_players || [];
  const countryStatus = (data as any).country_status || {};
  const eliminatedCountries = new Set(
    Object.entries(countryStatus).filter(([_, v]: [string, any]) => v.status === 'eliminated').map(([k]) => k)
  );

  // Knockout probabilities from predictions
  const knockoutOdds = ((data as any).predictions?.country_knockout_odds || {}) as Record<string, number>;

  // Build country data with Wally team breakdown and best player
  const countryInfo: Record<string, {
    playerCount: number;
    stats: { gp: number; goals: number; assists: number; plus_minus: number; pim: number; wins: number; saves: number; shots_against: number };
    wallyTeamCounts: Record<string, number>;
    bestPlayer: { name: string; zscore: number } | null;
  }> = {};

  Object.keys(countryNames).forEach(code => {
    countryInfo[code] = {
      playerCount: 0,
      stats: { gp: 0, goals: 0, assists: 0, plus_minus: 0, pim: 0, wins: 0, saves: 0, shots_against: 0 },
      wallyTeamCounts: {},
      bestPlayer: null,
    };
  });

  allOlympicPlayers.forEach((p: any) => {
    const c = p.country;
    if (!c || !countryInfo[c]) return;
    if (!p.wally_team) return;

    const ci = countryInfo[c];
    ci.playerCount++;
    const s = p.stats || {};
    ci.stats.gp += s.gp || 0;
    ci.stats.goals += s.goals || 0;
    ci.stats.assists += s.assists || 0;
    ci.stats.plus_minus += s.plus_minus || 0;
    ci.stats.pim += s.pim || 0;
    ci.stats.wins += s.wins || 0;
    ci.stats.saves += s.saves || 0;
    ci.stats.shots_against += s.shots_against || 0;

    ci.wallyTeamCounts[p.wally_team] = (ci.wallyTeamCounts[p.wally_team] || 0) + 1;

    const zscore = p.zscore ?? 0;
    if (!ci.bestPlayer || zscore > ci.bestPlayer.zscore) {
      ci.bestPlayer = { name: p.name, zscore };
    }
  });

  function CountryCard({ code }: { code: string }) {
    const ci = countryInfo[code];
    const isEliminated = eliminatedCountries.has(code);
    const knockoutPct = (knockoutOdds[code] || 0) * 100;
    
    // Top 3 Wally teams by player count
    const topTeams = Object.entries(ci.wallyTeamCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return (
      <div className={`glass-card p-4 ${isEliminated ? 'opacity-50' : ''}`}
           style={{ borderLeft: isEliminated ? '3px solid var(--text-muted)' : '3px solid var(--accent-blue)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Flag code={code} size={28} />
          <div className="flex-1">
            <div className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              {countryNames[code]}
            </div>
            <div className="text-xs font-semibold" style={{ color: 'var(--accent-blue)' }}>
              {ci.playerCount} Wally Player{ci.playerCount !== 1 ? 's' : ''}
            </div>
          </div>
          {isEliminated ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
              ELIMINATED
            </span>
          ) : (
            <div className="text-right">
              <div className="text-lg font-bold" style={{ color: knockoutPct >= 80 ? '#22c55e' : knockoutPct >= 50 ? 'var(--accent-blue)' : knockoutPct >= 20 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {knockoutPct.toFixed(0)}%
              </div>
              <div className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>knockout</div>
            </div>
          )}
        </div>

        {/* Top 3 Wally teams */}
        {topTeams.length > 0 && (
          <div className="text-xs mb-2 space-y-0.5">
            {topTeams.map(([team, count]) => (
              <div key={team} style={{ color: 'var(--text-secondary)' }}>
                <span className="font-semibold">{count}</span> from {team}
              </div>
            ))}
          </div>
        )}

        {/* Best player */}
        {ci.bestPlayer && (
          <div className="text-xs mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Top player: </span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{ci.bestPlayer.name}</span>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 text-xs mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="text-center">
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{ci.stats.goals}</div>
            <div style={{ color: 'var(--text-secondary)' }}>G</div>
          </div>
          <div className="text-center">
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{ci.stats.assists}</div>
            <div style={{ color: 'var(--text-secondary)' }}>A</div>
          </div>
          <div className="text-center">
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{ci.stats.plus_minus > 0 ? '+' : ''}{ci.stats.plus_minus}</div>
            <div style={{ color: 'var(--text-secondary)' }}>+/-</div>
          </div>
          <div className="text-center">
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{ci.stats.pim}</div>
            <div style={{ color: 'var(--text-secondary)' }}>PIM</div>
          </div>
          <div className="text-center">
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{ci.stats.wins}</div>
            <div style={{ color: 'var(--text-secondary)' }}>W</div>
          </div>
          <div className="text-center">
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {ci.stats.shots_against > 0 ? (ci.stats.saves / ci.stats.shots_against).toFixed(3).replace(/^0/, '') : '—'}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>SV%</div>
          </div>
        </div>
      </div>
    );
  }

  // Tournament summary totals
  const allCountries = Object.values(countryInfo);
  const totalPlayers = allCountries.reduce((s, c) => s + c.playerCount, 0);
  const totalG = allCountries.reduce((s, c) => s + c.stats.goals, 0);
  const totalA = allCountries.reduce((s, c) => s + c.stats.assists, 0);
  const totalPts = totalG + totalA;
  const totalPM = allCountries.reduce((s, c) => s + c.stats.plus_minus, 0);
  const totalPIM = allCountries.reduce((s, c) => s + c.stats.pim, 0);
  const totalW = allCountries.reduce((s, c) => s + c.stats.wins, 0);
  const totalSaves = allCountries.reduce((s, c) => s + c.stats.saves, 0);
  const totalSA = allCountries.reduce((s, c) => s + c.stats.shots_against, 0);
  const svpct = totalSA > 0 ? (totalSaves / totalSA).toFixed(3).replace(/^0/, '') : '—';

  return (
    <div>
      {/* Page title — consistent treatment */}
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Tournament Bracket
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Milano Cortina 2026 Olympics · Men&apos;s Ice Hockey · Wally Cup player breakdown by country
        </p>
      </div>

      {/* Group Stage */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Group Stage</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Two groups of 6 · Top 4 from each group advance</p>

        {/* Group A */}
        <div className="mb-6">
          <h4 className="text-base font-bold mb-3 pb-2" style={{ color: 'var(--accent-blue)', borderBottom: '2px solid var(--accent-blue)' }}>
            Group A
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.A.map(code => <CountryCard key={code} code={code} />)}
          </div>
        </div>

        {/* Divider */}
        <div className="my-8" style={{ borderTop: '2px solid var(--border)' }} />

        {/* Group B */}
        <div>
          <h4 className="text-base font-bold mb-3 pb-2" style={{ color: 'var(--accent-blue)', borderBottom: '2px solid var(--accent-blue)' }}>
            Group B
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.B.map(code => <CountryCard key={code} code={code} />)}
          </div>
        </div>
      </div>

      {/* Knockout Stage */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Knockout Stage</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Single elimination · Top 4 from each group advance</p>

        <div className="glass-card p-6">
          <div className="text-center space-y-6">
            <div>
              <h5 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Quarterfinals</h5>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>8 teams → 4 teams</p>
            </div>
            <div className="flex justify-center">
              <div style={{ width: '2px', height: '32px', background: 'var(--border)' }} />
            </div>
            <div>
              <h5 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Semifinals</h5>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>4 teams → 2 advance to Gold, 2 to Bronze</p>
            </div>
            <div className="flex justify-center gap-16">
              <div style={{ width: '2px', height: '32px', background: 'var(--border)' }} />
              <div style={{ width: '2px', height: '32px', background: 'var(--border)' }} />
            </div>
            <div className="flex justify-center gap-6 flex-wrap">
              <div className="glass-card p-4 text-center" style={{ borderLeft: '3px solid #ffd700' }}>
                <h5 className="font-bold text-base" style={{ color: '#ffd700' }}>🥇 Gold Medal Game</h5>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Championship Final</p>
              </div>
              <div className="glass-card p-4 text-center" style={{ borderLeft: '3px solid #cd7f32' }}>
                <h5 className="font-bold text-base" style={{ color: '#cd7f32' }}>🥉 Bronze Medal Game</h5>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Third Place</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Summary — Points between Assists and +/- */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Tournament Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>{totalPlayers}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Wally Players</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalG}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Goals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalA}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Assists</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalPts}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalPM > 0 ? '+' : ''}{totalPM}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>+/-</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalPIM}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>PIM</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalW}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Wins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{svpct}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>SV%</div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
        Statistics are combined totals for all Wally Cup players representing each country.
        Eliminated countries shown at reduced opacity.
      </div>
    </div>
  );
}
