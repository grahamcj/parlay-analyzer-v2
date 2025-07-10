import { useState } from 'react';
import { X, ChevronDown, ChevronUp, Save, AlertTriangle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useParlayStore } from '../../store/parlayStore';
import { useDataStore } from '../../store/dataStore';
import { formatBetDescription } from '../../config/columns';
import { formatOdds, formatCurrency, formatPercentage } from '../../utils/formatting';
import { calculateParlayProbability } from '../../utils/conditionalMetrics';

export default function ParlayPanel() {
  const [wager, setWager] = useState(10);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [parlayName, setParlayName] = useState('');
  
  const { currentParlay, isParlayMinimized, removeLeg, clearParlay, saveParlay, toggleParlayMinimized } = useParlayStore();
  const { betIndex } = useDataStore();

  if (currentParlay.length === 0) return null;

  // Calculate parlay odds
  const calculateOdds = () => {
    const decimalOdds = currentParlay.map(leg => {
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

  const parlayOdds = calculateOdds();
  const decimalOdds = parlayOdds > 0 ? (parlayOdds / 100) + 1 : (100 / Math.abs(parlayOdds)) + 1;
  const payout = wager * decimalOdds;
  const profit = payout - wager;
  
  // Calculate conditional probability
  const conditionalProb = calculateParlayProbability(currentParlay, betIndex);
  const impliedProb = 1 / decimalOdds;

  const handleSave = () => {
    if (parlayName.trim()) {
      saveParlay(parlayName.trim());
      setParlayName('');
      setShowSaveDialog(false);
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 transition-transform z-40 ${
      isParlayMinimized ? 'translate-y-[calc(100%-3rem)]' : 'translate-y-0'
    }`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-800"
        onClick={toggleParlayMinimized}
      >
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">
            Parlay ({currentParlay.length} {currentParlay.length === 1 ? 'leg' : 'legs'})
          </h3>
          <span className="text-sm text-gray-400">
            {formatOdds(parlayOdds)} • {formatPercentage(impliedProb)}
          </span>
        </div>
        <button className="p-1">
          {isParlayMinimized ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Content */}
      {!isParlayMinimized && (
        <div className="px-4 pb-4">
          {/* Legs */}
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {currentParlay.map((leg) => (
              <div 
                key={leg.leg_id} 
                className={`flex items-center justify-between p-3 bg-gray-800 rounded-lg ${
                  leg.isWeakLink ? 'border border-orange-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {leg.isWeakLink && (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  )}
                  <div>
                    <p className="font-medium">{formatBetDescription(leg)}</p>
                    <p className="text-sm text-gray-400">
                      {formatOdds(leg.price)} • {formatPercentage(leg.implied_prob)}
                      {leg.conditionalHitRate && (
                        <span className="ml-2">
                          → {formatPercentage(leg.conditionalHitRate)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLeg(leg.leg_id);
                  }}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Wager and Payout */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Wager</label>
              <input
                type="number"
                value={wager}
                onChange={(e) => setWager(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Payout</label>
              <div className="px-3 py-2 bg-gray-800 rounded-lg">
                {formatCurrency(payout)}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Profit</label>
              <div className="px-3 py-2 bg-gray-800 rounded-lg text-green-400">
                +{formatCurrency(profit)}
              </div>
            </div>
          </div>

          {/* Probability Comparison */}
          {conditionalProb !== impliedProb && (
            <div className="p-3 bg-gray-800 rounded-lg mb-4">
              <p className="text-sm text-gray-400">
                Conditional Probability: {formatPercentage(conditionalProb)}
                <span className={conditionalProb > impliedProb ? 'text-green-400' : 'text-red-400'}>
                  {' '}({conditionalProb > impliedProb ? '+' : ''}{formatPercentage(conditionalProb - impliedProb)})
                </span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={clearParlay}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Clear
            </button>
            <Dialog.Root open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <Dialog.Trigger asChild>
                <button className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-lg p-6 w-96 border border-gray-800">
                  <Dialog.Title className="text-lg font-semibold mb-4">
                    Save Parlay
                  </Dialog.Title>
                  <input
                    type="text"
                    value={parlayName}
                    onChange={(e) => setParlayName(e.target.value)}
                    placeholder="Enter parlay name..."
                    className="w-full px-3 py-2 bg-gray-800 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Dialog.Close asChild>
                      <button className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      onClick={handleSave}
                      disabled={!parlayName.trim()}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      )}
    </div>
  );
}