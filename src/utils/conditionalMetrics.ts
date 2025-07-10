import { LegMetric, BetIndexEntry } from '../types';
import { getCorrelationStrength } from './correlations';

interface ConditionalMetricsResult {
  updatedBets: LegMetric[];
  weakLinks: string[];
  betterAlternatives: Map<string, LegMetric[]>;
}

// Calculate conditional metrics for all bets given current parlay selections
export const calculateConditionalMetrics = (
  availableBets: LegMetric[],
  selectedBets: LegMetric[],
  betIndex: Record<string, BetIndexEntry>
): ConditionalMetricsResult => {
  if (selectedBets.length === 0) {
    // No conditioning needed, return original bets
    return {
      updatedBets: availableBets.map(bet => ({
        ...bet,
        conditionalHitRate: bet.blended_hit_rate,
        parlayBoost: 0,
        isWeakLink: false,
        betterAlternatives: []
      })),
      weakLinks: [],
      betterAlternatives: new Map()
    };
  }
  
  const updatedBets: LegMetric[] = [];
  const weakLinks: string[] = [];
  const betterAlternatives = new Map<string, LegMetric[]>();
  
  // Calculate conditional hit rates for each available bet
  for (const bet of availableBets) {
    const conditionalRate = calculateConditionalHitRate(bet, selectedBets, betIndex);
    const baseRate = bet.blended_hit_rate || bet.hit_rate;
    const parlayBoost = ((conditionalRate - baseRate) / baseRate) * 100;
    
    const updatedBet: LegMetric = {
      ...bet,
      conditionalHitRate: conditionalRate,
      parlayBoost,
      isWeakLink: false,
      betterAlternatives: []
    };
    
    updatedBets.push(updatedBet);
  }
  
  // Calculate conditional rates for selected bets to identify weak links
  for (const selectedBet of selectedBets) {
    const otherBets = selectedBets.filter(b => b.leg_id !== selectedBet.leg_id);
    const conditionalRate = calculateConditionalHitRate(selectedBet, otherBets, betIndex);
    const baseRate = selectedBet.blended_hit_rate || selectedBet.hit_rate;

    console.log('Weak link check:', {
      betId: selectedBet.leg_id,
      baseRate,
      conditionalRate,
      threshold: baseRate * 0.9,
      isWeak: conditionalRate < baseRate * 0.9
    });
    
    // If conditional rate drops significantly (below 80% of original), mark as weak link
    if (conditionalRate < baseRate * 0.9) {
      weakLinks.push(selectedBet.leg_id);
      
      // Find better alternatives for weak links
      const alternatives = findBetterAlternatives(selectedBet, otherBets, availableBets, betIndex);
      if (alternatives.length > 0) {
        betterAlternatives.set(selectedBet.leg_id, alternatives);
      }
    }
  }
  
  // Mark weak links in updated bets
  updatedBets.forEach(bet => {
    if (weakLinks.includes(bet.leg_id)) {
      bet.isWeakLink = true;
      bet.betterAlternatives = betterAlternatives.get(bet.leg_id) || [];
    }
  });
  
  return { updatedBets, weakLinks, betterAlternatives };
};

// Calculate conditional hit rate for a bet given other selected bets
const calculateConditionalHitRate = (
  bet: LegMetric,
  conditionBets: LegMetric[],
  betIndex: Record<string, BetIndexEntry>
): number => {
  if (bet.leg_id === 'Spencer_Torkelson_HITS_OVER_0_5') {
    console.log('Bet Index Entry:', betIndex[bet.leg_id]);
  }

  if (conditionBets.length === 0) {
    return bet.blended_hit_rate || bet.hit_rate;
  }
  
  // Get historical game data for this bet
  const betHistory = betIndex[bet.leg_id];
  if (!betHistory || !betHistory.hit_games || !Array.isArray(betHistory.hit_games)) {
    console.log('No bet history, using estimate for:', bet.leg_id);
    // Fallback to correlation-based estimation
    return estimateConditionalRate(bet, conditionBets);
  }
  
  // Find games where all condition bets hit
  let conditionHitGames = new Set<string>();
  let initialized = false;
  
  for (const conditionBet of conditionBets) {
    const conditionHistory = betIndex[conditionBet.leg_id];
    if (!conditionHistory || !conditionHistory.hit_games || !Array.isArray(conditionHistory.hit_games)) continue;
    
    const hitGamesSet = new Set(conditionHistory.hit_games);
    
    if (!initialized) {
      conditionHitGames = hitGamesSet;
      initialized = true;
    } else {
      // Intersection of hit games
      conditionHitGames = new Set(
        Array.from(conditionHitGames).filter(game => hitGamesSet.has(game))
      );
    }
  }
  
  if (!initialized || conditionHitGames.size === 0) {
    // No historical data, use correlation estimation
    return estimateConditionalRate(bet, conditionBets);
  }
  
  // Calculate hit rate within condition games
  const betHitGamesSet = new Set(betHistory.hit_games);
  const conditionalHits = Array.from(conditionHitGames).filter(game => betHitGamesSet.has(game)).length;
  const conditionalRate = conditionalHits / conditionHitGames.size;
  
  // Blend with correlation estimate for stability
  const correlationEstimate = estimateConditionalRate(bet, conditionBets);
  const blendWeight = Math.min(conditionHitGames.size / 20, 1); // More weight with more data
  
  return conditionalRate * blendWeight + correlationEstimate * (1 - blendWeight);
};

// Estimate conditional rate based on correlations
const estimateConditionalRate = (bet: LegMetric, conditionBets: LegMetric[]): number => {
  const baseRate = bet.blended_hit_rate || bet.hit_rate;
  let adjustment = 0;
  
  for (const conditionBet of conditionBets) {
    const correlation = getCorrelationStrength(bet, conditionBet);
    // Adjust rate based on correlation (positive increases, negative decreases)
    adjustment += correlation * 0.1; // 10% adjustment per unit of correlation
  }
  
  // Apply adjustment with bounds
  const adjustedRate = baseRate * (1 + adjustment);
  return Math.max(0.01, Math.min(0.99, adjustedRate));
};

// Find better alternatives for a weak link bet
const findBetterAlternatives = (
  weakBet: LegMetric,
  otherBets: LegMetric[],
  availableBets: LegMetric[],
  betIndex: Record<string, BetIndexEntry>
): LegMetric[] => {
  // Look for similar bets (same player/team, similar market)
  const alternatives = availableBets.filter(bet => {
    // Same bookmaker
    if (bet.bookmaker !== weakBet.bookmaker) return false;
    
    // Same game
    if (bet.game_id !== weakBet.game_id) return false;
    
    // Same selection (player/team)
    if (bet.selection !== weakBet.selection) return false;
    
    // Similar market type
    const weakMarketBase = weakBet.market.split('_').slice(0, 2).join('_');
    const betMarketBase = bet.market.split('_').slice(0, 2).join('_');
    if (weakMarketBase !== betMarketBase) return false;
    
    // Different line
    if (bet.line_value === weakBet.line_value) return false;
    
    return true;
  });
  
  // Calculate conditional rates for alternatives
  const alternativesWithRates = alternatives.map(alt => {
    const conditionalRate = calculateConditionalHitRate(alt, otherBets, betIndex);
    return {
      bet: alt,
      improvement: conditionalRate - (weakBet.conditionalHitRate || weakBet.blended_hit_rate)
    };
  });
  
  // Sort by improvement and return top 3
  return alternativesWithRates
    .filter(alt => alt.improvement > 0.05) // At least 5% improvement
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 3)
    .map(alt => alt.bet);
};

// Calculate overall parlay probability
export const calculateParlayProbability = (
  legs: LegMetric[],
  betIndex: Record<string, BetIndexEntry>
): number => {
  if (legs.length === 0) return 0;
  if (legs.length === 1) return legs[0].blended_hit_rate || legs[0].hit_rate;
  
  // Calculate conditional probability chain
  let probability = legs[0].blended_hit_rate || legs[0].hit_rate;
  
  for (let i = 1; i < legs.length; i++) {
    const previousLegs = legs.slice(0, i);
    const conditionalRate = calculateConditionalHitRate(legs[i], previousLegs, betIndex);
    probability *= conditionalRate;
  }
  
  return probability;
};