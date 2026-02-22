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
  
  // Player awards — use manual overrides from JSON if present, otherwise compute
  const allPlayers = ((data as any).all_olympic_players || []) as Player[];
  const activePlayers = allPlayers.filter(p => p.stats.gp > 0);
  const awardsOverride = (data as any).awards as {
    mvp?: string[];
    best_defenseman?: string[];
    best_goaltender?: string[];
    grittiest?: string[];
  } | undefined;
  
  function findPlayer(name: string): Player | undefined {
    return activePlayers.find(p => p.name === name);
  }
  
  function findPlayers(names: string[]): Player[] {
    return names.map(n => findPlayer(n)).filter(Boolean) as Player[];
  }
  
  // MVP
  const mvpPlayers: Player[] = awardsOverride?.mvp
    ? findPlayers(awardsOverride.mvp)
    : (() => {
        const sorted = [...activePlayers].sort((a, b) => (b.zscore ?? 0) - (a.zscore ?? 0));
        return sorted.length ? [sorted[0]] : [];
      })();
  const mvp = mvpPlayers[0];
  
  // Best Defenseman (supports ties)
  const bestDPlayers: Player[] = awardsOverride?.best_defenseman
    ? findPlayers(awardsOverride.best_defenseman)
    : (() => {
        const sorted = [...activePlayers].filter(p => p.pos === 'D').sort((a, b) => (b.zscore ?? 0) - (a.zscore ?? 0));
        return sorted.length ? [sorted[0]] : [];
      })();
  const bestD = bestDPlayers[0];
  
  // Best Goalie
  const bestGPlayers: Player[] = awardsOverride?.best_goaltender
    ? findPlayers(awardsOverride.best_goaltender)
    : (() => {
        const qualifiedGoalies = [...activePlayers]
          .filter(p => p.pos === 'G' && p.stats.gp >= 2 && (p.stats.save_pct ?? 0) > 0);
        const goalieWins = qualifiedGoalies.map(g => g.stats.wins ?? 0);
        const goalieSvs = qualifiedGoalies.map(g => g.stats.save_pct ?? 0);
        const maxW = Math.max(...goalieWins, 1);
        const minW = Math.min(...goalieWins, 0);
        const maxSV = Math.max(...goalieSvs, 0.9);
        const minSV = Math.min(...goalieSvs, 0.8);
        const sorted = qualifiedGoalies.sort((a, b) => {
          const aWN = maxW > minW ? ((a.stats.wins ?? 0) - minW) / (maxW - minW) : 0.5;
          const bWN = maxW > minW ? ((b.stats.wins ?? 0) - minW) / (maxW - minW) : 0.5;
          const aSN = maxSV > minSV ? ((a.stats.save_pct ?? 0) - minSV) / (maxSV - minSV) : 0.5;
          const bSN = maxSV > minSV ? ((b.stats.save_pct ?? 0) - minSV) / (maxSV - minSV) : 0.5;
          return (bWN * 0.35 + bSN * 0.65) - (aWN * 0.35 + aSN * 0.65);
        });
        return sorted.length ? [sorted[0]] : [];
      })();
  const bestG = bestGPlayers[0];
  
  // Grittiest Player
  const grittiestPlayers: Player[] = awardsOverride?.grittiest
    ? findPlayers(awardsOverride.grittiest)
    : (() => {
        const skaters = activePlayers.filter(p => p.pos !== 'G' && p.stats.gp >= 3);
        const sorted = [...skaters].sort((a, b) => {
          const aScore = a.stats.plus_minus * 5 + a.stats.pim;
          const bScore = b.stats.plus_minus * 5 + b.stats.pim;
          return bScore - aScore;
        });
        return sorted.length ? [sorted[0]] : [];
      })();

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
        {mvpPlayers.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              ⭐ Tournament MVP
            </div>
            {mvpPlayers.map((p, i) => (
              <div key={p.name} style={{ marginTop: i > 0 ? '8px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flag code={p.country} size={18} />
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{p.name}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '4px' }}>
                  {p.stats.goals}G · {p.stats.assists}A · {p.stats.goals + p.stats.assists}P · {p.stats.plus_minus > 0 ? '+' : ''}{p.stats.plus_minus}
                  {p.wally_team && <span style={{ color: 'rgba(255,215,0,0.6)', marginLeft: '6px' }}>({p.wally_team})</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Best Defenseman (supports ties) */}
        {bestDPlayers.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              🛡️ Best Defenseman{bestDPlayers.length > 1 ? ' (tie)' : ''}
            </div>
            {bestDPlayers.map((dp, i) => (
              <div key={dp.name} style={{ marginTop: i > 0 ? '8px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flag code={dp.country} size={18} />
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{dp.name}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '4px' }}>
                  {dp.stats.goals}G · {dp.stats.assists}A · {dp.stats.goals + dp.stats.assists}P · {dp.stats.plus_minus > 0 ? '+' : ''}{dp.stats.plus_minus}
                  {dp.wally_team && <span style={{ color: 'rgba(255,215,0,0.6)', marginLeft: '6px' }}>({dp.wally_team})</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Best Goalie */}
        {bestGPlayers.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              🧤 Best Goaltender
            </div>
            {bestGPlayers.map((gp, i) => (
              <div key={gp.name} style={{ marginTop: i > 0 ? '8px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flag code={gp.country} size={18} />
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{gp.name}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '4px' }}>
                  {gp.stats.wins ?? 0}W · {(gp.stats.save_pct ?? 0).toFixed(3).replace(/^0/, '')} SV% · {gp.stats.gp}GP
                  {gp.wally_team && <span style={{ color: 'rgba(255,215,0,0.6)', marginLeft: '6px' }}>({gp.wally_team})</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Grittiest Player */}
        {grittiestPlayers.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              💪 Grittiest Player
            </div>
            {grittiestPlayers.map((gp, i) => (
              <div key={gp.name} style={{ marginTop: i > 0 ? '8px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flag code={gp.country} size={18} />
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{gp.name}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '4px' }}>
                  {gp.stats.plus_minus > 0 ? '+' : ''}{gp.stats.plus_minus} · {gp.stats.pim} PIM · {gp.stats.gp}GP
                  {gp.wally_team && <span style={{ color: 'rgba(255,215,0,0.6)', marginLeft: '6px' }}>({gp.wally_team})</span>}
                </div>
              </div>
            ))}
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
