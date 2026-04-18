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