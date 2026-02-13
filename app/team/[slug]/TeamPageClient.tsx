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
                  >
                    Name
                  </th>
                 </tr>
              </thead>
              <tbody>
                {skaters.map((p, idx) => {
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
                </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Goalies Table */}
      <div>
        <h3 className="text-lg font-semibold">Goalies</h3>
       </div>
    </div>
  );
}