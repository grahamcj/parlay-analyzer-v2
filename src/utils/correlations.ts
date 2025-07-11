import { LegMetric } from '../types';

// Check if two bets should be blocked (can't be in same parlay)
export const areBetsBlocked = (bet1: LegMetric, bet2: LegMetric): boolean => {
  // Same game requirement
  if (bet1.game_id !== bet2.game_id) return false;
  
  // Can't bet both sides of a moneyline
  if (bet1.market === 'h2h' && bet2.market === 'h2h') {
    return bet1.selection !== bet2.selection;
  }
  
  // Can't bet both sides of a spread
  if (bet1.market === 'spreads' && bet2.market === 'spreads') {
    return bet1.selection !== bet2.selection;
  }
  
  // Can't bet over and under on same total
  if (bet1.market === 'totals' && bet2.market === 'totals') {
    return bet1.side !== bet2.side;
  }
  
  // Can't bet different lines on same player prop
  if (bet1.selection === bet2.selection && bet1.market === bet2.market) {
    return true;
  }
  
  // Additional check for same player/same stat but different lines
  if (bet1.selection === bet2.selection && bet1.game_id === bet2.game_id) {
    const market1Base = bet1.market.split('_').slice(0, 2).join('_');
    const market2Base = bet2.market.split('_').slice(0, 2).join('_');
    
    // Same player, same stat type (e.g., both are batter_hits)
    if (market1Base === market2Base) {
      return true;
    }
  }
  
  return false;
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

// Get correlation strength between two bets
// Note: This is now mainly handled in conditionalMetrics.ts with proper team resolution
export const getCorrelationStrength = (bet1: LegMetric, bet2: LegMetric): number => {
  // Must be same game
  if (bet1.game_id !== bet2.game_id) return 0;
  
  // Game totals correlate with everything
  if (bet1.market === 'totals' || bet2.market === 'totals') {
    return 0.2;
  }
  
  // Default to no correlation - proper correlation is handled in conditionalMetrics
  return 0;
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