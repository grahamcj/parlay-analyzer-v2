import { LegMetric, Player, Team } from '../types';

// Helper to get team for a bet
export const getTeamForBet = (
  bet: LegMetric,
  players: Player[],
  teams: Team[]
): string | null => {
  // For ML and spreads, selection is already the full team name
  if (bet.market === 'h2h' || bet.market === 'spreads') {
    return bet.selection; // e.g., "Atlanta Braves"
  }
  
  // For totals, no specific team
  if (bet.market === 'totals') {
    return null;
  }
  
  // For player props, look up the player to find their team
  if (bet.market.startsWith('batter_') || bet.market.startsWith('pitcher_')) {
    // Players array might not be loaded yet
    if (!players || players.length === 0) {
      console.warn('Players data not available');
      return null;
    }
    
    // Find the player by name
    const player = players.find(p => `${p.FIRST_NAME} ${p.LAST_NAME}` === bet.selection);
    
    if (player) {
      // Teams array might not be loaded yet
      if (!teams || teams.length === 0) {
        console.warn('Teams data not available');
        return null;
      }
      
      // Find the team by code
      const team = teams.find(t => t.TEAM_CODE === player.TEAM_CODE);
      if (team) {
        return team.TEAM_NAME; // Return full team name to match ML/spread format
      }
    }
  }
  
  return null;
};

// Check if two bets are from the same team
export const areBetsFromSameTeam = (
  bet1: LegMetric,
  bet2: LegMetric,
  players: Player[],
  teams: Team[]
): boolean => {
  if (bet1.game_id !== bet2.game_id) return false;
  
  const team1 = getTeamForBet(bet1, players, teams);
  const team2 = getTeamForBet(bet2, players, teams);
  
  if (!team1 || !team2) return false;
  
  return team1 === team2;
};

// Check if two bets are from opposing teams
export const areBetsFromOpposingTeams = (
  bet1: LegMetric,
  bet2: LegMetric,
  players: Player[],
  teams: Team[]
): boolean => {
  if (bet1.game_id !== bet2.game_id) return false;
  
  const team1 = getTeamForBet(bet1, players, teams);
  const team2 = getTeamForBet(bet2, players, teams);
  
  if (!team1 || !team2) return false;
  
  // They're opposing if they're different teams in the same game
  return team1 !== team2;
};