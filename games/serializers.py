from rest_framework import serializers
from django.db.models import Q
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
    series_record = serializers.SerializerMethodField()
    margin = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = '__all__'

    def get_series_record(self, obj):
        if obj.game_type != 'playoff':
            return None
        games = Game.objects.filter(
            season=obj.season,
            game_type='playoff',
            home_score__isnull=False,
        ).filter(
            Q(home_team=obj.home_team, away_team=obj.away_team) |
            Q(home_team=obj.away_team, away_team=obj.home_team)
        )
        home_wins = 0
        away_wins = 0
        for g in games:
            if g.home_score is None or g.away_score is None:
                continue
            if g.home_score > g.away_score:
                if g.home_team_id == obj.home_team_id:
                    home_wins += 1
                else:
                    away_wins += 1
            else:
                if g.away_team_id == obj.away_team_id:
                    away_wins += 1
                else:
                    home_wins += 1
        if home_wins == 0 and away_wins == 0:
            return None
        if home_wins > away_wins:
            return f"{obj.home_team.abbreviation} leads {home_wins}-{away_wins}"
        elif away_wins > home_wins:
            return f"{obj.away_team.abbreviation} leads {away_wins}-{home_wins}"
        else:
            return f"Series tied {home_wins}-{away_wins}"

    def get_margin(self, obj):
        if obj.home_score is None or obj.away_score is None:
            return None
        return abs(obj.home_score - obj.away_score)


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
            'id', 'nba_game_id', 'game_date', 'game_datetime', 'status',
            'season', 'game_type', 'postseason',
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