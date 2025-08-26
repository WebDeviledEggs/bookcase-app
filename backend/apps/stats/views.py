from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Avg, Sum, F
from django.utils import timezone
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import calendar

from .serializers import (
    DashboardStatsSerializer, 
    ReadingTimelineSerializer,
    GenreBreakdownSerializer,
    ReadingHabitsSerializer
)
from .models import ReadingSession, ReadingStreak
from apps.books.models import UserBook, Book, Rating


class DashboardStatsView(APIView):
    """Main dashboard statistics endpoint"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        today = timezone.now().date()
        
        # Calculate date ranges
        thirty_days_ago = today - timedelta(days=30)
        sixty_days_ago = today - timedelta(days=60)
        ninety_days_ago = today - timedelta(days=90)
        start_of_year = today.replace(month=1, day=1)
        
        # Get user's books
        user_books = UserBook.objects.filter(user=user)
        finished_books = user_books.filter(status='finished')
        
        # Time-based book counts with more granular data
        books_last_30_days = finished_books.filter(
            date_finished__date__gte=thirty_days_ago
        ).count()
        
        books_last_60_days = finished_books.filter(
            date_finished__date__gte=sixty_days_ago
        ).count()
        
        books_last_90_days = finished_books.filter(
            date_finished__date__gte=ninety_days_ago
        ).count()
        
        books_this_year = finished_books.filter(
            date_finished__date__gte=start_of_year
        ).count()
        
        books_all_time = finished_books.count()
        
        # Additional time periods for more granular analysis
        books_last_7_days = finished_books.filter(
            date_finished__date__gte=today - timedelta(days=7)
        ).count()
        
        books_last_14_days = finished_books.filter(
            date_finished__date__gte=today - timedelta(days=14)
        ).count()
        
        # Monthly breakdown for the current year
        monthly_books = {}
        for month in range(1, 13):
            month_start = today.replace(month=month, day=1)
            if month_start <= today:
                month_end = month_start.replace(day=28) + timedelta(days=4)
                month_end = month_end.replace(day=1) - timedelta(days=1)
                month_books = finished_books.filter(
                    date_finished__date__gte=month_start,
                    date_finished__date__lte=month_end
                ).count()
                monthly_books[month] = month_books
        
        # Page statistics
        def get_pages_in_range(start_date):
            return finished_books.filter(
                date_finished__date__gte=start_date
            ).aggregate(
                total_pages=Sum('book__pages')
            )['total_pages'] or 0
        
        pages_last_30_days = get_pages_in_range(thirty_days_ago)
        pages_last_60_days = get_pages_in_range(sixty_days_ago)
        pages_last_90_days = get_pages_in_range(ninety_days_ago)
        pages_this_year = get_pages_in_range(start_of_year)
        pages_all_time = get_pages_in_range(datetime(1900, 1, 1).date())
        
        # Averages and metrics
        avg_pages_per_book = finished_books.aggregate(
            avg_pages=Avg('book__pages')
        )['avg_pages'] or 0
        
        # Calculate average books per month
        if books_all_time > 0:
            first_book_date = finished_books.earliest('date_finished').date_finished.date()
            months_diff = (today.year - first_book_date.year) * 12 + today.month - first_book_date.month
            avg_books_per_month = books_all_time / max(months_diff, 1)
        else:
            avg_books_per_month = 0
        
        # Average pages per day (last 30 days)
        days_diff = 30
        avg_pages_per_day = pages_last_30_days / days_diff if days_diff > 0 else 0
        
        # Reading streaks
        current_streak = ReadingStreak.objects.filter(
            user=user, 
            current_streak=True
        ).first()
        current_streak_days = current_streak.streak_length if current_streak else 0
        
        # Get longest streak by calculating length for each streak
        all_streaks = ReadingStreak.objects.filter(user=user)
        longest_streak_days = 0
        if all_streaks.exists():
            for streak in all_streaks:
                streak_length = streak.streak_length
                if streak_length > longest_streak_days:
                    longest_streak_days = streak_length
        
        # Status breakdown
        currently_reading = user_books.filter(status='reading').count()
        tbr_books = user_books.filter(status='tbr').count()
        
        # Rating statistics
        ratings = Rating.objects.filter(user=user, rating_type='overall')
        avg_rating = ratings.aggregate(avg=Avg('rating'))['avg'] or 0
        total_ratings = ratings.count()
        
        # Rating distribution
        rating_distribution = {}
        for rating in [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0]:
            count = ratings.filter(rating=rating).count()
            rating_distribution[str(rating)] = count
        
        data = {
            'books_last_7_days': books_last_7_days,
            'books_last_14_days': books_last_14_days,
            'books_last_30_days': books_last_30_days,
            'books_last_60_days': books_last_60_days,
            'books_last_90_days': books_last_90_days,
            'books_this_year': books_this_year,
            'books_all_time': books_all_time,
            'monthly_books': monthly_books,
            'pages_last_30_days': pages_last_30_days,
            'pages_last_60_days': pages_last_60_days,
            'pages_last_90_days': pages_last_90_days,
            'pages_this_year': pages_this_year,
            'pages_all_time': pages_all_time,
            'avg_pages_per_book': round(avg_pages_per_book, 1),
            'avg_books_per_month': round(avg_books_per_month, 1),
            'avg_pages_per_day': round(avg_pages_per_day, 1),
            'current_streak_days': current_streak_days,
            'longest_streak_days': longest_streak_days,
            'currently_reading': currently_reading,
            'finished_books': books_all_time,
            'tbr_books': tbr_books,
            'avg_rating': round(avg_rating, 1),
            'total_ratings': total_ratings,
            'rating_distribution': rating_distribution,
        }
        
        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)


class ReadingTimelineView(APIView):
    """Reading timeline data for charts"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        days = int(request.GET.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Get daily reading data
        timeline_data = []
        current_date = start_date
        
        while current_date <= end_date:
            # Books finished on this date
            books_finished = UserBook.objects.filter(
                user=user,
                status='finished',
                date_finished__date=current_date
            ).count()
            
            # Pages read on this date
            pages_read = ReadingSession.objects.filter(
                user=user,
                session_date=current_date
            ).aggregate(
                total_pages=Sum(F('end_page') - F('start_page'))
            )['total_pages'] or 0
            
            # Books started on this date
            books_started = UserBook.objects.filter(
                user=user,
                date_started__date=current_date
            ).count()
            
            timeline_data.append({
                'date': current_date,
                'books_finished': books_finished,
                'pages_read': pages_read,
                'books_started': books_started,
            })
            
            current_date += timedelta(days=1)
        
        serializer = ReadingTimelineSerializer(timeline_data, many=True)
        return Response(serializer.data)


class GenreBreakdownView(APIView):
    """Genre breakdown statistics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get all finished books with genres
        finished_books = UserBook.objects.filter(
            user=user, 
            status='finished'
        ).select_related('book')
        
        # Count books by genre
        genre_stats = {}
        total_books = finished_books.count()
        
        for user_book in finished_books:
            book = user_book.book
            if book.genres:
                for genre in book.genres:
                    if genre not in genre_stats:
                        genre_stats[genre] = {
                            'book_count': 0,
                            'total_pages': 0,
                            'ratings': []
                        }
                    
                    genre_stats[genre]['book_count'] += 1
                    if book.pages:
                        genre_stats[genre]['total_pages'] += book.pages
                    
                    # Get rating for this book
                    rating = Rating.objects.filter(
                        user=user,
                        book=book,
                        rating_type='overall'
                    ).first()
                    if rating:
                        genre_stats[genre]['ratings'].append(float(rating.rating))
        
        # Calculate averages and percentages
        genre_breakdown = []
        for genre, stats in genre_stats.items():
            avg_rating = sum(stats['ratings']) / len(stats['ratings']) if stats['ratings'] else 0
            percentage = (stats['book_count'] / total_books * 100) if total_books > 0 else 0
            
            genre_breakdown.append({
                'genre': genre,
                'book_count': stats['book_count'],
                'total_pages': stats['total_pages'],
                'avg_rating': round(avg_rating, 1),
                'percentage': round(percentage, 1)
            })
        
        # Sort by book count
        genre_breakdown.sort(key=lambda x: x['book_count'], reverse=True)
        
        serializer = GenreBreakdownSerializer(genre_breakdown, many=True)
        return Response(serializer.data)


class ReadingHabitsView(APIView):
    """Detailed reading habits analysis"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Reading speed analysis
        reading_sessions = ReadingSession.objects.filter(user=user)
        
        if reading_sessions.exists():
            avg_pages_per_session = reading_sessions.aggregate(
                avg=Avg(F('end_page') - F('start_page'))
            )['avg'] or 0
            
            avg_session_duration = reading_sessions.aggregate(
                avg=Avg('duration_minutes')
            )['avg'] or 0
        else:
            avg_pages_per_session = 0
            avg_session_duration = 0
        
        # Calculate average pages per day (last 30 days)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_sessions = reading_sessions.filter(session_date__gte=thirty_days_ago)
        
        if recent_sessions.exists():
            total_pages = sum(session.pages_read for session in recent_sessions)
            avg_pages_per_day = total_pages / 30
        else:
            avg_pages_per_day = 0
        
        # Most productive days (by pages read)
        daily_pages = {}
        for session in reading_sessions:
            day_name = session.session_date.strftime('%A')
            daily_pages[day_name] = daily_pages.get(day_name, 0) + session.pages_read
        
        most_productive_days = sorted(
            daily_pages.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:3]
        
        # Favorite authors
        author_counts = {}
        finished_books = UserBook.objects.filter(user=user, status='finished')
        
        for user_book in finished_books:
            for author in user_book.book.authors:
                author_counts[author] = author_counts.get(author, 0) + 1
        
        favorite_authors = sorted(
            author_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:5]
        
        # Favorite genres
        genre_counts = {}
        for user_book in finished_books:
            for genre in user_book.book.genres:
                genre_counts[genre] = genre_counts.get(genre, 0) + 1
        
        favorite_genres = sorted(
            genre_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:5]
        
        # Longest and shortest books
        books_with_pages = [
            (user_book.book.title, user_book.book.pages or 0)
            for user_book in finished_books
            if user_book.book.pages
        ]
        
        longest_books = sorted(books_with_pages, key=lambda x: x[1], reverse=True)[:3]
        shortest_books = sorted(books_with_pages, key=lambda x: x[1])[:3]
        
        data = {
            'avg_pages_per_day': round(avg_pages_per_day, 1),
            'avg_pages_per_session': round(avg_pages_per_session, 1),
            'avg_session_duration': round(avg_session_duration, 1),
            'most_productive_days': [{'day': day, 'pages': pages} for day, pages in most_productive_days],
            'most_productive_hours': [],  # Could be implemented with timestamp data
            'favorite_authors': [{'author': author, 'count': count} for author, count in favorite_authors],
            'favorite_genres': [{'genre': genre, 'count': count} for genre, count in favorite_genres],
            'longest_books': [{'title': title, 'pages': pages} for title, pages in longest_books],
            'shortest_books': [{'title': title, 'pages': pages} for title, pages in shortest_books],
        }
        
        serializer = ReadingHabitsSerializer(data)
        return Response(serializer.data)
