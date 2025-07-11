import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { LegMetric } from '../../types';
import { useDataStore } from '../../store/dataStore';
import { useParlayStore } from '../../store/parlayStore';
import { calculateConditionalHitRate } from '../../utils/conditionalMetrics';
import { formatBetDescription } from '../../config/columns';
import { formatOdds, formatPercentage } from '../../utils/formatting';

interface AlternateLinesPopoverProps {
  bet: LegMetric;
  otherBets: LegMetric[];
}

export default function AlternateLinesPopover({ bet, otherBets }: AlternateLinesPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { legMetrics, betIndex } = useDataStore();
  const { switchBetInParlay } = useParlayStore();
  
  // Find alternate lines for this bet
  const getAlternateLines = () => {
    const baseMarket = bet.market.split('_').slice(0, 2).join('_');
    
    return legMetrics.filter(altBet => 
      altBet.bookmaker === bet.bookmaker &&
      altBet.game_id === bet.game_id &&
      altBet.selection === bet.selection &&
      altBet.market.split('_').slice(0, 2).join('_') === baseMarket &&
      altBet.line_value !== bet.line_value
    );
  };
  
  const alternateLines = getAlternateLines();
  
  if (alternateLines.length === 0) return null;
  
  // Calculate conditional rates for each alternate
  const alternatesWithRates = alternateLines.map(altBet => {
    const conditionalRate = calculateConditionalHitRate(altBet, otherBets, betIndex);
    const baseRate = altBet.blended_hit_rate || altBet.hit_rate;
    const currentConditionalRate = bet.conditionalHitRate || bet.blended_hit_rate;
    const improvement = conditionalRate - currentConditionalRate;
    
    return {
      bet: altBet,
      conditionalRate,
      baseRate,
      improvement
    };
  });
  
  // Sort by line value for better display
  alternatesWithRates.sort((a, b) => b.bet.line_value - a.bet.line_value);
  
  const handleSwitch = (altBet: LegMetric) => {
    switchBetInParlay(bet.leg_id, altBet);
    setIsOpen(false);
  };
  
  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1 hover:bg-gray-700 rounded"
          title="View alternate lines"
        >
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-xl p-6 max-h-[80vh] overflow-y-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:rounded-lg border border-gray-800">
          <Dialog.Title className="text-lg font-semibold mb-4">
            Alternate Lines for {formatBetDescription(bet)}
          </Dialog.Title>
          
          <div className="mb-4 p-3 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Current Selection</p>
            <div className="flex items-center justify-between">
              <span className="font-medium">{formatBetDescription(bet)}</span>
              <div className="text-right">
                <p className="text-sm">{formatOdds(bet.price)}</p>
                <p className="text-xs text-gray-400">
                  {formatPercentage(bet.conditionalHitRate || bet.blended_hit_rate)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            {alternatesWithRates.map(({ bet: altBet, conditionalRate, improvement }) => (
              <button
                key={altBet.leg_id}
                onClick={() => handleSwitch(altBet)}
                className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-between"
              >
                <div className="text-left">
                  <p className="font-medium">{formatBetDescription(altBet)}</p>
                  <p className="text-sm text-gray-400">
                    {formatPercentage(conditionalRate)}
                    {improvement !== 0 && (
                      <span className={improvement > 0 ? 'text-green-400' : 'text-red-400'}>
                        {' '}({improvement > 0 ? '+' : ''}{(improvement * 100).toFixed(1)}%)
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatOdds(altBet.price)}</p>
                  {improvement > 0 && (
                    <p className="text-xs text-green-400">Better</p>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}