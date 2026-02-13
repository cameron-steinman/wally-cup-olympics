"use client";
import data from "./data/standings.json";

const medalClasses: Record<number, string> = {
  1: "medal-badge medal-gold",
  2: "medal-badge medal-silver",
  3: "medal-badge medal-bronze",
};

function teamSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function CategoryHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <th className="px-3 py-4 text-center text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
      <div className="font-bold" style={{ color: 'var(--text-secondary)' }}>{label}</div>
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
      <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        {displayVal}
        {unqualified && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-red)', verticalAlign: 'middle' }} title="Not qualified (<20 SA)" />}
      </div>
      <div className="cat-rank mt-1 inline-flex">
        <span>{rotoPoints} pts</span>
        <span style={{ color: 'var(--border)' }}>·</span>
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

  const updated = new Date(data.updated_at).toLocaleString('en-US', {
    timeZone: 'America/Toronto',
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
  });

  return (
    <div>
      {/* Stats summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass-card px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Teams</div>
          <div className="text-2xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>12</div>
        </div>
        <div className="glass-card px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Categories</div>
          <div className="text-2xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>6</div>
        </div>
        <div className="glass-card px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Last Updated</div>
          <div className="text-sm font-semibold mt-1.5" style={{ color: 'var(--text-primary)' }}>{updated}</div>
        </div>
      </div>

      {/* Section header */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Standings</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Rotisserie scoring across 6 categories
          </p>
        </div>
      </div>

      {/* Standings table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: 'rgba(99, 102, 241, 0.04)' }}>
                <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-wider w-14" style={{ color: 'var(--text-muted)' }}>Rank</th>
                <th className="px-3 py-4 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Team</th>
                <CategoryHeader label="G" sub="Goals" />
                <CategoryHeader label="A" sub="Assists" />
                <CategoryHeader label="+/−" sub="Plus/Minus" />
                <CategoryHeader label="PIM" sub="Penalties" />
                <CategoryHeader label="W" sub="Goalie Wins" />
                <CategoryHeader label="SV%" sub="Save %" />
                <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--gradient-start)' }}>
                  <div>PTS</div>
                  <div className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Total</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, idx) => {
                const medalClass = medalClasses[s.rank];
                const isTop3 = s.rank <= 3;

                return (
                  <tr
                    key={s.team}
                    className="table-row-hover"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isTop3 ? 'rgba(99, 102, 241, 0.02)' : 'transparent',
                    }}
                  >
                    <td className="px-4 py-4">
                      {medalClass ? (
                        <span className={medalClass}>{s.rank}</span>
                      ) : (
                        <span className="text-sm font-bold pl-1.5" style={{ color: 'var(--text-muted)' }}>{s.rank}</span>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <a href={`/wally-cup-olympics/team/${teamSlug(s.team)}`} className="text-sm font-bold no-underline hover:underline" style={{ color: 'var(--accent-blue)' }}>
                        {s.team}
                      </a>
                    </td>
                    <CategoryCell value={s.categories.goals.value} rotoPoints={s.categories.goals.roto_points} rank={s.categories.goals.rank} />
                    <CategoryCell value={s.categories.assists.value} rotoPoints={s.categories.assists.roto_points} rank={s.categories.assists.rank} />
                    <CategoryCell value={s.categories.plus_minus.value} rotoPoints={s.categories.plus_minus.roto_points} rank={s.categories.plus_minus.rank} />
                    <CategoryCell value={s.categories.pim.value} rotoPoints={s.categories.pim.roto_points} rank={s.categories.pim.rank} />
                    <CategoryCell value={s.categories.goalie_wins.value} rotoPoints={s.categories.goalie_wins.roto_points} rank={s.categories.goalie_wins.rank} />
                    <CategoryCell value={s.categories.save_pct.value} rotoPoints={s.categories.save_pct.roto_points} rank={s.categories.save_pct.rank} isSavePct qualified={s.categories.save_pct.qualified} />
                    <td className="px-5 py-4 text-center">
                      <span className="points-pill" style={isTop3 ? { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))' } : {}}>
                        {s.total_roto_points}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer legend */}
      <div className="mt-5 flex gap-6 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-red)' }} />
          Save % not qualified (&lt;20 SA)
        </span>
        <span>Roto: 12 pts for 1st, 1 pt for 12th. Ties split evenly.</span>
      </div>
    </div>
  );
}
