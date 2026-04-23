from celery import shared_task
from django.core.management import call_command
from datetime import datetime, date, timedelta, timezone


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
    call_command('seed_bdl_plays', season=season)
    call_command('seed_bdl_plays', season=season, postseason=True)
    call_command('create_materialized_views', refresh_only=True)


@shared_task
def live_score_poll():
    from games.models import Game

    now = datetime.now(timezone.utc)
    today = date.today()
    yesterday = today - timedelta(days=1)

    live_or_pending = Game.objects.filter(
        game_date__in=[today, yesterday],
        game_datetime__lte=now,
    ).exclude(status='Final')

    if not live_or_pending.exists():
        return 'No live or pending games, skipping'

    season = get_current_season_year()

    # Update scores and status
    call_command('seed_bdl_games', seasons=[season])
    call_command('seed_bdl_games', seasons=[season], postseason=True)

    # Update live box scores for in-progress games only
    live_game_ids = list(
        live_or_pending.exclude(home_score=None).values_list('nba_game_id', flat=True)
    )
    if live_game_ids:
        call_command('seed_bdl_stats', game_ids=live_game_ids)
        call_command('seed_bdl_plays', game_ids=live_game_ids)

    return f'Polled {live_or_pending.count()} live/pending games'