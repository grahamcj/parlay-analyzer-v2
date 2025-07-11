import { LegMetric, BetIndexEntry, Player, Team } from '../types';
import { getTeamForBet, areBetsFromSameTeam, areBetsFromOpposingTeams } from './teamResolver';

// Configurable weak link threshold
const WEAK_LINK_THRESHOLD = 0.8; // 80% of base rate

interface ConditionalMetricsResult {
  updatedBets: LegMetric[];
  weakLinks: string[];
  betterAlternatives: Map<string, LegMetric[]>;
}

// Helper to check if bet is a game total
const isGameTotal = (bet: LegMetric): boolean => {
  return bet.market === 'totals';
};

// Helper to check if bet is a team bet (ML or spread)
const isTeamBet = (bet: LegMetric): boolean => {
  return bet.market === 'h2h' || bet.market === 'spreads';
};

// Helper to check if bet is a pitcher prop
const isPitcherProp = (bet: LegMetric): boolean => {
  return bet.market.startsWith('pitcher_');
};

// Helper to check if bet is a batter prop
const isBatterProp = (bet: LegMetric): boolean => {
  return bet.market.startsWith('batter_');
};

// Replace your areBetsCorrelated function with this fixed version:

// Determine if two bets are correlated based on the rules
const areBetsCorrelated = (
  bet1: LegMetric, 
  bet2: LegMetric,
  players: Player[],
  teams: Team[]
): boolean => {
  // Must be same game
  if (bet1.game_id !== bet2.game_id) return false;
  
  // Rule 1: Game totals correlate with everything in the game
  if (isGameTotal(bet1) || isGameTotal(bet2)) {
    return true;
  }
  
  // Check both directions without recursion
  return checkCorrelationOneWay(bet1, bet2, players, teams) || 
         checkCorrelationOneWay(bet2, bet1, players, teams);
};

// Helper function to check correlation in one direction
const checkCorrelationOneWay = (
  bet1: LegMetric, 
  bet2: LegMetric,
  players: Player[],
  teams: Team[]
): boolean => {
  // Rule 2: ML/spread correlates with:
  // - Pitcher props for same team
  // - Batter props for same team
  if (isTeamBet(bet1)) {
    if (isPitcherProp(bet2) || isBatterProp(bet2)) {
      return areBetsFromSameTeam(bet1, bet2, players, teams);
    }
  }
  
  // Rule 3: Pitcher props correlate with:
  // - ML/spread for their team
  // - Batter props for OPPOSING team
  if (isPitcherProp(bet1)) {
    if (isTeamBet(bet2)) {
      return areBetsFromSameTeam(bet1, bet2, players, teams);
    }
    if (isBatterProp(bet2)) {
      return areBetsFromOpposingTeams(bet1, bet2, players, teams);
    }
  }
  
  // Rule 4: Batter props correlate with:
  // - ML/spread for their team
  // - Other batter props for SAME team
  // - Pitcher props for OPPOSING team
  if (isBatterProp(bet1)) {
    if (isTeamBet(bet2)) {
      return areBetsFromSameTeam(bet1, bet2, players, teams);
    }
    if (isBatterProp(bet2)) {
      return areBetsFromSameTeam(bet1, bet2, players, teams);
    }
    if (isPitcherProp(bet2)) {
      return areBetsFromOpposingTeams(bet1, bet2, players, teams);
    }
  }
  
  return false;
};

// Calculate conditional metrics for all bets given current parlay selections
export const calculateConditionalMetrics = (
  availableBets: LegMetric[],
  selectedBets: LegMetric[],
  betIndex: Record<string, BetIndexEntry>,
  players: Player[],
  teams: Team[]
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
    // Check if this bet is correlated with any selected bet
    const hasCorrelation = selectedBets.some(selectedBet => 
      areBetsCorrelated(bet, selectedBet, players, teams)
    );
    
    let updatedBet: LegMetric;
    
    if (hasCorrelation) {
      // Only calculate conditional rate for correlated bets
      const conditionalRate = calculateConditionalHitRate(bet, selectedBets, betIndex, players, teams);
      const baseRate = bet.blended_hit_rate || bet.hit_rate;
      const parlayBoost = ((conditionalRate - baseRate) / baseRate) * 100;
      
      updatedBet = {
        ...bet,
        conditionalHitRate: conditionalRate,
        parlayBoost,
        isWeakLink: false,
        betterAlternatives: []
      };
    } else {
      // No correlation - keep original values
      updatedBet = {
        ...bet,
        conditionalHitRate: bet.blended_hit_rate || bet.hit_rate,
        parlayBoost: 0,
        isWeakLink: false,
        betterAlternatives: []
      };
    }
    
    updatedBets.push(updatedBet);
  }
  
  // Calculate conditional rates for selected bets to identify weak links
  for (const selectedBet of selectedBets) {
    const otherBets = selectedBets.filter(b => b.leg_id !== selectedBet.leg_id);
    const conditionalRate = calculateConditionalHitRate(selectedBet, otherBets, betIndex, players, teams);
    const baseRate = selectedBet.blended_hit_rate || selectedBet.hit_rate;
    
    // If conditional rate drops below threshold (80% of original), mark as weak link
    if (conditionalRate < baseRate * WEAK_LINK_THRESHOLD) {
      weakLinks.push(selectedBet.leg_id);
      
      // Find better alternatives for weak links
      const alternatives = findBetterAlternatives(selectedBet, otherBets, availableBets, betIndex, players, teams);
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
export const calculateConditionalHitRate = (
  bet: LegMetric,
  conditionBets: LegMetric[],
  betIndex: Record<string, BetIndexEntry>,
  players: Player[],
  teams: Team[]
): number => {
  // Filter out self from condition bets
  const filteredConditionBets = conditionBets.filter(b => b.leg_id !== bet.leg_id);
  
  if (filteredConditionBets.length === 0) {
    return bet.blended_hit_rate || bet.hit_rate;
  }
  
  // Only consider correlated bets for conditioning
  const correlatedConditionBets = filteredConditionBets.filter(conditionBet =>
    areBetsCorrelated(bet, conditionBet, players, teams)
  );
  
  if (correlatedConditionBets.length === 0) {
    return bet.blended_hit_rate || bet.hit_rate;
  }
  
  // Get historical game data for this bet
  const betHistory = betIndex[bet.leg_id];
  if (!betHistory || !betHistory.hit_games || !Array.isArray(betHistory.hit_games)) {
    // Fallback to correlation-based estimation
    return estimateConditionalRate(bet, correlatedConditionBets);
  }
  
  // Find games where all condition bets hit
  let conditionHitGames = new Set<string>();
  let initialized = false;
  
  for (const conditionBet of correlatedConditionBets) {
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
    return estimateConditionalRate(bet, correlatedConditionBets);
  }
  
  // Calculate hit rate within condition games
  const betHitGamesSet = new Set(betHistory.hit_games);
  const conditionalHits = Array.from(conditionHitGames).filter(game => betHitGamesSet.has(game)).length;
  const conditionalRate = conditionalHits / conditionHitGames.size;
  
  // Blend with correlation estimate for stability
  const correlationEstimate = estimateConditionalRate(bet, correlatedConditionBets);
  const blendWeight = Math.min(conditionHitGames.size / 20, 1); // More weight with more data
  
  return conditionalRate * blendWeight + correlationEstimate * (1 - blendWeight);
};

// Estimate conditional rate based on correlations
const estimateConditionalRate = (bet: LegMetric, conditionBets: LegMetric[]): number => {
  const baseRate = bet.blended_hit_rate || bet.hit_rate;
  let adjustment = 0;
  
  for (const conditionBet of conditionBets) {
    // Simple correlation strength based on bet types
    let correlation = 0.1; // Default positive correlation
    
    // Game totals have stronger correlation
    if (isGameTotal(conditionBet)) {
      correlation = 0.2;
    }
    
    // Adjust rate based on correlation
    adjustment += correlation;
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
  betIndex: Record<string, BetIndexEntry>,
  players: Player[],
  teams: Team[]
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
    const conditionalRate = calculateConditionalHitRate(alt, otherBets, betIndex, players, teams);
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
  betIndex: Record<string, BetIndexEntry>,
  players: Player[],
  teams: Team[]
): number => {
  if (legs.length === 0) return 0;
  if (legs.length === 1) return legs[0].blended_hit_rate || legs[0].hit_rate;
  
  // Calculate conditional probability chain
  let probability = legs[0].blended_hit_rate || legs[0].hit_rate;
  
  for (let i = 1; i < legs.length; i++) {
    const previousLegs = legs.slice(0, i);
    const conditionalRate = calculateConditionalHitRate(legs[i], previousLegs, betIndex, players, teams);
    probability *= conditionalRate;
  }
  
  return probability;
};