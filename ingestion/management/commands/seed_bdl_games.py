import time
import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from games.models import Team, Game


class Command(BaseCommand):
    help = 'Seed games from BallDontLie API for seasons 2015-2024'

    def add_arguments(self, parser):
        parser.add_argument('--seasons', nargs='+', type=int)
        parser.add_argument('--start-season', type=int, default=2015)
        parser.add_argument('--end-season', type=int, default=2024)

    def handle(self, *args, **options):
        api_key = settings.BALLDONTLIE_API_KEY
        headers = {'Authorization': api_key}
        base_url = 'https://api.balldontlie.io/v1/games'

        seasons = options['seasons'] or list(range(options['start_season'], options['end_season'] + 1))
        self.stdout.write(f'Seeding seasons: {seasons}')

        for season in seasons:
            self.stdout.write(f'\n--- Season {season} ---')
            cursor = None
            total = 0

            while True:
                params = {'seasons[]': season, 'per_page': 100}
                if cursor:
                    params['cursor'] = cursor

                r = requests.get(base_url, headers=headers, params=params)
                data = r.json()
                games = data['data']
                meta = data['meta']

                if not games:
                    break

                for g in games:
                    home_abbr = g['home_team']['abbreviation']
                    away_abbr = g['visitor_team']['abbreviation']
                    game_id = str(g['id'])
                    game_date = g['date']
                    home_score = int(g['home_team_score']) if g['home_team_score'] else None
                    away_score = int(g['visitor_team_score']) if g['visitor_team_score'] else None

                    home_team = Team.objects.filter(abbreviation=home_abbr).first()
                    away_team = Team.objects.filter(abbreviation=away_abbr).first()

                    if not home_team or not away_team:
                        self.stdout.write(f'  Skipping: {home_abbr} vs {away_abbr}')
                        continue

                    game, created = Game.objects.get_or_create(
                        nba_game_id=game_id,
                        defaults={
                            'home_team': home_team,
                            'away_team': away_team,
                            'game_date': game_date,
                            'game_type': 'regular_season',
                            'season': f'{season}-{str(season+1)[-2:]}',
                            'home_score': home_score,
                            'away_score': away_score,
                        }
                    )

                    if created:
                        total += 1
                        self.stdout.write(f'  [{total}] {home_abbr} vs {away_abbr} ({game_date})')

                cursor = meta.get('next_cursor')
                if not cursor:
                    break
                time.sleep(0.1)

            self.stdout.write(f'  Done — {total} games created for {season}')

        self.stdout.write('\nAll done.')