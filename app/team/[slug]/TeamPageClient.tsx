"use client";
import { useState } from "react";

const flagIso2: Record<string, string> = {
  CAN:"ca",USA:"us",SWE:"se",FIN:"fi",CZE:"cz",SUI:"ch",GER:"de",SVK:"sk",DEN:"dk",LAT:"lv",ITA:"it",FRA:"fr"
};

function Flag({ code, size = 18 }: { code: string; size?: number }) {
  const iso = flagIso2[code];
  if (!iso) return <span>{code}</span>;
  return (
    <img src={`https://flagcdn.com/w40/${iso}.png`} srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
      alt={code} width={size} height={Math.round(size * 0.75)}
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }} />
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

interface Props {
  skaters: Player[];
  goalies: Player[];
  countryStatus: Record<string, any>;
  eliminatedCountries: Set<string>;
  goalieAggregateStats: { wins: number; saves: number; shots_against: number; save_pct: number; qualified: boolean };
}

type SortDir = 'asc' | 'desc';

function sortPlayers(players: Player[], col: string, dir: SortDir): Player[] {
  return [...players].sort((a, b) => {
    let av: any, bv: any;
    if (col === 'name') { av = a.name; bv = b.name; }
    else if (col === 'country') { av = a.country || ''; bv = b.country || ''; }
    else if (col === 'pos') { av = a.pos; bv = b.pos; }
    else if (col === 'globalRank') { av = a.globalRank; bv = b.globalRank; }
    else if (col === 'gp') { av = a.stats?.gp ?? 0; bv = b.stats?.gp ?? 0; }
    else if (col === 'goals') { av = a.stats?.goals ?? 0; bv = b.stats?.goals ?? 0; }
    else if (col === 'assists') { av = a.stats?.assists ?? 0; bv = b.stats?.assists ?? 0; }
    else if (col === 'points') { av = (a.stats?.goals ?? 0) + (a.stats?.assists ?? 0); bv = (b.stats?.goals ?? 0) + (b.stats?.assists ?? 0); }
    else if (col === 'plus_minus') { av = a.stats?.plus_minus ?? 0; bv = b.stats?.plus_minus ?? 0; }
    else if (col === 'pim') { av = a.stats?.pim ?? 0; bv = b.stats?.pim ?? 0; }
    else if (col === 'wins') { av = a.stats?.wins ?? 0; bv = b.stats?.wins ?? 0; }
    else if (col === 'save_pct') { av = a.stats?.save_pct ?? 0; bv = b.stats?.save_pct ?? 0; }
    else if (col === 'saves') { av = a.stats?.saves ?? 0; bv = b.stats?.saves ?? 0; }
    else if (col === 'shots_against') { av = a.stats?.shots_against ?? 0; bv = b.stats?.shots_against ?? 0; }
    else { av = 0; bv = 0; }
    if (typeof av === 'string') return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return dir === 'asc' ? av - bv : bv - av;
  });
}

function SortHeader({ label, col, current, dir, onSort, align = 'center' }: {
  label: string; col: string; current: string; dir: SortDir; onSort: (c: string) => void; align?: string;
}) {
  const indicator = current === col ? (dir === 'asc' ? ' ▲' : ' ▼') : '';
  return (
    <th className={`px-2 py-2.5 text-${align} text-[10px] font-semibold uppercase tracking-wider cursor-pointer`}
      style={{ color: 'var(--text-muted)' }} onClick={() => onSort(col)}>
      {label}{indicator}
    </th>
  );
}

export default function TeamPageClient({ skaters, goalies, countryStatus, eliminatedCountries, goalieAggregateStats }: Props) {
  const [sCol, setSCol] = useState('globalRank');
  const [sDir, setSDir] = useState<SortDir>('asc');
  const [gCol, setGCol] = useState('globalRank');
  const [gDir, setGDir] = useState<SortDir>('asc');

  const handleSSort = (col: string) => {
    if (sCol === col) setSDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSCol(col); setSDir(col === 'name' || col === 'country' ? 'asc' : 'desc'); }
  };
  const handleGSort = (col: string) => {
    if (gCol === col) setGDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setGCol(col); setGDir(col === 'name' || col === 'country' ? 'asc' : 'desc'); }
  };

  const sortedSkaters = sortPlayers(skaters, sCol, sDir);
  const sortedGoalies = sortPlayers(goalies, gCol, gDir);

  return (
    <div className="flex flex-col gap-8">
      {/* Skaters */}
      <div>
        <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Skaters <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>({skaters.length})</span>
        </h3>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: 'rgba(37,99,235,0.04)' }}>
                  <SortHeader label="#" col="globalRank" current={sCol} dir={sDir} onSort={handleSSort} align="center" />
                  <SortHeader label="Name" col="name" current={sCol} dir={sDir} onSort={handleSSort} align="left" />
                  <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>🏳️</th>
                  <SortHeader label="Pos" col="pos" current={sCol} dir={sDir} onSort={handleSSort} />
                  <SortHeader label="GP" col="gp" current={sCol} dir={sDir} onSort={handleSSort} />
                  <SortHeader label="G" col="goals" current={sCol} dir={sDir} onSort={handleSSort} />
                  <SortHeader label="A" col="assists" current={sCol} dir={sDir} onSort={handleSSort} />
                  <SortHeader label="PTS" col="points" current={sCol} dir={sDir} onSort={handleSSort} />
                  <SortHeader label="+/-" col="plus_minus" current={sCol} dir={sDir} onSort={handleSSort} />
                  <SortHeader label="PIM" col="pim" current={sCol} dir={sDir} onSort={handleSSort} />
                  <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Next</th>
                </tr>
              </thead>
              <tbody>
                {sortedSkaters.map((p, idx) => {
                  const elim = p.country ? eliminatedCountries.has(p.country) : false;
                  const pm = p.stats?.plus_minus ?? 0;
                  const pts = (p.stats?.goals ?? 0) + (p.stats?.assists ?? 0);
                  const cs = p.country ? countryStatus[p.country] : null;
                  return (
                    <tr key={p.name + idx} style={{ borderBottom: '1px solid var(--border)', opacity: elim ? 0.4 : 1 }}>
                      <td className="px-2 py-2 text-center text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{p.globalRank}</td>
                      <td className="px-2 py-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {p.isHot && <span title="Hot">🔥 </span>}
                        {p.isCold && <span title="Cold">❄️ </span>}
                        {p.player_id ? (
                          <a href={`/wally-cup-olympics/player/${p.player_id}`} className="no-underline hover:underline" style={{ color: 'var(--accent-blue)' }}>{p.name}</a>
                        ) : p.name}
                      </td>
                      <td className="px-2 py-2 text-center">{p.country && <Flag code={p.country} size={16} />}</td>
                      <td className="px-2 py-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{p.pos}</td>
                      <td className="px-2 py-2 text-center text-sm" style={{ color: 'var(--text-primary)' }}>{p.stats?.gp ?? 0}</td>
                      <td className="px-2 py-2 text-center text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.stats?.goals ?? 0}</td>
                      <td className="px-2 py-2 text-center text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.stats?.assists ?? 0}</td>
                      <td className="px-2 py-2 text-center text-sm font-bold" style={{ color: 'var(--accent-blue)' }}>{pts}</td>
                      <td className="px-2 py-2 text-center text-sm" style={{ color: pm > 0 ? '#22c55e' : pm < 0 ? '#ef4444' : 'var(--text-primary)' }}>
                        {pm > 0 ? `+${pm}` : pm}
                      </td>
                      <td className="px-2 py-2 text-center text-sm" style={{ color: 'var(--text-primary)' }}>{p.stats?.pim ?? 0}</td>
                      <td className="px-2 py-2 text-center text-xs">
                        {elim ? (
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>Eliminated</span>
                        ) : cs?.next_game ? (
                          <span className="inline-flex items-center gap-1">
                            <span style={{ color: 'var(--text-muted)' }}>vs</span>
                            <Flag code={cs.next_game.vs} size={14} />
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>TBD</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Goalies */}
      <div>
        <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Goalies <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>({goalies.length})</span>
        </h3>

        {/* Aggregate goalie stats */}
        <div className="glass-card p-3 mb-3 flex items-center gap-4 flex-wrap text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>Team Goaltending:</span>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{goalieAggregateStats.wins}W</span>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
            {goalieAggregateStats.shots_against > 0
              ? (goalieAggregateStats.saves / goalieAggregateStats.shots_against).toFixed(3).replace(/^0/, '')
              : '—'} SV%
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>{goalieAggregateStats.saves} SV / {goalieAggregateStats.shots_against} SA</span>
          {!goalieAggregateStats.qualified && (
            <span className="text-xs" style={{ color: '#ef4444' }}>Not qualified (&lt;20 SA)</span>
          )}
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: 'rgba(37,99,235,0.04)' }}>
                  <SortHeader label="#" col="globalRank" current={gCol} dir={gDir} onSort={handleGSort} align="center" />
                  <SortHeader label="Name" col="name" current={gCol} dir={gDir} onSort={handleGSort} align="left" />
                  <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>🏳️</th>
                  <SortHeader label="GP" col="gp" current={gCol} dir={gDir} onSort={handleGSort} />
                  <SortHeader label="W" col="wins" current={gCol} dir={gDir} onSort={handleGSort} />
                  <SortHeader label="SV" col="saves" current={gCol} dir={gDir} onSort={handleGSort} />
                  <SortHeader label="SA" col="shots_against" current={gCol} dir={gDir} onSort={handleGSort} />
                  <SortHeader label="SV%" col="save_pct" current={gCol} dir={gDir} onSort={handleGSort} />
                  <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Next</th>
                </tr>
              </thead>
              <tbody>
                {sortedGoalies.map((p, idx) => {
                  const elim = p.country ? eliminatedCountries.has(p.country) : false;
                  const svPct = (p.stats?.shots_against ?? 0) > 0
                    ? ((p.stats?.saves ?? 0) / (p.stats?.shots_against ?? 1)).toFixed(3).replace(/^0/, '')
                    : '—';
                  const cs = p.country ? countryStatus[p.country] : null;
                  return (
                    <tr key={p.name + idx} style={{ borderBottom: '1px solid var(--border)', opacity: elim ? 0.4 : 1 }}>
                      <td className="px-2 py-2 text-center text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{p.globalRank}</td>
                      <td className="px-2 py-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {p.isHot && <span title="Hot">🔥 </span>}
                        {p.isCold && <span title="Cold">❄️ </span>}
                        {p.player_id ? (
                          <a href={`/wally-cup-olympics/player/${p.player_id}`} className="no-underline hover:underline" style={{ color: 'var(--accent-blue)' }}>{p.name}</a>
                        ) : p.name}
                      </td>
                      <td className="px-2 py-2 text-center">{p.country && <Flag code={p.country} size={16} />}</td>
                      <td className="px-2 py-2 text-center text-sm" style={{ color: 'var(--text-primary)' }}>{p.stats?.gp ?? 0}</td>
                      <td className="px-2 py-2 text-center text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.stats?.wins ?? 0}</td>
                      <td className="px-2 py-2 text-center text-sm" style={{ color: 'var(--text-primary)' }}>{p.stats?.saves ?? 0}</td>
                      <td className="px-2 py-2 text-center text-sm" style={{ color: 'var(--text-primary)' }}>{p.stats?.shots_against ?? 0}</td>
                      <td className="px-2 py-2 text-center text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{svPct}</td>
                      <td className="px-2 py-2 text-center text-xs">
                        {elim ? (
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>Eliminated</span>
                        ) : cs?.next_game ? (
                          <span className="inline-flex items-center gap-1">
                            <span style={{ color: 'var(--text-muted)' }}>vs</span>
                            <Flag code={cs.next_game.vs} size={14} />
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>TBD</span>
                        )}
                      </td>
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
