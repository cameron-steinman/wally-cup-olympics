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
  player_id?: number;
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
  const [skaterSortColumn, setSkaterSortColumn] = useState<string>('fantasyPts');
  const [skaterSortDirection, setSkaterSortDirection] = useState<'asc' | 'desc'>('desc');

  // Sorting state for goalies table
  const [goalieSortColumn, setGoalieSortColumn] = useState<string>('wins');
  const [goalieSortDirection, setGoalieSortDirection] = useState<'asc' | 'desc'>('desc');

  // Function to get sort indicator
  const getSkaterSortIndicator = (column: string) => {
    if (skaterSortColumn === column) {
      return skaterSortDirection === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  const getGoalieSortIndicator = (column: string) => {
    if (goalieSortColumn === column) {
      return goalieSortDirection === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  // Sort function for skaters table
  const handleSkaterSort = (column: string) => {
    if (skaterSortColumn === column) {
      setSkaterSortDirection(skaterSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSkaterSortColumn(column);
      setSkaterSortDirection('desc');
    }
  };

  // Sort function for goalies table
  const handleGoalieSort = (column: string) => {
    if (goalieSortColumn === column) {
      setGoalieSortDirection(goalieSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setGoalieSortColumn(column);
      setGoalieSortDirection('desc');
    }
  };

  // Sort the skaters
  const sortedSkaters = [...skaters].sort((a, b) => {
    let aVal: any, bVal: any;

    if (skaterSortColumn === 'name') {
      aVal = a.name;
      bVal = b.name;
    } else if (skaterSortColumn === 'pos') {
      aVal = a.pos;
      bVal = b.pos;
    } else if (skaterSortColumn === 'fantasyPts') {
      aVal = a.fantasyPts;
      bVal = b.fantasyPts;
    } else {
      aVal = a.stats?.[skaterSortColumn] ?? 0;
      bVal = b.stats?.[skaterSortColumn] ?? 0;
    }

    if (aVal < bVal) return skaterSortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return skaterSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Sort the goalies
  const sortedGoalies = [...goalies].sort((a, b) => {
    let aVal: any, bVal: any;

    if (goalieSortColumn === 'name') {
      aVal = a.name;
      bVal = b.name;
    } else if (goalieSortColumn === 'status') {
      aVal = a.status;
      bVal = b.status;
    } else {
      aVal = goalieAggregateStats[goalieSortColumn];
      bVal = goalieAggregateStats[goalieSortColumn];
    }

    if (aVal < bVal) return goalieSortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return goalieSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Skaters Table */}
      <div>
        <h3 className="text-lg font-semibold">Skaters</h3>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}></th>
                  <th 
                    className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => handleSkaterSort('name')}
                  >
                    Name{getSkaterSortIndicator('name')}
                  </th>
                  <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Flag</th>
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
                      <td className="px-3 py-2.5 text-sm font-medium mobile-text-sm">
                      {p.player_id ? (
                        <a href={`/player/${p.player_id}`} style={{ color: eliminated ? 'var(--text-muted)' : 'var(--text-primary)' }}>{p.name}</a>
                      ) : (
                        <span style={{ color: eliminated ? 'var(--text-muted)' : 'var(--text-primary)' }}>{p.name}</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Flag code={p.country ?? ''} size={18} />
                    </td>
                    <td className="px-2 py-2 text-center">{p.pos}</td>
                    <td className="px-2 py-2 text-center">{p.stats?.gp ?? 0}</td>
                    <td className="px-2 py-2 text-center">{p.stats?.goals ?? 0}</td>
                    <td className="px-2 py-2 text-center">{p.stats?.assists ?? 0}</td>
                    <td className="px-2 py-2 text-center">{pm > 0 ? `+${pm}` : pm}</td>
                    <td className="px-2 py-2 text-center">{p.stats?.pim ?? 0}</td>
                    <td className="px-3 py-2.5 text-left text-xs">{countryStatus[p.country ?? ''].next_game?.vs}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Goalies Table */}
      <div>
        <h3 className="text-lg font-semibold">Goalies</h3>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th 
                    className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => handleGoalieSort('name')}
                  >
                    Name{getGoalieSortIndicator('name')}
                  </th>
                  <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Flag</th>
                  <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th 
                    className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => handleGoalieSort('wins')}
                  >
                    Wins{getGoalieSortIndicator('wins')}
                  </th>
                  <th 
                    className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => handleGoalieSort('saves')}
                  >
                    Saves{getGoalieSortIndicator('saves')}
                  </th>
                  <th 
                    className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => handleGoalieSort('shots_against')}
                  >
                    Shots Against{getGoalieSortIndicator('shots_against')}
                  </th>
                  <th 
                    className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => handleGoalieSort('save_pct')}
                  >
                    Save %{getGoalieSortIndicator('save_pct')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedGoalies.map((p, idx) => {
                  const eliminated = p.country ? eliminatedCountries.has(p.country) : false;
                  const rowOpacity = eliminated ? 0.4 : 1;
                  return (
                    <tr key={p.name + idx} className="table-row-hover" style={{
                      borderBottom: '1px solid var(--border)',
                      opacity: rowOpacity,
                    }}>
                      <th 
                        className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                      ></th>
                      <td className="px-3 py-2.5 text-sm font-medium mobile-text-sm">
                      {p.player_id ? (
                        <a href={`/player/${p.player_id}`} style={{ color: eliminated ? 'var(--text-muted)' : 'var(--text-primary)' }}>{p.name}</a>
                      ) : (
                        <span style={{ color: eliminated ? 'var(--text-muted)' : 'var(--text-primary)' }}>{p.name}</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Flag code={p.country ?? ''} size={18} />
                    </td>
                    <td className="px-2 py-2 text-center">{p.status}</td>
                    <td className="px-2 py-2 text-center">{goalieAggregateStats.wins}</td>
                    <td className="px-2 py-2 text-center">{goalieAggregateStats.saves}</td>
                    <td className="px-2 py-2 text-center">{goalieAggregateStats.shots_against}</td>
                    <td className="px-2 py-2 text-center">{(goalieAggregateStats.save_pct * 100).toFixed(2)}%</td>
                </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}