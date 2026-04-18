from rest_framework import serializers
from .models import PlayByPlay
from games.models import Game, Team
from players.models import Player
from games.serializers import GameSerializer, TeamSerializer
from players.serializers import PlayerSerializer
from .models import PlayerStat


class PlayerStatSerializer(serializers.ModelSerializer):
    player_name = serializers.SerializerMethodField()
    team_abbreviation = serializers.SerializerMethodField()
    game_date = serializers.SerializerMethodField()
    opponent = serializers.SerializerMethodField()

    class Meta:
        model = PlayerStat
        fields = '__all__'

    def get_player_name(self, obj):
        return f"{obj.player.first_name} {obj.player.last_name}"

    def get_team_abbreviation(self, obj):
        return obj.team.abbreviation

    def get_game_date(self, obj):
        return obj.game.game_date

    def get_opponent(self, obj):
        game = obj.game
        if game.home_team == obj.team:
            return game.away_team.abbreviation
        return game.home_team.abbreviation

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