import requests
import json
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Test PBP endpoint'

    def handle(self, *args, **kwargs):
        headers = {
            'Host': 'stats.nba.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Referer': 'https://www.nba.com/',
            'x-nba-stats-origin': 'stats',
            'x-nba-stats-token': 'true',
        }

        url = 'https://stats.nba.com/stats/playbyplayv2?GameID=0022400001&StartPeriod=0&EndPeriod=10'
        
        self.stdout.write('Making request...')
        try:
            r = requests.get(url, headers=headers, timeout=60)
            self.stdout.write(f'Status: {r.status_code}')
            data = r.json()
            self.stdout.write(f'Top level keys: {list(data.keys())}')
        except Exception as e:
            self.stdout.write(f'Error: {e}')