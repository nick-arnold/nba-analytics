from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/games/', include('games.urls')),
    path('api/players/', include('players.urls')),
    path('api/stats/', include('stats.urls')),
    
]