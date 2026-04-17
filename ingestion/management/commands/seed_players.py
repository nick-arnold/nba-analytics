from django.core.management.base import BaseCommand
from nba_api.stats.static import players
from players.models import Player


class Command(BaseCommand):
    help = 'Seed NBA players from nba_api'

    def handle(self, *args, **kwargs):
        nba_players = players.get_active_players()
        for p in nba_players:
            player, created = Player.objects.get_or_create(
                nba_player_id=str(p['id']),
                defaults={
                    'first_name': p['first_name'],
                    'last_name': p['last_name'],
                }
            )
            if created:
                self.stdout.write(f"Created: {player}")
            else:
                self.stdout.write(f"Skipped: {player}")