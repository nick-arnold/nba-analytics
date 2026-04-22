from django.db import models
from games.models import Game, Team
from players.models import Player


class PlayByPlay(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='plays')
    order = models.IntegerField()
    period = models.IntegerField()
    clock = models.CharField(max_length=20)
    event_type = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='plays')
    home_score = models.IntegerField(null=True, blank=True)
    away_score = models.IntegerField(null=True, blank=True)
    scoring_play = models.BooleanField(default=False)
    score_value = models.IntegerField(null=True, blank=True)
    wallclock = models.DateTimeField(null=True, blank=True)
    coordinate_x = models.FloatField(null=True, blank=True)
    coordinate_y = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['game', 'order']
        unique_together = ['game', 'order']

    def __str__(self):
        return f"{self.game} - {self.period} - {self.order}"


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