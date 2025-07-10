import { Link } from 'react-router-dom';
import { Calendar, Clock, Trophy } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { formatDate, formatTime } from '../../utils/formatting';

export default function GameList() {
  const { games, teams } = useDataStore();

  const getTeamLogo = (teamCode: string) => {
    // In production, these would be actual logo URLs
    return `/logos/mlb/${teamCode.toLowerCase()}.png`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">MLB Parlay Analyzer</h1>
        <div className="flex items-center gap-6 text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(new Date())}</span>
          </div>
          <Link to="/saved" className="flex items-center gap-2 hover:text-purple-400 transition-colors">
            <Trophy className="w-4 h-4" />
            <span>Saved Parlays</span>
          </Link>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => {
          const homeTeam = teams.find(t => t.TEAM_ID === game.home_team_id);
          const awayTeam = teams.find(t => t.TEAM_ID === game.away_team_id);

          return (
            <Link
              key={game.game_id}
              to={`/game/${game.game_id}`}
              className="bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition-colors border border-gray-800 hover:border-purple-600"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(game.game_time)}</span>
                </div>
                <span className="text-xs text-gray-500 uppercase">{game.game_type}</span>
              </div>

              <div className="space-y-3">
                {/* Away Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={getTeamLogo(awayTeam?.TEAM_CODE || '')} 
                      alt={awayTeam?.TEAM_NAME}
                      className="w-8 h-8"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <p className="font-medium">{awayTeam?.TEAM_CITY} {awayTeam?.TEAM_NICKNAME}</p>
                      <p className="text-sm text-gray-400">SP: {game.away_sp} ({game.away_sp_hand})</p>
                    </div>
                  </div>
                </div>

                <div className="text-center text-gray-600 text-sm">@</div>

                {/* Home Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={getTeamLogo(homeTeam?.TEAM_CODE || '')} 
                      alt={homeTeam?.TEAM_NAME}
                      className="w-8 h-8"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <p className="font-medium">{homeTeam?.TEAM_CITY} {homeTeam?.TEAM_NICKNAME}</p>
                      <p className="text-sm text-gray-400">SP: {game.home_sp} ({game.home_sp_hand})</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-sm text-gray-400">Click to analyze bets →</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}