from django.db import models
from django.contrib.auth.models import User


class ReadingSession(models.Model):
    """Track individual reading sessions for detailed analytics"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey('books.Book', on_delete=models.CASCADE)  # Reference to books app
    
    # Session details
    start_page = models.IntegerField()
    end_page = models.IntegerField()
    session_date = models.DateField()
    duration_minutes = models.IntegerField(blank=True, null=True)  # Optional time tracking
    
    # Notes about the session
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-session_date', '-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.book.title} - {self.session_date}"
    
    @property
    def pages_read(self):
        """Calculate pages read in this session"""
        return max(0, self.end_page - self.start_page)


class ReadingStreak(models.Model):
    """Track reading streaks for gamification"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)  # Null if streak is ongoing
    current_streak = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-start_date']
    
    def __str__(self):
        status = "Current" if self.current_streak else "Past"
        return f"{self.user.username} - {status} Streak from {self.start_date}"
    
    @property
    def streak_length(self):
        """Calculate length of streak in days"""
        from django.utils import timezone
        end = self.end_date if self.end_date else timezone.now().date()
        return (end - self.start_date).days + 1


# You could add more stats models here in the future:
# - BookRecommendation
# - ReadingChallenge  
# - MonthlyStats
# etc.