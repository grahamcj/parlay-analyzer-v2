import { LegMetric, Correlation } from '../types';

// MLB Correlation Rules based on the Excel sheet
const MLB_CORRELATIONS: Correlation[] = [
  // Home Runs automatically include hits, runs, RBIs, and 4+ total bases
  { betType1: 'batter_home_runs', team1: 'same', betType2: 'batter_hits', team2: 'same', type: 'blocks' },
  { betType1: 'batter_home_runs', team1: 'same', betType2: 'batter_runs', team2: 'same', type: 'blocks' },
  { betType1: 'batter_home_runs', team1: 'same', betType2: 'batter_rbis', team2: 'same', type: 'blocks' },
  { betType1: 'batter_home_runs', team1: 'same', betType2: 'batter_total_bases', team2: 'same', type: 'blocks' },
  
  // Multiple hits blocks single hit
  { betType1: 'batter_hits', team1: 'same', betType2: 'batter_hits', team2: 'same', type: 'blocks' },
  
  // Team totals and moneylines
  { betType1: 'h2h', team1: 'same', betType2: 'spreads', team2: 'same', type: 'blocks' },
  { betType1: 'totals', team1: 'same', betType2: 'totals', team2: 'same', type: 'blocks' },
  
  // Positive correlations
  { betType1: 'totals', team1: 'any', betType2: 'batter_hits', team2: 'same', type: 'positive', strength: 0.3 },
  { betType1: 'totals', team1: 'any', betType2: 'batter_runs', team2: 'same', type: 'positive', strength: 0.4 },
  { betType1: 'totals', team1: 'any', betType2: 'batter_rbis', team2: 'same', type: 'positive', strength: 0.35 },
  
  // Negative correlations
  { betType1: 'totals', team1: 'any', betType2: 'pitcher_strikeouts', team2: 'any', type: 'negative', strength: -0.3 },
  { betType1: 'pitcher_strikeouts', team1: 'same', betType2: 'batter_hits', team2: 'opposing', type: 'negative', strength: -0.4 },
];

// Check if two bets are from the same player
const isSamePlayer = (bet1: LegMetric, bet2: LegMetric): boolean => {
  return bet1.selection === bet2.selection && bet1.game_id === bet2.game_id;
};

// Check if two bets are from the same team
const isSameTeam = (bet1: LegMetric, bet2: LegMetric): boolean => {
  return bet1.selection === bet2.selection && bet1.game_id === bet2.game_id;
};

// Check if two bets are from opposing teams
const isOpposingTeam = (bet1: LegMetric, bet2: LegMetric): boolean => {
  if (bet1.game_id !== bet2.game_id) return false;
  
  const bet1Home = bet1.selection === bet1.home_team;
  const bet2Home = bet2.selection === bet2.home_team;
  
  return bet1Home !== bet2Home;
};

// Extract base market from market string (e.g., "batter_hits_over_0.5" -> "batter_hits")
const getBaseMarket = (market: string): string => {
  return market.split('_').slice(0, 2).join('_');
};

// Check if bet matches correlation rule
const matchesCorrelation = (bet: LegMetric, correlation: Correlation, side: 'betType1' | 'betType2'): boolean => {
  const betMarket = getBaseMarket(bet.market);
  const correlationMarket = side === 'betType1' ? correlation.betType1 : correlation.betType2;
  const correlationTeam = side === 'betType1' ? correlation.team1 : correlation.team2;
  
  if (betMarket !== correlationMarket) return false;
  
  // Team requirements don't apply for this single bet check
  return true;
};

// Check if two bets violate correlation rules (blocking)
export const areBetsBlocked = (bet1: LegMetric, bet2: LegMetric): boolean => {
  // Same game requirement for most correlations
  if (bet1.game_id !== bet2.game_id) return false;
  
  // Check each blocking correlation rule
  for (const correlation of MLB_CORRELATIONS) {
    if (correlation.type !== 'blocks') continue;
    
    // Check both directions
    if (matchesCorrelation(bet1, correlation, 'betType1') && 
        matchesCorrelation(bet2, correlation, 'betType2')) {
      
      // Check team requirements
      if (correlation.team1 === 'same' && correlation.team2 === 'same') {
        if (isSamePlayer(bet1, bet2) || isSameTeam(bet1, bet2)) return true;
      } else if (correlation.team1 === 'opposing' && correlation.team2 === 'opposing') {
        if (isOpposingTeam(bet1, bet2)) return true;
      }
    }
    
    // Check reverse direction
    if (matchesCorrelation(bet2, correlation, 'betType1') && 
        matchesCorrelation(bet1, correlation, 'betType2')) {
      
      // Check team requirements
      if (correlation.team1 === 'same' && correlation.team2 === 'same') {
        if (isSamePlayer(bet1, bet2) || isSameTeam(bet1, bet2)) return true;
      } else if (correlation.team1 === 'opposing' && correlation.team2 === 'opposing') {
        if (isOpposingTeam(bet1, bet2)) return true;
      }
    }
  }
  
  // Additional checks for same player/same stat
  if (isSamePlayer(bet1, bet2) && getBaseMarket(bet1.market) === getBaseMarket(bet2.market)) {
    // Can't bet over and under on same stat
    if ((bet1.side === 'Over' && bet2.side === 'Under') || 
        (bet1.side === 'Under' && bet2.side === 'Over')) {
      return true;
    }
    
    // Can't bet different lines of same stat (e.g., Over 0.5 and Over 1.5)
    return true;
  }
  
  return false;
};

// Get correlation strength between two bets
export const getCorrelationStrength = (bet1: LegMetric, bet2: LegMetric): number => {
  // Same game requirement for most correlations
  if (bet1.game_id !== bet2.game_id) return 0;
  
  for (const correlation of MLB_CORRELATIONS) {
    if (correlation.type === 'blocks') continue;
    
    // Check both directions
    if (matchesCorrelation(bet1, correlation, 'betType1') && 
        matchesCorrelation(bet2, correlation, 'betType2')) {
      
      // Check team requirements
      if (correlation.team1 === 'same' && correlation.team2 === 'same') {
        if (isSamePlayer(bet1, bet2) || isSameTeam(bet1, bet2)) {
          return correlation.strength || 0;
        }
      } else if (correlation.team1 === 'opposing' && correlation.team2 === 'opposing') {
        if (isOpposingTeam(bet1, bet2)) {
          return correlation.strength || 0;
        }
      } else if (correlation.team1 === 'any' || correlation.team2 === 'any') {
        return correlation.strength || 0;
      }
    }
  }
  
  return 0;
};

// Filter out blocked bets from available options
export const filterBlockedBets = (availableBets: LegMetric[], selectedBets: LegMetric[]): LegMetric[] => {
  return availableBets.filter(bet => {
    for (const selectedBet of selectedBets) {
      if (areBetsBlocked(bet, selectedBet)) {
        return false;
      }
    }
    return true;
  });
};

// Calculate parlay correlation factor
export const calculateParlayCorrelation = (legs: LegMetric[]): number => {
  if (legs.length < 2) return 1;
  
  let totalCorrelation = 0;
  let pairCount = 0;
  
  for (let i = 0; i < legs.length; i++) {
    for (let j = i + 1; j < legs.length; j++) {
      const strength = getCorrelationStrength(legs[i], legs[j]);
      totalCorrelation += strength;
      pairCount++;
    }
  }
  
  // Average correlation across all pairs
  const avgCorrelation = pairCount > 0 ? totalCorrelation / pairCount : 0;
  
  // Convert to multiplier (1 = no correlation, >1 = positive, <1 = negative)
  return 1 + avgCorrelation;
};