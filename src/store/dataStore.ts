import { create } from 'zustand';
import { DataStore } from '../types';
import { loadAllData } from '../utils/csvLoader';

export const useDataStore = create<DataStore>((set, get) => ({
  teams: [],
  players: [],
  games: [],
  legMetrics: [],
  betIndex: {},
  isLoading: false,
  error: null,
  
  loadData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const data = await loadAllData();
      set({
        teams: data.teams,
        players: data.players,
        games: data.games,
        legMetrics: data.legMetrics,
        betIndex: data.betIndex,
        isLoading: false,
        error: null
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      });
    }
  },
  
  getGameById: (id: number) => {
    return get().games.find(game => game.game_id === id);
  },
  
  getTeamById: (id: number) => {
    return get().teams.find(team => team.TEAM_ID === id);
  },
  
  getPlayerById: (id: number) => {
    return get().players.find(player => player.PLAYER_ID === id);
  }
}));