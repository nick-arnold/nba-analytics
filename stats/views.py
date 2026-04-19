from rest_framework import viewsets
from .models import PlayByPlay
from .serializers import PlayByPlaySerializer
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import PlayerStat
from .serializers import PlayerStatSerializer


class PlayerStatViewSet(viewsets.ModelViewSet):
    queryset = PlayerStat.objects.select_related(
        'player', 'team', 'game'
    ).all().order_by('-id')
    serializer_class = PlayerStatSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['player', 'team', 'game__season', 'game__game_type']

class PlayByPlayViewSet(viewsets.ModelViewSet):
    queryset = PlayByPlay.objects.all()
    serializer_class = PlayByPlaySerializer

from .models import PlayerSeasonStats, PlayerGameLog
from .serializers import PlayerSeasonStatsSerializer, PlayerGameLogSerializer


class PlayerSeasonStatsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PlayerSeasonStatsSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['player', 'team', 'season']

    def get_queryset(self):
        return PlayerSeasonStats.objects.select_related(
            'player', 'team'
        ).all()


class PlayerGameLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PlayerGameLogSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['player', 'team', 'season']
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        return PlayerGameLog.objects.select_related(
            'player', 'team', 'game'
        ).all().order_by('game_date')