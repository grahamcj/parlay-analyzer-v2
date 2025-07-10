import { ColumnConfig } from '../types';

export const COLUMNS: ColumnConfig[] = [
  // Global columns (available for all bet types)
  {
    key: 'bet',
    label: 'Bet',
    description: 'Bet description',
    category: 'global',
    defaultVisible: true,
    minWidth: 150
  },
  {
    key: 'price',
    label: 'Odds',
    description: 'Sportsbook odds',
    category: 'global',
    defaultVisible: true,
    minWidth: 60,
    format: (value: number) => {
      if (!value || value === 0) return '—';
      return value > 0 ? `+${value}` : value.toString();
    }
  },
  {
    key: 'implied_prob',
    label: 'Implied',
    description: 'Implied probability from odds',
    category: 'global',
    defaultVisible: true,
    minWidth: 60,
    format: (value: any) => {
      if (value === null || value === undefined) return '—';
      return `${(value * 100).toFixed(1)}%`;
    }
  },
  {
    key: 'momentum',
    label: 'Momentum',
    description: 'Recent performance vs season average (positive = hot streak)',
    category: 'global',
    defaultVisible: true,
    minWidth: 80,
    format: (value: any) => {
      if (value === null || value === undefined) return '—';
      if (value > 0.2) return '🔥🔥🔥';
      if (value > 0.1) return '🔥🔥';
      if (value > 0.05) return '🔥';
      if (value > -0.05) return '=';
      if (value > -0.1) return '❄️';
      return '❄️❄️';
    }
  },
  {
    key: 'consistency',
    label: 'Consistency',
    description: 'Reliability grade based on variance in 5-game segments (A = very consistent)',
    category: 'global',
    defaultVisible: true,
    minWidth: 80
  },
  {
    key: 'edge',
    label: 'Edge',
    description: 'Value edge percentage',
    category: 'global',
    defaultVisible: false,
    minWidth: 60,
    format: (value: number) => `${(value * 100).toFixed(1)}%`,
    colorScale: true
  },
  {
    key: 'parlayBoost',
    label: 'Parlay Boost',
    description: 'Incremental payout boost in parlay context',
    category: 'global',
    defaultVisible: false,
    minWidth: 80,
    format: (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`,
    colorScale: true
  },
  {
    key: 'h2h_hit_rate',
    label: 'H2H',
    description: 'Performance in head-to-head matchup',
    category: 'global',
    defaultVisible: false,
    minWidth: 60,
    format: (value: number) => `${(value * 100).toFixed(0)}%`,
    colorScale: true
  },
  {
    key: 'blended_hit_rate',
    label: 'Hit Rate',
    description: 'Intelligently weighted hit rate',
    category: 'global',
    defaultVisible: true,
    minWidth: 60,
    format: (value: number) => `${(value * 100).toFixed(0)}%`,
    colorScale: true
  },
  
  // Batter-only columns
  {
    key: 'last30_hit_rate',
    label: 'L30',
    description: 'Last 30 games hit rate',
    category: 'batter',
    defaultVisible: true,
    minWidth: 50,
    format: (value: number) => `${(value * 100).toFixed(0)}%`,
    colorScale: true
  },
  {
    key: 'last15_hit_rate',
    label: 'L15',
    description: 'Last 15 games hit rate',
    category: 'batter',
    defaultVisible: true,
    minWidth: 50,
    format: (value: number) => `${(value * 100).toFixed(0)}%`,
    colorScale: true
  },
  {
    key: 'last7_hit_rate',
    label: 'L7',
    description: 'Last 7 games hit rate',
    category: 'batter',
    defaultVisible: true,
    minWidth: 50,
    format: (value: number) => `${(value * 100).toFixed(0)}%`,
    colorScale: true
  },
  {
    key: 'vs_sp_hit_rate',
    label: 'vs SP',
    description: 'Hit rate against today\'s starting pitcher',
    category: 'batter',
    defaultVisible: false,
    minWidth: 60,
    format: (value: number) => value === 0 ? '—' : `${(value * 100).toFixed(0)}%`,
    colorScale: true
  },
  {
    key: 'handedness_hit_rate',
    label: 'vs Hand',
    description: 'Hit rate against pitcher handedness',
    category: 'batter',
    defaultVisible: false,
    minWidth: 70,
    format: (value: number) => `${(value * 100).toFixed(0)}%`,
    colorScale: true
  },
  
  // Pitcher-only columns
  {
    key: 'last5_hit_rate',
    label: 'L5',
    description: 'Last 5 starts hit rate',
    category: 'pitcher',
    defaultVisible: true,
    minWidth: 50,
    format: (value: number) => `${(value * 100).toFixed(0)}%`,
    colorScale: true
  },
  {
    key: 'last3_hit_rate',
    label: 'L3',
    description: 'Last 3 starts hit rate',
    category: 'pitcher',
    defaultVisible: true,
    minWidth: 50,
    format: (value: number) => `${(value * 100).toFixed(0)}%`,
    colorScale: true
  },
  {
    key: 'last2_hit_rate',
    label: 'L2',
    description: 'Last 2 starts hit rate',
    category: 'pitcher',
    defaultVisible: true,
    minWidth: 50,
    format: (value: number) => `${(value * 100).toFixed(0)}%`,
    colorScale: true
  },
  
  // Game-only columns (team bets)
  {
    key: 'last30_hit_rate',
    label: 'L30',
    description: 'Last 30 games hit rate',
    category: 'game',
    defaultVisible: true,
    minWidth: 50,
    format: (value: number) => `${(value * 100).toFixed(0)}%`,
    colorScale: true
  },
  {
    key: 'last15_hit_rate',
    label: 'L15',
    description: 'Last 15 games hit rate',
    category: 'game',
    defaultVisible: true,
    minWidth: 50,
    format: (value: number) => `${(value * 100).toFixed(0)}%`,
    colorScale: true
  },
  {
    key: 'last7_hit_rate',
    label: 'L7',
    description: 'Last 7 games hit rate',
    category: 'game',
    defaultVisible: true,
    minWidth: 50,
    format: (value: number) => `${(value * 100).toFixed(0)}%`,
    colorScale: true
  }
];

// Helper to get columns for a specific category
export const getColumnsForCategory = (category: 'batter' | 'pitcher' | 'game'): ColumnConfig[] => {
  return COLUMNS.filter(col => col.category === 'global' || col.category === category);
};

// Helper to get hit rate color
export const getHitRateColor = (value: number): string => {
  if (value >= 0.7) return 'text-green-400';
  if (value >= 0.6) return 'text-green-500';
  if (value >= 0.5) return 'text-yellow-500';
  if (value >= 0.4) return 'text-orange-500';
  return 'text-red-500';
};

// Helper to format bet description
export const formatBetDescription = (leg: any): string => {
  const { selection, market, side, line_value } = leg;
  
  // Format market name
  const marketName = market
    .replace('batter_', '')
    .replace('pitcher_', '')
    .replace('_', ' ')
    .replace(/\b\w/g, (l: string) => l.toUpperCase());
  
  // Build description
  if (market === 'h2h') {
    return `${selection} ML`;
  } else if (market === 'spreads') {
    return `${selection} ${line_value > 0 ? '+' : ''}${line_value}`;
  } else if (market === 'totals') {
    return `${side} ${line_value} Runs`;
  } else {
    return `${selection} ${side} ${line_value} ${marketName}`;
  }
};