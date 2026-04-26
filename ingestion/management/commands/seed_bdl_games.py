import time
import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils.dateparse import parse_datetime
from games.models import Team, Game


class Command(BaseCommand):
    help = 'Seed games from BallDontLie API'

    def add_arguments(self, parser):
        parser.add_argument('--seasons', nargs='+', type=int)
        parser.add_argument('--start-season', type=int, default=2015)
        parser.add_argument('--end-season', type=int, default=2024)
        parser.add_argument('--postseason', action='store_true', help='Fetch postseason games')

    def handle(self, *args, **options):
        api_key = settings.BALLDONTLIE_API_KEY
        headers = {'Authorization': api_key}
        base_url = 'https://api.balldontlie.io/v1/games'

        seasons = options['seasons'] or list(range(options['start_season'], options['end_season'] + 1))
        postseason = options['postseason']
        game_type = 'playoff' if postseason else 'regular_season'

        self.stdout.write(f'Seeding {"postseason" if postseason else "regular season"} games for seasons: {seasons}')

        for season in seasons:
            self.stdout.write(f'\n--- Season {season} ---')
            cursor = None
            total_created = 0
            total_updated = 0

            while True:
                params = {'seasons[]': season, 'per_page': 100}
                if postseason:
                    params['postseason'] = 'true'
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

                    home_team = Team.objects.filter(abbreviation=home_abbr).first()
                    away_team = Team.objects.filter(abbreviation=away_abbr).first()

                    if not home_team or not away_team:
                        self.stdout.write(f'  Skipping: {home_abbr} vs {away_abbr}')
                        continue

                    # Parse incoming values. Use `is not None` so a real 0 score isn't dropped.
                    raw_home = g.get('home_team_score')
                    raw_away = g.get('visitor_team_score')
                    new_home_score = int(raw_home) if raw_home is not None else None
                    new_away_score = int(raw_away) if raw_away is not None else None
                    new_status = g.get('status')
                    new_datetime = parse_datetime(g['datetime']) if g.get('datetime') else None

                    existing = Game.objects.filter(nba_game_id=game_id).first()

                    # ── Brand new game ─────────────────────────────────────────
                    if existing is None:
                        Game.objects.create(
                            nba_game_id=game_id,
                            home_team=home_team,
                            away_team=away_team,
                            game_date=g['date'],
                            game_datetime=new_datetime,
                            status=new_status,
                            game_type=game_type,
                            postseason=postseason,
                            season=f'{season}-{str(season+1)[-2:]}',
                            home_score=new_home_score,
                            away_score=new_away_score,
                        )
                        total_created += 1
                        self.stdout.write(f'  [{total_created}] {home_abbr} vs {away_abbr} ({g["date"]})')
                        continue

                    # ── Existing game: defensive update ────────────────────────
                    update_fields = []

                    # Never downgrade a Final game's status. Only update status if
                    # we have a new non-empty value and the game isn't already Final.
                    if existing.status != 'Final' and new_status:
                        if existing.status != new_status:
                            existing.status = new_status
                            update_fields.append('status')

                    # Scores only ever increase during a game. Don't overwrite a
                    # real score with null, and don't allow a score to go backwards.
                    if new_home_score is not None:
                        if existing.home_score is None or new_home_score >= existing.home_score:
                            if existing.home_score != new_home_score:
                                existing.home_score = new_home_score
                                update_fields.append('home_score')

                    if new_away_score is not None:
                        if existing.away_score is None or new_away_score >= existing.away_score:
                            if existing.away_score != new_away_score:
                                existing.away_score = new_away_score
                                update_fields.append('away_score')

                    # Tipoff time can be corrected freely by BDL
                    if new_datetime and existing.game_datetime != new_datetime:
                        existing.game_datetime = new_datetime
                        update_fields.append('game_datetime')

                    if update_fields:
                        existing.save(update_fields=update_fields)
                        total_updated += 1

                cursor = meta.get('next_cursor')
                if not cursor:
                    break
                time.sleep(0.1)

            self.stdout.write(
                f'  Done — {total_created} created, {total_updated} updated for {season}'
            )

        self.stdout.write('\nAll done.')