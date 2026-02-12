"use client";
import data from "./data/standings.json";

const flagMap: Record<string, string> = {
  CAN:"🇨🇦",USA:"🇺🇸",SWE:"🇸🇪",FIN:"🇫🇮",CZE:"🇨🇿",SUI:"🇨🇭",GER:"🇩🇪",SVK:"🇸🇰",DEN:"🇩🇰",LAT:"🇱🇻",ITA:"🇮🇹",FRA:"🇫🇷"
};

const medalColors: Record<number, string> = {
  1: "var(--accent-gold)",
  2: "var(--accent-silver)",
  3: "var(--accent-bronze)",
};

const medalEmoji: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

function teamSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function CategoryHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
      <div>{label}</div>
      {sub && <div className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </th>
  );
}

function CategoryCell({ value, rotoPoints, rank, qualified, isSavePct }: {
  value: number; rotoPoints: number; rank: number; qualified?: boolean; isSavePct?: boolean;
}) {
  const displayVal = isSavePct ? (value > 0 ? value.toFixed(3).replace(/^0/, '') : '-') : value;
  const unqualified = isSavePct && qualified === false;

  return (
    <td className="px-3 py-3 text-center">
      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        {displayVal}
        {unqualified && <span className="ml-1 inline-block w-2 h-2 rounded-full" style={{ background: 'var(--accent-red)', verticalAlign: 'middle' }} title="Not qualified (<20 SA)" />}
      </div>
      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        {rotoPoints} pts · #{rank}
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Standings</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Rotisserie scoring · 6 categories · 12 teams
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Last updated</div>
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{updated}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider w-8" style={{ color: 'var(--text-secondary)' }}>#</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Team</th>
              <CategoryHeader label="G" sub="Goals" />
              <CategoryHeader label="A" sub="Assists" />
              <CategoryHeader label="+/-" sub="Plus/Minus" />
              <CategoryHeader label="PIM" sub="Penalties" />
              <CategoryHeader label="W" sub="Goalie Wins" />
              <CategoryHeader label="SV%" sub="Save %" />
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-blue)' }}>
                <div>PTS</div>
                <div className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>Total</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, idx) => {
              const medal = medalEmoji[s.rank];
              const medalColor = medalColors[s.rank];
              return (
                <tr
                  key={s.team}
                  className="transition-colors"
                  style={{
                    background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)',
                    borderBottom: '1px solid var(--border)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)')}
                >
                  <td className="px-3 py-3 text-sm font-bold" style={{ color: medalColor || 'var(--text-secondary)' }}>
                    {medal || s.rank}
                  </td>
                  <td className="px-3 py-3">
                    <a href={`/team/${teamSlug(s.team)}`} className="text-sm font-semibold no-underline hover:underline" style={{ color: 'var(--accent-blue)' }}>
                      {s.team}
                    </a>
                  </td>
                  <CategoryCell value={s.categories.goals.value} rotoPoints={s.categories.goals.roto_points} rank={s.categories.goals.rank} />
                  <CategoryCell value={s.categories.assists.value} rotoPoints={s.categories.assists.roto_points} rank={s.categories.assists.rank} />
                  <CategoryCell value={s.categories.plus_minus.value} rotoPoints={s.categories.plus_minus.roto_points} rank={s.categories.plus_minus.rank} />
                  <CategoryCell value={s.categories.pim.value} rotoPoints={s.categories.pim.roto_points} rank={s.categories.pim.rank} />
                  <CategoryCell value={s.categories.goalie_wins.value} rotoPoints={s.categories.goalie_wins.roto_points} rank={s.categories.goalie_wins.rank} />
                  <CategoryCell value={s.categories.save_pct.value} rotoPoints={s.categories.save_pct.roto_points} rank={s.categories.save_pct.rank} isSavePct qualified={s.categories.save_pct.qualified} />
                  <td className="px-4 py-3 text-center">
                    <span className="text-lg font-bold" style={{ color: medalColor || 'var(--text-primary)' }}>
                      {s.total_roto_points}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: 'var(--accent-red)' }} /> Save % not qualified (&lt;20 SA)</span>
        <span>Roto: 12 pts for 1st, 1 pt for 12th. Ties split evenly.</span>
      </div>
    </div>
  );
}
