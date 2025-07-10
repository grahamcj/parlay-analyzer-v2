import * as Checkbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { useFilterStore } from '../../store/filterStore';
import { COLUMNS } from '../../config/columns';

export default function ColumnSettings() {
  const { visibleColumns, toggleColumn } = useFilterStore();

  // Group columns by category
  const globalColumns = COLUMNS.filter(col => col.category === 'global' && col.key !== 'bet');
  const batterColumns = COLUMNS.filter(col => col.category === 'batter');
  const pitcherColumns = COLUMNS.filter(col => col.category === 'pitcher');
  const gameColumns = COLUMNS.filter(col => col.category === 'game');

  const renderColumnGroup = (title: string, columns: typeof COLUMNS, category: 'game' | 'pitcher' | 'batter') => {
    if (columns.length === 0) return null;

    return (
      <div className="mb-6">
        <h4 className="font-semibold text-sm mb-3">{title}</h4>
        <div className="space-y-2">
          {columns.map(column => {
            const isVisible = visibleColumns[category].includes(column.key);
            
            return (
              <label
                key={column.key}
                className="flex items-start gap-3 cursor-pointer hover:bg-gray-800 p-2 rounded"
              >
                <Checkbox.Root
                  checked={isVisible}
                  onCheckedChange={() => toggleColumn(category, column.key)}
                  className="flex h-4 w-4 items-center justify-center rounded bg-gray-700 data-[state=checked]:bg-purple-600 mt-0.5"
                >
                  <Checkbox.Indicator>
                    <Check className="h-3 w-3" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <div className="flex-1">
                  <p className="font-medium text-sm">{column.label}</p>
                  <p className="text-xs text-gray-400">{column.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h3 className="font-semibold mb-4">Column Settings</h3>
      
      {/* Global Columns */}
      <div className="mb-6">
        <h4 className="font-semibold text-sm mb-3">Global Columns</h4>
        <p className="text-xs text-gray-400 mb-3">These columns are available for all bet types</p>
        <div className="space-y-2">
          {globalColumns.map(column => (
            <div key={column.key} className="border-l-2 border-gray-700 pl-3">
              <label className="flex items-start gap-3 cursor-pointer hover:bg-gray-800 p-2 rounded">
                <div className="flex items-center gap-2">
                  <Checkbox.Root
                    checked={visibleColumns.game.includes(column.key)}
                    onCheckedChange={() => toggleColumn('game', column.key)}
                    className="flex h-4 w-4 items-center justify-center rounded bg-gray-700 data-[state=checked]:bg-purple-600"
                  >
                    <Checkbox.Indicator>
                      <Check className="h-3 w-3" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span className="text-xs text-gray-500">Game</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox.Root
                    checked={visibleColumns.pitcher.includes(column.key)}
                    onCheckedChange={() => toggleColumn('pitcher', column.key)}
                    className="flex h-4 w-4 items-center justify-center rounded bg-gray-700 data-[state=checked]:bg-purple-600"
                  >
                    <Checkbox.Indicator>
                      <Check className="h-3 w-3" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span className="text-xs text-gray-500">Pitcher</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox.Root
                    checked={visibleColumns.batter.includes(column.key)}
                    onCheckedChange={() => toggleColumn('batter', column.key)}
                    className="flex h-4 w-4 items-center justify-center rounded bg-gray-700 data-[state=checked]:bg-purple-600"
                  >
                    <Checkbox.Indicator>
                      <Check className="h-3 w-3" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span className="text-xs text-gray-500">Batter</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{column.label}</p>
                  <p className="text-xs text-gray-400">{column.description}</p>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Category-specific columns */}
      {renderColumnGroup('Batter Props Only', batterColumns, 'batter')}
      {renderColumnGroup('Pitcher Props Only', pitcherColumns, 'pitcher')}
      {renderColumnGroup('Game Bets Only', gameColumns, 'game')}
    </div>
  );
}