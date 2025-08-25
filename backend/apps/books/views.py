import requests
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie  # Add this import
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Book, UserBook, Rating
from .serializers import BookSerializer, UserBookSerializer, RatingSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_books(request):
    """Search books using Open Library API"""
    query = request.GET.get('q', '')
    
    if not query:
        return Response({
            'error': 'Search query is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Search Open Library API
        url = f"https://openlibrary.org/search.json"
        params = {
            'q': query,
            'limit': 20,
            'fields': 'key,title,author_name,first_publish_year,isbn,number_of_pages,subject,cover_i'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        books = []
        
        for book_data in data.get('docs', []):
            # Format book data
            book_info = {
                'open_library_id': book_data.get('key', '').replace('/works/', ''),
                'title': book_data.get('title', 'Unknown Title'),
                'authors': book_data.get('author_name', []),
                'first_publish_year': book_data.get('first_publish_year'),
                'pages': book_data.get('number_of_pages_median') or book_data.get('number_of_pages'),
                'subjects': book_data.get('subject', [])[:5],  # Limit subjects
                'isbn': book_data.get('isbn', [None])[0] if book_data.get('isbn') else None,
                'cover_id': book_data.get('cover_i'),
                'cover_url': f"https://covers.openlibrary.org/b/id/{book_data.get('cover_i')}-M.jpg" if book_data.get('cover_i') else None
            }
            books.append(book_info)
        
        return Response({
            'books': books,
            'total': data.get('numFound', 0)
        }, status=status.HTTP_200_OK)
        
    except requests.RequestException as e:
        return Response({
            'error': 'Failed to search books. Please try again.'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        return Response({
            'error': 'An error occurred while searching.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@ensure_csrf_cookie  # Add this decorator
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_book_to_library(request):
    """Add a book to user's library (TBR by default)"""
    book_data = request.data.get('book')
    status_choice = request.data.get('status', 'tbr')
    
    if not book_data or not book_data.get('open_library_id'):
        return Response({
            'error': 'Book data with open_library_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Check if book exists in our database, create if not
        book, created = Book.objects.get_or_create(
            open_library_id=book_data['open_library_id'],
            defaults={
                'title': book_data.get('title', 'Unknown Title'),
                'authors': book_data.get('authors', []),
                'pages': book_data.get('pages'),
                'genres': book_data.get('subjects', []),
                'cover_url': book_data.get('cover_url'),
                'isbn_10': book_data.get('isbn'),
                'publish_date': str(book_data.get('first_publish_year', '')) if book_data.get('first_publish_year') else None
            }
        )
        
        # Check if user already has this book
        user_book, created = UserBook.objects.get_or_create(
            user=request.user,
            book=book,
            defaults={'status': status_choice}
        )
        
        if not created:
            return Response({
                'error': 'Book is already in your library',
                'current_status': user_book.get_status_display()
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'message': f'Book added to your {user_book.get_status_display()}!',
            'user_book': UserBookSerializer(user_book).data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': 'Failed to add book to library'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_books(request):
    """Get user's books by status"""
    status_filter = request.GET.get('status', 'all')
    
    user_books = UserBook.objects.filter(user=request.user)
    
    if status_filter != 'all':
        user_books = user_books.filter(status=status_filter)
    
    return Response({
        'books': UserBookSerializer(user_books, many=True).data
    }, status=status.HTTP_200_OK)


@ensure_csrf_cookie  # Add this to other POST/PUT views too
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_book_status(request, user_book_id):
    """Update the reading status of a book"""
    user_book = get_object_or_404(UserBook, id=user_book_id, user=request.user)
    
    new_status = request.data.get('status')
    if new_status not in dict(UserBook.STATUS_CHOICES):
        return Response({
            'error': 'Invalid status'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle status changes
    from django.utils import timezone
    
    if new_status == 'reading' and user_book.status != 'reading':
        user_book.date_started = timezone.now()
    elif new_status == 'finished' and user_book.status != 'finished':
        user_book.date_finished = timezone.now()
        if not user_book.date_started:
            user_book.date_started = timezone.now()
    
    user_book.status = new_status
    user_book.current_page = request.data.get('current_page', user_book.current_page)
    user_book.notes = request.data.get('notes', user_book.notes)
    user_book.save()
    
    return Response({
        'message': f'Book status updated to {user_book.get_status_display()}',
        'user_book': UserBookSerializer(user_book).data
    }, status=status.HTTP_200_OK)


@ensure_csrf_cookie  # Add this to other POST/PUT views too
@api_view(['POST', 'PUT'])
@permission_classes([IsAuthenticated])
def rate_book(request, user_book_id):
    """Add or update ratings for a book"""
    user_book = get_object_or_404(UserBook, id=user_book_id, user=request.user)
    
    ratings_data = request.data.get('ratings', {})
    review_text = request.data.get('review', '')
    
    if not ratings_data:
        return Response({
            'error': 'At least one rating is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    created_ratings = []
    
    try:
        for rating_type, rating_value in ratings_data.items():
            if rating_type not in [choice[0] for choice in Rating.RATING_TYPES]:
                continue
                
            rating, created = Rating.objects.update_or_create(
                user=request.user,
                book=user_book.book,
                rating_type=rating_type,
                defaults={
                    'rating': rating_value,
                    'review': review_text if rating_type == 'overall' else ''
                }
            )
            created_ratings.append(rating)
        
        return Response({
            'message': 'Ratings saved successfully!',
            'ratings': RatingSerializer(created_ratings, many=True).data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': 'Failed to save ratings'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def book_ratings(request, user_book_id):
    """Get all ratings for a book by the current user"""
    user_book = get_object_or_404(UserBook, id=user_book_id, user=request.user)
    
    ratings = Rating.objects.filter(
        user=request.user,
        book=user_book.book
    )
    
    return Response({
        'ratings': RatingSerializer(ratings, many=True).data
    }, status=status.HTTP_200_OK)