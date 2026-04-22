import time
import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils.dateparse import parse_datetime
from games.models import Game, Team
from stats.models import PlayByPlay


class Command(BaseCommand):
    help = 'Seed scoring play-by-play data from BallDontLie API'

    def add_arguments(self, parser):
        parser.add_argument('--game-id', type=str, help='Specific nba_game_id to seed')
        parser.add_argument('--season', type=int, help='Seed all games for a season')
        parser.add_argument('--postseason', action='store_true', help='Postseason games only')

    def handle(self, *args, **options):
        api_key = settings.BALLDONTLIE_API_KEY
        headers = {'Authorization': api_key}

        if options['game_id']:
            games = Game.objects.filter(nba_game_id=options['game_id'])
        elif options['season']:
            season_str = f"{options['season']}-{str(options['season']+1)[-2:]}"
            games = Game.objects.filter(
                season=season_str,
                home_score__isnull=False,
            )
            if options['postseason']:
                games = games.filter(game_type='playoff')
        else:
            self.stdout.write('Provide --game-id or --season')
            return

        self.stdout.write(f'Seeding plays for {games.count()} games...')

        for game in games:
            self.seed_game(game, headers)
            time.sleep(0.15)

        self.stdout.write('Done.')

    def seed_game(self, game, headers):
        url = 'https://api.balldontlie.io/v1/plays'
        r = requests.get(url, headers=headers, params={'game_id': game.nba_game_id})

        if r.status_code != 200:
            self.stdout.write(f'  Error {r.status_code} for game {game.nba_game_id}')
            return

        data = r.json()
        plays = data.get('data', [])
        scoring_plays = [p for p in plays if p.get('scoring_play')]

        if not scoring_plays:
            self.stdout.write(f'  No scoring plays for {game.nba_game_id}')
            return

        team_cache = {t.abbreviation: t for t in game.home_team.__class__.objects.all()}

        created = 0
        for p in scoring_plays:
            team_abbr = p.get('team', {}).get('abbreviation') if p.get('team') else None
            team = team_cache.get(team_abbr) if team_abbr else None

            wallclock = None
            if p.get('wallclock'):
                wallclock = parse_datetime(p['wallclock'])

            coord_x = p.get('coordinate_x')
            coord_y = p.get('coordinate_y')
            if coord_x == -214748340:
                coord_x = None
            if coord_y == -214748365:
                coord_y = None

            _, was_created = PlayByPlay.objects.update_or_create(
                game=game,
                order=p['order'],
                defaults={
                    'period': p['period'],
                    'clock': p.get('clock', ''),
                    'event_type': p.get('type', '')[:100],
                    'description': p.get('text', ''),
                    'team': team,
                    'home_score': p.get('home_score'),
                    'away_score': p.get('away_score'),
                    'scoring_play': True,
                    'score_value': p.get('score_value'),
                    'wallclock': wallclock,
                    'coordinate_x': coord_x,
                    'coordinate_y': coord_y,
                }
            )
            if was_created:
                created += 1

        self.stdout.write(f'  {game.nba_game_id} — {created} new scoring plays ({len(scoring_plays)} total)')