"use client";
import { useState } from "react";

const flagIso2: Record<string, string> = {
  CAN:"ca",USA:"us",SWE:"se",FIN:"fi",CZE:"cz",SUI:"ch",GER:"de",SVK:"sk",DEN:"dk",LAT:"lv",ITA:"it",FRA:"fr"
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

type Player = {
  name: string;
  country: string | null;
  pos: string;
  stats: Record<string, number> | null;
  status: string;
  fantasyPts: number;
  globalRank: number;
  isHot: boolean;
  isCold: boolean;
};

interface TeamPageClientProps {
  skaters: Player[];
  goalies: Player[];
  countryStatus: Record<string, { status: string; name: string; flag: string; next_game: { vs: string; date: string; time: string } | null }>;
  eliminatedCountries: Set<string>;
  goalieAggregateStats: {
    wins: number;
    saves: number;
    shots_against: number;
    save_pct: number;
    qualified: boolean;
  };
}

export default function TeamPageClient({ skaters, goalies, countryStatus, eliminatedCountries, goalieAggregateStats }: TeamPageClientProps) {
  // Sorting state for skaters table
  const [skaterSortColumn, setSkaterSortColumn] = useState<string>('globalRank');
  const [skaterSortDirection, setSkaterSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sorting state for goalies table
  const [goalieSortColumn, setGoalieSortColumn] = useState<string>('globalRank');
  const [goalieSortDirection, setGoalieSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sort functions
  const handleSkaterSort = (column: string) => {
    if (skaterSortColumn === column) {
      setSkaterSortDirection(skaterSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSkaterSortColumn(column);
      setSkaterSortDirection('asc');
    }
  };

  const handleGoalieSort = (column: string) => {
    if (goalieSortColumn === column) {
      setGoalieSortDirection(goalieSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setGoalieSortColumn(column);
      setGoalieSortDirection('asc');
    }
  };

  // Sort the skaters
  const sortedSkaters = [...skaters].sort((a, b) => {
    let aVal: any, bVal: any;
    
    if (skaterSortColumn === 'name') {
      aVal = a.name;
      bVal = b.name;
    } else if (skaterSortColumn === 'globalRank') {
      aVal = a.globalRank;
      bVal = b.globalRank;
    } else if (skaterSortColumn === 'gp') {
      aVal = a.stats?.gp ?? 0;
      bVal = b.stats?.gp ?? 0;
    } else if (skaterSortColumn === 'goals') {
      aVal = a.stats?.goals ?? 0;
      bVal = b.stats?.goals ?? 0;
    } else if (skaterSortColumn === 'assists') {
      aVal = a.stats?.assists ?? 0;
      bVal = b.stats?.assists ?? 0;
    } else if (skaterSortColumn === 'plus_minus') {
      aVal = a.stats?.plus_minus ?? 0;
      bVal = b.stats?.plus_minus ?? 0;
    } else if (skaterSortColumn === 'pim') {
      aVal = a.stats?.pim ?? 0;
      bVal = b.stats?.pim ?? 0;
    } else {
      return 0;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return skaterSortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    
    return skaterSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Sort the goalies
  const sortedGoalies = [...goalies].sort((a, b) => {
    let aVal: any, bVal: any;
    
    if (goalieSortColumn === 'name') {
      aVal = a.name;
      bVal = b.name;
    } else if (goalieSortColumn === 'globalRank') {
      aVal = a.globalRank;
      bVal = b.globalRank;
    } else if (goalieSortColumn === 'gp') {
      aVal = a.stats?.gp ?? 0;
      bVal = b.stats?.gp ?? 0;
    } else if (goalieSortColumn === 'wins') {
      aVal = a.stats?.wins ?? 0;
      bVal = b.stats?.wins ?? 0;
    } else if (goalieSortColumn === 'shots_against') {
      aVal = a.stats?.shots_against ?? 0;
      bVal = b.stats?.shots_against ?? 0;
    } else if (goalieSortColumn === 'save_pct') {
      aVal = a.stats?.save_pct ?? 0;
      bVal = b.stats?.save_pct ?? 0;
    } else {
      return 0;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return goalieSortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    
    return goalieSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Sort indicator functions
  const getSkaterSortIndicator = (column: string) => {
    if (skaterSortColumn !== column) return '';
    return skaterSortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const getGoalieSortIndicator = (column: string) => {
    if (goalieSortColumn !== column) return '';
    return goalieSortDirection === 'asc' ? ' ▲' : ' ▼';
  };

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
    <>
      {/* Skaters */}
      <h3 className="text-lg font-bold mb-3 section-header-mobile" style={{ color: 'var(--text-primary)' }}>
        Skaters <span className="text-sm font-normal mobile-text-sm" style={{ color: 'var(--text-secondary)' }}>({skaters.length} in Olympics)</span>
      </h3>
      <div className="glass-card overflow-hidden mb-8 glass-card-mobile mobile-compact">
        <div className="overflow-x-auto mobile-table-scroll">
          <table className="w-full mobile-table player-table" style={{ borderCollapse: 'separate', borderSpacing: 0,  }}>
            <thead>
              <tr style={{ background: 'rgba(37, 99, 235, 0.04)' }}>
                <th 
                  className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSkaterSort('name')}
                >
                  Player{getSkaterSortIndicator('name')}
                </th>
                <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Country</th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--accent-blue)' }}
                  onClick={() => handleSkaterSort('globalRank')}
                >
                  Rank{getSkaterSortIndicator('globalRank')}
                </th>
                <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Pos</th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSkaterSort('gp')}
                >
                  GP{getSkaterSortIndicator('gp')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSkaterSort('goals')}
                >
                  G{getSkaterSortIndicator('goals')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSkaterSort('assists')}
                >
                  A{getSkaterSortIndicator('assists')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSkaterSort('plus_minus')}
                >
                  +/−{getSkaterSortIndicator('plus_minus')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSkaterSort('pim')}
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
                      {p.isHot && <span title="Hot player (top 10 last 48h)">🔥 </span>}{p.isCold && <span title="Cold player (bottom 50 last 48h)">❄️ </span>}{p.name}
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
        {!goalieAggregateStats.qualified && (
          <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' }}>
            Not qualified for SV% ({goalieAggregateStats.shots_against} SA &lt; 20 required)
          </span>
        )}
      </h3>
      <div className="glass-card overflow-hidden mb-8 glass-card-mobile mobile-compact">
        <div className="overflow-x-auto mobile-table-scroll">
          <table className="w-full mobile-table player-table" style={{ borderCollapse: 'separate', borderSpacing: 0,  }}>
            <thead>
              <tr style={{ background: 'rgba(37, 99, 235, 0.04)' }}>
                <th 
                  className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleGoalieSort('name')}
                >
                  Goalie{getGoalieSortIndicator('name')}
                </th>
                <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Country</th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--accent-blue)' }}
                  onClick={() => handleGoalieSort('globalRank')}
                >
                  Rank{getGoalieSortIndicator('globalRank')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleGoalieSort('gp')}
                >
                  GP{getGoalieSortIndicator('gp')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleGoalieSort('wins')}
                >
                  W{getGoalieSortIndicator('wins')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleGoalieSort('shots_against')}
                >
                  SA{getGoalieSortIndicator('shots_against')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleGoalieSort('save_pct')}
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
                    <td className="px-3 py-2.5 text-sm font-medium mobile-text-sm" style={{ color: 'var(--text-primary)' }}>{p.isHot && <span title="Hot player (top 10 last 48h)">🔥 </span>}{p.isCold && <span title="Cold player (bottom 50 last 48h)">❄️ </span>}{p.name}</td>
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
                <td className="px-2 py-2.5 text-center text-sm font-bold">{goalieAggregateStats.wins}</td>
                <td className="px-2 py-2.5 text-center text-sm font-bold">{goalieAggregateStats.shots_against}</td>
                <td className="px-2 py-2.5 text-center text-sm font-bold">
                  {goalieAggregateStats.save_pct > 0 ? goalieAggregateStats.save_pct.toFixed(3).replace(/^0/, '') : '—'}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}