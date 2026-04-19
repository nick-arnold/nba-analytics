from django.core.management.base import BaseCommand
from django.db import connection
from pathlib import Path


class Command(BaseCommand):
    help = 'Create or recreate all materialized views'

    def add_arguments(self, parser):
        parser.add_argument(
            '--refresh-only',
            action='store_true',
            help='Only refresh existing views, do not recreate'
        )

    def run_sql_file(self, filename):
        sql_path = Path(__file__).resolve().parent.parent.parent / 'sql' / filename
        sql = sql_path.read_text()
        with connection.cursor() as cursor:
            cursor.execute(sql)

    def drop_view(self, view_name):
        with connection.cursor() as cursor:
            cursor.execute(f'DROP MATERIALIZED VIEW IF EXISTS {view_name} CASCADE')

    def refresh_view(self, view_name):
        with connection.cursor() as cursor:
            cursor.execute(f'REFRESH MATERIALIZED VIEW CONCURRENTLY {view_name}')

    def handle(self, *args, **options):
        views = [
            ('player_season_stats', 'player_season_stats.sql'),
            ('player_game_log', 'player_game_log.sql'),
        ]

        if options['refresh_only']:
            for view_name, _ in views:
                self.stdout.write(f'Refreshing {view_name}...')
                self.refresh_view(view_name)
                self.stdout.write(self.style.SUCCESS(f'  {view_name} refreshed'))
        else:
            for view_name, sql_file in views:
                self.stdout.write(f'Creating {view_name}...')
                self.drop_view(view_name)
                self.run_sql_file(sql_file)
                self.stdout.write(self.style.SUCCESS(f'  {view_name} created'))

        self.stdout.write(self.style.SUCCESS('Done.'))