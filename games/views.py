from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from django_filters.rest_framework import DjangoFilterBackend
from .models import Team, Game
from .serializers import TeamSerializer, GameSerializer, GameDetailSerializer


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        if not pk.isdigit():
            try:
                instance = Team.objects.get(abbreviation__iexact=pk)
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
            except Team.DoesNotExist:
                raise NotFound()
        return super().retrieve(request, *args, **kwargs)


class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.select_related('home_team', 'away_team').all()
    serializer_class = GameSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['season', 'game_type', 'home_team', 'away_team', 'game_date']

    @action(detail=False, methods=['get'], url_path='by-nba-id/(?P<nba_game_id>[^/.]+)')
    def by_nba_id(self, request, nba_game_id=None):
        try:
            game = Game.objects.select_related('home_team', 'away_team').get(
                nba_game_id=nba_game_id
            )
        except Game.DoesNotExist:
            raise NotFound()
        serializer = GameDetailSerializer(game)
        return Response(serializer.data)