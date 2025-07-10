import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Play, Calendar } from 'lucide-react';
import { useParlayStore } from '../../store/parlayStore';
import { formatBetDescription } from '../../config/columns';
import { formatOdds, formatCurrency, formatPercentage } from '../../utils/formatting';
import { format } from 'date-fns';

export default function SavedParlays() {
  const { savedParlays, loadSavedParlay, deleteSavedParlay } = useParlayStore();

  return (
    <div className="container mx-auto px-4 py-8">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-purple-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Games
      </Link>

      <h1 className="text-3xl font-bold mb-8">Saved Parlays</h1>

      {savedParlays.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <p className="text-gray-400 mb-4">No saved parlays yet</p>
          <Link 
            to="/"
            className="text-purple-400 hover:text-purple-300"
          >
            Go build some parlays →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {savedParlays.map(parlay => (
            <div 
              key={parlay.id}
              className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-purple-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{parlay.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(parlay.savedAt!), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteSavedParlay(parlay.id)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                {parlay.legs.map((leg, index) => (
                  <div key={index} className="text-sm">
                    <p>{formatBetDescription(leg)}</p>
                    <p className="text-gray-400">{formatOdds(leg.price)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-800 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">Total Odds</span>
                  <span className="font-semibold">{formatOdds(parlay.totalOdds)}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">Implied Probability</span>
                  <span>{formatPercentage(parlay.impliedProb)}</span>
                </div>
                
                <button
                  onClick={() => loadSavedParlay(parlay.id)}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Load Parlay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}