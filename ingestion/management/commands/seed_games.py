import time
from django.core.management.base import BaseCommand
from nba_api.stats.endpoints import leaguegamelog, playbyplayv2
from nba_api.stats.static import teams as nba_teams_static
from games.models import Team, Game
from players.models import Player
from stats.models import PlayByPlay


class Command(BaseCommand):
    help = 'Seed games and play-by-play from nba_api for 2024-25 regular season'

    def handle(self, *args, **kwargs):
        season = '2024-25'
        season_type = 'Regular Season'

        self.stdout.write('Fetching game log...')
        time.sleep(1)

        gamelog = leaguegamelog.LeagueGameLog(
            season=season,
            season_type_all_star=season_type,
            timeout=60
        )
        games_df = gamelog.get_data_frames()[0]

        game_ids = games_df['GAME_ID'].unique()
        self.stdout.write(f'Found {len(game_ids)} games')

        for i, game_id in enumerate(game_ids):
            game_rows = games_df[games_df['GAME_ID'] == game_id]

            home_row = game_rows[game_rows['MATCHUP'].str.contains('vs.')].iloc[0]
            away_row = game_rows[game_rows['MATCHUP'].str.contains('@')].iloc[0]

            home_team = Team.objects.filter(abbreviation=home_row['TEAM_ABBREVIATION']).first()
            away_team = Team.objects.filter(abbreviation=away_row['TEAM_ABBREVIATION']).first()

            if not home_team or not away_team:
                self.stdout.write(f'Skipping {game_id} — team not found')
                continue

            game, created = Game.objects.get_or_create(
                nba_game_id=game_id,
                defaults={
                    'home_team': home_team,
                    'away_team': away_team,
                    'game_date': home_row['GAME_DATE'],
                    'game_type': 'regular_season',
                    'season': season,
                    'home_score': int(home_row['PTS']),
                    'away_score': int(away_row['PTS']),
                }
            )

            if not created:
                self.stdout.write(f'[{i+1}/{len(game_ids)}] Already exists: {game}')
                continue

            self.stdout.write(f'[{i+1}/{len(game_ids)}] Created: {game} — fetching PBP...')

            time.sleep(0.6)
            try:
                pbp = playbyplayv2.PlayByPlayV2(game_id=game_id, timeout=60)
                pbp_df = pbp.get_data_frames()[0]

                plays_to_create = []
                for _, row in pbp_df.iterrows():
                    player1 = Player.objects.filter(nba_player_id=str(int(row['PLAYER1_ID']))).first() if row['PLAYER1_ID'] and row['PLAYER1_ID'] != 0 else None
                    player2 = Player.objects.filter(nba_player_id=str(int(row['PLAYER2_ID']))).first() if row['PLAYER2_ID'] and row['PLAYER2_ID'] != 0 else None
                    player3 = Player.objects.filter(nba_player_id=str(int(row['PLAYER3_ID']))).first() if row['PLAYER3_ID'] and row['PLAYER3_ID'] != 0 else None
                    team = Team.objects.filter(abbreviation=row['PLAYER1_TEAM_ABBREVIATION']).first() if row.get('PLAYER1_TEAM_ABBREVIATION') else None

                    plays_to_create.append(PlayByPlay(
                        game=game,
                        event_num=row['EVENTNUM'],
                        period=row['PERIOD'],
                        clock=row['PCTIMESTRING'],
                        event_type=str(row['EVENTMSGTYPE']),
                        description=str(row.get('HOMEDESCRIPTION') or row.get('VISITORDESCRIPTION') or row.get('NEUTRALDESCRIPTION') or ''),
                        player1=player1,
                        player2=player2,
                        player3=player3,
                        team=team,
                        home_score=int(row['SCORE'].split('-')[0].strip()) if row.get('SCORE') and '-' in str(row['SCORE']) else None,
                        away_score=int(row['SCORE'].split('-')[1].strip()) if row.get('SCORE') and '-' in str(row['SCORE']) else None,
                    ))

                PlayByPlay.objects.bulk_create(plays_to_create, ignore_conflicts=True)
                self.stdout.write(f'  → {len(plays_to_create)} plays inserted')

            except Exception as e:
                self.stdout.write(f'  → PBP failed: {e}')
                time.sleep(2)
                continue

            time.sleep(0.6)

        self.stdout.write('Done.')