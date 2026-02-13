#!/usr/bin/env python3

import json
import os
import requests
import time
import unicodedata
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict
import statistics

def strip_diacritics(s: str) -> str:
    """Normalize unicode characters to ASCII equivalents (é→e, ü→u, etc.)"""
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

# Configuration
BASE_URL = "https://api-web.nhle.com/v1/gamecenter/{}/boxscore"
USER_AGENT = "Mozilla/5.0"
WORKSPACE_PATH = "/Users/cams_macmini/.openclaw/workspace/wally-cup"
ROSTERS_PATH = f"{WORKSPACE_PATH}/rosters.json"
STANDINGS_PATH = f"{WORKSPACE_PATH}/site/public/data/standings.json"
SNAPSHOTS_PATH = f"{WORKSPACE_PATH}/snapshots"
GAMES_DB_PATH = f"{WORKSPACE_PATH}/db/games"
GAME_ID_START = 2025090001
GAME_ID_END = 2025090022

# Olympic schedule date range
OLYMPIC_START_DATE = "2026-02-11"
OLYMPIC_END_DATE = "2026-02-22"

# Country information
COUNTRY_INFO = {
    "CAN": {"name": "Canada", "flag": "🇨🇦"},
    "USA": {"name": "United States", "flag": "🇺🇸"},
    "SWE": {"name": "Sweden", "flag": "🇸🇪"},
    "FIN": {"name": "Finland", "flag": "🇫🇮"},
    "CZE": {"name": "Czechia", "flag": "🇨🇿"},
    "SUI": {"name": "Switzerland", "flag": "🇨🇭"},
    "GER": {"name": "Germany", "flag": "🇩🇪"},
    "SVK": {"name": "Slovakia", "flag": "🇸🇰"},
    "DEN": {"name": "Denmark", "flag": "🇩🇰"},
    "LAT": {"name": "Latvia", "flag": "🇱🇻"},
    "ITA": {"name": "Italy", "flag": "🇮🇹"},
    "FRA": {"name": "France", "flag": "🇫🇷"}
}

class StatsFetcher:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})
        
        # Ensure games db directory exists
        os.makedirs(GAMES_DB_PATH, exist_ok=True)
        
        # Ensure snapshots directory exists
        os.makedirs(SNAPSHOTS_PATH, exist_ok=True)
        
        # Load rosters
        with open(ROSTERS_PATH, 'r') as f:
            self.rosters = json.load(f)
        
        # Load name overrides for abbreviated names
        name_overrides_path = f"{WORKSPACE_PATH}/name_overrides.json"
        self.name_overrides = {}
        if os.path.exists(name_overrides_path):
            with open(name_overrides_path, 'r') as f:
                self.name_overrides = json.load(f)
            print(f"📝 Loaded {len(self.name_overrides)} name overrides")
        
        # Load player IDs mapping
        player_ids_path = f"{WORKSPACE_PATH}/player_ids.json"
        self.player_ids = {}
        if os.path.exists(player_ids_path):
            with open(player_ids_path, 'r') as f:
                self.player_ids = json.load(f)
            print(f"📸 Loaded {len(self.player_ids)} player ID mappings")
        
        # Create player lookup by name -> (team, country, pos)
        self.player_lookup = {}
        self.abbreviated_lookup = {}  # For matching abbreviated names
        for team_name, players in self.rosters.items():
            for player in players:
                full_name = player["name"]
                self.player_lookup[full_name] = {
                    "team": team_name,
                    "country": player["olympic_country"],
                    "pos": player["pos"],
                    "nhl_team": player["nhl_team"]
                }
                
                # Create abbreviated name mapping (First Initial. Last Name)
                name_parts = full_name.split()
                if len(name_parts) >= 2:
                    # Standard: "J. Ek" for "Joel Eriksson Ek"
                    abbreviated = f"{name_parts[0][0]}. {name_parts[-1]}"
                    self.abbreviated_lookup[abbreviated] = full_name
                    # Also store ASCII-normalized version for diacritic matching
                    ascii_abbreviated = strip_diacritics(abbreviated)
                    if ascii_abbreviated != abbreviated:
                        self.abbreviated_lookup[ascii_abbreviated] = full_name
                    # Multi-word last name: "J. Eriksson Ek" for "Joel Eriksson Ek"
                    if len(name_parts) >= 3:
                        multi_word = f"{name_parts[0][0]}. {' '.join(name_parts[1:])}"
                        self.abbreviated_lookup[multi_word] = full_name
                        ascii_multi = strip_diacritics(multi_word)
                        if ascii_multi != multi_word:
                            self.abbreviated_lookup[ascii_multi] = full_name
                    # Hyphenated first name: "P-L. Dubois" for "Pierre-Luc Dubois"
                    if '-' in name_parts[0]:
                        hyph_parts = name_parts[0].split('-')
                        hyph_abbr = f"{'-'.join(p[0] for p in hyph_parts)}. {name_parts[-1]}"
                        self.abbreviated_lookup[hyph_abbr] = full_name
        
        # Track ALL Olympic players (not just Wally Cup rosters)
        self.all_olympic_players: Dict[str, Dict] = {}  # keyed by "name|country_abbrev"
        
        # Initialize team stats
        self.team_stats = {team: {
            "players": [],
            "goalie_stats": {"aggregate": {"wins": 0, "saves": 0, "shots_against": 0, "save_pct": 0, "qualified": False}},
            "totals": {"goals": 0, "assists": 0, "plus_minus": 0, "pim": 0, "goalie_wins": 0, "save_pct": 0, "sv_qualified": False}
        } for team in self.rosters.keys()}
        
        # Seed all roster players so they appear even if they haven't played
        for team_name, players in self.rosters.items():
            for player in players:
                country = player.get("olympic_country")
                pos = player.get("pos", "F")
                status = "not_in_olympics" if not country else "active"
                if pos == "G":
                    self.team_stats[team_name]["players"].append({
                        "name": player["name"], "country": country, "pos": pos, "status": status,
                        "stats": {"gp": 0, "wins": 0, "saves": 0, "shots_against": 0, "save_pct": 0}
                    })
                else:
                    self.team_stats[team_name]["players"].append({
                        "name": player["name"], "country": country, "pos": pos, "status": status,
                        "stats": {"gp": 0, "goals": 0, "assists": 0, "plus_minus": 0, "pim": 0}
                    })

    def fetch_game_boxscore(self, game_id: int) -> Optional[Dict]:
        """Fetch boxscore for a game, with caching"""
        cache_file = f"{GAMES_DB_PATH}/{game_id}.json"
        
        # Try to load from cache first (only use cache for FINAL games)
        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'r') as f:
                    cached = json.load(f)
                # Only use cache if game is FINAL — live/future games need fresh data
                if cached.get('gameState') in ('FINAL', 'OFF'):
                    return cached
                # Non-final cached data is stale, re-fetch below
            except:
                pass  # If cache is corrupted, fetch fresh
        
        # Fetch from API
        try:
            url = BASE_URL.format(game_id)
            print(f"Fetching {url}...")
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                # Save to cache
                with open(cache_file, 'w') as f:
                    json.dump(data, f, indent=2)
                print(f"✓ Game {game_id} fetched successfully")
                return data
            else:
                print(f"✗ Game {game_id} returned status {response.status_code}")
                # Save empty result to avoid refetching
                with open(cache_file, 'w') as f:
                    json.dump({}, f)
                return {}
        except Exception as e:
            print(f"✗ Error fetching game {game_id}: {e}")
            return {}

    def process_game_boxscore(self, game_id: int, boxscore: Dict):
        """Process boxscore data and update team stats"""
        if not boxscore or 'playerByGameStats' not in boxscore:
            print(f"No valid data for game {game_id}")
            return
        
        # Extract game date
        game_date = boxscore.get('gameDate', '')[:10]  # Extract YYYY-MM-DD format
        
        # Determine winning team
        winning_team_abbrev = None
        home_score = boxscore.get('homeTeam', {}).get('score', 0)
        away_score = boxscore.get('awayTeam', {}).get('score', 0)
        # Game is finished if it has a gameOutcome with lastPeriodType OR if scores are non-zero
        has_outcome = 'gameOutcome' in boxscore and boxscore['gameOutcome'].get('lastPeriodType')
        if has_outcome or (home_score + away_score > 0):
            if home_score > away_score:
                winning_team_abbrev = boxscore.get('homeTeam', {}).get('abbrev')
            elif away_score > home_score:
                winning_team_abbrev = boxscore.get('awayTeam', {}).get('abbrev')
        
        # Process skater stats
        for team_type in ['homeTeam', 'awayTeam']:
            if team_type not in boxscore['playerByGameStats']:
                continue
                
            team_data = boxscore['playerByGameStats'][team_type]
            # Get team abbreviation from the main boxscore data
            team_abbrev = boxscore.get(team_type, {}).get('abbrev', 'UNK')
            
            # Process forwards and defensemen
            for position in ['forwards', 'defense']:
                if position in team_data:
                    pos_label = "F" if position == "forwards" else "D"
                    for player_data in team_data[position]:
                        self._process_skater(player_data, team_abbrev, pos_label, game_id, game_date)
            
            # Process goalies
            if 'goalies' in team_data:
                for goalie_data in team_data['goalies']:
                    is_winner = (team_abbrev == winning_team_abbrev)
                    self._process_goalie(goalie_data, team_abbrev, is_winner, game_id, game_date)

    def _track_all_player(self, name: str, country: str, pos: str, stats: Dict, wally_team: str = None, game_id: int = None, game_date: str = None):
        """Track a player in the all_olympic_players dict"""
        # Apply name override if available (e.g., "E. Luostarinen" -> "Eetu Luostarinen")
        display_name = self.name_overrides.get(name, name)
        
        key = f"{name}|{country}"
        if key not in self.all_olympic_players:
            # Get player ID and headshot URL from mapping
            player_id = None
            headshot_url = None
            
            # Try to find player ID using different name formats
            # Priority: original name (abbreviated) > display name (full) > ASCII normalized versions
            player_data = None
            search_names = [name, display_name]
            
            # Also try ASCII-normalized versions
            ascii_name = strip_diacritics(name)
            ascii_display = strip_diacritics(display_name)
            if ascii_name != name:
                search_names.append(ascii_name)
            if ascii_display != display_name:
                search_names.append(ascii_display)
                
            for search_name in search_names:
                if search_name in self.player_ids:
                    player_data = self.player_ids[search_name]
                    break
            
            if player_data:
                player_id = player_data.get('player_id')
                headshot_url = player_data.get('headshot_url')
            
            self.all_olympic_players[key] = {
                "name": display_name,  # Use the full name for display
                "country": country,
                "pos": pos,
                "wally_team": wally_team,
                "player_id": player_id,
                "headshot_url": headshot_url,
                "stats": {"gp": 0, "goals": 0, "assists": 0, "plus_minus": 0, "pim": 0},
                "game_log": []
            }
        p = self.all_olympic_players[key]
        
        # Update accumulated stats
        for stat, value in stats.items():
            if stat == 'gp':
                p['stats']['gp'] = p['stats'].get('gp', 0) + (1 if value else 0)
            else:
                p['stats'][stat] = p['stats'].get(stat, 0) + value
        if wally_team and not p.get('wally_team'):
            p['wally_team'] = wally_team
            
        # Add game log entry if game_id and date are provided
        if game_id and game_date and stats.get('gp', 0) > 0:  # Only log if player actually played
            p['game_log'].append({
                "game_id": game_id,
                "date": game_date,
                "stats": stats.copy()
            })

    def _process_skater(self, player_data: Dict, team_abbrev: str, pos_label: str = "F", game_id: int = None, game_date: str = None):
        """Process individual skater stats"""
        abbreviated_name = player_data.get('name', {}).get('default', '')
        
        # Extract stats for all-player tracking
        raw_stats = {
            'gp': 0 if player_data.get('toi') == '0:00' else 1,  # Present in boxscore = played (missing toi field is OK)
            'goals': player_data.get('goals', 0),
            'assists': player_data.get('assists', 0),
            'plus_minus': player_data.get('plusMinus', 0),
            'pim': player_data.get('pim', 0)
        }
        
        # Try to match abbreviated name to full name (with diacritic normalization)
        if abbreviated_name in self.abbreviated_lookup:
            full_name = self.abbreviated_lookup[abbreviated_name]
        elif strip_diacritics(abbreviated_name) in self.abbreviated_lookup:
            full_name = self.abbreviated_lookup[strip_diacritics(abbreviated_name)]
        else:
            full_name = abbreviated_name
        
        # Track ALL players regardless of Wally membership
        nhl_to_country = {"CAN":"CAN","USA":"USA","SWE":"SWE","FIN":"FIN","CZE":"CZE","SUI":"SUI","GER":"GER","SVK":"SVK","DEN":"DEN","LAT":"LAT","ITA":"ITA","FRA":"FRA"}
        country = nhl_to_country.get(team_abbrev, team_abbrev)
        
        if full_name in self.player_lookup:
            player_info = self.player_lookup[full_name]
            if player_info['country']:
                country = player_info['country']
                pos_label = player_info['pos']
                self._track_all_player(full_name, country, pos_label, raw_stats, player_info['team'], game_id, game_date)
        else:
            self._track_all_player(abbreviated_name, country, pos_label, raw_stats, None, game_id, game_date)
            return
            
        player_info = self.player_lookup[full_name]
        if not player_info['country']:
            return
            
        wally_team = player_info['team']
        
        # Extract stats
        stats = raw_stats
        
        # Find existing player or create new
        existing_player = None
        for p in self.team_stats[wally_team]['players']:
            if p['name'] == full_name:
                existing_player = p
                break
        
        if existing_player:
            # Update existing stats
            for stat, value in stats.items():
                if stat == 'gp':
                    existing_player['stats'][stat] += value
                else:
                    existing_player['stats'][stat] += value
        else:
            # Add new player
            self.team_stats[wally_team]['players'].append({
                'name': full_name,
                'country': player_info['country'],
                'pos': player_info['pos'],
                'stats': stats,
                'status': 'active'
            })

    def _process_goalie(self, goalie_data: Dict, team_abbrev: str, is_winner: bool, game_id: int = None, game_date: str = None):
        """Process individual goalie stats"""
        abbreviated_name = goalie_data.get('name', {}).get('default', '')
        
        # Try to match abbreviated name to full name (with diacritic normalization)
        if abbreviated_name in self.abbreviated_lookup:
            full_name = self.abbreviated_lookup[abbreviated_name]
        elif strip_diacritics(abbreviated_name) in self.abbreviated_lookup:
            full_name = self.abbreviated_lookup[strip_diacritics(abbreviated_name)]
        else:
            full_name = abbreviated_name
        
        # Extract goalie stats
        toi = goalie_data.get('toi', '0:00')
        played = toi != '0:00'
        shots_against = goalie_data.get('shotsAgainst', 0)
        saves = goalie_data.get('saves', 0)
        wins = 1 if (played and is_winner) else 0
        
        save_pct = (saves / shots_against) if shots_against > 0 else 0
        
        stats = {
            'gp': 1 if played else 0,
            'wins': wins,
            'saves': saves,
            'shots_against': shots_against,
            'save_pct': save_pct
        }
        
        # Track ALL goalies
        nhl_to_country = {"CAN":"CAN","USA":"USA","SWE":"SWE","FIN":"FIN","CZE":"CZE","SUI":"SUI","GER":"GER","SVK":"SVK","DEN":"DEN","LAT":"LAT","ITA":"ITA","FRA":"FRA"}
        country = nhl_to_country.get(team_abbrev, team_abbrev)
        wally_team = None
        
        if full_name in self.player_lookup:
            player_info = self.player_lookup[full_name]
            if player_info['country']:
                country = player_info['country']
                wally_team = player_info['team']
        
        goalie_all_stats = {'gp': 1 if played else 0, 'wins': wins, 'saves': saves, 'shots_against': shots_against}
        self._track_all_player(full_name if full_name in self.player_lookup else abbreviated_name, country, "G", goalie_all_stats, wally_team, game_id, game_date)
            
        if full_name not in self.player_lookup:
            return
        
        player_info = self.player_lookup[full_name]
        if not player_info['country']:
            return
            
        wally_team = player_info['team']
        
        # Find existing player or create new
        existing_player = None
        for p in self.team_stats[wally_team]['players']:
            if p['name'] == full_name:
                existing_player = p
                break
        
        if existing_player:
            # Update existing stats
            for stat, value in stats.items():
                if stat == 'save_pct':
                    # Recalculate save percentage
                    total_shots = existing_player['stats']['shots_against'] + shots_against
                    total_saves = existing_player['stats']['saves'] + saves
                    existing_player['stats']['save_pct'] = (total_saves / total_shots) if total_shots > 0 else 0
                else:
                    existing_player['stats'][stat] += value
        else:
            # Add new player
            self.team_stats[wally_team]['players'].append({
                'name': full_name,
                'country': player_info['country'],
                'pos': player_info['pos'],
                'stats': stats,
                'status': 'active'
            })

    def calculate_team_totals(self):
        """Calculate team totals from individual player stats"""
        for team_name, team_data in self.team_stats.items():
            totals = {"goals": 0, "assists": 0, "plus_minus": 0, "pim": 0, "goalie_wins": 0}
            goalie_totals = {"wins": 0, "saves": 0, "shots_against": 0}
            
            for player in team_data['players']:
                if not player['stats']:
                    continue
                    
                if player['pos'] in ['F', 'D']:  # Skaters
                    totals['goals'] += player['stats'].get('goals', 0)
                    totals['assists'] += player['stats'].get('assists', 0)  
                    totals['plus_minus'] += player['stats'].get('plus_minus', 0)
                    totals['pim'] += player['stats'].get('pim', 0)
                elif player['pos'] == 'G':  # Goalies
                    goalie_totals['wins'] += player['stats'].get('wins', 0)
                    goalie_totals['saves'] += player['stats'].get('saves', 0)
                    goalie_totals['shots_against'] += player['stats'].get('shots_against', 0)
            
            # Calculate team save percentage and qualification
            team_save_pct = 0
            sv_qualified = False
            if goalie_totals['shots_against'] >= 20:
                team_save_pct = goalie_totals['saves'] / goalie_totals['shots_against']
                sv_qualified = True
            
            totals['goalie_wins'] = goalie_totals['wins']
            totals['save_pct'] = team_save_pct
            totals['sv_qualified'] = sv_qualified
            
            team_data['totals'] = totals
            team_data['goalie_stats']['aggregate'] = {
                "wins": goalie_totals['wins'],
                "saves": goalie_totals['saves'], 
                "shots_against": goalie_totals['shots_against'],
                "save_pct": team_save_pct,
                "qualified": sv_qualified
            }

    def compute_zscore_rankings(self):
        """Compute z-score fantasy points for all Olympic players"""
        print("📊 Computing z-score rankings...")
        
        # Separate skaters and goalies who have played
        skaters = []
        goalies = []
        
        for player in self.all_olympic_players.values():
            if player['stats']['gp'] > 0:
                if player['pos'] == 'G':
                    goalies.append(player)
                else:
                    skaters.append(player)
        
        # Compute z-scores using RAW TOTALS (more GP = higher rank, by design)
        if len(skaters) > 1:
            skater_stats = ['goals', 'assists', 'plus_minus', 'pim']
            stat_means = {}
            stat_stdevs = {}
            for stat in skater_stats:
                values = [p['stats'][stat] for p in skaters]
                stat_means[stat] = statistics.mean(values)
                stat_stdevs[stat] = statistics.stdev(values) if len(values) > 1 else 0
            
            for player in skaters:
                zscore = 0
                for stat in skater_stats:
                    if stat_stdevs[stat] > 0:
                        z = (player['stats'][stat] - stat_means[stat]) / stat_stdevs[stat]
                        zscore += z
                player['zscore'] = round(zscore, 2)
        
        # Compute z-scores for goalies
        if len(goalies) > 1:
            for goalie in goalies:
                sa = goalie['stats'].get('shots_against', 0)
                saves = goalie['stats'].get('saves', 0)
                goalie['stats']['save_pct'] = (saves / sa) if sa > 0 else 0
            
            # Goalie z-score: z(wins) + z(SV%) — simple quality-based ranking
            # Only include goalies with SA > 0 in SV% z-score computation (exclude bench warmers)
            active_goalies = [g for g in goalies if g['stats'].get('shots_against', 0) > 0]
            bench_goalies = [g for g in goalies if g['stats'].get('shots_against', 0) == 0]
            
            if len(active_goalies) > 1:
                # Compute means/stdevs from active goalies only
                wins_vals = [g['stats']['wins'] for g in active_goalies]
                svpct_vals = [g['stats']['save_pct'] for g in active_goalies]
                w_mean, w_std = statistics.mean(wins_vals), statistics.stdev(wins_vals)
                sv_mean, sv_std = statistics.mean(svpct_vals), statistics.stdev(svpct_vals)
                
                for player in active_goalies:
                    z_wins = (player['stats']['wins'] - w_mean) / w_std if w_std > 0 else 0
                    z_svpct = (player['stats']['save_pct'] - sv_mean) / sv_std if sv_std > 0 else 0
                    zscore = z_wins + z_svpct
                    # Scale by 2x to normalize against skaters (4 components vs 2)
                    player['zscore'] = round(zscore * 2, 2)
            
            # Bench goalies (SA=0) get z-score based on wins only
            if bench_goalies and len(active_goalies) > 1:
                for player in bench_goalies:
                    z_wins = (player['stats']['wins'] - w_mean) / w_std if w_std > 0 else 0
                    # Penalize slightly for no SV% data — put them at mean SV% (z=0)
                    player['zscore'] = round(z_wins * 2, 2)
        
        # Set z-score to 0 for players without enough data
        for player in self.all_olympic_players.values():
            if 'zscore' not in player:
                player['zscore'] = 0
        
        # Calculate rankings
        players_with_scores = [(player, player['zscore']) for player in self.all_olympic_players.values()]
        players_with_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Assign ranks (handle ties)
        current_rank = 1
        for i, (player, score) in enumerate(players_with_scores):
            if i > 0 and score < players_with_scores[i-1][1]:
                current_rank = i + 1
            player['zscore_rank'] = current_rank

    def compute_hot_players(self):
        """Compute hot players over the last 72 hours"""
        print("🔥 Computing hot players...")
        
        # Find the most recent FINAL game date
        most_recent_date = None
        for game_id in range(GAME_ID_START, GAME_ID_END + 1):
            cache_file = f"{GAMES_DB_PATH}/{game_id}.json"
            if os.path.exists(cache_file):
                try:
                    with open(cache_file, 'r') as f:
                        boxscore = json.load(f)
                    
                    if (boxscore and 'gameDate' in boxscore and 
                        boxscore.get('gameState') in ['FINAL', 'OFF']):
                        game_date = boxscore['gameDate'][:10]
                        if most_recent_date is None or game_date > most_recent_date:
                            most_recent_date = game_date
                except:
                    continue
        
        if not most_recent_date:
            print("No recent games found for hot players calculation")
            for player in self.all_olympic_players.values():
                player['hot_zscore'] = 0
                player['is_hot'] = False
            return []
        
        # Calculate 72-hour cutoff
        most_recent_dt = datetime.strptime(most_recent_date, '%Y-%m-%d')
        cutoff_dt = most_recent_dt - timedelta(hours=72)
        cutoff_date = cutoff_dt.strftime('%Y-%m-%d')
        
        # For each player, sum stats from games within 72 hours
        hot_players = []
        
        for player in self.all_olympic_players.values():
            # Filter game log for recent games
            recent_games = [
                game for game in player.get('game_log', [])
                if game['date'] >= cutoff_date and game['date'] <= most_recent_date
            ]
            
            if not recent_games:
                player['hot_zscore'] = 0
                player['is_hot'] = False
                continue
            
            # Sum stats over the hot window
            hot_stats = {'gp': 0, 'goals': 0, 'assists': 0, 'plus_minus': 0, 'pim': 0, 'wins': 0, 'saves': 0, 'shots_against': 0}
            for game in recent_games:
                game_stats = game['stats']
                for stat in hot_stats:
                    if stat in game_stats:
                        hot_stats[stat] += game_stats[stat]
            
            # Calculate save percentage for goalies
            if player['pos'] == 'G' and hot_stats['shots_against'] > 0:
                hot_stats['save_pct'] = hot_stats['saves'] / hot_stats['shots_against']
            else:
                hot_stats['save_pct'] = 0
            
            player['hot_72h_stats'] = hot_stats
            hot_players.append(player)
        
        # Separate hot skaters and goalies who played in the window
        hot_skaters = [p for p in hot_players if p['pos'] != 'G' and p['hot_72h_stats']['gp'] > 0]
        hot_goalies = [p for p in hot_players if p['pos'] == 'G' and p['hot_72h_stats']['gp'] > 0]
        
        # Compute z-scores for hot skaters
        if len(hot_skaters) > 1:
            skater_stats = ['goals', 'assists', 'plus_minus', 'pim']
            stat_means = {}
            stat_stdevs = {}
            
            for stat in skater_stats:
                values = [p['hot_72h_stats'][stat] for p in hot_skaters]
                stat_means[stat] = statistics.mean(values)
                stat_stdevs[stat] = statistics.stdev(values) if len(values) > 1 else 0
            
            for player in hot_skaters:
                zscore = 0
                for stat in skater_stats:
                    if stat_stdevs[stat] > 0:
                        z = (player['hot_72h_stats'][stat] - stat_means[stat]) / stat_stdevs[stat]
                        zscore += z
                player['hot_zscore'] = zscore
        
        # Compute z-scores for hot goalies: z(wins) + z(SV%) — matches overall goalie formula
        # Only include goalies with SA > 0 in SV% computation
        active_hot_goalies = [g for g in hot_goalies if g['hot_72h_stats'].get('shots_against', 0) > 0]
        if len(active_hot_goalies) > 1:
            wins_vals = [g['hot_72h_stats']['wins'] for g in active_hot_goalies]
            svpct_vals = [g['hot_72h_stats']['save_pct'] for g in active_hot_goalies]
            w_mean, w_std = statistics.mean(wins_vals), statistics.stdev(wins_vals)
            sv_mean, sv_std = statistics.mean(svpct_vals), statistics.stdev(svpct_vals)
            
            for player in active_hot_goalies:
                z_wins = (player['hot_72h_stats']['wins'] - w_mean) / w_std if w_std > 0 else 0
                z_svpct = (player['hot_72h_stats']['save_pct'] - sv_mean) / sv_std if sv_std > 0 else 0
                player['hot_zscore'] = (z_wins + z_svpct) * 2  # Scale by 2x to match skater 4-component
        
        # Bench goalies in hot window get wins-only z-score
        bench_hot_goalies = [g for g in hot_goalies if g['hot_72h_stats'].get('shots_against', 0) == 0]
        if bench_hot_goalies and len(active_hot_goalies) > 1:
            for player in bench_hot_goalies:
                z_wins = (player['hot_72h_stats']['wins'] - w_mean) / w_std if w_std > 0 else 0
                player['hot_zscore'] = z_wins * 2
        
        # Set hot_zscore to 0 for players not computed above
        for player in self.all_olympic_players.values():
            if 'hot_zscore' not in player:
                player['hot_zscore'] = 0
        
        # Get top 10 hot players
        all_hot = [p for p in hot_players if p.get('hot_zscore', 0) != 0]
        all_hot.sort(key=lambda x: x['hot_zscore'], reverse=True)
        top_10_hot = all_hot[:10]
        
        # Mark top 10 as hot
        for player in self.all_olympic_players.values():
            player['is_hot'] = player in top_10_hot
        
        # Create hot players summary for JSON output
        hot_players_summary = []
        for player in top_10_hot:
            hot_stats = player.get('hot_72h_stats', {})
            summary = {
                'name': player['name'],
                'country': player['country'],
                'wally_team': player.get('wally_team'),
                'pos': player['pos'],
                'hot_zscore': player['hot_zscore'],
                'hot_72h_stats': hot_stats
            }
            hot_players_summary.append(summary)
        
        return hot_players_summary

    def compute_cold_players(self):
        """Compute cold players over the last 72 hours (bottom 50)"""
        print("❄️ Computing cold players...")
        
        # Find the most recent FINAL game date
        most_recent_date = None
        for game_id in range(GAME_ID_START, GAME_ID_END + 1):
            cache_file = f"{GAMES_DB_PATH}/{game_id}.json"
            if os.path.exists(cache_file):
                try:
                    with open(cache_file, 'r') as f:
                        boxscore = json.load(f)
                    
                    if (boxscore and 'gameDate' in boxscore and 
                        boxscore.get('gameState') in ['FINAL', 'OFF']):
                        game_date = boxscore['gameDate'][:10]
                        if most_recent_date is None or game_date > most_recent_date:
                            most_recent_date = game_date
                except:
                    continue
        
        if not most_recent_date:
            print("No recent games found for cold players calculation")
            for player in self.all_olympic_players.values():
                player['cold_zscore'] = 0
                player['is_cold'] = False
            return []
        
        # Calculate 72-hour cutoff
        most_recent_dt = datetime.strptime(most_recent_date, '%Y-%m-%d')
        cutoff_dt = most_recent_dt - timedelta(hours=72)
        cutoff_date = cutoff_dt.strftime('%Y-%m-%d')
        
        # For each player, sum stats from games within 72 hours
        cold_players = []
        
        for player in self.all_olympic_players.values():
            # Filter game log for recent games
            recent_games = [
                game for game in player.get('game_log', [])
                if game['date'] >= cutoff_date and game['date'] <= most_recent_date
            ]
            
            if not recent_games:
                player['cold_zscore'] = 0
                player['is_cold'] = False
                continue
            
            # Sum stats over the cold window (same as hot window)
            cold_stats = {'gp': 0, 'goals': 0, 'assists': 0, 'plus_minus': 0, 'pim': 0, 'wins': 0, 'saves': 0, 'shots_against': 0}
            for game in recent_games:
                game_stats = game['stats']
                for stat in cold_stats:
                    if stat in game_stats:
                        cold_stats[stat] += game_stats[stat]
            
            # Calculate save percentage for goalies
            if player['pos'] == 'G' and cold_stats['shots_against'] > 0:
                cold_stats['save_pct'] = cold_stats['saves'] / cold_stats['shots_against']
            else:
                cold_stats['save_pct'] = 0
            
            player['cold_72h_stats'] = cold_stats
            cold_players.append(player)
        
        # Separate cold skaters and goalies who played in the window
        cold_skaters = [p for p in cold_players if p['pos'] != 'G' and p['cold_72h_stats']['gp'] > 0]
        cold_goalies = [p for p in cold_players if p['pos'] == 'G' and p['cold_72h_stats']['gp'] > 0]
        
        # Compute z-scores for cold skaters (reuse the same logic as hot players)
        if len(cold_skaters) > 1:
            skater_stats = ['goals', 'assists', 'plus_minus', 'pim']
            stat_means = {}
            stat_stdevs = {}
            
            for stat in skater_stats:
                values = [p['cold_72h_stats'][stat] for p in cold_skaters]
                stat_means[stat] = statistics.mean(values)
                stat_stdevs[stat] = statistics.stdev(values) if len(values) > 1 else 0
            
            for player in cold_skaters:
                zscore = 0
                for stat in skater_stats:
                    if stat_stdevs[stat] > 0:
                        z = (player['cold_72h_stats'][stat] - stat_means[stat]) / stat_stdevs[stat]
                        zscore += z
                player['cold_zscore'] = zscore
        
        # Compute z-scores for cold goalies: z(wins) + z(SV%) — matches overall goalie formula
        active_cold_goalies = [g for g in cold_goalies if g['cold_72h_stats'].get('shots_against', 0) > 0]
        if len(active_cold_goalies) > 1:
            wins_vals = [g['cold_72h_stats']['wins'] for g in active_cold_goalies]
            svpct_vals = [g['cold_72h_stats']['save_pct'] for g in active_cold_goalies]
            w_mean, w_std = statistics.mean(wins_vals), statistics.stdev(wins_vals)
            sv_mean, sv_std = statistics.mean(svpct_vals), statistics.stdev(svpct_vals)
            
            for player in active_cold_goalies:
                z_wins = (player['cold_72h_stats']['wins'] - w_mean) / w_std if w_std > 0 else 0
                z_svpct = (player['cold_72h_stats']['save_pct'] - sv_mean) / sv_std if sv_std > 0 else 0
                player['cold_zscore'] = (z_wins + z_svpct) * 2
        
        bench_cold_goalies = [g for g in cold_goalies if g['cold_72h_stats'].get('shots_against', 0) == 0]
        if bench_cold_goalies and len(active_cold_goalies) > 1:
            for player in bench_cold_goalies:
                z_wins = (player['cold_72h_stats']['wins'] - w_mean) / w_std if w_std > 0 else 0
                player['cold_zscore'] = z_wins * 2
        
        # Set cold_zscore to 0 for players not computed above
        for player in self.all_olympic_players.values():
            if 'cold_zscore' not in player:
                player['cold_zscore'] = 0
        
        # Get bottom 50 cold players (lowest z-scores)
        all_cold = [p for p in cold_players if p.get('cold_zscore', 0) != 0]
        all_cold.sort(key=lambda x: x['cold_zscore'], reverse=False)  # ascending order for lowest scores
        bottom_50_cold = all_cold[:50]  # bottom 50
        bottom_10_cold = all_cold[:10]   # bottom 10 for the cold_players array
        
        # Mark bottom 50 as cold
        for player in self.all_olympic_players.values():
            player['is_cold'] = player in bottom_50_cold
        
        # Create cold players summary for JSON output (bottom 10)
        cold_players_summary = []
        for player in bottom_10_cold:
            cold_stats = player.get('cold_72h_stats', {})
            summary = {
                'name': player['name'],
                'country': player['country'],
                'wally_team': player.get('wally_team'),
                'pos': player['pos'],
                'cold_zscore': player['cold_zscore'],
                'cold_72h_stats': cold_stats
            }
            cold_players_summary.append(summary)
        
        return cold_players_summary

    def compute_milestones(self) -> List[Dict]:
        """Compute milestones from game logs and current stats"""
        print("🏆 Computing milestones...")
        
        milestones = []
        
        # Get all players and track first goals across entire tournament
        all_first_goals = set()
        
        # Track leaders for "new leader" detection
        current_leaders = {
            'goals': {'player': None, 'value': 0},
            'assists': {'player': None, 'value': 0}, 
            'points': {'player': None, 'value': 0}
        }
        
        # Find current leaders
        for player in self.all_olympic_players.values():
            stats = player.get('stats', {})
            if not stats:
                continue
                
            goals = stats.get('goals', 0)
            assists = stats.get('assists', 0)
            points = goals + assists
            
            if goals > current_leaders['goals']['value']:
                current_leaders['goals'] = {'player': player, 'value': goals}
            if assists > current_leaders['assists']['value']:
                current_leaders['assists'] = {'player': player, 'value': assists}
            if points > current_leaders['points']['value']:
                current_leaders['points'] = {'player': player, 'value': points}
        
        # Process each player's game log for milestones
        for player in self.all_olympic_players.values():
            player_name = player['name']
            country = player['country']
            pos = player['pos']
            wally_team = player.get('wally_team')
            game_log = player.get('game_log', [])
            
            # Track cumulative stats to detect milestones
            cumulative_goals = 0
            cumulative_assists = 0
            cumulative_points = 0
            has_first_goal = False
            
            for game in sorted(game_log, key=lambda x: (x['date'], x['game_id'])):
                game_id = game['game_id']
                date = game['date']
                stats = game['stats']
                
                if not stats or stats.get('gp', 0) == 0:
                    continue
                
                # Update cumulative stats BEFORE this game
                prev_goals = cumulative_goals
                prev_assists = cumulative_assists
                prev_points = cumulative_points
                
                # Update cumulative stats WITH this game
                game_goals = stats.get('goals', 0)
                game_assists = stats.get('assists', 0)
                game_points = game_goals + game_assists
                
                cumulative_goals += game_goals
                cumulative_assists += game_assists
                cumulative_points += game_points
                
                # 1. First goal of tournament for player
                if game_goals > 0 and not has_first_goal and pos != 'G':
                    has_first_goal = True
                    all_first_goals.add(player_name)
                    milestones.append({
                        "type": "first_goal",
                        "player": player_name,
                        "country": country,
                        "wally_team": wally_team,
                        "game_id": game_id,
                        "date": date,
                        "description": f"{player_name} scores their first goal of the Olympics"
                    })
                
                # 2. Hat trick (3+ goals in single game)
                if game_goals >= 3 and pos != 'G':
                    milestones.append({
                        "type": "hat_trick",
                        "player": player_name,
                        "country": country,
                        "wally_team": wally_team,
                        "game_id": game_id,
                        "date": date,
                        "description": f"{player_name} records a hat trick with {game_goals} goals"
                    })
                
                # 3. Shutout (goalie with 0 goals against, full game played)
                if pos == 'G':
                    shots_against = stats.get('shots_against', 0)
                    saves = stats.get('saves', 0)
                    
                    # Shutout: saves == shots_against AND shots_against > 0 (actually faced shots)
                    if shots_against > 0 and saves == shots_against:
                        milestones.append({
                            "type": "shutout",
                            "player": player_name,
                            "country": country,
                            "wally_team": wally_team,
                            "game_id": game_id,
                            "date": date,
                            "description": f"{player_name} records a shutout with {saves} saves"
                        })
                
                # 4. 5+ point game
                if game_points >= 5 and pos != 'G':
                    milestones.append({
                        "type": "big_game",
                        "player": player_name,
                        "country": country,
                        "wally_team": wally_team,
                        "game_id": game_id,
                        "date": date,
                        "description": f"{player_name} records {game_points} points ({game_goals}G, {game_assists}A)"
                    })
                
                # 5. Player reaches 5 goals or 10 points milestone
                if prev_goals < 5 and cumulative_goals >= 5 and pos != 'G':
                    milestones.append({
                        "type": "milestone_goals",
                        "player": player_name,
                        "country": country,
                        "wally_team": wally_team,
                        "game_id": game_id,
                        "date": date,
                        "description": f"{player_name} reaches 5 goals ({cumulative_goals} total)"
                    })
                
                if prev_points < 10 and cumulative_points >= 10 and pos != 'G':
                    milestones.append({
                        "type": "milestone_points",
                        "player": player_name,
                        "country": country,
                        "wally_team": wally_team,
                        "game_id": game_id,
                        "date": date,
                        "description": f"{player_name} reaches 10 points ({cumulative_points} total)"
                    })
        
        # 6. New leader detection - check if current leaders achieved their position in this latest data
        for stat_type, leader_info in current_leaders.items():
            if leader_info['player'] and leader_info['value'] > 0:
                player = leader_info['player']
                value = leader_info['value']
                game_log = player.get('game_log', [])
                
                # Find the game where they first reached this value
                cumulative = 0
                for game in sorted(game_log, key=lambda x: (x['date'], x['game_id'])):
                    stats = game['stats']
                    if not stats or stats.get('gp', 0) == 0:
                        continue
                    
                    if stat_type == 'goals':
                        cumulative += stats.get('goals', 0)
                    elif stat_type == 'assists':
                        cumulative += stats.get('assists', 0)
                    elif stat_type == 'points':
                        cumulative += stats.get('goals', 0) + stats.get('assists', 0)
                    
                    # If this game pushed them to current total, they became leader
                    if cumulative == value and cumulative > 0:
                        stat_label = stat_type.capitalize()
                        milestones.append({
                            "type": "new_leader",
                            "player": player['name'],
                            "country": player['country'],
                            "wally_team": player.get('wally_team'),
                            "game_id": game['game_id'],
                            "date": game['date'],
                            "description": f"{player['name']} takes the {stat_label.lower()} lead with {value} {stat_label.lower()}"
                        })
                        break
        
        # Sort milestones by date (most recent first) and limit to last 50
        milestones.sort(key=lambda x: (x['date'], x['game_id']), reverse=True)
        
        return milestones[:50]

    def calculate_roto_rankings(self) -> List[Dict]:
        """Calculate roto rankings and return standings"""
        # Get all teams with their totals
        teams_data = []
        for team_name, team_data in self.team_stats.items():
            teams_data.append((team_name, team_data['totals']))
        
        categories = ['goals', 'assists', 'plus_minus', 'pim', 'goalie_wins', 'save_pct']
        team_ranks = {team: {} for team, _ in teams_data}
        
        # Calculate ranks for each category
        for category in categories:
            if category == 'save_pct':
                # Handle save percentage with qualification
                qualified_teams = [(team, totals[category]) for team, totals in teams_data if totals['sv_qualified']]
                unqualified_teams = [team for team, totals in teams_data if not totals['sv_qualified']]
                
                # Rank qualified teams by save percentage (higher is better)
                qualified_teams.sort(key=lambda x: x[1], reverse=True)
                
                # Assign ranks to qualified teams
                for i, (team, value) in enumerate(qualified_teams):
                    rank = i + 1
                    # Handle ties
                    if i > 0 and value == qualified_teams[i-1][1]:
                        rank = team_ranks[qualified_teams[i-1][0]][category]['rank']
                    team_ranks[team][category] = {'value': value, 'rank': rank, 'qualified': True}
                
                # Unqualified teams tie for position after last qualified team
                unqualified_rank = len(qualified_teams) + 1
                for team in unqualified_teams:
                    team_ranks[team][category] = {'value': 0, 'rank': unqualified_rank, 'qualified': False}
                    
            else:
                # Regular categories (all higher is better, including PIM per requirement)
                values = [(team, totals[category]) for team, totals in teams_data]
                values.sort(key=lambda x: x[1], reverse=True)
                
                for i, (team, value) in enumerate(values):
                    rank = i + 1
                    # Handle ties by averaging positions
                    if i > 0 and value == values[i-1][1]:
                        rank = team_ranks[values[i-1][0]][category]['rank']
                    team_ranks[team][category] = {'value': value, 'rank': rank}
        
        # Calculate roto points (12 teams, so 12 points for 1st, 11 for 2nd, etc.)
        for team in team_ranks:
            total_roto_points = 0
            for category in categories:
                rank = team_ranks[team][category]['rank']
                # Handle ties by averaging roto points
                tied_teams = [t for t in team_ranks if team_ranks[t][category]['rank'] == rank]
                if len(tied_teams) > 1:
                    # Average the roto points for tied positions
                    points_sum = sum(13 - (rank + i) for i in range(len(tied_teams)))
                    roto_points = points_sum / len(tied_teams)
                else:
                    roto_points = 13 - rank
                
                team_ranks[team][category]['roto_points'] = roto_points
                total_roto_points += roto_points
            
            team_ranks[team]['total_roto_points'] = total_roto_points
        
        # Create standings list sorted by total roto points
        standings = []
        for team_name, ranks in team_ranks.items():
            team_standing = {
                'team': team_name,
                'categories': {
                    'goals': ranks['goals'],
                    'assists': ranks['assists'], 
                    'plus_minus': ranks['plus_minus'],
                    'pim': ranks['pim'],
                    'goalie_wins': ranks['goalie_wins'],
                    'save_pct': ranks['save_pct']
                },
                'total_roto_points': ranks['total_roto_points'],
                'rank': 0  # Will be set after sorting
            }
            standings.append(team_standing)
        
        # Sort by total roto points (descending) and assign final ranks
        standings.sort(key=lambda x: x['total_roto_points'], reverse=True)
        for i, team in enumerate(standings):
            team['rank'] = i + 1
        
        return standings

    def fetch_olympic_schedule(self) -> Dict:
        """Fetch/generate Olympic hockey schedule"""
        # For now, return a basic schedule structure
        # In a real implementation, this would fetch from NHL API
        games = []
        for game_id in range(GAME_ID_START, GAME_ID_END + 1):
            # Try to get game info from cached boxscore
            cache_file = f"{GAMES_DB_PATH}/{game_id}.json"
            if os.path.exists(cache_file):
                try:
                    with open(cache_file, 'r') as f:
                        boxscore = json.load(f)
                    
                    if boxscore and 'gameDate' in boxscore:
                        game_date = boxscore['gameDate'][:10]  # Extract YYYY-MM-DD
                        home_team = boxscore.get('homeTeam', {}).get('abbrev', 'HOME')
                        away_team = boxscore.get('awayTeam', {}).get('abbrev', 'AWAY')
                        home_score = boxscore.get('homeTeam', {}).get('score', 0)
                        away_score = boxscore.get('awayTeam', {}).get('score', 0)
                        
                        # Determine status
                        game_state = boxscore.get('gameState', '')
                        if game_state in ('FINAL', 'OFF'):
                            status = "FINAL"
                        elif game_state in ('LIVE', 'CRIT'):
                            status = "LIVE"
                        else:
                            status = "FUT"
                        
                        # Live game details
                        period = boxscore.get('periodDescriptor', {}).get('number', 0)
                        clock = boxscore.get('clock', {}).get('timeRemaining', '')
                        start_time = boxscore.get('startTimeUTC', '')
                        
                        games.append({
                            "id": game_id,
                            "date": game_date,
                            "time": start_time,
                            "away": away_team,
                            "home": home_team,
                            "status": status,
                            "away_score": away_score,
                            "home_score": home_score,
                            "period": period if status == "LIVE" else None,
                            "clock": clock if status == "LIVE" else None
                        })
                except:
                    continue
        
        return {"games": games}

    def create_country_status(self, schedule: Dict) -> Dict:
        """Create country status information with next game from schedule"""
        # Find each country's next upcoming game
        next_games: Dict[str, Dict] = {}
        games = schedule.get("games", [])
        for g in games:
            if g["status"] != "FUT":
                continue
            for side in ["away", "home"]:
                code = g[side]
                if code == "TBD" or code in next_games:
                    continue
                opp = g["home"] if side == "away" else g["away"]
                next_games[code] = {
                    "vs": opp,
                    "date": g["date"],
                    "time": g.get("time", "TBD"),
                }

        country_status = {}
        for country_code, info in COUNTRY_INFO.items():
            country_status[country_code] = {
                "status": "active",
                "name": info["name"],
                "flag": info["flag"],
                "next_game": next_games.get(country_code),
            }
        return country_status

    def save_daily_snapshot(self, standings: List[Dict]) -> None:
        """Save daily snapshot if it doesn't exist or if roto points changed"""
        today = datetime.now().strftime("%Y-%m-%d")
        snapshot_file = f"{SNAPSHOTS_PATH}/{today}.json"
        
        # Create snapshot data
        snapshot_data = {
            "date": today,
            "standings": []
        }
        
        for team in standings:
            snapshot_data["standings"].append({
                "team": team["team"],
                "roto_points": team["total_roto_points"],
                "rank": team["rank"]
            })
        
        # Check if we should save the snapshot
        should_save = False
        
        if not os.path.exists(snapshot_file):
            # File doesn't exist, save it
            should_save = True
            print(f"📸 Saving new snapshot for {today}")
        else:
            # File exists, check if roto points changed
            try:
                with open(snapshot_file, 'r') as f:
                    existing_snapshot = json.load(f)
                
                # Compare roto points for each team
                existing_teams = {t["team"]: t["roto_points"] for t in existing_snapshot["standings"]}
                current_teams = {t["team"]: t["roto_points"] for t in snapshot_data["standings"]}
                
                if existing_teams != current_teams:
                    should_save = True
                    print(f"📸 Updating snapshot for {today} - roto points changed")
                else:
                    print(f"📸 Snapshot for {today} unchanged, skipping")
            except:
                # Error reading existing file, overwrite it
                should_save = True
                print(f"📸 Overwriting corrupted snapshot for {today}")
        
        if should_save:
            with open(snapshot_file, 'w') as f:
                json.dump(snapshot_data, f, indent=2)

    def load_standings_history(self) -> List[Dict]:
        """Load all snapshot files and return array of daily snapshots"""
        history = []
        
        # Find all snapshot files
        if os.path.exists(SNAPSHOTS_PATH):
            for filename in sorted(os.listdir(SNAPSHOTS_PATH)):
                if filename.endswith('.json'):
                    try:
                        filepath = os.path.join(SNAPSHOTS_PATH, filename)
                        with open(filepath, 'r') as f:
                            snapshot = json.load(f)
                        history.append(snapshot)
                    except Exception as e:
                        print(f"⚠️ Error loading snapshot {filename}: {e}")
                        continue
        
        return history

    def compute_daily_recap(self, schedule: Dict) -> Dict[str, Dict]:
        """Compute daily recap for each game day with games, top performers, and standings changes"""
        print("📰 Computing daily recaps...")
        
        daily_recaps = {}
        
        # Group games by date
        games_by_date = defaultdict(list)
        for game in schedule.get("games", []):
            if game["status"] == "FINAL":
                games_by_date[game["date"]].append(game)
        
        # Load standings history for comparison
        standings_history = self.load_standings_history()
        history_by_date = {h["date"]: h for h in standings_history}
        
        # Process each date with games
        for date, games in games_by_date.items():
            if not games:
                continue
            
            recap_data = {
                "games": [],
                "top_performers": [],
                "standings_changes": [],
                "milestones": [],
                "recap_text": ""
            }
            
            # Process games for this date
            for game in games:
                home_country = COUNTRY_INFO.get(game["home"], {})
                away_country = COUNTRY_INFO.get(game["away"], {})
                
                recap_data["games"].append({
                    "id": game["id"],
                    "away": {
                        "code": game["away"],
                        "name": away_country.get("name", game["away"]),
                        "flag": away_country.get("flag", ""),
                        "score": game["away_score"]
                    },
                    "home": {
                        "code": game["home"],
                        "name": home_country.get("name", game["home"]),
                        "flag": home_country.get("flag", ""),
                        "score": game["home_score"]
                    },
                    "final_score": f"{game['away_score']}-{game['home_score']}"
                })
            
            # Find top performers from game logs for this date
            daily_performances = []
            
            for player in self.all_olympic_players.values():
                for game_log in player.get('game_log', []):
                    if game_log['date'] == date:
                        # Calculate fantasy points for the day
                        stats = game_log['stats']
                        
                        if player['pos'] == 'G':
                            # Goalie scoring: 4 pts for win, 0.25 per save
                            fantasy_pts = (stats.get('wins', 0) * 4 + 
                                         stats.get('saves', 0) * 0.25)
                        else:
                            # Skater scoring: 6 pts for goal, 4 for assist, 2 for +1, -2 for -1, -0.5 per PIM
                            fantasy_pts = (stats.get('goals', 0) * 6 + 
                                         stats.get('assists', 0) * 4 + 
                                         stats.get('plus_minus', 0) * 2 - 
                                         stats.get('pim', 0) * 0.5)
                        
                        if fantasy_pts > 0 or stats.get('gp', 0) > 0:  # Include anyone who played
                            daily_performances.append({
                                "name": player['name'],
                                "country": player['country'],
                                "wally_team": player.get('wally_team'),
                                "pos": player['pos'],
                                "fantasy_points": fantasy_pts,
                                "stats": stats
                            })
            
            # Sort by fantasy points and take top 10
            daily_performances.sort(key=lambda x: x['fantasy_points'], reverse=True)
            recap_data["top_performers"] = daily_performances[:10]
            
            # Compute standings changes if we have previous day data
            previous_date = None
            current_snapshot = history_by_date.get(date)
            
            # Find the most recent previous snapshot
            sorted_dates = sorted(history_by_date.keys())
            try:
                current_index = sorted_dates.index(date)
                if current_index > 0:
                    previous_date = sorted_dates[current_index - 1]
            except ValueError:
                pass  # Current date not in history yet
            
            if previous_date and current_snapshot:
                previous_snapshot = history_by_date[previous_date]
                
                # Create lookup dictionaries
                prev_standings = {team["team"]: {"roto_points": team["roto_points"], "rank": team["rank"]} 
                                for team in previous_snapshot["standings"]}
                curr_standings = {team["team"]: {"roto_points": team["roto_points"], "rank": team["rank"]} 
                                for team in current_snapshot["standings"]}
                
                # Find biggest risers and fallers
                changes = []
                for team in curr_standings:
                    if team in prev_standings:
                        rank_change = prev_standings[team]["rank"] - curr_standings[team]["rank"]
                        roto_change = curr_standings[team]["roto_points"] - prev_standings[team]["roto_points"]
                        
                        changes.append({
                            "team": team,
                            "rank_change": rank_change,
                            "roto_change": round(roto_change, 2),
                            "previous_rank": prev_standings[team]["rank"],
                            "current_rank": curr_standings[team]["rank"],
                            "previous_roto": round(prev_standings[team]["roto_points"], 2),
                            "current_roto": round(curr_standings[team]["roto_points"], 2)
                        })
                
                # Sort by rank improvement (positive rank_change = moved up)
                changes.sort(key=lambda x: x["rank_change"], reverse=True)
                
                # Take top 3 risers and bottom 3 fallers
                risers = [c for c in changes if c["rank_change"] > 0][:3]
                fallers = [c for c in changes if c["rank_change"] < 0][-3:]
                
                recap_data["standings_changes"] = {
                    "risers": risers,
                    "fallers": fallers
                }
            
            # Generate recap text
            game_count = len(games)
            games_text = f"{game_count} game{'s' if game_count != 1 else ''}"
            
            # Highlight the biggest game
            if games:
                biggest_game = max(games, key=lambda g: g["away_score"] + g["home_score"])
                away_name = COUNTRY_INFO.get(biggest_game["away"], {}).get("name", biggest_game["away"])
                home_name = COUNTRY_INFO.get(biggest_game["home"], {}).get("name", biggest_game["home"])
                
                biggest_game_text = f"{away_name} {biggest_game['away_score']}-{biggest_game['home_score']} {home_name}"
            
            # Top performer text
            top_performer_text = ""
            if recap_data["top_performers"]:
                top = recap_data["top_performers"][0]
                country_name = COUNTRY_INFO.get(top["country"], {}).get("name", top["country"])
                
                if top["pos"] == "G":
                    perf_detail = f"{top['stats'].get('wins', 0)} win{'s' if top['stats'].get('wins', 0) != 1 else ''}, {top['stats'].get('saves', 0)} saves"
                else:
                    goals = top['stats'].get('goals', 0)
                    assists = top['stats'].get('assists', 0)
                    if goals > 0 and assists > 0:
                        perf_detail = f"{goals}G {assists}A"
                    elif goals > 0:
                        perf_detail = f"{goals} goal{'s' if goals != 1 else ''}"
                    elif assists > 0:
                        perf_detail = f"{assists} assist{'s' if assists != 1 else ''}"
                    else:
                        perf_detail = f"{top['fantasy_points']:.1f} fantasy points"
                
                top_performer_text = f"{top['name']} ({country_name}) led the day with {perf_detail}."
            
            # Standings change text
            standings_text = ""
            if recap_data["standings_changes"]:
                risers = recap_data["standings_changes"]["risers"]
                fallers = recap_data["standings_changes"]["fallers"]
                
                if risers:
                    top_riser = risers[0]
                    move_text = f"moved up {top_riser['rank_change']} spot{'s' if top_riser['rank_change'] != 1 else ''}"
                    standings_text = f"In Wally Cup standings, {top_riser['team']} {move_text}."
                
                if fallers:
                    top_faller = fallers[0]
                    drop_text = f"dropped {abs(top_faller['rank_change'])} spot{'s' if abs(top_faller['rank_change']) != 1 else ''}"
                    if standings_text:
                        standings_text += f" {top_faller['team']} {drop_text}."
                    else:
                        standings_text = f"In Wally Cup standings, {top_faller['team']} {drop_text}."
            
            # Combine into recap text
            recap_parts = [
                f"Day {(datetime.strptime(date, '%Y-%m-%d') - datetime.strptime(OLYMPIC_START_DATE, '%Y-%m-%d')).days + 1} featured {games_text}."
            ]
            
            if games:
                recap_parts.append(f"The highest-scoring affair was {biggest_game_text}.")
            
            if top_performer_text:
                recap_parts.append(top_performer_text)
            
            if standings_text:
                recap_parts.append(standings_text)
            
            recap_data["recap_text"] = " ".join(recap_parts)
            
            daily_recaps[date] = recap_data
        
        return daily_recaps

    def generate_standings_json(self) -> Dict:
        """Generate the complete standings JSON structure"""
        standings = self.calculate_roto_rankings()
        
        # Create teams structure matching the original format
        teams = {}
        for team_name, team_data in self.team_stats.items():
            # Add non-Olympic players to maintain full roster
            all_players = []
            
            # Add Olympic players with stats
            for player in team_data['players']:
                all_players.append(player)
            
            # Add non-Olympic players from original rosters
            for roster_player in self.rosters[team_name]:
                if roster_player['olympic_country'] is None:
                    # Check if already added
                    if not any(p['name'] == roster_player['name'] for p in all_players):
                        all_players.append({
                            'name': roster_player['name'],
                            'country': None,
                            'pos': roster_player['pos'],
                            'stats': None,
                            'status': 'not_in_olympics'
                        })
            
            teams[team_name] = {
                'players': all_players,
                'goalie_stats': team_data['goalie_stats'],
                'totals': team_data['totals']
            }
        
        # Generate schedule and daily recaps
        schedule = self.fetch_olympic_schedule()
        daily_recaps = self.compute_daily_recap(schedule)
        
        return {
            "updated_at": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            "tournament_status": "group_stage",
            "schedule": schedule,
            "country_status": self.create_country_status(schedule),
            "standings": standings,
            "standings_history": self.load_standings_history(),
            "daily_recaps": daily_recaps,
            "teams": teams,
            "country_names": {code: info["name"] for code, info in COUNTRY_INFO.items()},
            "flag_map": {code: info["flag"] for code, info in COUNTRY_INFO.items()},
            "all_olympic_players": list(self.all_olympic_players.values()),
            "hot_players": getattr(self, 'hot_players_summary', []),
            "cold_players": getattr(self, 'cold_players_summary', []),
            "milestones": getattr(self, 'milestones_summary', [])
        }

    def run(self):
        """Main execution method"""
        print("🏒 Starting Wally Cup Olympics stats fetch...")
        
        # Fetch all game boxscores
        for game_id in range(GAME_ID_START, GAME_ID_END + 1):
            boxscore = self.fetch_game_boxscore(game_id)
            if boxscore:
                self.process_game_boxscore(game_id, boxscore)
            time.sleep(0.1)  # Rate limiting
        
        # Calculate team totals
        print("📊 Calculating team totals...")
        self.calculate_team_totals()
        
        # Compute z-score rankings
        self.compute_zscore_rankings()
        
        # Compute hot players
        self.hot_players_summary = self.compute_hot_players()
        
        # Compute cold players
        self.cold_players_summary = self.compute_cold_players()
        
        # Compute milestones
        self.milestones_summary = self.compute_milestones()
        
        # Generate final standings JSON
        print("🏆 Generating standings...")
        standings_data = self.generate_standings_json()
        
        # Save daily snapshot before saving the main file
        self.save_daily_snapshot(standings_data['standings'])
        
        # Reload standings history to include the new snapshot
        standings_data['standings_history'] = self.load_standings_history()
        
        # Save to file
        with open(STANDINGS_PATH, 'w') as f:
            json.dump(standings_data, f, indent=2)
        
        print(f"✅ Standings saved to {STANDINGS_PATH}")
        
        # Print summary
        print("\n📈 Team Standings Summary:")
        for i, team in enumerate(standings_data['standings'][:5], 1):
            print(f"{i}. {team['team']}: {team['total_roto_points']:.1f} roto points")
        print("...")

def main():
    fetcher = StatsFetcher()
    fetcher.run()

if __name__ == "__main__":
    main()