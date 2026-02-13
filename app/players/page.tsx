"use client";
import { useState } from "react";
import data from "../data/standings.json";

const flagIso2: Record<string, string> = {
  CAN:"ca",USA:"us",SWE:"se",FIN:"fi",CZE:"cz",SUI:"ch",GER:"de",SVK:"sk",DEN:"dk",LAT:"lv",ITA:"it",FRA:"fr"
};

function Flag({ code, size = 18 }: { code: string; size?: number }) {
  const iso = flagIso2[code];
  if (!iso) return <span className="text-xs">{code}</span>;
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

const teamAbbrevs: Record<string, string> = {
  "Cam's Crunch": "CC", "Mark's Mafia": "MM", "Todd's Hitmen": "TH",
  "Johnny's Scrubbers": "JS", "Bardown": "BD", "Cross's Beavers": "CB",
  "Big Shooters": "BS", "Gators": "GAT", "Gabe's Gangsters": "GG",
  "Willy's Warlocks": "WW", "Owen's Otters": "OO", "Ice Holes": "IH",
};

function teamSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

type AllPlayer = {
  name: string; country: string; pos: string; wally_team: string | null;
  stats: { gp: number; goals: number; assists: number; plus_minus: number; pim: number; wins?: number; saves?: number; shots_against?: number; };
};

function calcFPts(p: AllPlayer): number {
  const s = p.stats;
  if (p.pos === 'G') {
    const sa = s.shots_against ?? 0;
    const sv = s.saves ?? 0;
    const svPct = sa > 0 ? sv / sa : 0;
    return 16 * (s.wins ?? 0) + (svPct > 0 ? 0.5 * ((svPct - 0.904) * 1000) : 0);
  }
  return 10 * s.goals + 8 * s.assists + 10 * s.plus_minus + 5 * s.pim;
}

const PAGE_SIZE = 50;

export default function PlayersPage() {
  const [page, setPage] = useState(0);
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const allPlayers = ((data as any).all_olympic_players || []) as (AllPlayer & { zscore?: number; zscore_rank?: number; is_hot?: boolean })[];
  // Use z-score ranking from data pipeline (per-game rate normalized)
  const withRanks = [...allPlayers]
    .sort((a, b) => (b.zscore ?? 0) - (a.zscore ?? 0))
    .map(p => ({ ...p, rank: p.zscore_rank ?? 999 }));

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
  const sortedPlayers = [...withRanks].sort((a, b) => {
    let aVal: any, bVal: any;
    
    if (sortColumn === 'rank') {
      aVal = a.rank;
      bVal = b.rank;
    } else if (sortColumn === 'name') {
      aVal = a.name;
      bVal = b.name;
    } else if (sortColumn === 'country') {
      aVal = a.country;
      bVal = b.country;
    } else if (sortColumn === 'pos') {
      aVal = a.pos;
      bVal = b.pos;
    } else if (sortColumn === 'gp') {
      aVal = a.stats.gp;
      bVal = b.stats.gp;
    } else if (sortColumn === 'goals') {
      aVal = a.stats.goals;
      bVal = b.stats.goals;
    } else if (sortColumn === 'assists') {
      aVal = a.stats.assists;
      bVal = b.stats.assists;
    } else if (sortColumn === 'plus_minus') {
      aVal = a.stats.plus_minus;
      bVal = b.stats.plus_minus;
    } else if (sortColumn === 'pim') {
      aVal = a.stats.pim;
      bVal = b.stats.pim;
    } else if (sortColumn === 'wins') {
      aVal = a.stats.wins ?? 0;
      bVal = b.stats.wins ?? 0;
    } else if (sortColumn === 'save_pct') {
      const aShots = a.stats.shots_against ?? 0;
      const aSaves = a.stats.saves ?? 0;
      const bShots = b.stats.shots_against ?? 0;
      const bSaves = b.stats.saves ?? 0;
      aVal = aShots > 0 ? aSaves / aShots : 0;
      bVal = bShots > 0 ? bSaves / bShots : 0;
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

  const totalPages = Math.ceil(sortedPlayers.length / PAGE_SIZE);
  const pageData = sortedPlayers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <a href="/wally-cup-olympics/" className="text-sm no-underline mb-5 inline-flex items-center gap-1.5 back-link-mobile" style={{ color: 'var(--accent-blue)' }}>
        ← Back to Standings
      </a>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mobile-stack mobile-stack-header mobile-compact">
        <div className="section-header-mobile">
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            All Olympic Players
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {sortedPlayers.length} players · {sortedPlayers.filter(p => p.wally_team).length} on Wally Cup teams · Ranked by fantasy points
          </p>
        </div>
        {/* Pagination controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-bold pagination-button"
            style={{
              background: page === 0 ? 'rgba(37,99,235,0.05)' : 'rgba(37,99,235,0.1)',
              color: page === 0 ? 'var(--text-muted)' : 'var(--accent-blue)',
              border: 'none', cursor: page === 0 ? 'default' : 'pointer'
            }}
          >← Prev</button>
          <span className="text-xs font-semibold mobile-text-xs" style={{ color: 'var(--text-secondary)' }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sortedPlayers.length)} of {sortedPlayers.length}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg text-xs font-bold pagination-button"
            style={{
              background: page >= totalPages - 1 ? 'rgba(37,99,235,0.05)' : 'rgba(37,99,235,0.1)',
              color: page >= totalPages - 1 ? 'var(--text-muted)' : 'var(--accent-blue)',
              border: 'none', cursor: page >= totalPages - 1 ? 'default' : 'pointer'
            }}
          >Next →</button>
        </div>
      </div>

      <div className="glass-card overflow-hidden glass-card-mobile">
        <div className="overflow-x-auto mobile-table-scroll">
          <table className="w-full mobile-table all-players-table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: 'rgba(37, 99, 235, 0.04)' }}>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider w-12 cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--accent-blue)' }}
                  onClick={() => handleSort('rank')}
                >
                  #{getSortIndicator('rank')}
                </th>
                <th 
                  className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSort('name')}
                >
                  Player{getSortIndicator('name')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSort('country')}
                >
                  Country{getSortIndicator('country')}
                </th>
                <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Team</th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSort('pos')}
                >
                  Pos{getSortIndicator('pos')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSort('gp')}
                >
                  GP{getSortIndicator('gp')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSort('goals')}
                >
                  G{getSortIndicator('goals')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSort('assists')}
                >
                  A{getSortIndicator('assists')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSort('plus_minus')}
                >
                  +/−{getSortIndicator('plus_minus')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSort('pim')}
                >
                  PIM{getSortIndicator('pim')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSort('wins')}
                >
                  W{getSortIndicator('wins')}
                </th>
                <th 
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-50" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSort('save_pct')}
                >
                  SV%{getSortIndicator('save_pct')}
                </th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((p, idx) => {
                const pm = p.stats.plus_minus ?? 0;
                const abbrev = p.wally_team ? teamAbbrevs[p.wally_team] : null;
                const logo = p.wally_team ? teamLogos[p.wally_team] : null;
                const sa = p.stats.shots_against ?? 0;
                const saves = p.stats.saves ?? 0;
                const svPct = sa > 0 ? (saves / sa) : 0;
                const isGoalie = p.pos === 'G';

                return (
                  <tr key={p.name + p.country + idx} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-2 py-2 text-center">
                      <span className="text-xs font-bold" style={{ color: p.rank <= 3 ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                        {p.rank}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm font-medium mobile-text-sm" style={{ color: 'var(--text-primary)' }}>
                      {p.is_hot && <span title="Hot player (top 10 last 48h)">🔥 </span>}{p.name}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Flag code={p.country} size={18} />
                    </td>
                    <td className="px-2 py-2 text-center">
                      {p.wally_team ? (
                        <a
                          href={`/wally-cup-olympics/team/${teamSlug(p.wally_team)}`}
                          className="inline-flex items-center gap-1 no-underline hover:underline"
                          title={p.wally_team}
                        >
                          {logo && <img src={logo} alt="" className="w-4 h-4 rounded-sm object-contain team-logo-mobile" />}
                          <span className="text-[11px] font-bold mobile-text-xs" style={{ color: 'var(--accent-blue)' }}>{abbrev}</span>
                        </a>
                      ) : (
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{p.pos}</td>
                    <td className="px-2 py-2 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>{p.stats.gp}</td>
                    <td className="px-2 py-2 text-center text-sm" style={{ color: 'var(--text-primary)' }}>{isGoalie ? '—' : p.stats.goals}</td>
                    <td className="px-2 py-2 text-center text-sm" style={{ color: 'var(--text-primary)' }}>{isGoalie ? '—' : p.stats.assists}</td>
                    <td className="px-2 py-2 text-center text-sm" style={{
                      color: !isGoalie ? (pm > 0 ? 'var(--accent-green)' : pm < 0 ? 'var(--accent-red)' : 'var(--text-primary)') : 'var(--text-muted)'
                    }}>
                      {isGoalie ? '—' : `${pm > 0 ? '+' : ''}${pm}`}
                    </td>
                    <td className="px-2 py-2 text-center text-sm" style={{ color: 'var(--text-primary)' }}>{isGoalie ? '—' : p.stats.pim}</td>
                    <td className="px-2 py-2 text-center text-sm" style={{ color: 'var(--text-primary)' }}>{isGoalie ? (p.stats.wins ?? 0) : '—'}</td>
                    <td className="px-2 py-2 text-center text-sm" style={{ color: 'var(--text-primary)' }}>
                      {isGoalie && svPct > 0 ? svPct.toFixed(3).replace(/^0/, '') : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom pagination */}
      <div className="mt-4 flex items-center justify-between mobile-stack mobile-compact">
        <div className="text-[11px] mobile-text-xs" style={{ color: 'var(--text-muted)' }}>
          Page {page + 1} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-bold pagination-button"
            style={{
              background: page === 0 ? 'rgba(37,99,235,0.05)' : 'rgba(37,99,235,0.1)',
              color: page === 0 ? 'var(--text-muted)' : 'var(--accent-blue)',
              border: 'none', cursor: page === 0 ? 'default' : 'pointer'
            }}
          >← Prev</button>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg text-xs font-bold pagination-button"
            style={{
              background: page >= totalPages - 1 ? 'rgba(37,99,235,0.05)' : 'rgba(37,99,235,0.1)',
              color: page >= totalPages - 1 ? 'var(--text-muted)' : 'var(--accent-blue)',
              border: 'none', cursor: page >= totalPages - 1 ? 'default' : 'pointer'
            }}
          >Next →</button>
        </div>
      </div>
    </div>
  );
}
