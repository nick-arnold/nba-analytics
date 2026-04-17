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