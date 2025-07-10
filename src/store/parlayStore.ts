import { create } from 'zustand';
import { ParlayStore, LegMetric, Parlay } from '../types';

export const useParlayStore = create<ParlayStore>((set, get) => ({
  currentParlay: [],
  savedParlays: [],
  isParlayMinimized: false,
  
  addLeg: (leg: LegMetric) => {
    const current = get().currentParlay;
    // Check if leg already exists
    if (current.some(l => l.leg_id === leg.leg_id)) {
      return;
    }
    set({ currentParlay: [...current, leg] });
  },
  
  removeLeg: (legId: string) => {
    set({
      currentParlay: get().currentParlay.filter(leg => leg.leg_id !== legId)
    });
  },
  
  clearParlay: () => {
    set({ currentParlay: [] });
  },
  
  saveParlay: (name: string) => {
    const current = get().currentParlay;
    if (current.length === 0) return;
    
    const newParlay: Parlay = {
      id: Date.now().toString(),
      name,
      legs: [...current],
      totalOdds: calculateParlayOdds(current),
      impliedProb: calculateImpliedProb(current),
      savedAt: new Date()
    };
    
    set({
      savedParlays: [...get().savedParlays, newParlay],
      currentParlay: []
    });
  },
  
  loadSavedParlay: (id: string) => {
    const saved = get().savedParlays.find(p => p.id === id);
    if (saved) {
      set({ currentParlay: [...saved.legs] });
    }
  },
  
  deleteSavedParlay: (id: string) => {
    set({
      savedParlays: get().savedParlays.filter(p => p.id !== id)
    });
  },
  
  toggleParlayMinimized: () => {
    set({ isParlayMinimized: !get().isParlayMinimized });
  },
  
  switchBetInParlay: (oldLegId: string, newLeg: LegMetric) => {
    const current = get().currentParlay;
    const index = current.findIndex(leg => leg.leg_id === oldLegId);
    
    if (index !== -1) {
      const updated = [...current];
      updated[index] = newLeg;
      set({ currentParlay: updated });
    }
  }
}));

// Helper functions
const calculateParlayOdds = (legs: LegMetric[]): number => {
  if (legs.length === 0) return 0;
  
  // Convert American odds to decimal and multiply
  const decimalOdds = legs.map(leg => {
    const american = leg.price;
    if (american > 0) {
      return (american / 100) + 1;
    } else {
      return (100 / Math.abs(american)) + 1;
    }
  });
  
  const totalDecimal = decimalOdds.reduce((acc, odd) => acc * odd, 1);
  
  // Convert back to American
  if (totalDecimal >= 2) {
    return Math.round((totalDecimal - 1) * 100);
  } else {
    return Math.round(-100 / (totalDecimal - 1));
  }
};

const calculateImpliedProb = (legs: LegMetric[]): number => {
  if (legs.length === 0) return 0;
  
  // Multiply individual implied probabilities
  return legs.reduce((acc, leg) => acc * leg.implied_prob, 1);
};