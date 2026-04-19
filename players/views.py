from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Player
from .serializers import PlayerSerializer


class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['team', 'is_active', 'position']
    search_fields = ['first_name', 'last_name']