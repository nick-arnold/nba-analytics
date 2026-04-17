from rest_framework import serializers
from .models import PlayByPlay
from games.models import Game, Team
from players.models import Player
from games.serializers import GameSerializer, TeamSerializer
from players.serializers import PlayerSerializer


class PlayByPlaySerializer(serializers.ModelSerializer):
    game = GameSerializer(read_only=True)
    player1 = PlayerSerializer(read_only=True)
    player2 = PlayerSerializer(read_only=True)
    player3 = PlayerSerializer(read_only=True)
    team = TeamSerializer(read_only=True)
    game_id = serializers.PrimaryKeyRelatedField(
        queryset=Game.objects.all(),
        source='game',
        write_only=True
    )

    class Meta:
        model = PlayByPlay
        fields = '__all__'