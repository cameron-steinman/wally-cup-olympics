"use client";
import data from "../../public/data/standings.json"; // Corrected path
import { format, parseISO } from "date-fns";

type Game = {
  id: number;
  home: string;
  away: string;
  home_score: number;
  away_score: number;
  status: string;
  date: string;
  time: string;
};

const flagIso2: Record<string, string> = (data as any).flag_iso_map || {
  CAN:"ca",USA:"us",SWE:"se",FIN:"fi",CZE:"cz",SUI:"ch",GER:"de",SVK:"sk",DEN:"dk",LAT:"lv",ITA:"it",FRA:"fr",TBD:"tbd"
};

function Flag({ code, size = 24 }: { code: string; size?: number }) {
  const iso = flagIso2[code];
  if (!iso || code === 'TBD') return <span className="w-6 h-4 inline-block bg-gray-700 rounded-sm" style={{filter: 'saturate(0.5)'}}></span>;
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

const countryNames: Record<string, string> = (data as any).country_names || {};

function GameScore({ game }: { game: Game | undefined }) {
  if (!game) return null;

  const isFinal = game.status === 'FINAL';
  const awayName = countryNames[game.away] || game.away;
  const homeName = countryNames[game.home] || game.home;
  const gameDate = game.date ? format(parseISO(game.date), 'MMM d') : '';

  const winner = isFinal ? (game.home_score > game.away_score ? game.home : game.away) : null;

  return (
    <>
      <div className="flex items-center justify-between text-sm">
        <div className={`flex items-center gap-2 ${winner && winner !== game.away ? 'opacity-50' : ''}`}>
          <Flag code={game.away} size={18} />
          <span className={`${winner && winner !== game.away ? 'line-through' : ''}`}>{awayName}</span>
        </div>
        {isFinal && <span className={`font-bold ${winner && winner !== game.away ? 'opacity-50' : ''}`}>{game.away_score}</span>}
      </div>
      
      {isFinal ? <div className="my-1 border-t border-white/10"></div> : <div className="text-center text-xs py-1" style={{ color: 'var(--text-muted)' }}>vs</div>}

      <div className="flex items-center justify-between text-sm">
        <div className={`flex items-center gap-2 ${winner && winner !== game.home ? 'opacity-50' : ''}`}>
          <Flag code={game.home} size={18} />
          <span className={`${winner && winner !== game.home ? 'line-through' : ''}`}>{homeName}</span>
        </div>
        {isFinal && <span className={`font-bold ${winner && winner !== game.home ? 'opacity-50' : ''}`}>{game.home_score}</span>}
      </div>
      <div className="text-[10px] text-right mt-1" style={{ color: 'var(--text-muted)' }}>{isFinal ? `Final (${gameDate})` : gameDate}</div>
    </>
  );
}

export default function BracketPage() {
  const scheduleGames : Game[] = (data as any).schedule?.games || [];

  const quarterFinalGames = scheduleGames.filter((g: Game) => g.id >= 2025090023 && g.id <= 2025090026);
  const semiFinalGames = scheduleGames.filter((g: Game) => g.id >= 2025090027 && g.id <= 2025090028);
  const bronzeMedalGame = scheduleGames.find((g: Game) => g.id === 2025090029);
  const goldMedalGame = scheduleGames.find((g: Game) => g.id === 2025090030);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Tournament Bracket
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Milano Cortina 2026 Olympics · Men&apos;s Ice Hockey
        </p>
      </div>

      <div className="flex justify-center items-center space-x-4 md:space-x-8">
        {/* Quarterfinals */}
        <div className="flex flex-col justify-around space-y-12">
          <h3 className="text-lg font-bold text-center" style={{ color: 'var(--text-primary)' }}>Quarterfinals</h3>
          {quarterFinalGames.map((game: Game) => (
            <div key={game.id} className="glass-card p-2 w-48">
              <GameScore game={game} />
            </div>
          ))}
        </div>

        {/* Semifinals */}
        <div className="flex flex-col justify-around space-y-48 pt-24">
          <h3 className="text-lg font-bold text-center -mt-20" style={{ color: 'var(--text-primary)' }}>Semifinals</h3>
          {semiFinalGames.map((game: Game) => (
            <div key={game.id} className="glass-card p-2 w-48">
              <GameScore game={game} />
            </div>
          ))}
        </div>
        
        {/* Finals */}
        <div className="flex flex-col justify-center h-full pt-12">
            <h3 className="text-lg font-bold text-center -mt-20 mb-4" style={{ color: 'var(--text-primary)' }}>Finals</h3>
            <div className="space-y-12">
                <div className="glass-card p-2 w-48" style={{ borderLeft: '3px solid #ffd700' }}>
                    <h5 className="font-bold text-sm text-center mb-2" style={{ color: '#ffd700' }}>🥇 Gold Medal</h5>
                    <GameScore game={goldMedalGame} />
                </div>
                <div className="glass-card p-2 w-48" style={{ borderLeft: '3px solid #cd7f32' }}>
                    <h5 className="font-bold text-sm text-center mb-2" style={{ color: '#cd7f32' }}>🥉 Bronze Medal</h5>
                    <GameScore game={bronzeMedalGame} />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
