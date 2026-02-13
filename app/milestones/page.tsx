"use client";
import milestonesData from "../data/milestones.json";

const typeConfig: Record<string, { label: string; color: string }> = {
  hat_trick: { label: "Hat Trick", color: "#ffd700" },
  multi_point: { label: "Multi-Point Game", color: "#60a5fa" },
  goal_milestone: { label: "Goal Milestone", color: "#34d399" },
  ranking_change: { label: "Standings Move", color: "#f97316" },
  shutout: { label: "Shutout", color: "#a78bfa" },
};

const flagMap: Record<string, string> = {
  CAN:"🇨🇦",USA:"🇺🇸",SWE:"🇸🇪",FIN:"🇫🇮",CZE:"🇨🇿",SUI:"🇨🇭",GER:"🇩🇪",SVK:"🇸🇰",DEN:"🇩🇰",LAT:"🇱🇻",ITA:"🇮🇹",FRA:"🇫🇷"
};

type Milestone = {
  id: string;
  type: string;
  timestamp: string;
  player?: string;
  team?: string;
  country?: string;
  description: string;
  icon: string;
  value?: number;
};

export default function MilestonesPage() {
  const milestones: Milestone[] = (milestonesData as any).milestones || [];

  const sorted = [...milestones].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Milestones
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Notable achievements during the tournament
        </p>
      </div>

      {sorted.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <p className="text-lg" style={{ color: "var(--text-muted)" }}>
            No milestones yet — check back as the tournament progresses!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((m) => {
            const cfg = typeConfig[m.type] || { label: m.type, color: "#888" };
            const flag = m.country ? flagMap[m.country] || "" : "";
            return (
              <div
                key={m.id}
                className="rounded-lg p-4 flex items-start gap-4 transition-colors"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{ background: `${cfg.color}22` }}
                >
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${cfg.color}33`, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    {m.player && (
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {flag} {m.player}
                      </span>
                    )}
                    {m.team && (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        · {m.team}
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    {m.description}
                  </p>
                </div>
                <div className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                  {new Date(m.timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
