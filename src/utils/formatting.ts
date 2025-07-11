import { format } from 'date-fns';

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'EEEE, MMMM d, yyyy');
};

export const formatTime = (time: string): string => {
  // Assuming time is in format "HH:MM"
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const formatOdds = (odds: number | null | undefined): string => {
  if (odds === null || odds === undefined) return '—';
  return odds > 0 ? `+${odds}` : odds.toString();
};

export const formatPercentage = (value: number | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined) return '—';
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const getOddsColor = (odds: number): string => {
  if (odds < -200) return 'text-red-400';
  if (odds < -150) return 'text-orange-400';
  if (odds < 100) return 'text-yellow-400';
  return 'text-green-400';
};

export const getEdgeColor = (edge: number): string => {
  if (edge > 0.1) return 'text-green-400';
  if (edge > 0.05) return 'text-green-500';
  if (edge > 0) return 'text-yellow-500';
  return 'text-gray-400';
};

export const getMomentumIcon = (momentum: number | null | undefined): string => {
  if (momentum === null || momentum === undefined) return '—';
  if (momentum > 0.2) return '🔥🔥🔥';
  if (momentum > 0.1) return '🔥🔥';
  if (momentum > 0.05) return '🔥';
  if (momentum > -0.05) return '=';
  if (momentum > -0.1) return '❄️';
  return '❄️❄️';
};

export const getConsistencyColor = (grade: string | null | undefined): string => {
  if (!grade) return 'text-gray-400';
  if (grade.startsWith('A')) return 'text-green-400';
  if (grade.startsWith('B')) return 'text-blue-400';
  if (grade.startsWith('C')) return 'text-yellow-400';
  if (grade.startsWith('D')) return 'text-orange-400';
  return 'text-red-400';
};

// Helper to format bookmaker names properly
export const formatBookmaker = (bookmaker: string): string => {
  const bookmakerMap: Record<string, string> = {
    'draftkings': 'DraftKings',
    'fanduel': 'FanDuel',
    'espnbet': 'ESPN BET',
    'hardrockbet': 'Hard Rock Bet',
    'betmgm': 'BetMGM'
  };
  
  return bookmakerMap[bookmaker.toLowerCase()] || bookmaker;
};