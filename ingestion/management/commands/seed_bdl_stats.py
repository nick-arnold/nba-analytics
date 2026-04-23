import time
import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from games.models import Game, Team
from players.models import Player
from stats.models import PlayerStat


class Command(BaseCommand):
    help = 'Seed player stats from BallDontLie API'

    def add_arguments(self, parser):
        parser.add_argument('--seasons', nargs='+', type=int)
        parser.add_argument('--start-season', type=int, default=2015)
        parser.add_argument('--end-season', type=int, default=2024)
        parser.add_argument('--postseason', action='store_true', help='Fetch postseason stats')
        parser.add_argument('--game-ids', nargs='+', type=str, help='Fetch stats for specific game IDs only')

    def handle(self, *args, **options):
        api_key = settings.BALLDONTLIE_API_KEY
        headers = {'Authorization': api_key}
        base_url = 'https://api.balldontlie.io/v1/stats'
        postseason = options['postseason']
        game_ids = options.get('game_ids')

        if game_ids:
            self.seed_by_game_ids(game_ids, headers, base_url)
            return

        seasons = options['seasons'] or list(range(options['start_season'], options['end_season'] + 1))
        self.stdout.write(f'Seeding {"postseason" if postseason else "regular season"} stats for seasons: {seasons}')

        for season in seasons:
            self.stdout.write(f'\n--- Season {season} ---')
            cursor = None
            created_total = 0
            updated_total = 0

            while True:
                params = {'seasons[]': season, 'per_page': 100}
                if postseason:
                    params['postseason'] = 'true'
                if cursor:
                    params['cursor'] = cursor

                self.stdout.write(f'  Fetching cursor: {cursor}')
                r = requests.get(base_url, headers=headers, params=params)
                data = r.json()
                stats = data['data']
                meta = data['meta']

                if not stats:
                    break

                created_total, updated_total = self.process_stats(stats, created_total, updated_total)

                cursor = meta.get('next_cursor')
                if not cursor:
                    break
                time.sleep(0.1)

            self.stdout.write(f'  Done — {created_total} created, {updated_total} updated for {season}')

        self.stdout.write('\nAll done.')

    def seed_by_game_ids(self, game_ids, headers, base_url):
        self.stdout.write(f'Seeding stats for game IDs: {game_ids}')
        created_total = 0
        updated_total = 0
        cursor = None

        while True:
            params = {'per_page': 100}
            for gid in game_ids:
                params.setdefault('game_ids[]', [])
                if isinstance(params['game_ids[]'], list):
                    params['game_ids[]'].append(gid)

            if cursor:
                params['cursor'] = cursor

            r = requests.get(base_url, headers=headers, params=params)
            data = r.json()
            stats = data['data']
            meta = data['meta']

            if not stats:
                break

            created_total, updated_total = self.process_stats(stats, created_total, updated_total)

            cursor = meta.get('next_cursor')
            if not cursor:
                break
            time.sleep(0.1)

        self.stdout.write(f'Done — {created_total} created, {updated_total} updated')

    def process_stats(self, stats, created_total, updated_total):
        for s in stats:
            nba_game_id = str(s['game']['id'])
            player = Player.objects.filter(bdl_player_id=s['player']['id']).first()
            game = Game.objects.filter(nba_game_id=nba_game_id).first()

            if not game or not player:
                continue

            team_abbr = s['team']['abbreviation']
            team = Team.objects.filter(abbreviation=team_abbr).first()

            if not team:
                continue

            _, created = PlayerStat.objects.update_or_create(
                game=game,
                player=player,
                defaults={
                    'team': team,
                    'minutes': s.get('min'),
                    'pts': s.get('pts'),
                    'reb': s.get('reb'),
                    'ast': s.get('ast'),
                    'stl': s.get('stl'),
                    'blk': s.get('blk'),
                    'turnover': s.get('turnover'),
                    'fgm': s.get('fgm'),
                    'fga': s.get('fga'),
                    'fg_pct': s.get('fg_pct'),
                    'fg3m': s.get('fg3m'),
                    'fg3a': s.get('fg3a'),
                    'fg3_pct': s.get('fg3_pct'),
                    'ftm': s.get('ftm'),
                    'fta': s.get('fta'),
                    'ft_pct': s.get('ft_pct'),
                    'oreb': s.get('oreb'),
                    'dreb': s.get('dreb'),
                    'pf': s.get('pf'),
                }
            )

            if created:
                created_total += 1
            else:
                updated_total += 1

        return created_total, updated_total