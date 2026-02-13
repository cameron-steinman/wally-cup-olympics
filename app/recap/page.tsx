"use client";
import { useState } from "react";
import data from "../data/standings.json";

// Team logos — path relative to public/
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

function Flag({ code, size = 20 }: { code: string; size?: number }) {
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

function GameCard({ game }: { game: any }) {
  return (
    <div className="glass-card p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flag code={game.away.code} size={24} />
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {game.away.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {game.away.score}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {game.home.score}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {game.home.name}
          </span>
          <Flag code={game.home.code} size={24} />
        </div>
      </div>
    </div>
  );
}

function TopPerformerCard({ performer }: { performer: any }) {
  const logoSrc = performer.wally_team ? teamLogos[performer.wally_team] : null;
  
  // Format stats display
  let statsDisplay = "";
  if (performer.pos === "G") {
    const wins = performer.stats.wins || 0;
    const saves = performer.stats.saves || 0;
    const sa = performer.stats.shots_against || 0;
    const svPct = sa > 0 ? (saves / sa * 100).toFixed(1) + "%" : "0.0%";
    statsDisplay = `${wins}W, ${saves}SV (${svPct})`;
  } else {
    const goals = performer.stats.goals || 0;
    const assists = performer.stats.assists || 0;
    const plusMinus = performer.stats.plus_minus || 0;
    const pim = performer.stats.pim || 0;
    
    let parts = [];
    if (goals > 0) parts.push(`${goals}G`);
    if (assists > 0) parts.push(`${assists}A`);
    if (plusMinus !== 0) parts.push(`${plusMinus > 0 ? '+' : ''}${plusMinus}`);
    if (pim > 0) parts.push(`${pim}PIM`);
    
    statsDisplay = parts.join(', ') || "0 pts";
  }

  return (
    <div className="glass-card p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Flag code={performer.country} size={20} />
          <div>
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {performer.name}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {performer.pos} • {(data as any).country_names?.[performer.country] || performer.country}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg" style={{ color: 'var(--accent-blue)' }}>
            {performer.fantasy_points.toFixed(1)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            fantasy pts
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {statsDisplay}
        </div>
        {performer.wally_team && (
          <div className="flex items-center gap-2">
            {logoSrc && (
              <img src={logoSrc} alt={performer.wally_team} className="w-5 h-5 rounded object-contain" />
            )}
            <span className="text-xs font-semibold" style={{ color: 'var(--accent-blue)' }}>
              {performer.wally_team}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StandingsChangeCard({ change, type }: { change: any; type: 'riser' | 'faller' }) {
  const logoSrc = teamLogos[change.team];
  const isRiser = type === 'riser';
  const moveText = isRiser ? 
    `↗ +${change.rank_change} ${change.rank_change === 1 ? 'spot' : 'spots'}` : 
    `↘ ${change.rank_change} ${Math.abs(change.rank_change) === 1 ? 'spot' : 'spots'}`;
  
  return (
    <div className="glass-card p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {logoSrc && (
            <img src={logoSrc} alt={change.team} className="w-6 h-6 rounded object-contain" />
          )}
          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {change.team}
          </div>
        </div>
        <div className="text-right">
          <div className={`font-bold ${isRiser ? 'text-green-500' : 'text-red-500'}`}>
            {moveText}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            #{change.previous_rank} → #{change.current_rank}
          </div>
        </div>
      </div>
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {change.previous_roto} → {change.current_roto} roto pts
        <span style={{ color: isRiser ? 'var(--accent-green)' : 'var(--accent-red)' }}>
          ({isRiser ? '+' : ''}{change.roto_change})
        </span>
      </div>
    </div>
  );
}

export default function RecapPage() {
  // Get daily recaps from data
  const dailyRecaps = (data as any).daily_recaps || {};
  const availableDates = Object.keys(dailyRecaps).sort().reverse(); // Most recent first
  
  // State for selected date
  const [selectedDate, setSelectedDate] = useState(availableDates[0] || '');
  
  // Get the selected recap
  const currentRecap = dailyRecaps[selectedDate];
  
  if (!currentRecap) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
              Daily Recap
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Daily summaries of Olympic hockey action and Wally Cup movement
            </p>
          </div>
          
          <div className="glass-card p-8 text-center rounded-xl">
            <div className="text-6xl mb-4">📰</div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No Recaps Available
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Daily recaps will appear here after games are completed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
              Daily Recap
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Daily summaries of Olympic hockey action and Wally Cup movement
            </p>
            <div className="mt-2">
              <a href="/wally-cup-olympics/" className="text-sm font-semibold no-underline hover:underline" style={{ color: 'var(--accent-blue)' }}>
                ← Back to Standings
              </a>
            </div>
          </div>
          
          {/* Date Selector */}
          {availableDates.length > 1 && (
            <div>
              <label htmlFor="date-select" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                Select Date
              </label>
              <select
                id="date-select"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="glass-card px-3 py-2 rounded-lg border text-sm font-medium"
                style={{ 
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--glass-bg)'
                }}
              >
                {availableDates.map(date => (
                  <option key={date} value={date}>
                    {formatDate(date)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Recap Summary */}
        <div className="glass-card p-6 rounded-xl mb-8" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <div className="flex items-start gap-4 mb-4">
            <div className="text-4xl">📰</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {formatDate(selectedDate)}
              </h2>
              <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {currentRecap.recap_text}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8">
          {/* Games Section */}
          {currentRecap.games && currentRecap.games.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                🏒 Games ({currentRecap.games.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentRecap.games.map((game: any, idx: number) => (
                  <GameCard key={game.id || idx} game={game} />
                ))}
              </div>
            </section>
          )}

          {/* Top Performers Section */}
          {currentRecap.top_performers && currentRecap.top_performers.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                ⭐ Top Performers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentRecap.top_performers.slice(0, 9).map((performer: any, idx: number) => (
                  <TopPerformerCard key={`${performer.name}-${idx}`} performer={performer} />
                ))}
              </div>
            </section>
          )}

          {/* Standings Movement Section */}
          {currentRecap.standings_changes && (currentRecap.standings_changes.risers?.length > 0 || currentRecap.standings_changes.fallers?.length > 0) && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                📊 Standings Movement
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risers */}
                {currentRecap.standings_changes.risers?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-green-500 flex items-center gap-2">
                      📈 Biggest Risers
                    </h3>
                    <div className="space-y-3">
                      {currentRecap.standings_changes.risers.map((change: any, idx: number) => (
                        <StandingsChangeCard key={`riser-${idx}`} change={change} type="riser" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallers */}
                {currentRecap.standings_changes.fallers?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-red-500 flex items-center gap-2">
                      📉 Biggest Fallers
                    </h3>
                    <div className="space-y-3">
                      {currentRecap.standings_changes.fallers.map((change: any, idx: number) => (
                        <StandingsChangeCard key={`faller-${idx}`} change={change} type="faller" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Milestones Section */}
          {currentRecap.milestones && currentRecap.milestones.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                🏆 Milestones
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentRecap.milestones.map((milestone: any, idx: number) => (
                  <div key={idx} className="glass-card p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🏆</div>
                      <div>
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {milestone.title}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {milestone.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}