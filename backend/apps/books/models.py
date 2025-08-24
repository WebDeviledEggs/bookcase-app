from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Book(models.Model):
    """Book information from Open Library API"""
    
    # Open Library identifiers
    open_library_id = models.CharField(max_length=50, unique=True)
    isbn_10 = models.CharField(max_length=10, blank=True, null=True)
    isbn_13 = models.CharField(max_length=13, blank=True, null=True)
    
    # Basic book information
    title = models.CharField(max_length=500)
    authors = models.JSONField(default=list)  # List of author names
    description = models.TextField(blank=True, null=True)
    
    # Publication details
    publisher = models.CharField(max_length=200, blank=True, null=True)
    publish_date = models.CharField(max_length=50, blank=True, null=True)
    pages = models.IntegerField(blank=True, null=True)
    
    # Categorization
    genres = models.JSONField(default=list)  # List of genres/subjects
    language = models.CharField(max_length=10, default='en')
    
    # Book cover
    cover_url = models.URLField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['title']
    
    def __str__(self):
        author_str = ', '.join(self.authors[:2])  # First 2 authors
        if len(self.authors) > 2:
            author_str += ' et al.'
        return f"{self.title} by {author_str}"
    
    @property
    def primary_author(self):
        return self.authors[0] if self.authors else "Unknown Author"


class UserBook(models.Model):
    """Junction table for user-book relationships"""
    
    STATUS_CHOICES = [
        ('tbr', 'To Be Read'),
        ('reading', 'Currently Reading'), 
        ('finished', 'Finished'),
        ('dnf', 'Did Not Finish'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='tbr')
    
    # Reading progress tracking
    date_added = models.DateTimeField(auto_now_add=True)
    date_started = models.DateTimeField(blank=True, null=True)
    date_finished = models.DateTimeField(blank=True, null=True)
    current_page = models.IntegerField(default=0)
    
    # Notes
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        unique_together = ['user', 'book']
        ordering = ['-date_added']
    
    def __str__(self):
        return f"{self.user.username} - {self.book.title} ({self.get_status_display()})"
    
    @property
    def reading_days(self):
        """Calculate days spent reading if finished"""
        if self.date_started and self.date_finished:
            return (self.date_finished.date() - self.date_started.date()).days
        return None
    
    @property
    def progress_percentage(self):
        """Calculate reading progress percentage"""
        if self.book.pages and self.current_page:
            return min(100, (self.current_page / self.book.pages) * 100)
        return 0


class Rating(models.Model):
    """Detailed ratings for books"""
    
    RATING_TYPES = [
        ('overall', 'Overall'),
        ('enjoyment', 'Enjoyment'),
        ('critique', 'Critique'),
        ('plot', 'Plot'),
        ('character', 'Character Development'),
        ('setting', 'Setting/World Building'),
        ('theme', 'Themes'),
        ('prose', 'Prose/Writing Style'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    rating_type = models.CharField(max_length=20, choices=RATING_TYPES)
    
    # Rating from 0.5 to 5.0 in 0.5 increments
    rating = models.DecimalField(
        max_digits=2, 
        decimal_places=1,
        validators=[
            MinValueValidator(0.5),
            MaxValueValidator(5.0)
        ]
    )
    
    # Optional review text
    review = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'book', 'rating_type']
        ordering = ['rating_type']
    
    def __str__(self):
        return f"{self.user.username} - {self.book.title} - {self.get_rating_type_display()}: {self.rating}"