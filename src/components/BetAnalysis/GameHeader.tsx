import { Game, Team } from '../../types';
import { formatTime } from '../../utils/formatting';

interface GameHeaderProps {
  game: Game;
  homeTeam: Team;
  awayTeam: Team;
}

export default function GameHeader({ game, homeTeam, awayTeam }: GameHeaderProps) {
  const getTeamLogo = (teamCode: string) => {
    return `/logos/mlb/${teamCode.toLowerCase()}.png`;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Away Team */}
          <div className="flex items-center gap-4">
            <img 
              src={getTeamLogo(awayTeam.TEAM_CODE)} 
              alt={awayTeam.TEAM_NAME}
              className="w-12 h-12"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <h3 className="text-lg font-semibold">
                {awayTeam.TEAM_CITY} {awayTeam.TEAM_NICKNAME}
              </h3>
              <p className="text-sm text-gray-400">
                SP: {game.away_sp} ({game.away_sp_hand})
              </p>
            </div>
          </div>

          <div className="text-2xl text-gray-600">@</div>

          {/* Home Team */}
          <div className="flex items-center gap-4">
            <img 
              src={getTeamLogo(homeTeam.TEAM_CODE)} 
              alt={homeTeam.TEAM_NAME}
              className="w-12 h-12"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <h3 className="text-lg font-semibold">
                {homeTeam.TEAM_CITY} {homeTeam.TEAM_NICKNAME}
              </h3>
              <p className="text-sm text-gray-400">
                SP: {game.home_sp} ({game.home_sp_hand})
              </p>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-lg font-medium">{formatTime(game.game_time)}</p>
          <p className="text-sm text-gray-400 capitalize">{game.game_type}</p>
        </div>
      </div>
    </div>
  );
}