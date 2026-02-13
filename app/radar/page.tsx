"use client";
import React from "react";
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

// 12 distinct team colors
const teamColors: Record<string, string> = {
  "Big Shooters": "#e74c3c", // Red
  "Bardown": "#3498db", // Blue
  "Gabe's Gangsters": "#2ecc71", // Green
  "Mark's Mafia": "#9b59b6", // Purple
  "Cam's Crunch": "#f39c12", // Orange
  "Ice Holes": "#1abc9c", // Teal
  "Cross's Beavers": "#e67e22", // Dark Orange
  "Todd's Hitmen": "#34495e", // Dark Blue Gray
  "Owen's Otters": "#f1c40f", // Yellow
  "Johnny's Scrubbers": "#8e44ad", // Dark Purple
  "Gators": "#27ae60", // Dark Green
  "Willy's Warlocks": "#c0392b", // Dark Red
};

const categoryLabels = [
  { key: "goals", label: "Goals" },
  { key: "assists", label: "Assists" },
  { key: "plus_minus", label: "+/-" },
  { key: "pim", label: "PIM" },
  { key: "goalie_wins", label: "Wins" },
  { key: "save_pct", label: "SV%" },
];

// Radar Chart Component
function RadarChart({ team, rankings, color }: { 
  team: string; 
  rankings: Record<string, number>; 
  color: string; 
}) {
  const size = 200;
  const center = size / 2;
  const maxRadius = 70;
  
  // Calculate positions for hexagon vertices
  const getVertex = (index: number, radius: number) => {
    // Start from top and go clockwise
    const angle = (index * 60 - 90) * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };

  // Convert rank to radius (rank 1 = outermost, rank 12 = innermost)
  const rankToRadius = (rank: number) => {
    return maxRadius * (13 - rank) / 12;
  };

  // Create polygon points for team performance
  const polygonPoints = categoryLabels.map((cat, index) => {
    const rank = rankings[cat.key] || 12;
    const radius = rankToRadius(rank);
    const vertex = getVertex(index, radius);
    return `${vertex.x},${vertex.y}`;
  }).join(' ');

  // Grid circles (ranks 2, 4, 6, 8, 10, 12)
  const gridCircles = [2, 4, 6, 8, 10, 12].map(rank => (
    <circle
      key={rank}
      cx={center}
      cy={center}
      r={rankToRadius(rank)}
      fill="none"
      stroke="rgba(37, 99, 235, 0.1)"
      strokeWidth="1"
    />
  ));

  // Axis lines
  const axisLines = categoryLabels.map((cat, index) => {
    const endpoint = getVertex(index, maxRadius);
    return (
      <line
        key={cat.key}
        x1={center}
        y1={center}
        x2={endpoint.x}
        y2={endpoint.y}
        stroke="rgba(37, 99, 235, 0.15)"
        strokeWidth="1"
      />
    );
  });

  // Axis labels
  const axisLabels = categoryLabels.map((cat, index) => {
    const labelPoint = getVertex(index, maxRadius + 15);
    const rank = rankings[cat.key] || 12;
    return (
      <g key={cat.key}>
        <text
          x={labelPoint.x}
          y={labelPoint.y - 5}
          textAnchor="middle"
          fontSize="9"
          fontWeight="600"
          fill="var(--text-secondary)"
        >
          {cat.label}
        </text>
        <text
          x={labelPoint.x}
          y={labelPoint.y + 7}
          textAnchor="middle"
          fontSize="8"
          fill="var(--text-muted)"
        >
          #{rank}
        </text>
      </g>
    );
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid circles */}
        {gridCircles}
        
        {/* Axis lines */}
        {axisLines}
        
        {/* Team performance polygon */}
        <polygon
          points={polygonPoints}
          fill={color}
          fillOpacity="0.3"
          stroke={color}
          strokeWidth="2"
          strokeOpacity="0.8"
        />
        
        {/* Data points */}
        {categoryLabels.map((cat, index) => {
          const rank = rankings[cat.key] || 12;
          const radius = rankToRadius(rank);
          const point = getVertex(index, radius);
          return (
            <circle
              key={cat.key}
              cx={point.x}
              cy={point.y}
              r="3"
              fill={color}
              stroke="white"
              strokeWidth="1.5"
            />
          );
        })}
        
        {/* Axis labels */}
        {axisLabels}
      </svg>
    </div>
  );
}

export default function RadarPage() {
  const standings = data.standings as Array<{
    team: string;
    rank: number;
    total_roto_points: number;
    categories: Record<string, { value: number; roto_points: number; rank: number; qualified?: boolean }>;
  }>;

  return (
    <div>
      {/* Back link */}
      <div className="mb-5">
        <a 
          href="/wally-cup-olympics/" 
          className="inline-flex items-center gap-2 text-sm font-semibold no-underline hover:underline back-link-mobile" 
          style={{ color: 'var(--accent-blue)' }}
        >
          ← Back to Standings
        </a>
      </div>

      {/* Page header */}
      <div className="mb-6 section-header-mobile">
        <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Team Radar Charts
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          Spider charts showing each team's rotisserie ranking across all 6 categories.
          <br />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Outermost ring = 1st place, center = 12th place
          </span>
        </p>
      </div>

      {/* Team radar chart grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
        {standings.map(team => {
          const logoSrc = teamLogos[team.team];
          const color = teamColors[team.team] || "#2563eb";
          const rankings = team.categories;
          
          return (
            <div key={team.team} className="glass-card p-5 flex flex-col items-center glass-card-mobile">
              {/* Team header */}
              <div className="flex items-center gap-3 mb-4">
                {logoSrc ? (
                  <img 
                    src={logoSrc} 
                    alt={team.team} 
                    className="w-8 h-8 rounded-md object-contain" 
                  />
                ) : (
                  <span 
                    className="w-8 h-8 rounded-md flex items-center justify-center text-sm" 
                    style={{ background: 'rgba(37, 99, 235, 0.1)' }}
                  >
                    🏒
                  </span>
                )}
                <div className="text-center">
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {team.team}
                  </h3>
                  <div className="flex items-center gap-2 justify-center mt-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" 
                          style={{ 
                            background: 'rgba(37, 99, 235, 0.1)', 
                            color: 'var(--accent-blue)' 
                          }}>
                      #{team.rank}
                    </span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {team.total_roto_points} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Radar chart */}
              <RadarChart 
                team={team.team}
                rankings={Object.fromEntries(
                  Object.entries(rankings).map(([key, value]) => [key, value.rank])
                )}
                color={color}
              />

              {/* Category rankings summary */}
              <div className="mt-4 w-full">
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {categoryLabels.map(cat => {
                    const categoryData = rankings[cat.key];
                    const rank = categoryData?.rank || 12;
                    const rotoPoints = categoryData?.roto_points || 0;
                    
                    return (
                      <div key={cat.key} className="flex justify-between items-center py-1">
                        <span style={{ color: 'var(--text-muted)' }}>{cat.label}:</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          #{rank} ({rotoPoints}pts)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="glass-card p-4 glass-card-mobile">
        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          How to Read the Charts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <div>
            <span className="font-semibold">Shape:</span> Each team's polygon shows their performance profile across all 6 categories.
          </div>
          <div>
            <span className="font-semibold">Distance from center:</span> Closer to edge = better ranking (1st place is outermost ring).
          </div>
          <div>
            <span className="font-semibold">Larger areas:</span> Indicate more consistent performance across categories.
          </div>
          <div>
            <span className="font-semibold">Sharp spikes:</span> Show categories where a team excels relative to their other stats.
          </div>
        </div>
      </div>
    </div>
  );
}