from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import LimitOffsetPagination
from django.db.models import Sum, Count
from .models import PlayByPlay, PlayerStat, PlayerSeasonStats, PlayerGameLog, GameSegment, GameKeyEvent
from .serializers import (
    PlayByPlaySerializer, PlayerStatSerializer,
    PlayerSeasonStatsSerializer, PlayerGameLogSerializer,
    GameSegmentSerializer,
)
from games.models import Game
from players.models import Player


class PlayerStatViewSet(viewsets.ModelViewSet):
    queryset = PlayerStat.objects.select_related('player', 'team', 'game').all().order_by('-id')
    serializer_class = PlayerStatSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['player', 'team', 'game__season', 'game__game_type']


class PlayByPlayViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PlayByPlaySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['game', 'scoring_play', 'period']

    def get_queryset(self):
        return PlayByPlay.objects.select_related('team', 'game').all()


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
def scoring_plays(request):
    nba_game_id = request.query_params.get('game_id')
    if not nba_game_id:
        return Response({'error': 'game_id required'}, status=400)
    try:
        game = Game.objects.get(nba_game_id=nba_game_id)
    except Game.DoesNotExist:
        return Response({'error': 'Game not found'}, status=404)

    plays = PlayByPlay.objects.filter(
        game=game,
        scoring_play=True
    ).select_related('team').order_by('order')

    data = [{
        'order': p.order,
        'period': p.period,
        'clock': p.clock,
        'event_type': p.event_type,
        'description': p.description,
        'team_abbreviation': p.team.abbreviation if p.team else None,
        'home_score': p.home_score,
        'away_score': p.away_score,
        'score_value': p.score_value,
        'wallclock': p.wallclock,
    } for p in plays]

    return Response({
        'game_id': nba_game_id,
        'home_team': game.home_team.abbreviation,
        'away_team': game.away_team.abbreviation,
        'plays': data,
    })


@api_view(['GET'])
def game_segments(request):
    """
    Returns all segments and key events for a game.
    Query params: game_id (nba_game_id)
    """
    nba_game_id = request.query_params.get('game_id')
    if not nba_game_id:
        return Response({'error': 'game_id required'}, status=400)
    try:
        game = Game.objects.select_related('home_team', 'away_team').get(nba_game_id=nba_game_id)
    except Game.DoesNotExist:
        return Response({'error': 'Game not found'}, status=404)

    segments = GameSegment.objects.filter(game=game).prefetch_related('key_events').order_by('sequence')

    return Response({
        'game_id': nba_game_id,
        'home_team': game.home_team.abbreviation,
        'away_team': game.away_team.abbreviation,
        'segments': GameSegmentSerializer(segments, many=True).data,
    })


@api_view(['GET'])
def segment_player_stats(request):
    """
    Returns player scoring aggregated per segment for a game.
    Derives stats from play-by-play participants — no stored aggregates.

    Query params:
        game_id     — nba_game_id (required)
        segment_id  — optional, filter to a single segment
    """
    nba_game_id = request.query_params.get('game_id')
    segment_id = request.query_params.get('segment_id')

    if not nba_game_id:
        return Response({'error': 'game_id required'}, status=400)
    try:
        game = Game.objects.select_related('home_team', 'away_team').get(nba_game_id=nba_game_id)
    except Game.DoesNotExist:
        return Response({'error': 'Game not found'}, status=404)

    segments_qs = GameSegment.objects.filter(game=game).order_by('sequence')
    if segment_id:
        segments_qs = segments_qs.filter(id=segment_id)

    # Fetch all scoring plays for the game once
    all_scoring_plays = list(
        PlayByPlay.objects.filter(game=game, scoring_play=True)
        .select_related('team')
        .order_by('order')
    )

    # Build player name lookup from DB
    participant_ids = set()
    for p in all_scoring_plays:
        if p.participants:
            participant_ids.update(p.participants)

    player_name_lookup = {
        p.bdl_player_id: p.full_name
        for p in Player.objects.filter(bdl_player_id__in=participant_ids)
    }

    # Derive team from the play's team FK — always populated at ingest
    player_team_lookup = {}
    for p in all_scoring_plays:
        if p.participants and p.team:
            player_team_lookup[p.participants[0]] = p.team.abbreviation

    result = []
    for seg in segments_qs:
        window = [
            p for p in all_scoring_plays
            if seg.start_order <= p.order <= seg.end_order
            and p.participants
        ]

        player_pts = {}
        for p in window:
            pid = p.participants[0]
            player_pts[pid] = player_pts.get(pid, 0) + (p.score_value or 0)

        scorers = [
            {
                'player_id': pid,
                'name': player_name_lookup.get(pid, f'player#{pid}'),
                'team': player_team_lookup.get(pid),
                'pts': pts,
            }
            for pid, pts in sorted(player_pts.items(), key=lambda x: x[1], reverse=True)
        ]

        result.append({
            'segment_id': seg.id,
            'sequence': seg.sequence,
            'segment_type': seg.segment_type,
            'dominant_team': seg.dominant_team.abbreviation if seg.dominant_team else None,
            'scorers': scorers,
        })

    return Response({
        'game_id': nba_game_id,
        'home_team': game.home_team.abbreviation,
        'away_team': game.away_team.abbreviation,
        'segments': result,
    })


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
        total_games=Count('game', distinct=True),
        total_player_games=Count('id'),
    )
    tov = totals['total_tov'] or 0
    fga = totals['total_fga'] or 0
    fta = totals['total_fta'] or 0
    ast = totals['total_ast'] or 0
    player_games = totals['total_player_games'] or 1
    denom = fga + 0.44 * fta + ast + tov
    tov_pct = round(tov / denom * 100, 1) if denom > 0 else 0
    avg_tov_per_game = round(tov / player_games, 2) if player_games > 0 else 0
    return Response({
        'season': season,
        'league_tov_pct': tov_pct,
        'league_avg_tov_per_game': avg_tov_per_game
    })


@api_view(['GET'])
def shot_chart(request):
    nba_game_id = request.query_params.get('game_id')
    if not nba_game_id:
        return Response({'error': 'game_id required'}, status=400)
    try:
        game = Game.objects.get(nba_game_id=nba_game_id)
    except Game.DoesNotExist:
        return Response({'error': 'Game not found'}, status=404)

    from django.db.models import Q
    shot_filter = (
        Q(event_type__icontains='shot') | Q(event_type__icontains='layup')
    ) & ~Q(event_type__icontains='turnover') & ~Q(event_type__icontains='foul')

    shots = PlayByPlay.objects.filter(
        game=game,
        coordinate_x__isnull=False,
        coordinate_y__isnull=False,
    ).filter(shot_filter).select_related('team').order_by('order')

    data = [{
        'x': p.coordinate_x,
        'y': p.coordinate_y,
        'made': p.scoring_play,
        'value': p.score_value,
        'team': p.team.abbreviation if p.team else None,
        'event_type': p.event_type,
    } for p in shots]

    return Response({
        'game_id': nba_game_id,
        'home_team': game.home_team.abbreviation,
        'away_team': game.away_team.abbreviation,
        'shots': data,
    })