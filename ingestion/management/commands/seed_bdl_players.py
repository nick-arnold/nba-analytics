import time
import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from players.models import Player


class Command(BaseCommand):
    help = 'Match players to BallDontLie IDs'

    def handle(self, *args, **options):
        api_key = settings.BALLDONTLIE_API_KEY
        headers = {'Authorization': api_key}
        base_url = 'https://api.balldontlie.io/v1/players'

        cursor = None
        total = 0
        matched = 0

        self.stdout.write('Fetching all BallDontLie players...')

        while True:
            params = {'per_page': 100}
            if cursor:
                params['cursor'] = cursor

            r = requests.get(base_url, headers=headers, params=params)
            data = r.json()
            players = data['data']
            meta = data['meta']

            if not players:
                break

            for p in players:
                total += 1
                first = p['first_name']
                last = p['last_name']
                bdl_id = p['id']

                player = Player.objects.filter(
                    first_name__iexact=first,
                    last_name__iexact=last
                ).first()

                if player and not player.bdl_player_id:
                    player.bdl_player_id = bdl_id
                    player.save()
                    matched += 1
                    self.stdout.write(f'  Matched: {first} {last} -> {bdl_id}')

            cursor = meta.get('next_cursor')
            if not cursor:
                break
            time.sleep(0.1)

        self.stdout.write(f'\nDone — {matched} players matched out of {total} BDL players')