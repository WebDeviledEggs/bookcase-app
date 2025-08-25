from rest_framework import serializers
from .models import Book, UserBook, Rating


class BookSerializer(serializers.ModelSerializer):
    """Serializer for Book model"""
    
    primary_author = serializers.ReadOnlyField()
    
    class Meta:
        model = Book
        fields = [
            'id', 'open_library_id', 'isbn_10', 'isbn_13',
            'title', 'authors', 'primary_author', 'description',
            'publisher', 'publish_date', 'pages', 'genres',
            'language', 'cover_url', 'created_at', 'updated_at'
        ]


class UserBookSerializer(serializers.ModelSerializer):
    """Serializer for UserBook model"""
    
    book = BookSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reading_days = serializers.ReadOnlyField()
    progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = UserBook
        fields = [
            'id', 'book', 'status', 'status_display',
            'date_added', 'date_started', 'date_finished',
            'current_page', 'notes', 'reading_days', 'progress_percentage'
        ]


class RatingSerializer(serializers.ModelSerializer):
    """Serializer for Rating model"""
    
    rating_type_display = serializers.CharField(source='get_rating_type_display', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)
    
    class Meta:
        model = Rating
        fields = [
            'id', 'rating_type', 'rating_type_display', 
            'rating', 'review', 'book_title',
            'created_at', 'updated_at'
        ]


class BookRatingSummarySerializer(serializers.Serializer):
    """Serializer for book rating summaries"""
    
    overall = serializers.DecimalField(max_digits=2, decimal_places=1, required=False)
    enjoyment = serializers.DecimalField(max_digits=2, decimal_places=1, required=False)
    critique = serializers.DecimalField(max_digits=2, decimal_places=1, required=False)
    plot = serializers.DecimalField(max_digits=2, decimal_places=1, required=False)
    character = serializers.DecimalField(max_digits=2, decimal_places=1, required=False)
    setting = serializers.DecimalField(max_digits=2, decimal_places=1, required=False)
    theme = serializers.DecimalField(max_digits=2, decimal_places=1, required=False)
    prose = serializers.DecimalField(max_digits=2, decimal_places=1, required=False)
    review = serializers.CharField(required=False)