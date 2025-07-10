# MLB Parlay Analyzer - Setup Guide

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd parlay-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up data files**
   
   Create a `public/data` directory and add your CSV files:
   ```bash
   mkdir -p public/data
   ```
   
   Required files:
   - `mlb_teams_metadata.csv` - Team information
   - `mlb_players_metadata.csv` - Player information
   - `mlb_games_20250706.csv` - Game schedule
   - `mlb_leg_metrics_2025_07_06.csv` - Betting data
   - `mlb_bet_index_2025-07-06.json` - Historical bet outcomes

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to http://localhost:3000

## Data File Formats

### mlb_teams_metadata.csv
```csv
TEAM_ID,TEAM_CODE,TEAM_NAME,TEAM_CITY,TEAM_NICKNAME
1,NYY,New York Yankees,New York,Yankees
```

### mlb_players_metadata.csv
```csv
PLAYER_ID,FIRST_NAME,LAST_NAME,POSITION,JERSEY_NUMBER,TEAM_CODE,TEAM_ID
1,Aaron,Judge,OF,99,NYY,1
```

### mlb_games_20250706.csv
```csv
game_id,game_date,game_time,game_type,status,home_team_id,home_team_name,home_sp,home_sp_hand,away_team_id,away_team_name,away_sp,away_sp_hand
1,2025-07-06,19:05,Regular,scheduled,1,New York Yankees,Gerrit Cole,R,2,Boston Red Sox,Chris Sale,L
```

### mlb_leg_metrics_2025_07_06.csv
The main betting data file with all available props and their statistics.

### mlb_bet_index_2025-07-06.json
```json
{
  "BET_INDEX": {
    "leg_id_1": {
      "game_id": "1",
      "hit_games": ["game1", "game2"],
      "miss_games": ["game3"]
    }
  }
}
```

## Troubleshooting

### Data not loading
- Check that all CSV files are in `public/data/`
- Verify file names match exactly (case-sensitive)
- Check browser console for specific error messages

### Build errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Make sure you're using Node.js 16+ and npm 7+

### Styling issues
- Run `npm run build` to ensure Tailwind processes all classes
- Check that PostCSS is configured correctly

## Development Tips

- Use the browser's React Developer Tools to inspect component state
- The Zustand devtools can help debug store state
- Network tab shows which data files are being loaded

## Adding Your Own Data

1. Export data in the required CSV format
2. Place files in `public/data/`
3. Update file names in `src/utils/csvLoader.ts` if needed
4. Restart the dev server

## Deployment

Build for production:
```bash
npm run build
```

The `dist` folder will contain the static files ready for deployment.