from rest_framework import viewsets, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from .models import Player
from .serializers import PlayerSerializer


class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['team', 'is_active', 'position']
    search_fields = ['first_name', 'last_name']

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        # try slug lookup first, fall back to pk
        if not pk.isdigit():
            try:
                instance = Player.objects.get(slug=pk)
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
            except Player.DoesNotExist:
                from rest_framework.exceptions import NotFound
                raise NotFound()
        return super().retrieve(request, *args, **kwargs)