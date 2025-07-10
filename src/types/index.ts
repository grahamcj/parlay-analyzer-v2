// Team and Player Types
export interface Team {
    TEAM_ID: number;
    TEAM_CODE: string;
    TEAM_NAME: string;
    TEAM_CITY: string;
    TEAM_NICKNAME: string;
  }
  
  export interface Player {
    PLAYER_ID: number;
    FIRST_NAME: string;
    LAST_NAME: string;
    POSITION: string;
    JERSEY_NUMBER: number;
    TEAM_CODE: string;
    TEAM_ID: number;
  }
  
  // Game Types
  export interface Game {
    game_id: number;
    game_date: string;
    game_time: string;
    game_type: string;
    status: string;
    home_team_id: number;
    home_team_name: string;
    home_sp: string;
    home_sp_hand: string;
    away_team_id: number;
    away_team_name: string;
    away_sp: string;
    away_sp_hand: string;
  }
  
  // Bet/Leg Types
  export interface LegMetric {
    game_id: string;
    leg_id: string;
    sport_title: string;
    home_team: string;
    away_team: string;
    bookmaker: string;
    market: string;
    selection: string;
    side: string;
    line_value: number;
    price: number;
    implied_prob: number;
    hit_rate: number;
    last30_hit_rate: number;
    last15_hit_rate: number;
    last7_hit_rate: number;
    last5_hit_rate: number;
    last3_hit_rate: number;
    last2_hit_rate: number;
    home_away_hit_rate: number;
    h2h_hit_rate: number;
    vs_sp_hit_rate: number;
    handedness_hit_rate: number;
    blended_hit_rate: number;
    edge: number;
    ev: number;
    kelly: number;
    // Additional fields for UI
    momentum?: number;
    consistency?: string;
    conditionalHitRate?: number;
    parlayBoost?: number;
    isWeakLink?: boolean;
    betterAlternatives?: LegMetric[];
  }
  
  // Bet Categories
  export type BetCategory = 'game' | 'pitcher' | 'batter';
  
  // Market Types for categorization
  export const GAME_MARKETS = ['spreads', 'totals', 'h2h'] as const;
  export const PITCHER_MARKETS = ['pitcher_strikeouts', 'pitcher_outs', 'pitcher_hits_allowed', 'pitcher_earned_runs'] as const;
  export const BATTER_MARKETS = ['batter_hits', 'batter_runs', 'batter_rbis', 'batter_home_runs', 'batter_total_bases', 'batter_stolen_bases'] as const;
  
  // Filter Types
  export interface Filters {
    bookmaker?: string;
    teams?: string[];
    markets?: string[];
    oddsRange?: { min: number; max: number };
    search?: string;
    category?: BetCategory;
    preset?: PresetType;
  }
  
  // Preset Types
  export type PresetType = 'topEV' | 'valueUnderdogs' | 'hotHand' | 'safeAnchors' | 'bigBoosters';
  
  export interface Preset {
    name: string;
    type: PresetType;
    filters: Partial<Filters>;
    requiredConditions?: {
      minEdge?: number;
      minHitRate?: number;
      minConsistency?: string;
      minMomentum?: number;
      requiresParlay?: boolean;
    };
    sortBy: keyof LegMetric;
    sortOrder: 'asc' | 'desc';
    visibleColumns: string[];
  }
  
  // Column Configuration
  export interface ColumnConfig {
    key: string;
    label: string;
    description: string;
    category: 'global' | 'batter' | 'pitcher' | 'game';
    defaultVisible: boolean;
    minWidth?: number;
    format?: (value: any) => string;
    colorScale?: boolean;
  }
  
  // Parlay Types
  export interface Parlay {
    id: string;
    name: string;
    legs: LegMetric[];
    totalOdds: number;
    impliedProb: number;
    conditionalProb?: number;
    savedAt?: Date;
  }
  
  // Correlation Types
  export interface Correlation {
    betType1: string;
    team1: 'same' | 'opposing' | 'any';
    position1?: string;
    betType2: string;
    team2: 'same' | 'opposing' | 'any';
    position2?: string;
    type: 'blocks' | 'positive' | 'negative';
    strength?: number;
  }
  
  // Bet Index Types
  export interface BetIndexEntry {
    game_id: string;
    leg_id: string;
    sport_title: string;
    home_team: string;
    away_team: string;
    bookmaker: string;
    market: string;
    selection: string;
    side: string;
    line_value: number;
    price: number;
    implied_prob: number;
    hit_rate: number;
    // ... other hit rates
    blended_hit_rate: number;
    edge: number;
    ev: number;
    kelly: number;
    hit_games: string[];
    miss_games: string[];
  }
  
  // Store Types
  export interface DataStore {
    teams: Team[];
    players: Player[];
    games: Game[];
    legMetrics: LegMetric[];
    betIndex: Record<string, BetIndexEntry>;
    isLoading: boolean;
    error: string | null;
    loadData: () => Promise<void>;
    getGameById: (id: number) => Game | undefined;
    getTeamById: (id: number) => Team | undefined;
    getPlayerById: (id: number) => Player | undefined;
  }
  
  export interface ParlayStore {
    currentParlay: LegMetric[];
    savedParlays: Parlay[];
    isParlayMinimized: boolean;
    addLeg: (leg: LegMetric) => void;
    removeLeg: (legId: string) => void;
    clearParlay: () => void;
    saveParlay: (name: string) => void;
    loadSavedParlay: (id: string) => void;
    deleteSavedParlay: (id: string) => void;
    toggleParlayMinimized: () => void;
    switchBetInParlay: (oldLegId: string, newLeg: LegMetric) => void;
  }
  
  export interface FilterStore {
    filters: Filters;
    visibleColumns: Record<BetCategory, string[]>;
    activePreset: PresetType | null;
    setFilter: (key: keyof Filters, value: any) => void;
    clearFilters: () => void;
    applyPreset: (preset: PresetType) => void;
    toggleColumn: (category: BetCategory, column: string) => void;
    setVisibleColumns: (category: BetCategory, columns: string[]) => void;
  }