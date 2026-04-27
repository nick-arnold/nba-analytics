from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    PlayByPlayViewSet, PlayerStatViewSet,
    PlayerSeasonStatsViewSet, PlayerGameLogViewSet,
    league_tov_avg, scoring_plays, shot_chart,
    game_segments, segment_player_stats,
)

router = DefaultRouter()
router.register(r'playbyplay', PlayByPlayViewSet, basename='playbyplay')
router.register(r'playerstats', PlayerStatViewSet)
router.register(r'player-season-stats', PlayerSeasonStatsViewSet, basename='player-season-stats')
router.register(r'player-game-log', PlayerGameLogViewSet, basename='player-game-log')

urlpatterns = router.urls + [
    path('league-tov-avg/', league_tov_avg, name='league-tov-avg'),
    path('scoring-plays/', scoring_plays, name='scoring-plays'),
    path('shot-chart/', shot_chart, name='shot-chart'),
    path('game-segments/', game_segments, name='game-segments'),
    path('segment-player-stats/', segment_player_stats, name='segment-player-stats'),
]