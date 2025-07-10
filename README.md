# MLB Parlay Analyzer

A sophisticated sports betting analysis tool built with React, TypeScript, and Tailwind CSS. Designed for MLB initially but architected to support multiple sports.

## Features

- **Smart Correlation Detection**: Automatically prevents invalid bet combinations and highlights correlated bets
- **Conditional Probability Calculation**: Updates bet probabilities based on parlay context
- **Advanced Filtering**: Filter by bookmaker, teams, odds ranges, and use preset views
- **Dynamic Column Management**: Customize visible statistics per bet category
- **Momentum & Consistency Tracking**: Visual indicators for hot/cold streaks and reliability grades
- **Parlay Builder**: Real-time parlay construction with weak link detection and alternative suggestions
- **Saved Parlays**: Save and reload parlay combinations

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create data directory:**
   ```bash
   mkdir public/data
   ```

3. **Add your CSV files to `public/data/`:**
   - `mlb_teams_metadata.csv`
   - `mlb_players_metadata.csv`
   - `mlb_games_2025-07-06.csv`
   - `mlb_leg_metrics_2025_07_06.csv`
   - `mlb_bet_index_2025-07-06.json`

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   Navigate to `http://localhost:3000`

## Project Structure

```
src/
├── components/         # React components
│   ├── BetAnalysis/   # Main betting analysis views
│   ├── GameList/      # Game selection screen
│   ├── SavedParlays/  # Saved parlay management
│   └── common/        # Shared components
├── config/            # Configuration files
│   ├── columns.ts     # Column definitions
│   └── presets.ts     # Preset view configurations
├── store/             # Zustand state management
│   ├── dataStore.ts   # Data loading and caching
│   ├── filterStore.ts # Filter and view state
│   └── parlayStore.ts # Parlay management
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
│   ├── correlations.ts     # Bet correlation logic
│   ├── conditionalMetrics.ts # Probability calculations
│   ├── csvLoader.ts        # Data loading utilities
│   └── formatting.ts       # Display formatting
└── App.tsx            # Main application component
```

## Key Technologies

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible, unstyled components
- **Zustand** for state management
- **Papa Parse** for CSV parsing
- **date-fns** for date formatting

## Adding New Sports

The architecture supports easy addition of new sports:

1. Add sport-specific market types to `types/index.ts`
2. Update correlation rules in `utils/correlations.ts`
3. Add sport-specific columns to `config/columns.ts`
4. Update data loading logic in `utils/csvLoader.ts`

## Future Enhancements

- **Supabase Integration**: Replace CSV files with real-time database
- **Authentication**: User accounts and personalized settings
- **Advanced Analytics**: Historical performance tracking
- **Mobile App**: React Native version
- **Live Odds**: Real-time odds updates

## Development Notes

- Uses a dark theme optimized for data-heavy interfaces
- Mobile-first responsive design with horizontal scrolling for tables
- Emphasizes performance with memoization and efficient rendering
- Accessible components with keyboard navigation and screen reader support