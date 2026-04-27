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
    participants = models.JSONField(default=list)
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


class GameSegment(models.Model):
    SEGMENT_TYPES = [
        ('BACK_AND_FORTH', 'Back and Forth'),
        ('RUN', 'Run'),
        ('BLOWOUT', 'Blowout'),
        ('TIGHT', 'Tight'),
    ]

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='segments')
    dominant_team = models.ForeignKey(
        Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='dominant_segments'
    )

    segment_type = models.CharField(max_length=20, choices=SEGMENT_TYPES)
    sequence = models.PositiveSmallIntegerField()  # ordering within the game

    # Boundaries (play order from PlayByPlay)
    start_order = models.IntegerField()
    end_order = models.IntegerField()

    # Game clock context
    start_period = models.IntegerField()
    end_period = models.IntegerField()
    start_clock = models.CharField(max_length=20)
    end_clock = models.CharField(max_length=20)

    # Score context
    home_score_start = models.IntegerField()
    away_score_start = models.IntegerField()
    home_score_end = models.IntegerField()
    away_score_end = models.IntegerField()

    # Derived metrics
    differential_start = models.IntegerField()   # home - away at segment start
    differential_end = models.IntegerField()     # home - away at segment end
    differential_max = models.IntegerField()     # largest abs differential within segment
    lead_change_count = models.IntegerField(default=0)
    run_ratio = models.FloatField(null=True, blank=True)  # null for non-RUN segments

    class Meta:
        ordering = ['game', 'sequence']
        unique_together = ['game', 'sequence']
        indexes = [
            models.Index(fields=['game', 'sequence']),
            models.Index(fields=['game', 'segment_type']),
        ]

    def __str__(self):
        return f"{self.game} — segment {self.sequence} ({self.segment_type})"


class GameKeyEvent(models.Model):
    EVENT_TYPES = [
        ('TIE', 'Tie'),
        ('LEAD_CHANGE', 'Lead Change'),
        ('BLOWOUT_START', 'Blowout Start'),
    ]

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='key_events')
    segment = models.ForeignKey(
        GameSegment, on_delete=models.CASCADE, related_name='key_events', null=True, blank=True
    )
    benefiting_team = models.ForeignKey(
        Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='key_events'
    )

    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)

    # Reference back to the specific play
    play_order = models.IntegerField()
    period = models.IntegerField()
    clock = models.CharField(max_length=20)

    # Score at moment of event
    home_score = models.IntegerField()
    away_score = models.IntegerField()
    differential = models.IntegerField()  # home - away

    class Meta:
        ordering = ['game', 'play_order']
        indexes = [
            models.Index(fields=['game', 'event_type']),
            models.Index(fields=['game', 'play_order']),
        ]

    def __str__(self):
        return f"{self.game} — {self.event_type} at Q{self.period} {self.clock}"


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