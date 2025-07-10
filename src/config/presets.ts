import { Preset, PresetType } from '../types';

export const PRESETS: Record<PresetType, Preset> = {
  topEV: {
    name: 'Top EV Bets',
    type: 'topEV',
    filters: {},
    requiredConditions: {
      minEdge: 0,
      minHitRate: 0.5
    },
    sortBy: 'edge',
    sortOrder: 'desc',
    visibleColumns: ['odds', 'implied_prob', 'blended_hit_rate', 'edge']
  },
  
  valueUnderdogs: {
    name: 'Value Underdogs',
    type: 'valueUnderdogs',
    filters: {},
    requiredConditions: {
      minEdge: 0
    },
    sortBy: 'edge',
    sortOrder: 'desc',
    visibleColumns: ['odds', 'implied_prob', 'blended_hit_rate', 'edge', 'ev']
  },
  
  hotHand: {
    name: 'Hot Hand',
    type: 'hotHand',
    filters: {},
    requiredConditions: {
      minMomentum: 0.1 // At least 10% above average
    },
    sortBy: 'last5_hit_rate',
    sortOrder: 'desc',
    visibleColumns: ['odds', 'momentum', 'last5_hit_rate', 'last3_hit_rate', 'blended_hit_rate']
  },
  
  safeAnchors: {
    name: 'Safe Anchors',
    type: 'safeAnchors',
    filters: {},
    requiredConditions: {
      minConsistency: 'B-',
      minHitRate: 0.6
    },
    sortBy: 'blended_hit_rate',
    sortOrder: 'desc',
    visibleColumns: ['odds', 'implied_prob', 'consistency', 'blended_hit_rate']
  },
  
  bigBoosters: {
    name: 'Big Boosters',
    type: 'bigBoosters',
    filters: {},
    requiredConditions: {
      requiresParlay: true
    },
    sortBy: 'parlayBoost',
    sortOrder: 'desc',
    visibleColumns: ['odds', 'implied_prob', 'parlayBoost', 'conditionalHitRate', 'blended_hit_rate']
  }
};

// Helper to check if a bet meets preset conditions
export const meetsPresetConditions = (bet: any, preset: Preset): boolean => {
  const conditions = preset.requiredConditions;
  if (!conditions) return true;
  
  if (conditions.minEdge !== undefined && bet.edge < conditions.minEdge) return false;
  if (conditions.minHitRate !== undefined && (bet.blended_hit_rate || bet.hit_rate) < conditions.minHitRate) return false;
  if (conditions.minMomentum !== undefined && (bet.momentum || 0) < conditions.minMomentum) return false;
  
  if (conditions.minConsistency !== undefined) {
    const grades = ['F', 'D', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'];
    const betGradeIndex = grades.indexOf(bet.consistency || 'F');
    const minGradeIndex = grades.indexOf(conditions.minConsistency);
    if (betGradeIndex < minGradeIndex) return false;
  }
  
  // Note: requiresParlay condition is handled at the UI level
  
  return true;
};

// Helper to check if bet is plus money (underdog)
export const isPlusMoney = (odds: number): boolean => {
  return odds > 0;
};