import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { useParlayStore } from '../../store/parlayStore';
import { useFilterStore } from '../../store/filterStore';
import GameHeader from './GameHeader';
import FilterBar from './FilterBar';
import BetTable from './BetTable';
import ParlayPanel from './ParlayPanel';
import CollapsibleTable from './CollapsibleTable';
import { LegMetric, Game, Team, Player } from '../../types';
import { filterBlockedBets } from '../../utils/correlations';
import { calculateConditionalMetrics } from '../../utils/conditionalMetrics';
import { meetsPresetConditions } from '../../config/presets';
import { PRESETS } from '../../config/presets';
import { groupBetsByCategory } from '../../utils/betUtils';

const getGameIdForLegMetrics = (game: Game, teams: Team[]): string => {
  const gameDate = game.game_date.replace(/-/g, ''); // Convert 2025-07-06 to 20250706
  const homeTeam = teams.find(t => t.TEAM_ID === game.home_team_id);
  const awayTeam = teams.find(t => t.TEAM_ID === game.away_team_id);
  
  if (!homeTeam || !awayTeam) return '';
  
  // Format: YYYYMMDD_HOMECODE_AWAYCODE
  return `${gameDate}_${homeTeam.TEAM_CODE}_${awayTeam.TEAM_CODE}`;
};

export default function BetAnalysis() {
  const { gameId } = useParams<{ gameId: string }>();
  const { games, teams, players, legMetrics, betIndex } = useDataStore();
  const { currentParlay, updateParlayLeg } = useParlayStore();
  const { filters, activePreset, setFilter } = useFilterStore();
  
  // State for table sorting
  const [gameLineSort, setGameLineSort] = useState({ column: 'bet', order: 'asc' as 'asc' | 'desc' });
  const [pitcherSort, setPitcherSort] = useState({ column: 'bet', order: 'asc' as 'asc' | 'desc' });
  const [batterSort, setBatterSort] = useState({ column: 'bet', order: 'asc' as 'asc' | 'desc' });

  const game = games.find(g => g.game_id === Number(gameId));
  
  if (!game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Game not found</p>
        <Link to="/" className="text-purple-400 hover:text-purple-300">
          Back to games
        </Link>
      </div>
    );
  }

  const homeTeam = teams.find(t => t.TEAM_ID === game.home_team_id);
  const awayTeam = teams.find(t => t.TEAM_ID === game.away_team_id);

  // Get bets for this game
  const legMetricsGameId = getGameIdForLegMetrics(game, teams);
  const gameBets = legMetrics.filter(bet => bet.game_id === legMetricsGameId);
  const bookmakers = [...new Set(gameBets.map(b => b.bookmaker))].filter(Boolean);
  
  // Initialize default bookmaker on first load
  useEffect(() => {
    if (!filters.bookmaker && bookmakers.length > 0) {
      const defaultBookmaker = bookmakers.find(b => b.toLowerCase() === 'draftkings') || bookmakers[0];
      if (defaultBookmaker) {
        setFilter('bookmaker', defaultBookmaker);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameBets.length]); // Only run when gameBets are loaded

  // Filter blocked bets based on current parlay
  const availableBets = filterBlockedBets(gameBets, currentParlay);

  // Calculate conditional metrics if parlay exists
  const { updatedBets, weakLinks, betterAlternatives } = calculateConditionalMetrics(
    availableBets,
    currentParlay,
    betIndex, 
    players, 
    teams
  );

  // Update parlay legs with conditional metrics
  useEffect(() => {
    currentParlay.forEach(leg => {
      const updatedLeg = updatedBets.find(bet => bet.leg_id === leg.leg_id);
      if (updatedLeg && (updatedLeg.conditionalHitRate !== leg.conditionalHitRate || updatedLeg.isWeakLink !== leg.isWeakLink)) {
        updateParlayLeg(leg.leg_id, {
          conditionalHitRate: updatedLeg.conditionalHitRate,
          isWeakLink: updatedLeg.isWeakLink
        });
      }
    });
  }, [updatedBets, currentParlay, updateParlayLeg]);

  // Apply filters
  const filteredBets = updatedBets.filter(bet => {
    // Bookmaker filter
    if (filters.bookmaker && bet.bookmaker !== filters.bookmaker) return false;
    
    // Team filter
    if (filters.teams && filters.teams.length > 0) {
      // For team bets (ML, spread), check if selection matches
      if (bet.market === 'h2h' || bet.market === 'spreads') {
        if (!filters.teams.includes(bet.selection)) return false;
      }
      // For totals, always include (applies to both teams)
      else if (bet.market === 'totals') {
        // Check if either team in the game matches the filter
        const gameTeams = [bet.home_team, bet.away_team];
        if (!filters.teams.some(team => gameTeams.includes(team))) return false;
      }
      // For player props, check if player's team matches
      else {
        // Get player's team from metadata
        const player = players.find(p => `${p.FIRST_NAME} ${p.LAST_NAME}` === bet.selection);
        if (player) {
          const playerTeam = teams.find(t => t.TEAM_CODE === player.TEAM_CODE);
          if (playerTeam && !filters.teams.includes(playerTeam.TEAM_NAME)) return false;
        } else {
          // If we can't find the player, exclude the bet
          return false;
        }
      }
    }
    
    // Market filter
    if (filters.markets && filters.markets.length > 0) {
      if (!filters.markets.includes(bet.market)) return false;
    }
    
    // Odds range filter
    if (filters.oddsRange) {
      if (bet.price < filters.oddsRange.min || bet.price > filters.oddsRange.max) return false;
    }
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const betText = `${bet.selection} ${bet.market} ${bet.side} ${bet.line_value}`.toLowerCase();
      if (!betText.includes(searchLower)) return false;
    }
    
    // Preset conditions
    if (activePreset) {
      const preset = PRESETS[activePreset];
      if (!meetsPresetConditions(bet, preset)) return false;
      
      // Special handling for valueUnderdogs - must be plus money
      if (activePreset === 'valueUnderdogs' && bet.price < 100) return false;
      
      // Special handling for bigBoosters - requires parlay
      if (activePreset === 'bigBoosters' && currentParlay.length === 0) return false;
    }
    
    return true;
  });

  // Categorize bets using utility function
  const { gameBets: gameLineBets, pitcherBets: pitcherPropBets, batterBets: batterPropBets } = 
    groupBetsByCategory(filteredBets, game);

  return (
    <div className="min-h-screen">
      {/* Fixed Filter Bar */}
      <div className="filter-bar-fixed">
        <FilterBar 
          totalBets={filteredBets.length}
          bookmakers={bookmakers}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      </div>

      {/* Scrollable Content - padded for fixed elements */}
      <div className="container mx-auto px-4 pt-[85px] pb-40">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-purple-400 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Games
        </Link>

        <GameHeader 
          game={game} 
          homeTeam={homeTeam!} 
          awayTeam={awayTeam!} 
        />

        <div className="space-y-6 mt-6">
          <CollapsibleTable 
            title="Game Lines" 
            count={gameLineBets.length}
            tableId="game-lines"
          >
            <BetTable 
              bets={gameLineBets}
              category="game"
              weakLinks={weakLinks}
              betterAlternatives={betterAlternatives}
              sortColumn={gameLineSort.column}
              sortOrder={gameLineSort.order}
              onSort={(column) => {
                if (gameLineSort.column === column) {
                  setGameLineSort({ column, order: gameLineSort.order === 'asc' ? 'desc' : 'asc' });
                } else {
                  setGameLineSort({ column, order: 'asc' });
                }
              }}
            />
          </CollapsibleTable>

          <CollapsibleTable 
            title="Pitcher Props" 
            count={pitcherPropBets.length}
            tableId="pitcher-props"
          >
            <BetTable 
              bets={pitcherPropBets}
              category="pitcher"
              weakLinks={weakLinks}
              betterAlternatives={betterAlternatives}
              sortColumn={pitcherSort.column}
              sortOrder={pitcherSort.order}
              onSort={(column) => {
                if (pitcherSort.column === column) {
                  setPitcherSort({ column, order: pitcherSort.order === 'asc' ? 'desc' : 'asc' });
                } else {
                  setPitcherSort({ column, order: 'asc' });
                }
              }}
            />
          </CollapsibleTable>

          <CollapsibleTable 
            title="Batter Props" 
            count={batterPropBets.length}
            tableId="batter-props"
          >
            <BetTable 
              bets={batterPropBets}
              category="batter"
              weakLinks={weakLinks}
              betterAlternatives={betterAlternatives}
              sortColumn={batterSort.column}
              sortOrder={batterSort.order}
              onSort={(column) => {
                if (batterSort.column === column) {
                  setBatterSort({ column, order: batterSort.order === 'asc' ? 'desc' : 'asc' });
                } else {
                  setBatterSort({ column, order: 'asc' });
                }
              }}
            />
          </CollapsibleTable>
        </div>
      </div>

      {/* Fixed Parlay Panel */}
      <ParlayPanel />
    </div>
  );
}