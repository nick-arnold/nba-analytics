from django.core.management.base import BaseCommand
from nba_api.stats.static import teams
from games.models import Team


class Command(BaseCommand):
    help = 'Seed NBA teams from nba_api'

    def handle(self, *args, **kwargs):
        nba_teams = teams.get_teams()
        for t in nba_teams:
            team, created = Team.objects.get_or_create(
                abbreviation=t['abbreviation'],
                defaults={
                    'name': t['nickname'],
                    'city': t['city'],
                }
            )
            if created:
                self.stdout.write(f"Created: {team}")
            else:
                self.stdout.write(f"Skipped: {team}")