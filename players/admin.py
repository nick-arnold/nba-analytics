from django.contrib import admin
from .models import Player

@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ['last_name', 'first_name', 'position', 'team', 'is_active', 'slug']
    search_fields = ['first_name', 'last_name', 'slug']
    list_filter = ['position', 'is_active', 'team']
    ordering = ['last_name', 'first_name']