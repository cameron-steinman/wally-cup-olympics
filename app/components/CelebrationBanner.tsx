"use client";
import data from "../data/standings.json";

const flagIso2: Record<string, string> = {
  CAN:"ca",USA:"us",SWE:"se",FIN:"fi",CZE:"cz",SUI:"ch",GER:"de",SVK:"sk",DEN:"dk",LAT:"lv",ITA:"it",FRA:"fr"
};

function Flag({ code, size = 20 }: { code: string; size?: number }) {
  const iso = flagIso2[code];
  if (!iso) return null;
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
  country: string;
  pos: string;
  wally_team: string | null;
  zscore?: number;
  zscore_rank?: number;
  stats: {
    gp: number;
    goals: number;
    assists: number;
    plus_minus: number;
    pim: number;
    wins?: number;
    saves?: number;
    shots_against?: number;
    save_pct?: number;
  };
};

export default function CelebrationBanner() {
  const schedule = (data as any).schedule || {};
  const games = schedule.games || [];
  
  // Find the gold medal game (id 2025090030)
  const goldGame = games.find((g: any) => g.id === 2025090030);
  
  // Only show if the gold medal game is FINAL
  if (!goldGame || goldGame.status !== 'FINAL') return null;
  
  // Tournament is over! Calculate awards.
  const standings = ((data as any).standings || []) as { team: string; total_roto_points: number; rank: number }[];
  const sortedStandings = [...standings].sort((a, b) => a.rank - b.rank);
  
  const goldTeam = sortedStandings[0];
  const silverTeam = sortedStandings[1];
  const bronzeTeam = sortedStandings[2];
  
  // Olympic gold medal winner
  const olympicGoldWinner = goldGame.home_score > goldGame.away_score ? goldGame.home : goldGame.away;
  
  // Player awards
  const allPlayers = ((data as any).all_olympic_players || []) as Player[];
  const activePlayers = allPlayers.filter(p => p.stats.gp > 0);
  
  // MVP: highest zscore among all players
  const mvp = [...activePlayers].sort((a, b) => (b.zscore ?? 0) - (a.zscore ?? 0))[0];
  
  // Best Defenseman: highest zscore among D
  const bestD = [...activePlayers]
    .filter(p => p.pos === 'D')
    .sort((a, b) => (b.zscore ?? 0) - (a.zscore ?? 0))[0];
  
  // Best Goalie: highest save_pct among goalies with 3+ GP
  const bestG = [...activePlayers]
    .filter(p => p.pos === 'G' && p.stats.gp >= 3 && (p.stats.save_pct ?? 0) > 0)
    .sort((a, b) => (b.stats.save_pct ?? 0) - (a.stats.save_pct ?? 0))[0];
  
  // Grittiest Player: composite of plus_minus + pim (both normalized)
  // Simple approach: rank by (plus_minus * 2 + pim), favoring players who are both physical AND effective
  const skaters = activePlayers.filter(p => p.pos !== 'G' && p.stats.gp >= 3);
  const grittiest = [...skaters]
    .sort((a, b) => {
      const aScore = a.stats.plus_minus * 2 + a.stats.pim;
      const bScore = b.stats.plus_minus * 2 + b.stats.pim;
      return bScore - aScore;
    })[0];

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%)',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '24px',
      position: 'relative',
      overflow: 'hidden',
      border: '2px solid rgba(255,215,0,0.3)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,215,0,0.1)',
    }}>
      {/* Sparkle overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at 20% 50%, rgba(255,215,0,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(255,215,0,0.05) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />
      
      {/* Header */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '40px', marginBottom: '4px' }}>🏆</div>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 900,
          color: '#ffd700',
          letterSpacing: '-0.02em',
          textShadow: '0 2px 8px rgba(255,215,0,0.3)',
          margin: '0 0 4px 0',
        }}>
          TOURNAMENT COMPLETE
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
          Milano Cortina 2026 · Men&apos;s Ice Hockey · Final Standings
        </p>
      </div>
      
      {/* Podium */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: '16px',
        margin: '28px 0 24px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Silver - 2nd */}
        {silverTeam && (
          <div style={{ textAlign: 'center', flex: '0 0 160px' }}>
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>🥈</div>
            <div style={{
              background: 'linear-gradient(180deg, rgba(192,192,192,0.15) 0%, rgba(192,192,192,0.05) 100%)',
              border: '1px solid rgba(192,192,192,0.2)',
              borderRadius: '12px',
              padding: '16px 12px',
            }}>
              <div style={{ color: '#c0c0c0', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Silver</div>
              <div style={{ color: '#fff', fontSize: '15px', fontWeight: 800, marginTop: '4px' }}>{silverTeam.team}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '2px' }}>{silverTeam.total_roto_points.toFixed(1)} pts</div>
            </div>
          </div>
        )}
        
        {/* Gold - 1st (tallest) */}
        {goldTeam && (
          <div style={{ textAlign: 'center', flex: '0 0 180px', marginBottom: '16px' }}>
            <div style={{ fontSize: '36px', marginBottom: '4px' }}>🥇</div>
            <div style={{
              background: 'linear-gradient(180deg, rgba(255,215,0,0.2) 0%, rgba(255,215,0,0.05) 100%)',
              border: '2px solid rgba(255,215,0,0.4)',
              borderRadius: '14px',
              padding: '20px 14px',
              boxShadow: '0 4px 20px rgba(255,215,0,0.15)',
            }}>
              <div style={{ color: '#ffd700', fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                🏆 Wally Cup Champion 🏆
              </div>
              <div style={{ color: '#ffd700', fontSize: '20px', fontWeight: 900, marginTop: '6px', textShadow: '0 1px 4px rgba(255,215,0,0.3)' }}>
                {goldTeam.team}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>{goldTeam.total_roto_points.toFixed(1)} pts</div>
            </div>
          </div>
        )}
        
        {/* Bronze - 3rd */}
        {bronzeTeam && (
          <div style={{ textAlign: 'center', flex: '0 0 160px' }}>
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>🥉</div>
            <div style={{
              background: 'linear-gradient(180deg, rgba(205,127,50,0.15) 0%, rgba(205,127,50,0.05) 100%)',
              border: '1px solid rgba(205,127,50,0.2)',
              borderRadius: '12px',
              padding: '16px 12px',
            }}>
              <div style={{ color: '#cd7f32', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Bronze</div>
              <div style={{ color: '#fff', fontSize: '15px', fontWeight: 800, marginTop: '4px' }}>{bronzeTeam.team}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '2px' }}>{bronzeTeam.total_roto_points.toFixed(1)} pts</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Awards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* MVP */}
        {mvp && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              ⭐ Tournament MVP
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flag code={mvp.country} size={18} />
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{mvp.name}</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '4px' }}>
              {mvp.stats.goals}G · {mvp.stats.assists}A · {mvp.stats.goals + mvp.stats.assists}P · {mvp.stats.plus_minus > 0 ? '+' : ''}{mvp.stats.plus_minus}
              {mvp.wally_team && <span style={{ color: 'rgba(255,215,0,0.6)', marginLeft: '6px' }}>({mvp.wally_team})</span>}
            </div>
          </div>
        )}
        
        {/* Best Defenseman */}
        {bestD && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              🛡️ Best Defenseman
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flag code={bestD.country} size={18} />
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{bestD.name}</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '4px' }}>
              {bestD.stats.goals}G · {bestD.stats.assists}A · {bestD.stats.goals + bestD.stats.assists}P · {bestD.stats.plus_minus > 0 ? '+' : ''}{bestD.stats.plus_minus}
              {bestD.wally_team && <span style={{ color: 'rgba(255,215,0,0.6)', marginLeft: '6px' }}>({bestD.wally_team})</span>}
            </div>
          </div>
        )}
        
        {/* Best Goalie */}
        {bestG && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              🧤 Best Goaltender
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flag code={bestG.country} size={18} />
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{bestG.name}</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '4px' }}>
              {bestG.stats.wins ?? 0}W · {(bestG.stats.save_pct ?? 0).toFixed(3).replace(/^0/, '')} SV% · {bestG.stats.gp}GP
              {bestG.wally_team && <span style={{ color: 'rgba(255,215,0,0.6)', marginLeft: '6px' }}>({bestG.wally_team})</span>}
            </div>
          </div>
        )}
        
        {/* Grittiest Player */}
        {grittiest && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              💪 Grittiest Player
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flag code={grittiest.country} size={18} />
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{grittiest.name}</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '4px' }}>
              {grittiest.stats.plus_minus > 0 ? '+' : ''}{grittiest.stats.plus_minus} · {grittiest.stats.pim} PIM · {grittiest.stats.gp}GP
              {grittiest.wally_team && <span style={{ color: 'rgba(255,215,0,0.6)', marginLeft: '6px' }}>({grittiest.wally_team})</span>}
            </div>
          </div>
        )}
      </div>
      
      {/* Olympic Gold */}
      <div style={{
        textAlign: 'center',
        marginTop: '20px',
        padding: '12px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
        zIndex: 1,
      }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600 }}>
          Olympic Gold Medal: <Flag code={olympicGoldWinner} size={16} /> <span style={{ color: '#ffd700' }}>{olympicGoldWinner}</span>
        </span>
      </div>
    </div>
  );
}
