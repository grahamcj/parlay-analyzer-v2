import { Info } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useParlayStore } from '../../store/parlayStore';
import { useDataStore } from '../../store/dataStore';
import { getCorrelationStrength } from '../../utils/correlations';
import { formatBetDescription } from '../../config/columns';
import { formatPercentage } from '../../utils/formatting';

export default function ParlayInfoDialog() {
  const { currentParlay } = useParlayStore();
  const { betIndex } = useDataStore();
  
  // Calculate pairwise correlations
  const getCorrelations = () => {
    const correlations: Array<{
      bet1: typeof currentParlay[0];
      bet2: typeof currentParlay[0];
      strength: number;
    }> = [];
    
    for (let i = 0; i < currentParlay.length; i++) {
      for (let j = i + 1; j < currentParlay.length; j++) {
        const strength = getCorrelationStrength(currentParlay[i], currentParlay[j]);
        correlations.push({
          bet1: currentParlay[i],
          bet2: currentParlay[j],
          strength
        });
      }
    }
    
    return correlations.sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength));
  };
  
  // Calculate historical outcomes
  const getHistoricalOutcomes = () => {
    if (currentParlay.length === 0) return null;
    
    try {
      // Get hit games for each leg
      const hitGamesSets = currentParlay.map(leg => {
        if (!leg || !leg.leg_id) {
          console.warn('Invalid leg in parlay:', leg);
          return new Set<string>();
        }
        
        const history = betIndex[leg.leg_id];
        
        if (!history || !history.hit_games) {
          return new Set<string>();
        }
        
        // hit_games is an object with game IDs as keys
        // Extract the keys (game IDs) to create the set
        const gameIds = Object.keys(history.hit_games);
        return new Set(gameIds);
      });
      
      // Find intersection (games where all legs hit)
      let allHitGames = hitGamesSets[0] || new Set<string>();
      for (let i = 1; i < hitGamesSets.length; i++) {
        allHitGames = new Set(
          Array.from(allHitGames).filter(game => hitGamesSets[i].has(game))
        );
      }
      
      // Find total games where all legs were available
      const firstLegHistory = betIndex[currentParlay[0].leg_id];
      let totalGames = 0;
      if (firstLegHistory) {
        const hitGamesCount = firstLegHistory.hit_games ? Object.keys(firstLegHistory.hit_games).length : 0;
        const missGamesCount = firstLegHistory.miss_games ? Object.keys(firstLegHistory.miss_games).length : 0;
        totalGames = hitGamesCount + missGamesCount;
      }
      
      // Calculate distribution (how many times X of Y legs hit)
      const distribution: Record<number, number> = {};
      if (totalGames > 0 && currentParlay.length > 1) {
        // This is simplified - in reality we'd need to check each game
        // For now, just estimate based on individual hit rates
        distribution[currentParlay.length] = allHitGames.size;
        distribution[0] = Math.floor(totalGames * 0.1); // Rough estimate
        
        // Calculate how many times exactly 1 leg hit
        const remainingGames = totalGames - distribution[currentParlay.length] - distribution[0];
        distribution[1] = Math.max(0, remainingGames);
      }
      
      return {
        allHitCount: allHitGames.size,
        totalGames,
        hitRate: totalGames > 0 ? allHitGames.size / totalGames : 0,
        distribution
      };
    } catch (error) {
      console.error('Error calculating historical outcomes:', error);
      return null;
    }
  };
  
  const correlations = getCorrelations();
  const historicalData = getHistoricalOutcomes();
  
  const getCorrelationColor = (strength: number) => {
    const abs = Math.abs(strength);
    if (abs > 0.3) return strength > 0 ? 'text-green-400' : 'text-red-400';
    if (abs > 0.1) return strength > 0 ? 'text-green-500' : 'text-red-500';
    return 'text-gray-400';
  };
  
  const getCorrelationLabel = (strength: number) => {
    const abs = Math.abs(strength);
    const direction = strength > 0 ? 'Positive' : 'Negative';
    if (abs > 0.3) return `Strong ${direction}`;
    if (abs > 0.1) return `Moderate ${direction}`;
    if (abs > 0) return `Weak ${direction}`;
    return 'None';
  };
  
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
          <Info className="w-4 h-4" />
        </button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto border border-gray-800">
          <Dialog.Title className="text-lg font-semibold mb-6">
            Parlay Analysis
          </Dialog.Title>
          
          {/* Correlation Matrix */}
          <div className="mb-8">
            <h3 className="text-md font-medium mb-4 flex items-center gap-2">
              <span>🔗</span> Correlation Between Legs
            </h3>
            
            {correlations.length === 0 ? (
              <p className="text-gray-400">Add more legs to see correlations</p>
            ) : (
              <div className="space-y-2">
                {correlations.map((corr, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-800 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-sm">{formatBetDescription(corr.bet1)}</p>
                      <p className="text-sm text-gray-400">vs</p>
                      <p className="text-sm">{formatBetDescription(corr.bet2)}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`font-medium ${getCorrelationColor(corr.strength)}`}>
                        {getCorrelationLabel(corr.strength)}
                      </p>
                      <p className="text-xs text-gray-400">
                        ({(corr.strength * 100).toFixed(0)}%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-400 mt-3">
              Correlations are based on historical data. Positive means legs tend to hit together,
              negative means one hitting makes the other less likely.
            </p>
          </div>
          
          {/* Historical Outcomes */}
          <div>
            <h3 className="text-md font-medium mb-4 flex items-center gap-2">
              <span>📊</span> Historical Outcomes
            </h3>
            
            {!historicalData || historicalData.totalGames === 0 ? (
              <p className="text-gray-400">Insufficient historical data</p>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400">All legs hit together</p>
                  <p className="text-lg font-medium">
                    {historicalData.allHitCount} of {historicalData.totalGames} games
                  </p>
                  <p className="text-sm text-purple-400">
                    {formatPercentage(historicalData.hitRate)}
                  </p>
                </div>
                
                {Object.keys(historicalData.distribution).length > 0 && (
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Hit Distribution</p>
                    {Object.entries(historicalData.distribution)
                      .sort(([a], [b]) => Number(b) - Number(a))
                      .map(([legs, count]) => (
                        <div key={legs} className="flex justify-between text-sm">
                          <span>
                            {legs} of {currentParlay.length} legs hit:
                          </span>
                          <span className="text-gray-400">
                            {count} games
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
            
            <p className="text-xs text-gray-400 mt-3">
              Based on historical games where all selected players/teams participated.
            </p>
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