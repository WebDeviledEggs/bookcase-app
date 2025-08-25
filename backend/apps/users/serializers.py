from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, ReadingGoal


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['user', 'bio', 'favorite_genres', 'reading_preferences', 
                 'profile_public', 'email_notifications', 'created_at']
        read_only_fields = ['created_at']


class ReadingGoalSerializer(serializers.ModelSerializer):
    """Serializer for ReadingGoal model"""
    books_read_count = serializers.ReadOnlyField()
    progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = ReadingGoal
        fields = ['id', 'user', 'year', 'books_goal', 'pages_goal', 
                 'books_read_count', 'progress_percentage', 'created_at']
        read_only_fields = ['user', 'created_at']