from django.db import models
from games.models import Game, Team
from players.models import Player


class PlayByPlay(models.Model):
    EVENT_TYPES = [
        ('field_goal_made', 'Field Goal Made'),
        ('field_goal_missed', 'Field Goal Missed'),
        ('free_throw', 'Free Throw'),
        ('rebound', 'Rebound'),
        ('turnover', 'Turnover'),
        ('foul', 'Foul'),
        ('substitution', 'Substitution'),
        ('timeout', 'Timeout'),
        ('jump_ball', 'Jump Ball'),
        ('violation', 'Violation'),
        ('period_start', 'Period Start'),
        ('period_end', 'Period End'),
    ]

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='plays')
    event_num = models.IntegerField()
    period = models.IntegerField()
    clock = models.CharField(max_length=10)  # e.g. "PT05M30.00S"
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    description = models.TextField(blank=True)

    # Player involvement
    player1 = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='primary_plays')
    player2 = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='secondary_plays')
    player3 = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='tertiary_plays')

    # Team
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='plays')

    # Shot data (null for non-shot events)
    loc_x = models.FloatField(null=True, blank=True)
    loc_y = models.FloatField(null=True, blank=True)
    shot_distance = models.FloatField(null=True, blank=True)    
    shot_made = models.BooleanField(null=True, blank=True)
    shot_value = models.IntegerField(null=True, blank=True)  # 2 or 3

    # Scores after this play
    home_score = models.IntegerField(null=True, blank=True)
    away_score = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['game', 'period', 'event_num']
        unique_together = ['game', 'event_num']

    def __str__(self):
        return f"{self.game} - Period {self.period} - {self.event_type}"
    
class PlayerStat(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='player_stats')
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='stats')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='player_stats')

    minutes = models.CharField(max_length=10, null=True, blank=True)
    pts = models.IntegerField(null=True, blank=True)
    reb = models.IntegerField(null=True, blank=True)
    ast = models.IntegerField(null=True, blank=True)
    stl = models.IntegerField(null=True, blank=True)
    blk = models.IntegerField(null=True, blank=True)
    turnover = models.IntegerField(null=True, blank=True)
    fgm = models.IntegerField(null=True, blank=True)
    fga = models.IntegerField(null=True, blank=True)
    fg_pct = models.FloatField(null=True, blank=True)
    fg3m = models.IntegerField(null=True, blank=True)
    fg3a = models.IntegerField(null=True, blank=True)
    fg3_pct = models.FloatField(null=True, blank=True)
    ftm = models.IntegerField(null=True, blank=True)
    fta = models.IntegerField(null=True, blank=True)
    ft_pct = models.FloatField(null=True, blank=True)
    oreb = models.IntegerField(null=True, blank=True)
    dreb = models.IntegerField(null=True, blank=True)
    pf = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('game', 'player')
        indexes = [
            models.Index(fields=['player']),
            models.Index(fields=['team']),
            models.Index(fields=['game']),
        ]

    def __str__(self):
        return f"{self.player} - {self.game}"
    
class PlayerSeasonStats(models.Model):
    id = models.BigIntegerField(primary_key=True)
    player = models.ForeignKey(Player, on_delete=models.DO_NOTHING, related_name='season_stats')
    team = models.ForeignKey(Team, on_delete=models.DO_NOTHING, related_name='player_season_stats')
    season = models.CharField(max_length=10)
    gp = models.IntegerField()
    ppg = models.DecimalField(max_digits=5, decimal_places=1)
    rpg = models.DecimalField(max_digits=5, decimal_places=1)
    apg = models.DecimalField(max_digits=5, decimal_places=1)
    spg = models.DecimalField(max_digits=5, decimal_places=1)
    bpg = models.DecimalField(max_digits=5, decimal_places=1)
    topg = models.DecimalField(max_digits=5, decimal_places=1)
    fg_pct = models.DecimalField(max_digits=5, decimal_places=3, null=True)
    fg3_pct = models.DecimalField(max_digits=5, decimal_places=3, null=True)
    ft_pct = models.DecimalField(max_digits=5, decimal_places=3, null=True)
    total_pts = models.IntegerField()
    total_tov = models.IntegerField()
    total_reb = models.IntegerField()
    total_ast = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'player_season_stats'

    def __str__(self):
        return f"{self.player} {self.season}"

class PlayerGameLog(models.Model):
    playerstat_id = models.IntegerField(primary_key=True)
    player = models.ForeignKey(Player, on_delete=models.DO_NOTHING, related_name='game_log')
    team = models.ForeignKey(Team, on_delete=models.DO_NOTHING, related_name='player_game_logs')
    game = models.ForeignKey('games.Game', on_delete=models.DO_NOTHING, related_name='player_game_logs')
    season = models.CharField(max_length=10)
    game_date = models.DateField()
    home_team_id = models.IntegerField()
    away_team_id = models.IntegerField()
    home_score = models.IntegerField(null=True)
    away_score = models.IntegerField(null=True)
    minutes = models.CharField(max_length=10, null=True)
    pts = models.IntegerField(null=True)
    reb = models.IntegerField(null=True)
    ast = models.IntegerField(null=True)
    stl = models.IntegerField(null=True)
    blk = models.IntegerField(null=True)
    turnover = models.IntegerField(null=True)
    fgm = models.IntegerField(null=True)
    fga = models.IntegerField(null=True)
    fg_pct = models.FloatField(null=True)
    fg3m = models.IntegerField(null=True)
    fg3a = models.IntegerField(null=True)
    fg3_pct = models.FloatField(null=True)
    ftm = models.IntegerField(null=True)
    fta = models.IntegerField(null=True)
    ft_pct = models.FloatField(null=True)
    oreb = models.IntegerField(null=True)
    dreb = models.IntegerField(null=True)
    pf = models.IntegerField(null=True)

    class Meta:
        managed = False
        db_table = 'player_game_log'

    def __str__(self):
        return f"{self.player} - {self.game_date}"