from rest_framework import viewsets
from .models import PlayByPlay
from .serializers import PlayByPlaySerializer


class PlayByPlayViewSet(viewsets.ModelViewSet):
    queryset = PlayByPlay.objects.all()
    serializer_class = PlayByPlaySerializer