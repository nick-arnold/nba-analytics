from django.db import models
from games.models import Team


class Player(models.Model):
    POSITIONS = [
        ('G', 'Guard'),
        ('F', 'Forward'),
        ('C', 'Center'),
        ('G-F', 'Guard-Forward'),
        ('F-C', 'Forward-Center'),
    ]

    nba_player_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    position = models.CharField(max_length=5, choices=POSITIONS, blank=True)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='players')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"