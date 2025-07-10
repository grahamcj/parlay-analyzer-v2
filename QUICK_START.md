# MLB Parlay Analyzer - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Data Files
Create the data directory:
```bash
mkdir -p public/data
```

Copy your CSV files to `public/data/`:
- `mlb_teams_metadata.csv`
- `mlb_players_metadata.csv`
- `mlb_games_20250706.csv`
- `mlb_leg_metrics_2025_07_06.csv`
- `mlb_bet_index_2025-07-06.json`

### 3. Start the App
```bash
npm run dev
```

### 4. Open in Browser
Go to http://localhost:3000

## 🎯 Key Features

### Building Parlays
1. Click on any game from the home screen
2. Click on bets to add them to your parlay
3. Invalid combinations are automatically hidden
4. Watch hit rates update based on correlations
5. Save your parlay for later

### Using Presets
- **Top EV Bets**: Shows positive expected value bets
- **Hot Hand**: Players/teams on winning streaks
- **Safe Anchors**: Reliable bets with high consistency
- **Value Underdogs**: Plus-money bets with edge
- **Big Boosters**: Best parlay combinations (requires active parlay)

### Customizing Views
- Click "Columns" to show/hide statistics
- Use "Show Filters" to filter by team, odds, etc.
- Sort any column by clicking the header

## 📊 Understanding the Data

### Momentum Indicators
- 🔥🔥🔥 = Very hot (20%+ above average)
- 🔥🔥 = Hot (10-20% above average)
- 🔥 = Warm (5-10% above average)
- = = Neutral
- ❄️ = Cold (5-10% below average)
- ❄️❄️ = Very cold (10%+ below average)

### Consistency Grades
- **A+/A/A-**: Very consistent performance
- **B+/B/B-**: Generally reliable
- **C+/C/C-**: Average consistency
- **D/F**: Highly variable/unpredictable

### Hit Rate Windows
- **L30/L15/L7**: Last 30/15/7 games (for teams/batters)
- **L5/L3/L2**: Last 5/3/2 starts (for pitchers)
- **vs SP**: Performance against today's starting pitcher
- **vs Hand**: Performance against pitcher handedness

## 🛠️ Troubleshooting

### No data showing?
- Check that CSV files are named exactly as specified
- Look at browser console for errors
- Verify data format matches examples in SETUP.md

### Parlay not updating?
- Some bets block others (e.g., HR blocks Hits for same player)
- Check for weak link warnings
- Try removing and re-adding bets

### Performance issues?
- Filter to show fewer bets
- Close unused browser tabs
- Try Chrome/Edge for best performance

## 📱 Mobile Usage
- Tables scroll horizontally - swipe to see all columns
- Tap bets to add/remove from parlay
- Parlay panel minimizes to save space

## 🔗 Next Steps
- Read the full README.md for detailed documentation
- Check SETUP.md for data format specifications
- Explore the code to customize for your needs

Happy betting analysis! 🎰