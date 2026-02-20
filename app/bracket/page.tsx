"use client";
import data from "../data/standings.json";
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

const flagIso2: Record<string, string> = {
  CAN:"ca",USA:"us",SWE:"se",FIN:"fi",CZE:"cz",SUI:"ch",GER:"de",SVK:"sk",DEN:"dk",LAT:"lv",ITA:"it",FRA:"fr"
};

function Flag({ code, size = 24 }: { code: string; size?: number }) {
  const iso = flagIso2[code];
  if (!iso || code === 'TBD') return <span className="w-6 h-4 inline-block bg-gray-600 rounded-sm"></span>;
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

const countryNames: Record<string, string> = {
  CAN:"Canada",USA:"United States",SWE:"Sweden",FIN:"Finland",CZE:"Czechia",SUI:"Switzerland",
  GER:"Germany",SVK:"Slovakia",DEN:"Denmark",LAT:"Latvia",ITA:"Italy",FRA:"France", TBD: "TBD"
};

function GameScore({ game, eliminatedTeams }: { game: Game; eliminatedTeams: Set<string> }) {
  const isFinal = game.status === 'FINAL';
  const awayName = countryNames[game.away] || game.away;
  const homeName = countryNames[game.home] || game.home;
  const gameDate = game.date ? format(parseISO(game.date), 'MMM d') : '';

  const awayEliminated = eliminatedTeams.has(game.away);
  const homeEliminated = eliminatedTeams.has(game.home);

  const winner = isFinal ? (game.home_score > game.away_score ? game.home : game.away) : null;

  if (isFinal) {
    return (
      <>
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center gap-1 ${winner !== game.away ? 'opacity-50' : ''}`}>
            <Flag code={game.away} size={18} />
            <span className={`${winner !== game.away ? 'line-through' : ''}`}>{awayName}</span>
          </div>
          <span className={`font-bold ${winner !== game.away ? 'opacity-50' : ''}`}>{game.away_score}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center gap-1 ${winner !== game.home ? 'opacity-50' : ''}`}>
            <Flag code={game.home} size={18} />
            <span className={`${winner !== game.home ? 'line-through' : ''}`}>{homeName}</span>
          </div>
          <span className={`font-bold ${winner !== game.home ? 'opacity-50' : ''}`}>{game.home_score}</span>
        </div>
        <div className="text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>Final ({gameDate})</div>
      </>
    );
  } else {
    return (
      <div className="text-sm">
        <div className={`flex items-center gap-1 ${awayEliminated ? 'opacity-50 line-through' : ''}`}>
          <Flag code={game.away} size={18} />
          <span>{awayName}</span>
        </div>
        <div className="text-center text-xs py-1" style={{ color: 'var(--text-muted)' }}>vs</div>
        <div className={`flex items-center gap-1 ${homeEliminated ? 'opacity-50 line-through' : ''}`}>
          <Flag code={game.home} size={18} />
          <span>{homeName}</span>
        </div>
        <div className="text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>{gameDate}</div>
      </div>
    );
  }
}

export default function BracketPage() {
  const countryStatus = (data as any).country_status || {};
  const eliminatedCountries = new Set(
    Object.entries(countryStatus).filter(([_, v]: [string, any]) => v.status === 'eliminated').map(([k]) => k)
  );

  const scheduleGames : Game[] = (data as any).schedule?.games || [];

  const getWinner = (game: Game | undefined) => game && game.status === 'FINAL' ? (game.home_score > game.away_score ? game.home : game.away) : 'TBD';
  const getLoser = (game: Game | undefined) => game && game.status === 'FINAL' ? (game.home_score < game.away_score ? game.home : game.away) : 'TBD';
  
  // Find all knockout games from the schedule
  const quarterFinalGames = scheduleGames.filter((g: Game) => g.id >= 2025090023 && g.id <= 2025090026);
  const semiFinalGames = scheduleGames.filter((g: Game) => g.id >= 2025090027 && g.id <= 2025090028);
  let bronzeMedalGame = scheduleGames.find((g: Game) => g.id === 2025090029);
  let goldMedalGame = scheduleGames.find((g: Game) => g.id === 2025090030);

  // Dynamically determine participants for future games
  const sf1_winner = getWinner(semiFinalGames[0]);
  const sf2_winner = getWinner(semiFinalGames[1]);
  const sf1_loser = getLoser(semiFinalGames[0]);
  const sf2_loser = getLoser(semiFinalGames[1]);
  
  if (goldMedalGame && goldMedalGame.home === 'TBD') {
      goldMedalGame = {...goldMedalGame, home: sf1_winner, away: sf2_winner};
  }
  if (bronzeMedalGame && bronzeMedalGame.home === 'TBD') {
      bronzeMedalGame = {...bronzeMedalGame, home: sf1_loser, away: sf2_loser};
  }

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

      <div className="flex justify-center items-start">
        {/* Quarterfinals */}
        <div className="flex flex-col justify-around h-full space-y-8">
          <h3 className="text-lg font-bold text-center mb-4" style={{ color: 'var(--text-primary)' }}>Quarterfinals</h3>
          {quarterFinalGames.map((game: Game) => (
            <div key={game.id} className="glass-card p-2 w-48">
              <GameScore game={game} eliminatedTeams={eliminatedCountries} />
            </div>
          ))}
        </div>

        {/* Semifinals */}
        <div className="flex flex-col justify-around h-full space-y-32 pt-24 ml-8">
          <h3 className="text-lg font-bold text-center -mt-20 mb-4" style={{ color: 'var(--text-primary)' }}>Semifinals</h3>
          {semiFinalGames.map((game: Game) => (
            <div key={game.id} className="glass-card p-2 w-48">
              <GameScore game={game} eliminatedTeams={eliminatedCountries} />
            </div>
          ))}
        </div>
        
        {/* Finals */}
        <div className="flex flex-col justify-around h-full pt-48 ml-8">
            <h3 className="text-lg font-bold text-center -mt-44 mb-4" style={{ color: 'var(--text-primary)' }}>Finals</h3>
            <div className="space-y-8">
                {goldMedalGame && (
                    <div className="glass-card p-2 w-48" style={{ borderLeft: '3px solid #ffd700' }}>
                        <h5 className="font-bold text-sm text-center mb-2" style={{ color: '#ffd700' }}>🥇 Gold Medal</h5>
                        <GameScore game={goldMedalGame} eliminatedTeams={eliminatedCountries} />
                    </div>
                )}
                {bronzeMedalGame && (
                    <div className="glass-card p-2 w-48 mt-16" style={{ borderLeft: '3px solid #cd7f32' }}>
                        <h5 className="font-bold text-sm text-center mb-2" style={{ color: '#cd7f32' }}>🥉 Bronze Medal</h5>
                        <GameScore game={bronzeMedalGame} eliminatedTeams={eliminatedCountries} />
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
