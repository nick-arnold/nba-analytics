from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import Team, Game
from .serializers import TeamSerializer, GameSerializer

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer

class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.select_related('home_team', 'away_team').all()
    serializer_class = GameSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['season', 'game_type', 'home_team', 'away_team', 'game_date']