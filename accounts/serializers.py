from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile
from games.models import Team
from players.models import Player


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'email', 'password')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        UserProfile.objects.create(user=user)
        return user


class TeamMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ('id', 'name', 'city', 'abbreviation')


class PlayerMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ('id', 'first_name', 'last_name')


class UserProfileSerializer(serializers.ModelSerializer):
    favorite_teams = TeamMinimalSerializer(many=True, read_only=True)
    favorite_players = PlayerMinimalSerializer(many=True, read_only=True)
    favorite_team_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Team.objects.all(), source='favorite_teams', write_only=True
    )
    favorite_player_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Player.objects.all(), source='favorite_players', write_only=True
    )

    class Meta:
        model = UserProfile
        fields = ('favorite_teams', 'favorite_players', 'favorite_team_ids', 'favorite_player_ids', 'tier')


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'profile')