import { useState } from 'react';
import { Filter, Settings, ChevronDown } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import * as Popover from '@radix-ui/react-popover';
import { useFilterStore } from '../../store/filterStore';
import { PRESETS } from '../../config/presets';
import FilterPanel from './FilterPanel';
import ColumnSettings from './ColumnSettings';
import { Team } from '../../types';

interface FilterBarProps {
  totalBets: number;
  bookmakers: string[];
  homeTeam?: Team;
  awayTeam?: Team;
}

export default function FilterBar({ totalBets, bookmakers, homeTeam, awayTeam }: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const { activePreset, applyPreset, clearFilters } = useFilterStore();

  return (
    <div className="fixed top-0 left-0 right-0 z-20 bg-gray-950 border-b border-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            </button>

            <span className="text-sm text-gray-400">
              Showing {totalBets} bets
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Preset Selector */}
            <Select.Root 
              value={activePreset || 'all'} 
              onValueChange={(value) => {
                if (value === 'all') {
                  clearFilters();
                } else {
                  applyPreset(value as any);
                }
              }}
            >
              <Select.Trigger className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors min-w-[150px]">
                <Select.Value placeholder="Select Preset" />
                <ChevronDown className="w-4 h-4" />
              </Select.Trigger>

              <Select.Portal>
                <Select.Content className="bg-gray-900 rounded-lg shadow-xl border border-gray-800 overflow-hidden z-[200]">
                  <Select.Viewport className="p-1 max-h-[300px] overflow-y-auto">
                    <Select.Item value="all" className="px-3 py-2 hover:bg-gray-800 rounded cursor-pointer">
                      <Select.ItemText>All Bets</Select.ItemText>
                    </Select.Item>
                    {Object.entries(PRESETS).map(([key, preset]) => (
                      <Select.Item 
                        key={key} 
                        value={key}
                        className="px-3 py-2 hover:bg-gray-800 rounded cursor-pointer"
                      >
                        <Select.ItemText>{preset.name}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>

            {/* Column Settings */}
            <Popover.Root open={showColumnSettings} onOpenChange={setShowColumnSettings}>
              <Popover.Trigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
                  <Settings className="w-4 h-4" />
                  <span>Columns</span>
                </button>
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Content 
                  className="bg-gray-900 rounded-lg shadow-xl border border-gray-800 p-4 w-96 max-h-[600px] overflow-y-auto z-[200]"
                  sideOffset={5}
                  align="end"
                >
                  <ColumnSettings />
                  <Popover.Arrow className="fill-gray-800" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <FilterPanel 
            bookmakers={bookmakers} 
            currentTeams={[homeTeam?.TEAM_NAME, awayTeam?.TEAM_NAME].filter(Boolean)} 
            onClose={() => setShowFilters(false)} 
          />
        )}
      </div>
    </div>
  );
}