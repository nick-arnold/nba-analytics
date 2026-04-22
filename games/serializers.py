from rest_framework import serializers
from .models import Team, Game
from stats.models import PlayerStat


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = '__all__'


class GameSerializer(serializers.ModelSerializer):
    home_team = TeamSerializer(read_only=True)
    away_team = TeamSerializer(read_only=True)
    home_team_id = serializers.PrimaryKeyRelatedField(
        queryset=Team.objects.all(), source='home_team', write_only=True
    )
    away_team_id = serializers.PrimaryKeyRelatedField(
        queryset=Team.objects.all(), source='away_team', write_only=True
    )

    class Meta:
        model = Game
        fields = '__all__'


class BoxScorePlayerSerializer(serializers.ModelSerializer):
    player_id = serializers.IntegerField(source='player.id')
    player_name = serializers.SerializerMethodField()
    player_slug = serializers.SerializerMethodField()

    class Meta:
        model = PlayerStat
        fields = [
            'player_id', 'player_name', 'player_slug',
            'minutes', 'pts', 'reb', 'ast', 'stl', 'blk',
            'turnover', 'fgm', 'fga', 'fg_pct',
            'fg3m', 'fg3a', 'fg3_pct', 'ftm', 'fta', 'ft_pct',
            'oreb', 'dreb', 'pf',
        ]

    def get_player_name(self, obj):
        return f"{obj.player.first_name} {obj.player.last_name}"

    def get_player_slug(self, obj):
        return obj.player.slug


class GameDetailSerializer(serializers.ModelSerializer):
    home_team = TeamSerializer(read_only=True)
    away_team = TeamSerializer(read_only=True)
    home_box_score = serializers.SerializerMethodField()
    away_box_score = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = [
            'id', 'nba_game_id', 'game_date', 'season', 'game_type', 'postseason',
            'home_team', 'away_team', 'home_score', 'away_score',
            'home_box_score', 'away_box_score',
        ]

    def get_home_box_score(self, obj):
        stats = PlayerStat.objects.select_related('player', 'team').filter(
            game=obj, team=obj.home_team
        ).order_by('-minutes')
        return BoxScorePlayerSerializer(stats, many=True).data

    def get_away_box_score(self, obj):
        stats = PlayerStat.objects.select_related('player', 'team').filter(
            game=obj, team=obj.away_team
        ).order_by('-minutes')
        return BoxScorePlayerSerializer(stats, many=True).data