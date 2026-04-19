from django.db import models


class Team(models.Model):
    CONFERENCE_CHOICES = [
        ('East', 'Eastern'),
        ('West', 'Western'),
    ]

    name = models.CharField(max_length=100)
    abbreviation = models.CharField(max_length=10, unique=True)
    city = models.CharField(max_length=100)
    conference = models.CharField(max_length=4, choices=CONFERENCE_CHOICES, null=True, blank=True)

    def __str__(self):
        return f"{self.city} {self.name}"


class Game(models.Model):
    GAME_TYPES = [
        ('regular_season', 'Regular Season'),
        ('playoff', 'Playoff'),
        ('play_in', 'Play-In'),
        ('preseason', 'Preseason'),
    ]

    postseason = models.BooleanField(default=False)
    home_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='home_games')
    away_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='away_games')
    game_date = models.DateField()
    game_type = models.CharField(max_length=20, choices=GAME_TYPES, default='regular_season')
    season = models.CharField(max_length=10)
    home_score = models.IntegerField(null=True, blank=True)
    away_score = models.IntegerField(null=True, blank=True)
    nba_game_id = models.CharField(max_length=20, unique=True)

    class Meta:
        ordering = ['-game_date']

    def __str__(self):
        return f"{self.away_team} @ {self.home_team} ({self.game_date})"