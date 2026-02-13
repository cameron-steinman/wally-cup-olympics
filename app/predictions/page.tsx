'use client';

import { useEffect, useState } from 'react';
import standingsData from '../data/standings.json';

// Flag mapping for countries
const FLAG_MAP = {
  CAN: 'ca',
  USA: 'us',
  SWE: 'se',
  FIN: 'fi',
  CZE: 'cz',
  SUI: 'ch',
  GER: 'de',
  SVK: 'sk',
  DEN: 'dk',
  LAT: 'lv',
  ITA: 'it',
  FRA: 'fr'
};

const COUNTRY_NAMES = {
  CAN: 'Canada',
  USA: 'United States',  
  SWE: 'Sweden',
  FIN: 'Finland',
  CZE: 'Czechia',
  SUI: 'Switzerland',
  GER: 'Germany',
  SVK: 'Slovakia',
  DEN: 'Denmark',
  LAT: 'Latvia',
  ITA: 'Italy',
  FRA: 'France'
};

interface Predictions {
  win_probabilities: Record<string, number>;
  podium_probabilities: Record<string, number>;
  projected_points: Record<string, number>;
  country_medal_odds: Record<string, {gold: number, silver: number, bronze: number}>;
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Predictions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (standingsData.predictions) {
      setPredictions(standingsData.predictions as Predictions);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading predictions...</div>
        </div>
      </div>
    );
  }

  if (!predictions) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Predictions data not available</div>
        </div>
      </div>
    );
  }

  // Sort teams by win probability
  const teamsByWinProb = Object.entries(predictions.win_probabilities)
    .sort(([,a], [,b]) => b - a);

  // Sort countries by gold medal probability  
  const countriesByGoldProb = Object.entries(predictions.country_medal_odds)
    .sort(([,a], [,b]) => b.gold - a.gold);

  // Sort teams by projected points for final standings
  const teamsByProjectedPoints = Object.entries(predictions.projected_points)
    .sort(([,a], [,b]) => b - a)
    .map(([team, points], index) => ({ team, points, rank: index + 1 }));

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            🎲 Wally Cup Predictions
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Monte Carlo simulation results based on current performance, power rankings, and tournament advancement probabilities.
            <span className="block text-sm mt-2 text-slate-500">1,000 simulations run</span>
          </p>
        </div>

        {/* Win Probabilities Bar Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 mb-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center">🏆 Wally Cup Win Probabilities</h2>
          <div className="space-y-4">
            {teamsByWinProb.map(([team, probability]) => (
              <div key={team} className="flex items-center">
                <div className="w-48 text-right pr-4 font-medium text-slate-300">
                  {team}
                </div>
                <div className="flex-1 bg-slate-700/50 rounded-full h-8 relative overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                    style={{width: `${Math.max(probability * 100, 2)}%`}}
                  >
                    <span className="text-sm font-bold text-slate-900">
                      {(probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Country Medal Probabilities */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center">🥇 Medal Probabilities</h2>
            <div className="space-y-3">
              {countriesByGoldProb.map(([country, odds]) => (
                <div key={country} className="flex items-center p-3 bg-slate-700/30 rounded-xl">
                  <img 
                    src={`https://flagcdn.com/24x18/${FLAG_MAP[country as keyof typeof FLAG_MAP]}.png`}
                    alt={`${country} flag`}
                    className="w-6 h-4 mr-3 rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-200">
                      {COUNTRY_NAMES[country as keyof typeof COUNTRY_NAMES]}
                    </div>
                    <div className="flex space-x-4 text-sm">
                      <span className="text-yellow-400">
                        🥇 {(odds.gold * 100).toFixed(1)}%
                      </span>
                      <span className="text-gray-300">
                        🥈 {(odds.silver * 100).toFixed(1)}%
                      </span>
                      <span className="text-amber-600">
                        🥉 {(odds.bronze * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projected Final Standings */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center">📊 Projected Final Standings</h2>
            <div className="space-y-2">
              {teamsByProjectedPoints.map(({ team, points, rank }) => (
                <div key={team} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {rank}
                    </div>
                    <span className="font-medium text-slate-200">{team}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-slate-100">
                      {points.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-400">points</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Podium Probabilities */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 mt-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center">🏅 Top 3 Finish Probabilities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(predictions.podium_probabilities)
              .sort(([,a], [,b]) => b - a)
              .map(([team, probability]) => (
                <div key={team} className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <div className="font-medium text-slate-200 mb-2">{team}</div>
                  <div className="text-2xl font-bold text-amber-400">
                    {(probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-400">podium chance</div>
                </div>
              ))}
          </div>
        </div>

        {/* Methodology */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 mt-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-center">📈 Methodology</h2>
          <div className="grid md:grid-cols-2 gap-6 text-slate-300">
            <div>
              <h3 className="font-bold text-lg mb-3 text-slate-200">Simulation Process</h3>
              <ul className="space-y-2 text-sm">
                <li>• 1,000 Monte Carlo simulations run</li>
                <li>• Country advancement weighted by betting odds</li>
                <li>• Player stats projected using per-game rates</li>
                <li>• Random noise (±30%) applied to projections</li>
                <li>• Final roto standings calculated for each sim</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3 text-slate-200">Data Sources</h3>
              <ul className="space-y-2 text-sm">
                <li>• Power rankings from pre-tournament odds</li>
                <li>• Current player performance statistics</li>
                <li>• Tournament stage & advancement probabilities</li>
                <li>• Historical per-game production rates</li>
                <li>• Estimated remaining games by country</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back to Standings */}
        <div className="text-center mt-12">
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
          >
            ← Back to Current Standings
          </a>
        </div>
      </div>
    </div>
  );
}