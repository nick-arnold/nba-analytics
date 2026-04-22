from django.contrib import admin
from .models import Team, Game

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['city', 'name', 'abbreviation', 'conference']
    search_fields = ['city', 'name', 'abbreviation']
    list_filter = ['conference']

@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ['game_date', 'home_team', 'away_team', 'home_score', 'away_score', 'season', 'game_type']
    search_fields = ['home_team__name', 'away_team__name']
    list_filter = ['season', 'game_type']
    ordering = ['-game_date']