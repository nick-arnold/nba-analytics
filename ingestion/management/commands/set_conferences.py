from django.core.management.base import BaseCommand
from games.models import Team

CONFERENCES = {
    'East': [
        'ATL', 'BOS', 'BKN', 'CHA', 'CHI',
        'CLE', 'DET', 'IND', 'MIA', 'MIL',
        'NYK', 'ORL', 'PHI', 'TOR', 'WAS',
    ],
    'West': [
        'DAL', 'DEN', 'GSW', 'HOU', 'LAC',
        'LAL', 'MEM', 'MIN', 'NOP', 'OKC',
        'PHX', 'POR', 'SAC', 'SAS', 'UTA',
    ],
}

class Command(BaseCommand):
    help = 'Set conference for all 30 teams'

    def handle(self, *args, **kwargs):
        for conference, abbrevs in CONFERENCES.items():
            updated = Team.objects.filter(abbreviation__in=abbrevs).update(conference=conference)
            self.stdout.write(f'{conference}: updated {updated} teams')
        self.stdout.write(self.style.SUCCESS('Done.'))