from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    """Extended user profile for additional BookCase features"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
    # Profile information
    bio = models.TextField(max_length=500, blank=True)
    favorite_genres = models.JSONField(default=list)
    reading_preferences = models.JSONField(default=dict)  # Store various preferences
    
    # Settings
    profile_public = models.BooleanField(default=False)
    email_notifications = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"


class ReadingGoal(models.Model):
    """Annual reading goals for users"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    year = models.IntegerField()
    books_goal = models.IntegerField()
    pages_goal = models.IntegerField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'year']
        ordering = ['-year']
    
    def __str__(self):
        return f"{self.user.username} - {self.year}: {self.books_goal} books"
    
    @property
    def books_read_count(self):
        """Count books finished this year"""
        from django.utils import timezone
        from apps.books.models import UserBook
        
        year_start = timezone.datetime(self.year, 1, 1)
        year_end = timezone.datetime(self.year, 12, 31, 23, 59, 59)
        
        return UserBook.objects.filter(
            user=self.user,
            status='finished',
            date_finished__range=(year_start, year_end)
        ).count()
    
    @property 
    def progress_percentage(self):
        """Calculate progress toward goal"""
        if self.books_goal == 0:
            return 0
        return min(100, (self.books_read_count / self.books_goal) * 100)