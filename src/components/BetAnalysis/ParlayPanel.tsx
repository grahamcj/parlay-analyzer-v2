import { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronUp, Save, AlertTriangle, Info, Wand2, Plus, RefreshCw } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Popover from '@radix-ui/react-popover';
import { useParlayStore } from '../../store/parlayStore';
import { useDataStore } from '../../store/dataStore';
import { formatBetDescription } from '../../config/columns';
import { formatOdds, formatCurrency, formatPercentage } from '../../utils/formatting';
import { calculateParlayProbability } from '../../utils/conditionalMetrics';
import { getCorrelationStrength } from '../../utils/correlations';
import AlternateLinesPopover from './AlternateLinesPopover';
import ParlayInfoDialog from './ParlayInfoDialog';

export default function ParlayPanel() {
  const [wager, setWager] = useState(10);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [parlayName, setParlayName] = useState('');
  const [showAddLegSuggestions, setShowAddLegSuggestions] = useState(false);
  
  const { currentParlay, isParlayMinimized, removeLeg, clearParlay, saveParlay, toggleParlayMinimized, switchBetInParlay, addLeg } = useParlayStore();
  const { betIndex, legMetrics } = useDataStore();

  // Get add-a-leg suggestions
  const getAddLegSuggestions = () => {
    if (currentParlay.length === 0) return [];
    
    // Find bets from same games that have high correlation
    const gameIds = [...new Set(currentParlay.map(leg => leg.game_id))];
    const candidateBets = legMetrics.filter(bet => 
      gameIds.includes(bet.game_id) && 
      !currentParlay.some(leg => leg.leg_id === bet.leg_id)
    );
    
    // Calculate correlation scores
    const suggestions = candidateBets.map(bet => {
      let totalCorrelation = 0;
      currentParlay.forEach(leg => {
        totalCorrelation += Math.max(0, getCorrelationStrength(bet, leg));
      });
      return { bet, score: totalCorrelation };
    });
    
    // Sort by correlation score and return top 2
    return suggestions
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(s => s.bet);
  };

  const addLegSuggestions = useMemo(() => getAddLegSuggestions(), [currentParlay, legMetrics]);

  const handleSave = () => {
    if (parlayName.trim()) {
      saveParlay(parlayName.trim());
      setParlayName('');
      setShowSaveDialog(false);
    }
  };

  const handleOptimize = () => {
    // Swap weak links
    currentParlay.forEach(leg => {
      if (leg.isWeakLink && leg.betterAlternatives && leg.betterAlternatives.length > 0) {
        const alternative = leg.betterAlternatives[0];
        if (alternative && alternative.leg_id) {
          switchBetInParlay(leg.leg_id, alternative);
        }
      }
    });
    
    // Add best suggested leg if available
    if (addLegSuggestions.length > 0) {
      addLeg(addLegSuggestions[0]);
    }
  };

  // Early return AFTER all hooks
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
  
  // Calculate adjusted odds (estimated sportsbook odds)
  const adjustedDecimal = 1 / conditionalProb;
  const adjustedAmerican = adjustedDecimal >= 2
    ? Math.round((adjustedDecimal - 1) * 100)
    : Math.round(-100 / (adjustedDecimal - 1));
  
  // Calculate synergy score
  const synergyPercent = ((conditionalProb - impliedProb) / impliedProb) * 100;
  const synergyLabel = synergyPercent > 10 ? 'High' : synergyPercent > 0 ? 'Medium' : 'Low';
  const synergyColor = synergyPercent > 10 ? 'text-green-400' : synergyPercent > 0 ? 'text-yellow-400' : 'text-red-400';

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
          <span className={`text-sm ${synergyColor}`}>
            Synergy: {synergyLabel}
          </span>
        </div>
        <button className="p-1">
          {isParlayMinimized ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Content */}
      {!isParlayMinimized && (
        <div className="px-4 pb-4">
          {/* Add-a-Leg Suggestion */}
          {addLegSuggestions.length > 0 && currentParlay.length < 5 && (
            <div className="mb-4 p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Suggested Addition</span>
                <button
                  onClick={() => setShowAddLegSuggestions(!showAddLegSuggestions)}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  {showAddLegSuggestions ? 'Hide' : 'Show All'}
                </button>
              </div>
              {showAddLegSuggestions ? (
                <div className="space-y-2">
                  {addLegSuggestions.map(suggestion => (
                    <button
                      key={suggestion.leg_id}
                      onClick={() => {
                        addLeg(suggestion);
                        setShowAddLegSuggestions(false);
                      }}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded flex items-center justify-between"
                    >
                      <span className="text-sm">{formatBetDescription(suggestion)}</span>
                      <Plus className="w-4 h-4 text-green-400" />
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => {
                    addLeg(addLegSuggestions[0]);
                  }}
                  className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
                >
                  <Plus className="w-4 h-4" />
                  Add {formatBetDescription(addLegSuggestions[0])}
                </button>
              )}
            </div>
          )}

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
                    <Popover.Root>
                      <Popover.Trigger asChild>
                        <button className="p-1">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                        </button>
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Content
                          className="bg-gray-800 px-3 py-2 rounded text-sm max-w-xs z-50 shadow-lg"
                          sideOffset={5}
                        >
                          This leg reduces the parlay's overall hit rate by {((1 - ((leg.conditionalHitRate || 0) / (leg.blended_hit_rate || 1))) * 100).toFixed(0)}%
                          <Popover.Arrow className="fill-gray-800" />
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  )}
                  <div>
                    <p className="font-medium">{formatBetDescription(leg)}</p>
                    <p className="text-sm text-gray-400">
                      {formatOdds(leg.price)} • {formatPercentage(leg.implied_prob || 0)}
                      {leg.conditionalHitRate !== undefined && (
                        <span className={(leg.conditionalHitRate > (leg.blended_hit_rate || 0)) ? 'text-green-400' : 'text-red-400'}>
                          {' '}→ {formatPercentage(leg.conditionalHitRate)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlternateLinesPopover 
                    bet={leg}
                    otherBets={currentParlay.filter(b => b.leg_id !== leg.leg_id)}
                  />
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
          <div className="p-3 bg-gray-800 rounded-lg mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Conditional Probability:</span>
                <Popover.Root>
                  <Popover.Trigger asChild>
                    <button className="p-1">
                      <Info className="w-3 h-3 text-gray-500" />
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      className="bg-gray-800 px-3 py-2 rounded text-sm max-w-xs z-50 shadow-lg"
                      sideOffset={5}
                    >
                      The actual probability of all legs hitting together based on historical correlations
                      <Popover.Arrow className="fill-gray-800" />
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </div>
              <span className={conditionalProb > impliedProb ? 'text-green-400' : 'text-red-400'}>
                {formatPercentage(conditionalProb)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Est. Same-Game Parlay Odds:</span>
              <span>{formatOdds(adjustedAmerican)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={clearParlay}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleOptimize}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              disabled={!currentParlay.some(leg => leg.isWeakLink) && addLegSuggestions.length === 0}
            >
              <Wand2 className="w-4 h-4" />
              Optimize
            </button>
            <ParlayInfoDialog />
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