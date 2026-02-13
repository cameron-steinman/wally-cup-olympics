# Scripts

This directory contains the backend scripts that power the Wally Cup Olympics website.

## fetch-stats.py

The main data collection script that fetches NHL game stats and processes them for Olympic rosters.

### What it does:
- Fetches NHL game data from the NHL API (api-web.nhle.com)
- Processes player statistics for Olympic rosters
- Generates standings and team statistics
- Handles name normalization and player matching
- Creates snapshot data for archival purposes
- Updates site data in real-time during games

### Input files:
- `rosters.json` - Olympic team rosters mapping NHL players to countries
- `olympic_power_rankings.json` - Team power rankings data
- `name_overrides.json` - Manual overrides for player name matching

### Output:
- `../site/public/data/standings.json` - Current team standings and stats
- `../snapshots/` - Historical game snapshots
- `../db/games/` - Game database files

### How to run:

#### Setup (first time):
```bash
cd scripts/
python3 -m venv venv
source venv/bin/activate
pip install requests
```

#### Normal usage:
```bash
cd scripts/
source venv/bin/activate
./fetch-stats.py
```

### Cron Schedule:
The script is typically run every 15 minutes during game times via cron:
```
*/15 * * * * cd /Users/cams_macmini/.openclaw/workspace/wally-cup && source venv/bin/activate && ./fetch-stats.py
```

### Configuration:
- Game ID range: 2025090001-2025090022 (preseason games)
- Olympic date range: Feb 11-22, 2026
- Workspace path: `/Users/cams_macmini/.openclaw/workspace/wally-cup`

### Dependencies:
- Python 3.x
- requests library
- Standard library modules (json, datetime, statistics, etc.)

The script is designed to be robust and handle API failures gracefully while maintaining data consistency for the live website.