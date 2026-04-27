from rest_framework import serializers
from .models import PlayByPlay, PlayerStat, PlayerSeasonStats, PlayerGameLog, GameSegment, GameKeyEvent
from games.models import Game, Team
from players.models import Player
from games.serializers import GameSerializer, TeamSerializer
from players.serializers import PlayerSerializer


class PlayerStatSerializer(serializers.ModelSerializer):
    player_name = serializers.SerializerMethodField()
    team_abbreviation = serializers.SerializerMethodField()
    game_date = serializers.SerializerMethodField()

    class Meta:
        model = PlayerStat
        fields = '__all__'

    def get_player_name(self, obj):
        return f"{obj.player.first_name} {obj.player.last_name}"

    def get_team_abbreviation(self, obj):
        return obj.team.abbreviation

    def get_game_date(self, obj):
        return obj.game.game_date


class PlayByPlaySerializer(serializers.ModelSerializer):
    game = GameSerializer(read_only=True)
    team = TeamSerializer(read_only=True)
    game_id = serializers.PrimaryKeyRelatedField(
        queryset=Game.objects.all(),
        source='game',
        write_only=True
    )

    class Meta:
        model = PlayByPlay
        fields = '__all__'


class GameKeyEventSerializer(serializers.ModelSerializer):
    benefiting_team_abbreviation = serializers.SerializerMethodField()

    class Meta:
        model = GameKeyEvent
        fields = [
            'id',
            'event_type',
            'play_order',
            'period',
            'clock',
            'home_score',
            'away_score',
            'differential',
            'benefiting_team_abbreviation',
        ]

    def get_benefiting_team_abbreviation(self, obj):
        return obj.benefiting_team.abbreviation if obj.benefiting_team else None


class GameSegmentSerializer(serializers.ModelSerializer):
    dominant_team_abbreviation = serializers.SerializerMethodField()
    key_events = GameKeyEventSerializer(many=True, read_only=True)

    class Meta:
        model = GameSegment
        fields = [
            'id',
            'sequence',
            'segment_type',
            'dominant_team_abbreviation',
            'start_order',
            'end_order',
            'start_period',
            'end_period',
            'start_clock',
            'end_clock',
            'home_score_start',
            'away_score_start',
            'home_score_end',
            'away_score_end',
            'differential_start',
            'differential_end',
            'differential_max',
            'lead_change_count',
            'run_ratio',
            'key_events',
        ]

    def get_dominant_team_abbreviation(self, obj):
        return obj.dominant_team.abbreviation if obj.dominant_team else None


class PlayerSeasonStatsSerializer(serializers.ModelSerializer):
    player_name = serializers.SerializerMethodField()
    player_slug = serializers.SerializerMethodField()
    team_abbreviation = serializers.SerializerMethodField()

    class Meta:
        model = PlayerSeasonStats
        fields = '__all__'

    def get_player_name(self, obj):
        return f"{obj.player.first_name} {obj.player.last_name}"

    def get_player_slug(self, obj):
        return obj.player.slug

    def get_team_abbreviation(self, obj):
        return obj.team.abbreviation


class PlayerGameLogSerializer(serializers.ModelSerializer):
    player_name = serializers.SerializerMethodField()
    player_slug = serializers.SerializerMethodField()

    class Meta:
        model = PlayerGameLog
        fields = '__all__'

    def get_player_name(self, obj):
        return f"{obj.player.first_name} {obj.player.last_name}"

    def get_player_slug(self, obj):
        return obj.player.slug