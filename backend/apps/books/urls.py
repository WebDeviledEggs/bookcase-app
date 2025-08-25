from django.urls import path
from . import views

app_name = 'books'

urlpatterns = [
    # Book search and management
    path('search/', views.search_books, name='search_books'),
    path('add/', views.add_book_to_library, name='add_book_to_library'),
    path('my-books/', views.my_books, name='my_books'),
    
    # UserBook management
    path('user-book/<int:user_book_id>/update/', views.update_book_status, name='update_book_status'),
    path('user-book/<int:user_book_id>/rate/', views.rate_book, name='rate_book'),
    path('user-book/<int:user_book_id>/ratings/', views.book_ratings, name='book_ratings'),
]