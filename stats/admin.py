from django.contrib import admin
from .models import PlayerStat

@admin.register(PlayerStat)
class PlayerStatAdmin(admin.ModelAdmin):
    list_display = ['player', 'team', 'game', 'pts', 'reb', 'ast', 'turnover', 'minutes']
    search_fields = ['player__first_name', 'player__last_name']
    list_filter = ['team', 'game__season', 'game__game_type']
    ordering = ['-game__game_date']