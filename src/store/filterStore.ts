import { create } from 'zustand';
import { FilterStore, BetCategory, PresetType } from '../types';
import { PRESETS } from '../config/presets';

const DEFAULT_COLUMNS: Record<BetCategory, string[]> = {
  game: ['bet', 'price', 'implied_prob', 'momentum', 'consistency', 'blended_hit_rate', 'last30_hit_rate', 'last15_hit_rate', 'last7_hit_rate'],
  pitcher: ['bet', 'price', 'implied_prob', 'momentum', 'consistency', 'last5_hit_rate', 'last3_hit_rate', 'last2_hit_rate'],
  batter: ['bet', 'price', 'implied_prob', 'momentum', 'consistency', 'last30_hit_rate', 'last15_hit_rate', 'last7_hit_rate', 'vs_sp_hit_rate', 'handedness_hit_rate']
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  filters: {},
  visibleColumns: DEFAULT_COLUMNS,
  activePreset: null,
  
  setFilter: (key, value) => {
    set({
      filters: {
        ...get().filters,
        [key]: value
      },
      activePreset: null // Clear preset when manually filtering
    });
  },
  
  clearFilters: () => {
    const currentBookmaker = get().filters.bookmaker;
    set({
      filters: {
        bookmaker: currentBookmaker // Keep bookmaker when clearing
      },
      activePreset: null,
      visibleColumns: DEFAULT_COLUMNS
    });
  },
  
  applyPreset: (presetType: PresetType) => {
    const preset = PRESETS[presetType];
    if (!preset) return;
    
    // Build visible columns for each category based on preset
    const newVisibleColumns: Record<BetCategory, string[]> = {
      game: ['bet', ...preset.visibleColumns],
      pitcher: ['bet', ...preset.visibleColumns],
      batter: ['bet', ...preset.visibleColumns]
    };
    
    set({
      filters: {
        ...preset.filters,
        bookmaker: get().filters.bookmaker // Preserve bookmaker selection
      },
      activePreset: presetType,
      visibleColumns: newVisibleColumns
    });
  },
  
  toggleColumn: (category: BetCategory, column: string) => {
    const current = get().visibleColumns[category];
    const isVisible = current.includes(column);
    
    set({
      visibleColumns: {
        ...get().visibleColumns,
        [category]: isVisible 
          ? current.filter(c => c !== column)
          : [...current, column]
      }
    });
  },
  
  setVisibleColumns: (category: BetCategory, columns: string[]) => {
    set({
      visibleColumns: {
        ...get().visibleColumns,
        [category]: columns
      }
    });
  }
}));