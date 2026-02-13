"use client";
import { useState } from "react";
import data from "../data/standings.json";

const flagIso2: Record<string, string> = {
  CAN:"ca",USA:"us",SWE:"se",FIN:"fi",CZE:"cz",SUI:"ch",GER:"de",SVK:"sk",DEN:"dk",LAT:"lv",ITA:"it",FRA:"fr"
};

function Flag({ code, size = 24 }: { code: string; size?: number }) {
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

// Olympic tournament groups
const groups = {
  A: ["CAN", "SWE", "SUI", "LAT", "DEN", "FRA"],
  B: ["USA", "FIN", "CZE", "GER", "SVK", "ITA"]
};

interface PlayerStats {
  gp: number;
  goals: number;
  assists: number;
  plus_minus: number;
  pim: number;
  wins: number;
  saves: number;
  shots_against: number;
}

interface CountryData {
  code: string;
  name: string;
  playerCount: number;
  totalStats: PlayerStats;
  players: Array<{
    name: string;
    pos: string;
    wally_team: string;
    stats: PlayerStats;
  }>;
}

// Tournament structure
const tournamentStructure = {
  groupStage: { name: "Group Stage", teams: 12 },
  quarterfinals: { name: "Quarterfinals", teams: 8 },
  semifinals: { name: "Semifinals", teams: 4 },
  finals: { name: "Gold Medal Game", teams: 2 },
  bronze: { name: "Bronze Medal Game", teams: 2 }
};

const countryNames: Record<string, string> = {
  CAN: "Canada",
  USA: "United States", 
  SWE: "Sweden",
  FIN: "Finland",
  CZE: "Czechia",
  SUI: "Switzerland",
  GER: "Germany",
  SVK: "Slovakia",
  DEN: "Denmark",
  LAT: "Latvia",
  ITA: "Italy",
  FRA: "France"
};

export default function BracketPage() {
  // Process all Olympic players data
  const allOlympicPlayers = (data as any).all_olympic_players || [];
  
  // Group players by country
  const countryData: Record<string, CountryData> = {};
  
  // Initialize all countries (even if no Wally players)
  Object.keys(countryNames).forEach(code => {
    countryData[code] = {
      code,
      name: countryNames[code] || code,
      playerCount: 0,
      totalStats: { gp: 0, goals: 0, assists: 0, plus_minus: 0, pim: 0, wins: 0, saves: 0, shots_against: 0 },
      players: []
    };
  });

  allOlympicPlayers.forEach((player: any) => {
    const country = player.country;
    if (!country || !countryData[country]) return;
    
    // Only count players on active Wally Cup teams
    if (!player.wally_team) return;
    
    const stats = player.stats || {};
    countryData[country].playerCount++;
    countryData[country].totalStats.gp += stats.gp || 0;
    countryData[country].totalStats.goals += stats.goals || 0;
    countryData[country].totalStats.assists += stats.assists || 0;
    countryData[country].totalStats.plus_minus += stats.plus_minus || 0;
    countryData[country].totalStats.pim += stats.pim || 0;
    countryData[country].totalStats.wins += stats.wins || 0;
    countryData[country].totalStats.saves += stats.saves || 0;
    countryData[country].totalStats.shots_against += stats.shots_against || 0;
    
    countryData[country].players.push({
      name: player.name,
      pos: player.pos,
      wally_team: player.wally_team,
      stats: stats
    });
  });

  // Get country status for elimination tracking
  const countryStatus = (data as any).country_status || {};
  const eliminatedCountries = new Set(
    Object.entries(countryStatus)
      .filter(([_, v]: [string, any]) => v.status === 'eliminated')
      .map(([k]) => k)
  );

  function CountryCard({ code, group }: { code: string; group?: string }) {
    const country = countryData[code];
    const isEliminated = eliminatedCountries.has(code);
    
    if (!country) {
      return (
        <div className={`glass-card p-4 text-center ${isEliminated ? 'opacity-50' : ''}`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flag code={code} size={32} />
            <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              {countryNames[code] || code}
            </div>
          </div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No Wally players
          </div>
        </div>
      );
    }

    return (
      <div className={`glass-card p-4 text-center ${isEliminated ? 'opacity-50' : ''}`} 
           style={{ borderLeft: isEliminated ? '3px solid var(--text-muted)' : '3px solid var(--accent-blue)' }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Flag code={code} size={32} />
          <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            {country.name}
          </div>
        </div>
        
        <div className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-blue)' }}>
          {country.playerCount} Wally Player{country.playerCount !== 1 ? 's' : ''}
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{country.totalStats.goals}</div>
            <div style={{ color: 'var(--text-muted)' }}>G</div>
          </div>
          <div>
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{country.totalStats.assists}</div>
            <div style={{ color: 'var(--text-muted)' }}>A</div>
          </div>
          <div>
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{country.totalStats.plus_minus > 0 ? '+' : ''}{country.totalStats.plus_minus}</div>
            <div style={{ color: 'var(--text-muted)' }}>+/-</div>
          </div>
          <div>
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{country.totalStats.pim}</div>
            <div style={{ color: 'var(--text-muted)' }}>PIM</div>
          </div>
          <div>
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{country.totalStats.wins}</div>
            <div style={{ color: 'var(--text-muted)' }}>W</div>
          </div>
          <div>
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {country.totalStats.shots_against > 0 ? (country.totalStats.saves / country.totalStats.shots_against).toFixed(3).replace(/^0/, '') : '—'}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>SV%</div>
          </div>
        </div>
        
        {isEliminated && (
          <div className="mt-2 text-xs font-semibold" style={{ color: 'var(--accent-red)' }}>
            ELIMINATED
          </div>
        )}
      </div>
    );
  }

  function TournamentRound({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
      <div className="mb-8">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4">
          <a href="/wally-cup-olympics" className="text-sm font-semibold no-underline hover:underline back-link-mobile" style={{ color: 'var(--accent-blue)' }}>
            ← Back to Standings
          </a>
        </div>
        
        <div className="section-header-mobile">
          <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            🏆 Tournament Bracket
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Milan-Cortina 2026 Olympics • Men's Ice Hockey
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Showing Wally Cup player statistics for each participating country
          </p>
        </div>
      </div>

      {/* Group Stage */}
      <TournamentRound 
        title="Group Stage" 
        subtitle="Two groups of 6 teams each • Top 4 from each group advance"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Group A */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-center" 
                style={{ color: 'var(--accent-blue)' }}>
              Group A
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.A.map(code => (
                <CountryCard key={code} code={code} group="A" />
              ))}
            </div>
          </div>
          
          {/* Group B */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-center" 
                style={{ color: 'var(--accent-blue)' }}>
              Group B
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.B.map(code => (
                <CountryCard key={code} code={code} group="B" />
              ))}
            </div>
          </div>
        </div>
      </TournamentRound>

      {/* Knockout Stage Diagram */}
      <TournamentRound 
        title="Knockout Stage" 
        subtitle="Single elimination • Top 4 from each group advance"
      >
        <div className="glass-card p-6">
          <div className="text-center space-y-8">
            {/* Quarterfinals */}
            <div>
              <h5 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                Quarterfinals
              </h5>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                8 teams → 4 teams
              </div>
            </div>
            
            <div className="flex justify-center">
              <div style={{ 
                width: '2px', 
                height: '40px', 
                background: 'var(--border)' 
              }}></div>
            </div>
            
            {/* Semifinals */}
            <div>
              <h5 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                Semifinals
              </h5>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                4 teams → 2 teams advance to Gold Medal Game
                <br />
                2 teams advance to Bronze Medal Game
              </div>
            </div>
            
            <div className="flex justify-center gap-16">
              <div style={{ 
                width: '2px', 
                height: '40px', 
                background: 'var(--border)' 
              }}></div>
              <div style={{ 
                width: '2px', 
                height: '40px', 
                background: 'var(--border)' 
              }}></div>
            </div>
            
            {/* Finals */}
            <div className="flex justify-center gap-8">
              <div className="glass-card p-4 text-center" style={{ borderLeft: '3px solid var(--accent-gold)' }}>
                <h5 className="font-bold text-lg mb-2" style={{ color: 'var(--accent-gold)' }}>
                  🥇 Gold Medal Game
                </h5>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Championship Final
                </div>
              </div>
              
              <div className="glass-card p-4 text-center" style={{ borderLeft: '3px solid var(--accent-bronze)' }}>
                <h5 className="font-bold text-lg mb-2" style={{ color: 'var(--accent-bronze)' }}>
                  🥉 Bronze Medal Game
                </h5>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Third Place
                </div>
              </div>
            </div>
          </div>
        </div>
      </TournamentRound>

      {/* Tournament Summary */}
      <div className="glass-card p-6 mt-8">
        <h4 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Tournament Summary
        </h4>
        {(() => {
          const allCountries = Object.values(countryData);
          const totalPlayers = allCountries.reduce((s, c) => s + c.playerCount, 0);
          const totalG = allCountries.reduce((s, c) => s + c.totalStats.goals, 0);
          const totalA = allCountries.reduce((s, c) => s + c.totalStats.assists, 0);
          const totalPM = allCountries.reduce((s, c) => s + c.totalStats.plus_minus, 0);
          const totalPIM = allCountries.reduce((s, c) => s + c.totalStats.pim, 0);
          const totalW = allCountries.reduce((s, c) => s + c.totalStats.wins, 0);
          const totalSaves = allCountries.reduce((s, c) => s + c.totalStats.saves, 0);
          const totalSA = allCountries.reduce((s, c) => s + c.totalStats.shots_against, 0);
          const svpct = totalSA > 0 ? (totalSaves / totalSA).toFixed(3).replace(/^0/, '') : '—';
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>{totalPlayers}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Wally Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalG}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalA}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Assists</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalPM > 0 ? '+' : ''}{totalPM}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>+/-</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalPIM}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>PIM</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalW}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Wins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{svpct}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>SV%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalG + totalA}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Points</div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Statistics shown are combined totals for all Wally Cup players representing each country
          <br />
          Countries with eliminated status are shown with reduced opacity
        </div>
      </div>
    </div>
  );
}