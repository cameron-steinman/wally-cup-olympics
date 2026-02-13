import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
// Simple inline icon replacements
const ChevronLeftIcon = ({ className }: { className?: string }) => <span className={className}>←</span>;
const StarIconSolid = ({ className }: { className?: string }) => <span className={className}>★</span>;
const StarIcon = ({ className }: { className?: string }) => <span className={className}>☆</span>;
import standingsData from "../../data/standings.json";

interface GameLogEntry {
  game_id: number;
  date: string;
  stats: {
    gp: number;
    goals: number;
    assists: number;
    plus_minus: number;
    pim: number;
  };
}

interface Player {
  name: string;
  country: string;
  pos: string;
  wally_team?: string | null;
  player_id?: number;
  headshot_url?: string;
  stats: {
    gp: number;
    goals: number;
    assists: number;
    plus_minus: number;
    pim: number;
  };
  game_log: GameLogEntry[];
  zscore?: number;
  hot_zscore?: number;
}

interface PageProps {
  params: { id: string };
}

export function generateStaticParams() {
  const players = standingsData.all_olympic_players;
  return players
    .filter((p: any) => p.player_id != null)
    .map((p: any) => ({ id: String(p.player_id) }));
}

function findPlayerById(playerId: number): Player | null {
  const players = standingsData.all_olympic_players;
  for (let i = 0; i < players.length; i++) {
    const player = { ...players[i] }; // Create a copy of the player object
    if (player.player_id != null && player.player_id === playerId) {
      return player as any as Player;
    }
  }
  return null;
}

function getCountryFlag(countryCode: string): string {
  const flagMap = standingsData.flag_map as Record<string, string>;
  return flagMap[countryCode] || "🏳️";
}

function getCountryName(countryCode: string): string {
  const countryNames = standingsData.country_names as Record<string, string>;
  return countryNames[countryCode] || countryCode;
}

function formatPlusMinus(value: number): string {
  if (value > 0) return `+${value}`;
  return value.toString();
}

function getGameOpponent(gameId: number): string {
  const game = standingsData.schedule.games.find(g => g.id === gameId);
  if (!game) return "Unknown";
  
  return `${game.away} vs ${game.home}`;
}

function getGameDate(gameId: number): string {
  const game = standingsData.schedule.games.find(g => g.id === gameId);
  if (!game) return "";
  
  const date = new Date(game.date);
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric" 
  });
}

function getHotColdStatus(player: Player): { status: "hot" | "cold" | "neutral", icon: React.ReactNode } {
  const hotZscore = player.hot_zscore || 0;
  
  if (hotZscore >= 1.5) {
    return { 
      status: "hot", 
      icon: <StarIconSolid className="h-5 w-5 text-red-500" />
    };
  } else if (hotZscore <= -1.5) {
    return { 
      status: "cold", 
      icon: <StarIcon className="h-5 w-5 text-blue-400" />
    };
  }
  
  return { status: "neutral", icon: null };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const playerId = parseInt(params.id);
  const player = findPlayerById(playerId);
  
  if (!player) {
    return {
      title: "Player Not Found | Wally Cup Olympics",
      description: "Player not found in the tournament data."
    };
  }

  return {
    title: `${player.name} | Wally Cup Olympics`,
    description: `View ${player.name}'s stats, game log, and performance in the Wally Cup Olympics tournament.`
  };
}

export default function PlayerProfile({ params }: PageProps) {
  const playerId = parseInt(params.id);
  const player = findPlayerById(playerId);

  if (!player) {
    notFound();
  }

  const countryFlag = getCountryFlag(player.country);
  const countryName = getCountryName(player.country);
  const hotCold = getHotColdStatus(player);
  
  // Calculate points
  const points = player.stats.goals + player.stats.assists;
  
  // Calculate points per game
  const ppg = player.stats.gp > 0 ? (points / player.stats.gp).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          href="/all-players" 
          className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6 transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-1" />
          Back to All Players
        </Link>

        {/* Player Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Player Headshot */}
            <div className="relative">
              {player.headshot_url ? (
                <Image
                  src={player.headshot_url}
                  alt={`${player.name} headshot`}
                  width={168}
                  height={168}
                  className="rounded-lg border-2 border-gray-600"
                  onError={(e) => {
                    // Fallback to generic silhouette on error
                    (e.target as HTMLImageElement).src = "/api/placeholder/168/168";
                  }}
                />
              ) : (
                <div className="w-[168px] h-[168px] bg-gray-700 rounded-lg border-2 border-gray-600 flex items-center justify-center">
                  <div className="text-gray-400 text-4xl">👤</div>
                </div>
              )}
              
              {/* Hot/Cold indicator */}
              {hotCold.icon && (
                <div className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1 border border-gray-600">
                  {hotCold.icon}
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{player.name}</h1>
                <span className="text-2xl">{countryFlag}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-4">
                <span className="bg-blue-500/20 px-2 py-1 rounded text-blue-300">
                  {player.pos}
                </span>
                <span>{countryName}</span>
                {player.wally_team && (
                  <Link 
                    href={`/team/${encodeURIComponent(player.wally_team)}`}
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    {player.wally_team}
                  </Link>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{player.stats.gp}</div>
                  <div className="text-sm text-gray-400">GP</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{player.stats.goals}</div>
                  <div className="text-sm text-gray-400">G</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{player.stats.assists}</div>
                  <div className="text-sm text-gray-400">A</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{points}</div>
                  <div className="text-sm text-gray-400">P</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{ppg}</div>
                  <div className="text-sm text-gray-400">PPG</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Tournament Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700/30 p-4 rounded-lg text-center">
              <div className="text-lg font-bold">{formatPlusMinus(player.stats.plus_minus)}</div>
              <div className="text-sm text-gray-400">+/-</div>
            </div>
            <div className="bg-gray-700/30 p-4 rounded-lg text-center">
              <div className="text-lg font-bold">{player.stats.pim}</div>
              <div className="text-sm text-gray-400">PIM</div>
            </div>
            {player.zscore && (
              <div className="bg-gray-700/30 p-4 rounded-lg text-center">
                <div className="text-lg font-bold">{player.zscore.toFixed(2)}</div>
                <div className="text-sm text-gray-400">Z-Score</div>
              </div>
            )}
            {player.hot_zscore && (
              <div className="bg-gray-700/30 p-4 rounded-lg text-center">
                <div className="text-lg font-bold">{player.hot_zscore.toFixed(2)}</div>
                <div className="text-sm text-gray-400">Hot Z-Score</div>
              </div>
            )}
          </div>
        </div>

        {/* Game Log */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Game Log</h2>
          
          {player.game_log && player.game_log.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-left py-2 px-3">Opponent</th>
                    <th className="text-center py-2 px-3">G</th>
                    <th className="text-center py-2 px-3">A</th>
                    <th className="text-center py-2 px-3">P</th>
                    <th className="text-center py-2 px-3">+/-</th>
                    <th className="text-center py-2 px-3">PIM</th>
                  </tr>
                </thead>
                <tbody>
                  {player.game_log.map((game) => (
                    <tr key={game.game_id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                      <td className="py-2 px-3 text-gray-300">{getGameDate(game.game_id)}</td>
                      <td className="py-2 px-3 text-gray-300">{getGameOpponent(game.game_id)}</td>
                      <td className="py-2 px-3 text-center">{game.stats.goals}</td>
                      <td className="py-2 px-3 text-center">{game.stats.assists}</td>
                      <td className="py-2 px-3 text-center font-bold">
                        {game.stats.goals + game.stats.assists}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {formatPlusMinus(game.stats.plus_minus)}
                      </td>
                      <td className="py-2 px-3 text-center">{game.stats.pim}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-400 text-center py-8">
              No games played yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}