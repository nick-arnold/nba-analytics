from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import LimitOffsetPagination
from django.db.models import Sum, F, FloatField, ExpressionWrapper
from django.db.models.functions import Cast
from .models import PlayByPlay, PlayerStat, PlayerSeasonStats, PlayerGameLog
from .serializers import (
    PlayByPlaySerializer, PlayerStatSerializer,
    PlayerSeasonStatsSerializer, PlayerGameLogSerializer
)


class PlayerStatViewSet(viewsets.ModelViewSet):
    queryset = PlayerStat.objects.select_related('player', 'team', 'game').all().order_by('-id')
    serializer_class = PlayerStatSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['player', 'team', 'game__season', 'game__game_type']


class PlayByPlayViewSet(viewsets.ModelViewSet):
    queryset = PlayByPlay.objects.all()
    serializer_class = PlayByPlaySerializer


class PlayerSeasonStatsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PlayerSeasonStatsSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['player', 'team', 'season']

    def get_queryset(self):
        return PlayerSeasonStats.objects.select_related('player', 'team').all()


class PlayerGameLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PlayerGameLogSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['player', 'team', 'season']
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        return PlayerGameLog.objects.select_related('player', 'team', 'game').all().order_by('game_date')


@api_view(['GET'])
def league_tov_avg(request):
    season = request.query_params.get('season', '2025-26')
    stats = PlayerStat.objects.filter(
        game__season=season
    ).exclude(
        fga=0, fta=0, ast=0, turnover=0
    )
    totals = stats.aggregate(
        total_tov=Sum('turnover'),
        total_fga=Sum('fga'),
        total_fta=Sum('fta'),
        total_ast=Sum('ast'),
    )
    tov = totals['total_tov'] or 0
    fga = totals['total_fga'] or 0
    fta = totals['total_fta'] or 0
    ast = totals['total_ast'] or 0
    denom = fga + 0.44 * fta + ast + tov
    tov_pct = round(tov / denom * 100, 1) if denom > 0 else 0
    return Response({'season': season, 'league_tov_pct': tov_pct})