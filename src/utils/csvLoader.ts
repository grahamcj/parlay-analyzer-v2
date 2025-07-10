import Papa from 'papaparse';
import { Team, Player, Game, LegMetric, BetIndexEntry } from '../types';

// Helper to find files by pattern
export const findFileByPattern = async (pattern: string): Promise<string | null> => {
  try {
    // In production, this would fetch from a server endpoint
    // For now, we'll use static imports
    const files = {
      teams: '/data/mlb_teams_metadata.csv',
      players: '/data/mlb_players_metadata.csv',
      games: '/data/mlb_games_2025-07-06.csv',
      leg_metrics: '/data/mlb_leg_metrics_2025_07_06.csv',
      bet_index: '/data/mlb_bet_index_2025-07-06.json'
    };
    
    if (pattern === 'teams') return files.teams;
    if (pattern === 'players') return files.players;
    if (pattern.includes('games')) return files.games;
    if (pattern.includes('leg_metrics')) return files.leg_metrics;
    if (pattern.includes('bet_index')) return files.bet_index;
    
    return null;
  } catch (error) {
    console.error('Error finding file:', error);
    return null;
  }
};

// Generic CSV parser
export const parseCSV = <T>(content: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        resolve(results.data as T[]);
      },
      error: (error: Error) => reject(error)
    });
  });
};

// Load teams data
export const loadTeams = async (): Promise<Team[]> => {
  const filePath = await findFileByPattern('teams');
  if (!filePath) throw new Error('Teams file not found');
  
  const response = await fetch(filePath);
  const text = await response.text();
  return parseCSV<Team>(text);
};

// Load players data
export const loadPlayers = async (): Promise<Player[]> => {
  const filePath = await findFileByPattern('players');
  if (!filePath) throw new Error('Players file not found');
  
  const response = await fetch(filePath);
  const text = await response.text();
  return parseCSV<Player>(text);
};

// Load games data
export const loadGames = async (): Promise<Game[]> => {
  const filePath = await findFileByPattern('games');
  if (!filePath) throw new Error('Games file not found');
  
  const response = await fetch(filePath);
  const text = await response.text();
  return parseCSV<Game>(text);
};

// Load leg metrics data
export const loadLegMetrics = async (): Promise<LegMetric[]> => {
  const filePath = await findFileByPattern('leg_metrics');
  if (!filePath) throw new Error('Leg metrics file not found');
  
  const response = await fetch(filePath);
  const text = await response.text();
  const data = await parseCSV<LegMetric>(text);
  
  // Calculate momentum and consistency for each bet
  return data.map(leg => ({
    ...leg,
    momentum: calculateMomentum(leg),
    consistency: calculateConsistency(leg)
  }));
};

// Load bet index data
export const loadBetIndex = async (): Promise<Record<string, BetIndexEntry>> => {
  const filePath = await findFileByPattern('bet_index');
  if (!filePath) throw new Error('Bet index file not found');
  
  const response = await fetch(filePath);
  const text = await response.text();
  
  // Replace NaN values with null before parsing
  const cleanedText = text.replace(/:\s*NaN/g, ': null');
  
  try {
    const data = JSON.parse(cleanedText);
    return data.BET_INDEX || data;
  } catch (error) {
    console.error('Error parsing bet index:', error);
    throw new Error('Invalid JSON in bet index file');
  }
};

// Calculate momentum based on recent performance vs season average
const calculateMomentum = (leg: LegMetric): number => {
  const recentWeight = 0.7; // Weight for recent games
  const olderWeight = 0.3; // Weight for older games
  
  // For batters/teams: use L5 and L10 equivalent
  // For pitchers: use L2 and L5
  const isPitcher = leg.market.includes('pitcher_');
  
  let recentRate: number;
  let baselineRate: number;
  
  if (isPitcher) {
    recentRate = leg.last2_hit_rate || 0;
    baselineRate = leg.last5_hit_rate || leg.hit_rate || 0;
  } else {
    recentRate = leg.last5_hit_rate || 0;
    baselineRate = leg.last15_hit_rate || leg.hit_rate || 0;
  }
  
  // Calculate weighted momentum
  const momentum = ((recentRate * recentWeight) + (baselineRate * olderWeight)) - leg.hit_rate;
  
  return momentum;
};

// Calculate consistency grade based on variance in hit rates
const calculateConsistency = (leg: LegMetric): string => {
  // Get all available hit rate windows
  const hitRates = [
    leg.last30_hit_rate,
    leg.last15_hit_rate,
    leg.last7_hit_rate,
    leg.last5_hit_rate,
    leg.last3_hit_rate,
    leg.last2_hit_rate
  ].filter(rate => rate !== null && rate !== undefined);
  
  if (hitRates.length < 3) return 'N/A';
  
  // Calculate standard deviation
  const mean = hitRates.reduce((sum, rate) => sum + rate, 0) / hitRates.length;
  const variance = hitRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / hitRates.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to letter grade based on consistency
  if (stdDev < 0.05) return 'A+';
  if (stdDev < 0.10) return 'A';
  if (stdDev < 0.15) return 'A-';
  if (stdDev < 0.20) return 'B+';
  if (stdDev < 0.25) return 'B';
  if (stdDev < 0.30) return 'B-';
  if (stdDev < 0.35) return 'C+';
  if (stdDev < 0.40) return 'C';
  if (stdDev < 0.45) return 'C-';
  if (stdDev < 0.50) return 'D';
  return 'F';
};

// Load all data
export const loadAllData = async () => {
  try {
    const [teams, players, games, legMetrics, betIndex] = await Promise.all([
      loadTeams(),
      loadPlayers(),
      loadGames(),
      loadLegMetrics(),
      loadBetIndex()
    ]);
    
    return {
      teams,
      players,
      games,
      legMetrics,
      betIndex
    };
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
};