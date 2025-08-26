from rest_framework import serializers
from .models import ReadingSession, ReadingStreak
from apps.books.models import UserBook, Book, Rating


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for main dashboard statistics"""
    
    # Time-based book counts
    books_last_7_days = serializers.IntegerField()
    books_last_14_days = serializers.IntegerField()
    books_last_30_days = serializers.IntegerField()
    books_last_60_days = serializers.IntegerField()
    books_last_90_days = serializers.IntegerField()
    books_this_year = serializers.IntegerField()
    books_all_time = serializers.IntegerField()
    monthly_books = serializers.DictField()
    
    # Page statistics
    pages_last_30_days = serializers.IntegerField()
    pages_last_60_days = serializers.IntegerField()
    pages_last_90_days = serializers.IntegerField()
    pages_this_year = serializers.IntegerField()
    pages_all_time = serializers.IntegerField()
    
    # Averages and metrics
    avg_pages_per_book = serializers.FloatField()
    avg_books_per_month = serializers.FloatField()
    avg_pages_per_day = serializers.FloatField()
    
    # Reading streaks
    current_streak_days = serializers.IntegerField()
    longest_streak_days = serializers.IntegerField()
    
    # Status breakdown
    currently_reading = serializers.IntegerField()
    finished_books = serializers.IntegerField()
    tbr_books = serializers.IntegerField()
    
    # Rating statistics
    avg_rating = serializers.FloatField()
    total_ratings = serializers.IntegerField()
    rating_distribution = serializers.DictField()


class ReadingTimelineSerializer(serializers.Serializer):
    """Serializer for reading timeline data"""
    
    date = serializers.DateField()
    books_finished = serializers.IntegerField()
    pages_read = serializers.IntegerField()
    books_started = serializers.IntegerField()


class GenreBreakdownSerializer(serializers.Serializer):
    """Serializer for genre breakdown data"""
    
    genre = serializers.CharField()
    book_count = serializers.IntegerField()
    total_pages = serializers.IntegerField()
    avg_rating = serializers.FloatField()
    percentage = serializers.FloatField()


class ReadingHabitsSerializer(serializers.Serializer):
    """Serializer for reading habits analysis"""
    
    # Reading speed
    avg_pages_per_day = serializers.FloatField()
    avg_pages_per_session = serializers.FloatField()
    avg_session_duration = serializers.FloatField()
    
    # Time patterns
    most_productive_days = serializers.ListField()
    most_productive_hours = serializers.ListField()
    
    # Book preferences
    favorite_authors = serializers.ListField()
    favorite_genres = serializers.ListField()
    longest_books = serializers.ListField()
    shortest_books = serializers.ListField()
