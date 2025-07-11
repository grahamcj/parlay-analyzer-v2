import { X } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import * as Slider from '@radix-ui/react-slider';
import { useFilterStore } from '../../store/filterStore';
import { useDataStore } from '../../store/dataStore';
import { formatBookmaker } from '../../utils/formatting';

interface FilterPanelProps {
  bookmakers: string[];
  currentTeams?: string[];
  onClose: () => void;
}

export default function FilterPanel({ bookmakers, currentTeams, onClose }: FilterPanelProps) {
  const { filters, setFilter } = useFilterStore();
  const { teams } = useDataStore();
  const teamsToShow = currentTeams 
    ? teams.filter(t => currentTeams.includes(t.TEAM_NAME))
    : teams;


  return (
    <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Filters</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bookmaker Filter */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Bookmaker</label>
          <Select.Root
            value={filters.bookmaker || bookmakers[0]}
            onValueChange={(value) => setFilter('bookmaker', value)}
          >
            <Select.Trigger className="w-full px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
              <Select.Value placeholder="Select Bookmaker">
                {filters.bookmaker ? formatBookmaker(filters.bookmaker) : 'Select Bookmaker'}
              </Select.Value>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-gray-900 rounded-lg shadow-xl border border-gray-800 overflow-hidden z-[200]">
                <Select.Viewport className="p-1">
                  {bookmakers.map(bookmaker => (
                    <Select.Item 
                      key={bookmaker} 
                      value={bookmaker}
                      className="px-3 py-2 hover:bg-gray-800 rounded cursor-pointer"
                    >
                      <Select.ItemText>{formatBookmaker(bookmaker)}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        {/* Team Filter */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Teams</label>
          <Select.Root
            value={filters.teams?.[0] || 'all'}
            onValueChange={(value) => setFilter('teams', value === 'all' ? [] : [value])}
          >
            <Select.Trigger className="w-full px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
              <Select.Value placeholder="All Teams" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-gray-900 rounded-lg shadow-xl border border-gray-800 overflow-hidden max-h-64 z-[200]">
                <Select.Viewport className="p-1">
                  <Select.Item value="all" className="px-3 py-2 hover:bg-gray-800 rounded cursor-pointer">
                    <Select.ItemText>All Teams</Select.ItemText>
                  </Select.Item>
                  {teamsToShow.map(team => (
                    <Select.Item 
                      key={team.TEAM_ID} 
                      value={team.TEAM_NAME}
                      className="px-3 py-2 hover:bg-gray-800 rounded cursor-pointer"
                    >
                      <Select.ItemText>{team.TEAM_CITY} {team.TEAM_NICKNAME}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        {/* Odds Range */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Odds Range: {filters.oddsRange ? `${filters.oddsRange.min} to ${filters.oddsRange.max}` : 'All Odds'}
          </label>
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[filters.oddsRange?.min || -2000, filters.oddsRange?.max || 2000]}
            onValueChange={([min, max]) => setFilter('oddsRange', { min, max })}
            min={-500}
            max={500}
            step={25}
          >
            <Slider.Track className="bg-gray-700 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-purple-600 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb className="block w-4 h-4 bg-white rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <Slider.Thumb className="block w-4 h-4 bg-white rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </Slider.Root>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Search</label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => setFilter('search', e.target.value || undefined)}
            placeholder="Search bets..."
            className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>
    </div>
  );
}