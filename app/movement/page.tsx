'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SnapshotStanding {
  team: string;
  roto_points: number;
  rank: number;
}

interface Snapshot {
  date: string;
  standings: SnapshotStanding[];
}

interface StandingsData {
  updated_at: string;
  standings_history: Snapshot[];
}

const TEAM_COLORS: { [key: string]: string } = {
  "Big Shooters": "#ef4444",
  "Bardown": "#f97316", 
  "Gabe's Gangsters": "#a855f7",
  "Mark's Mafia": "#6b7280",
  "Cam's Crunch": "#3b82f6",
  "Ice Holes": "#06b6d4",
  "Cross's Beavers": "#f59e0b",
  "Todd's Hitmen": "#ec4899",
  "Owen's Otters": "#10b981", 
  "Johnny's Scrubbers": "#eab308",
  "Gators": "#059669",
  "Willy's Warlocks": "#8b5cf6"
};

export default function MovementPage() {
  const [data, setData] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'points' | 'rank'>('points');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/standings.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const standingsData: StandingsData = await response.json();
        setData(standingsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderChart = () => {
    if (!data || !data.standings_history || data.standings_history.length === 0) {
      return (
        <div className="text-center text-white py-12">
          <p className="text-xl">No historical data available yet.</p>
          <p className="text-gray-400 mt-2">Check back after more snapshots have been taken.</p>
        </div>
      );
    }

    const chartWidth = 800;
    const chartHeight = 500;
    const padding = { top: 40, right: 150, bottom: 60, left: 60 };

    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    const sortedSnapshots = [...data.standings_history].sort((a, b) => a.date.localeCompare(b.date));
    const teams = Object.keys(TEAM_COLORS);

    // Calculate scales
    const dateRange = sortedSnapshots.length > 1 ? sortedSnapshots.length - 1 : 1;
    
    let yDomain: [number, number];
    let getYValue: (standing: SnapshotStanding) => number;
    
    if (viewMode === 'points') {
      const allPoints = sortedSnapshots.flatMap(s => s.standings.map(st => st.roto_points));
      const minPoints = Math.min(...allPoints);
      const maxPoints = Math.max(...allPoints);
      const padding = (maxPoints - minPoints) * 0.1;
      yDomain = [Math.max(0, minPoints - padding), maxPoints + padding];
      getYValue = (standing: SnapshotStanding) => standing.roto_points;
    } else {
      yDomain = [12, 1]; // Inverted for rank (1st place at top)
      getYValue = (standing: SnapshotStanding) => standing.rank;
    }

    const getXPos = (index: number) => (index / dateRange) * plotWidth;
    const getYPos = (value: number) => {
      const ratio = (value - yDomain[0]) / (yDomain[1] - yDomain[0]);
      return plotHeight - (ratio * plotHeight);
    };

    // Generate grid lines
    const yGridLines = [];
    const numYLines = viewMode === 'points' ? 8 : 12;
    for (let i = 0; i <= numYLines; i++) {
      const value = yDomain[0] + (i / numYLines) * (yDomain[1] - yDomain[0]);
      const y = getYPos(value);
      yGridLines.push(
        <line
          key={i}
          x1={0}
          y1={y}
          x2={plotWidth}
          y2={y}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      );
    }

    const xGridLines = [];
    for (let i = 0; i < sortedSnapshots.length; i++) {
      const x = getXPos(i);
      xGridLines.push(
        <line
          key={i}
          x1={x}
          y1={0}
          x2={x}
          y2={plotHeight}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      );
    }

    return (
      <div className="w-full overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="bg-black/20 rounded-xl">
          <defs>
            {teams.map(team => (
              <linearGradient key={team} id={`gradient-${team.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={TEAM_COLORS[team]} stopOpacity="0.8" />
                <stop offset="100%" stopColor={TEAM_COLORS[team]} stopOpacity="0.3" />
              </linearGradient>
            ))}
          </defs>
          
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Grid lines */}
            <g opacity="0.3">
              {yGridLines}
              {xGridLines}
            </g>
            
            {/* Y-axis labels */}
            <g>
              {Array.from({ length: (viewMode === 'points' ? 9 : 13) }, (_, i) => {
                const value = yDomain[0] + (i / (viewMode === 'points' ? 8 : 12)) * (yDomain[1] - yDomain[0]);
                const y = getYPos(value);
                const displayValue = viewMode === 'points' ? value.toFixed(1) : Math.round(value);
                return (
                  <text
                    key={i}
                    x={-10}
                    y={y + 5}
                    fill="white"
                    textAnchor="end"
                    fontSize="12"
                    opacity="0.7"
                  >
                    {displayValue}
                  </text>
                );
              })}
            </g>

            {/* X-axis labels */}
            <g>
              {sortedSnapshots.map((snapshot, i) => {
                const x = getXPos(i);
                return (
                  <text
                    key={i}
                    x={x}
                    y={plotHeight + 20}
                    fill="white"
                    textAnchor="middle"
                    fontSize="11"
                    opacity="0.7"
                  >
                    {snapshot.date.slice(5)} {/* MM-DD */}
                  </text>
                );
              })}
            </g>

            {/* Team lines */}
            {teams.map(team => {
              const teamData = sortedSnapshots.map((snapshot, i) => {
                const teamStanding = snapshot.standings.find(s => s.team === team);
                if (!teamStanding) return null;
                return {
                  x: getXPos(i),
                  y: getYPos(getYValue(teamStanding)),
                  value: getYValue(teamStanding)
                };
              }).filter(Boolean) as Array<{x: number, y: number, value: number}>;

              if (teamData.length < 2) return null;

              const pathD = teamData.map((point, i) => 
                i === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
              ).join(' ');

              return (
                <g key={team}>
                  {/* Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={TEAM_COLORS[team]}
                    strokeWidth="2.5"
                    opacity="0.8"
                  />
                  
                  {/* Points */}
                  {teamData.map((point, i) => (
                    <circle
                      key={i}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill={TEAM_COLORS[team]}
                      stroke="white"
                      strokeWidth="1"
                      opacity="0.9"
                    />
                  ))}
                </g>
              );
            })}

            {/* Y-axis title */}
            <text
              x={-40}
              y={plotHeight / 2}
              fill="white"
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              transform={`rotate(-90, -40, ${plotHeight / 2})`}
            >
              {viewMode === 'points' ? 'Roto Points' : 'Rank Position'}
            </text>

            {/* X-axis title */}
            <text
              x={plotWidth / 2}
              y={plotHeight + 45}
              fill="white"
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
            >
              Date
            </text>
          </g>

          {/* Legend */}
          <g transform={`translate(${chartWidth - padding.right + 20}, ${padding.top})`}>
            {teams.map((team, i) => (
              <g key={team} transform={`translate(0, ${i * 25})`}>
                <rect
                  width="20"
                  height="3"
                  fill={TEAM_COLORS[team]}
                  y="8"
                />
                <text
                  x="25"
                  y="12"
                  fill="white"
                  fontSize="11"
                  opacity="0.9"
                >
                  {team}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-xl">Loading movement data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Error Loading Data</h1>
            <p className="text-xl text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-blue-400 hover:text-blue-300 font-semibold mb-4 inline-block">
              ← Back to Standings
            </Link>
            <h1 className="text-5xl font-bold text-white">Standings Movement</h1>
            <p className="text-xl text-gray-300 mt-2">Track team performance over time</p>
          </div>
        </div>

        {/* Main Chart Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl p-8">
          {/* Toggle Controls */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">Team Movement Chart</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('points')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  viewMode === 'points' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Points
              </button>
              <button
                onClick={() => setViewMode('rank')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  viewMode === 'rank' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Rank
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="flex justify-center">
            {renderChart()}
          </div>

          {/* Chart Info */}
          <div className="mt-6 text-sm text-gray-400 text-center">
            <p>
              {viewMode === 'points'
                ? 'Higher points are better. Shows total rotisserie points over time.' 
                : 'Lower rank numbers are better (1st place at top). Shows ranking position over time.'
              }
            </p>
            {data?.updated_at && (
              <p className="mt-2">
                Last Updated: {new Date(data.updated_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}