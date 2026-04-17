from rest_framework import serializers
from .models import Player
from games.models import Team
from games.serializers import TeamSerializer


class PlayerSerializer(serializers.ModelSerializer):
    team = TeamSerializer(read_only=True)
    team_id = serializers.PrimaryKeyRelatedField(
        queryset=Team.objects.all(),
        source='team',
        write_only=True,
        required=False
    )

    class Meta:
        model = Player
        fields = '__all__'