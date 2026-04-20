from celery import shared_task
from django.core.management import call_command
from datetime import datetime


def get_current_season_year():
    now = datetime.now()
    year = now.year
    month = now.month
    if month >= 10:
        return year
    else:
        return year - 1


@shared_task
def nightly_ingest():
    season = get_current_season_year()

    call_command('seed_bdl_games', seasons=[season])
    call_command('seed_bdl_games', seasons=[season], postseason=True)
    call_command('seed_bdl_stats', seasons=[season])
    call_command('seed_bdl_stats', seasons=[season], postseason=True)
    call_command('create_materialized_views', refresh_only=True)