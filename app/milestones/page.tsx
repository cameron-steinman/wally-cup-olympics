"use client";
import { useState } from "react";
import milestonesData from "../data/milestones.json";

const typeConfig: Record<string, { label: string; color: string }> = {
  hat_trick: { label: "Hat Trick", color: "#ffd700" },
  multi_point: { label: "Multi-Point Game", color: "#60a5fa" },
  goal_milestone: { label: "Goal Milestone", color: "#34d399" },
  ranking_change: { label: "Standings Move", color: "#f97316" },
  shutout: { label: "Shutout", color: "#a78bfa" },
  new_leader: { label: "New Leader", color: "#f59e0b" },
  big_game: { label: "Big Game", color: "#ec4899" },
};

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

function Flag({ code, size = 16 }: { code: string; size?: number }) {
  const iso = flagIso2[code];
  if (!iso) return <span>{code}</span>;
  return (
    <img src={`https://flagcdn.com/w40/${iso}.png`} srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
      alt={code} width={size} height={Math.round(size * 0.75)}
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }} />
  );
}

type Milestone = {
  id: string; type: string; timestamp: string;
  player?: string; team?: string; country?: string;
  description: string; icon: string; value?: number;
  wally_team?: string;
};

const PAGE_SIZE = 20;

export default function MilestonesPage() {
  const milestones: Milestone[] = (milestonesData as any).milestones || [];
  const sorted = [...milestones].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const [page, setPage] = useState(0);
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Get unique Wally teams from milestones
  const wallyTeams = Array.from(new Set(
    sorted.map(m => m.team || m.wally_team).filter(Boolean)
  )).sort() as string[];

  // Filter by team
  const filtered = teamFilter === 'all'
    ? sorted
    : sorted.filter(m => (m.team || m.wally_team) === teamFilter);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when filter changes
  const handleFilterChange = (team: string) => {
    setTeamFilter(team);
    setPage(0);
  };

  return (
    <div>
      {/* Page title */}
      <div className="mb-4">
        <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Milestones
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Notable achievements throughout the tournament · Newest first
        </p>
      </div>

      {/* Team filter */}
      {wallyTeams.length > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Filter:</span>
          <button
            onClick={() => handleFilterChange('all')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg"
            style={{
              background: teamFilter === 'all' ? 'var(--accent-blue)' : 'var(--bg-card)',
              color: teamFilter === 'all' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            All Teams
          </button>
          {wallyTeams.map(team => {
            const logo = teamLogos[team];
            return (
              <button
                key={team}
                onClick={() => handleFilterChange(team)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1"
                style={{
                  background: teamFilter === team ? 'var(--accent-blue)' : 'var(--bg-card)',
                  color: teamFilter === team ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                {logo && <img src={logo} alt="" className="w-3.5 h-3.5 rounded-sm object-contain" />}
                {team}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            {teamFilter === 'all' ? 'No milestones yet — check back as the tournament progresses.' : `No milestones for ${teamFilter} yet.`}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {visible.map((m) => {
              const cfg = typeConfig[m.type] || { label: m.type, color: "#888" };
              const wallyTeam = m.team || m.wally_team;
              const logo = wallyTeam ? teamLogos[wallyTeam] : null;
              return (
                <div key={m.id} className="glass-card p-4 flex items-start gap-4">
                  <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ background: `${cfg.color}22` }}>
                    {m.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${cfg.color}33`, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      {m.player && (
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {m.country && <Flag code={m.country} />}{' '}{m.player}
                        </span>
                      )}
                      {wallyTeam && (
                        <a href={`/wally-cup-olympics/team/${wallyTeam.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                          className="flex items-center gap-1 no-underline hover:underline">
                          {logo && <img src={logo} alt="" className="w-4 h-4 rounded-sm object-contain" />}
                          <span className="text-xs font-medium" style={{ color: 'var(--accent-blue)' }}>{wallyTeam}</span>
                        </a>
                      )}
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {m.description}
                    </p>
                  </div>
                  <div className="text-xs flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(m.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1.5 text-sm font-medium rounded-lg"
                style={{ background: page === 0 ? 'var(--bg-card)' : 'var(--accent-blue)', color: page === 0 ? 'var(--text-muted)' : '#fff', cursor: page === 0 ? 'default' : 'pointer', border: '1px solid var(--border)' }}>
                ← Prev
              </button>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Page {page + 1} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg"
                style={{ background: page >= totalPages - 1 ? 'var(--bg-card)' : 'var(--accent-blue)', color: page >= totalPages - 1 ? 'var(--text-muted)' : '#fff', cursor: page >= totalPages - 1 ? 'default' : 'pointer', border: '1px solid var(--border)' }}>
                Next →
              </button>
            </div>
          )}

          <div className="mt-4 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
            {filtered.length} milestone{filtered.length !== 1 ? 's' : ''}{teamFilter !== 'all' ? ` for ${teamFilter}` : ' total'}
          </div>
        </>
      )}
    </div>
  );
}
