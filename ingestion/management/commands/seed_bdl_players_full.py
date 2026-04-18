import time
import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from players.models import Player


class Command(BaseCommand):
    help = 'Seed all players from BallDontLie, matching existing or creating new'

    def handle(self, *args, **options):
        api_key = settings.BALLDONTLIE_API_KEY
        headers = {'Authorization': api_key}
        base_url = 'https://api.balldontlie.io/v1/players'

        cursor = None
        matched = 0
        created = 0

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
                bdl_id = p['id']
                first = p['first_name']
                last = p['last_name']
                position = p.get('position', '')

                # first try to match existing player by name
                player = Player.objects.filter(
                    first_name__iexact=first,
                    last_name__iexact=last
                ).first()

                if player:
                    if not player.bdl_player_id:
                        player.bdl_player_id = bdl_id
                        player.save()
                        matched += 1
                else:
                    # create new player with BDL data
                    Player.objects.create(
                        first_name=first,
                        last_name=last,
                        position=position,
                        bdl_player_id=bdl_id,
                        is_active=False,
                    )
                    created += 1

            cursor = meta.get('next_cursor')
            if not cursor:
                break
            time.sleep(0.1)

        self.stdout.write(f'\nDone — {matched} matched, {created} created')