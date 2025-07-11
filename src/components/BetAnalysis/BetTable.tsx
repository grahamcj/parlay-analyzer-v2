import { useState, useMemo } from 'react';
import { AlertTriangle, ArrowUpDown, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Popover from '@radix-ui/react-popover';
import { LegMetric, BetCategory } from '../../types';
import { useParlayStore } from '../../store/parlayStore';
import { useFilterStore } from '../../store/filterStore';
import { getColumnsForCategory, formatBetDescription, getHitRateColor } from '../../config/columns';
import { formatOdds, getOddsColor, getConsistencyColor, getMomentumIcon, formatPercentage } from '../../utils/formatting';

interface BetTableProps {
  bets: LegMetric[];
  category: BetCategory;
  weakLinks: string[];
  betterAlternatives: Map<string, LegMetric[]>;
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortOrder?: 'asc' | 'desc';
}

export default function BetTable({ 
  bets, 
  category, 
  weakLinks, 
  betterAlternatives,
  onSort,
  sortColumn: externalSortColumn,
  sortOrder: externalSortOrder
}: BetTableProps) {
  const [internalSortColumn, setInternalSortColumn] = useState<string>('bet');
  const [internalSortOrder, setInternalSortOrder] = useState<'asc' | 'desc'>('asc');
  const { currentParlay, addLeg, removeLeg, switchBetInParlay } = useParlayStore();
  const { visibleColumns } = useFilterStore();

  // Use external sort state if provided, otherwise use internal
  const sortColumn = externalSortColumn ?? internalSortColumn;
  const sortOrder = externalSortOrder ?? internalSortOrder;

  const columns = getColumnsForCategory(category);
  const visibleColumnKeys = visibleColumns[category];

  // Sort bets
  const sortedBets = useMemo(() => {
    return [...bets].sort((a, b) => {
      const aValue = a[sortColumn as keyof LegMetric];
      const bValue = b[sortColumn as keyof LegMetric];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  }, [bets, sortColumn, sortOrder]);

  const handleSort = (column: string) => {
    if (onSort) {
      onSort(column);
    } else {
      if (internalSortColumn === column) {
        setInternalSortOrder(internalSortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setInternalSortColumn(column);
        setInternalSortOrder('asc');
      }
    }
  };

  const isInParlay = (legId: string) => {
    return currentParlay.some(leg => leg.leg_id === legId);
  };

  const handleBetClick = (bet: LegMetric) => {
    if (isInParlay(bet.leg_id)) {
      removeLeg(bet.leg_id);
    } else {
      addLeg(bet);
    }
  };

  const handleAlternativeSwitch = (oldLegId: string, newBet: LegMetric) => {
    switchBetInParlay(oldLegId, newBet);
  };

  if (bets.length === 0) {
    return (
      <div className="bg-gray-900 rounded-b-lg p-8 text-center text-gray-400">
        No bets match the current filters
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-b-lg overflow-x-auto">
      <table className="w-full bet-table">
        <thead className="bg-gray-800 sticky-header">  
          <tr>
            {columns
              .filter(col => col.key === 'bet' || visibleColumnKeys.includes(col.key))
              .map((column, index) => (
                <th
                  key={column.key}
                  className={`
                    px-4 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors
                    ${index === 0 ? 'sticky-first-col' : ''}
                  `}
                  style={{ minWidth: column.minWidth }}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <span>{column.label}</span>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            className="bg-gray-800 px-3 py-2 rounded text-sm max-w-xs"
                            sideOffset={5}
                          >
                            {column.description}
                            <Tooltip.Arrow className="fill-gray-800" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                    <ArrowUpDown className="w-3 h-3 text-gray-500" />
                  </div>
                </th>
              ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {sortedBets.map((bet, index) => {
            const isSelected = isInParlay(bet.leg_id);
            const isWeak = weakLinks.includes(bet.leg_id);
            const alternatives = betterAlternatives.get(bet.leg_id) || [];

            return (
              <tr
                key={`${bet.leg_id}_${index}`}
                className={`
                  hover:bg-gray-800 transition-colors cursor-pointer
                  ${isSelected ? 'bet-row-selected' : ''}
                  ${isWeak ? 'bet-row-weak' : ''}
                `}
                onClick={() => handleBetClick(bet)}
              >
                {columns
                  .filter(col => col.key === 'bet' || visibleColumnKeys.includes(col.key))
                  .map((column, colIndex) => {
                    const value = bet[column.key as keyof LegMetric];
                    let displayValue: React.ReactNode = Array.isArray(value) ? null : value;

                    // Special formatting for specific columns
                    if (column.key === 'bet') {
                      displayValue = (
                        <div className="flex items-center gap-2">
                          <span>{formatBetDescription(bet)}</span>
                          {isWeak && (
                            <Popover.Root>
                              <Popover.Trigger asChild>
                                <button 
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1"
                                >
                                  <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                </button>
                              </Popover.Trigger>
                              <Popover.Portal>
                                <Popover.Content
                                  className="bg-gray-800 px-3 py-2 rounded text-sm max-w-xs z-50 shadow-lg"
                                  sideOffset={5}
                                >
                                  Weak link - reduces parlay probability by {((1 - (bet.conditionalHitRate! / bet.blended_hit_rate!)) * 100).toFixed(0)}%
                                  <Popover.Arrow className="fill-gray-800" />
                                </Popover.Content>
                              </Popover.Portal>
                            </Popover.Root>
                          )}
                          {alternatives.length > 0 && (
                            <Popover.Root>
                              <Popover.Trigger asChild>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAlternativeSwitch(bet.leg_id, alternatives[0]);
                                  }}
                                  className="p-1 hover:bg-gray-700 rounded flex-shrink-0"
                                >
                                  <RefreshCw className="w-3 h-3 text-blue-400" />
                                </button>
                              </Popover.Trigger>
                              <Popover.Portal>
                                <Popover.Content
                                  className="bg-gray-800 px-3 py-2 rounded text-sm max-w-xs z-50 shadow-lg"
                                  sideOffset={5}
                                >
                                  Switch to {formatBetDescription(alternatives[0])} 
                                  (+{((alternatives[0].conditionalHitRate! - bet.conditionalHitRate!) * 100).toFixed(1)}% better)
                                  <Popover.Arrow className="fill-gray-800" />
                                </Popover.Content>
                              </Popover.Portal>
                            </Popover.Root>
                          )}
                        </div>
                      );
                    } 
                    else if (column.key === 'price') {
                      displayValue = (
                        <span className={getOddsColor(value as number)}>
                          {formatOdds(value as number)}
                        </span>
                      );
                    } else if (column.key === 'momentum') {
                      displayValue = getMomentumIcon(value as number);
                    } else if (column.key === 'consistency') {
                      displayValue = (
                        <span className={getConsistencyColor(value as string)}>
                          {value}
                        </span>
                      );
                    } else if (column.key.includes('hit_rate') || column.key === 'blended_hit_rate') {
                      const conditionalValue = bet.conditionalHitRate;
                      const originalValue = value as number;
                      
                      if (conditionalValue !== undefined && Math.abs(conditionalValue - originalValue) > 0.001 && currentParlay.length > 0) {
                        const diff = conditionalValue - originalValue;
                        displayValue = (
                          <div className="flex items-center gap-1">
                            <span className={getHitRateColor(conditionalValue)}>
                              {formatPercentage(conditionalValue)}
                            </span>
                            {diff > 0 ? (
                              <TrendingUp className="w-3 h-3 text-green-400" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-400" />
                            )}
                          </div>
                        );
                      } else if (column.format && value !== null && value !== undefined) {
                        displayValue = column.format(value);
                        if (column.colorScale) {
                          displayValue = (
                            <span className={getHitRateColor(value as number)}>
                              {displayValue}
                            </span>
                          );
                        }
                      }
                    } else if (column.format && value !== null && value !== undefined) {
                      displayValue = column.format(value);
                    }

                    return (
                      <td 
                        key={column.key} 
                        className={`
                          px-4 py-3 text-sm
                          ${colIndex === 0 ? 'sticky left-0 z-2 bg-gray-900' : ''}
                          ${colIndex === 0 && isSelected ? 'bg-purple-900 bg-opacity-40' : ''}
                          ${colIndex === 0 && !isSelected ? 'bg-gray-900' : ''}
                        `}
                        style={{ minWidth: column.minWidth }}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}