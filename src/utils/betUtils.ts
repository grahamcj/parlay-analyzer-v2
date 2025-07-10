import { LegMetric, Game } from '../types';

// Categorize a bet based on its market and selection
export const getBetCategory = (bet: LegMetric, game?: Game): 'game' | 'pitcher' | 'batter' => {
  // Game-level markets
  if (['h2h', 'spreads', 'totals'].includes(bet.market)) {
    return 'game';
  }
  
  // Pitcher markets (by prefix)
  if (bet.market.startsWith('pitcher_')) {
    return 'pitcher';
  }
  
  // Check if selection matches a starting pitcher
  if (game && bet.selection) {
    if (bet.selection === game.home_sp || bet.selection === game.away_sp) {
      return 'pitcher';
    }
  }
  
  // Default to batter for all other props
  return 'batter';
};

// Group bets by category
export const groupBetsByCategory = (bets: LegMetric[], game?: Game) => {
  const gameBets: LegMetric[] = [];
  const pitcherBets: LegMetric[] = [];
  const batterBets: LegMetric[] = [];

  bets.forEach(bet => {
    const category = getBetCategory(bet, game);
    
    switch (category) {
      case 'game':
        gameBets.push(bet);
        break;
      case 'pitcher':
        pitcherBets.push(bet);
        break;
      case 'batter':
        batterBets.push(bet);
        break;
    }
  });

  return { gameBets, pitcherBets, batterBets };
};

// Check if a bet is for a specific team
export const isBetForTeam = (bet: LegMetric, teamName: string): boolean => {
  return bet.selection === teamName || 
         bet.home_team === teamName || 
         bet.away_team === teamName;
};

// Check if a bet is for a specific player
export const isBetForPlayer = (bet: LegMetric, playerName: string): boolean => {
  return bet.selection === playerName;
};

// Get display name for market
export const getMarketDisplayName = (market: string): string => {
  const marketMap: Record<string, string> = {
    'h2h': 'Moneyline',
    'spreads': 'Run Line',
    'totals': 'Total Runs',
    'batter_hits': 'Hits',
    'batter_home_runs': 'Home Runs',
    'batter_runs': 'Runs Scored',
    'batter_rbis': 'RBIs',
    'batter_total_bases': 'Total Bases',
    'batter_stolen_bases': 'Stolen Bases',
    'pitcher_strikeouts': 'Strikeouts',
    'pitcher_outs': 'Outs Recorded',
    'pitcher_hits_allowed': 'Hits Allowed',
    'pitcher_earned_runs': 'Earned Runs'
  };
  
  return marketMap[market] || market
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};