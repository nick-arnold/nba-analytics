from django.db import models
from django.contrib.auth.models import User
from games.models import Team
from players.models import Player


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    favorite_teams = models.ManyToManyField(Team, blank=True, related_name='favorited_by')
    favorite_players = models.ManyToManyField(Player, blank=True, related_name='favorited_by')
    tier = models.CharField(max_length=20, default='free')

    def __str__(self):
        return f"{self.user.email} profile"