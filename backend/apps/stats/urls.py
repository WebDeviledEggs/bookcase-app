from django.urls import path
from . import views

app_name = 'stats'

urlpatterns = [
    path('dashboard/', views.DashboardStatsView.as_view(), name='dashboard'),
    path('reading-timeline/', views.ReadingTimelineView.as_view(), name='reading-timeline'),
    path('genre-breakdown/', views.GenreBreakdownView.as_view(), name='genre-breakdown'),
    path('reading-habits/', views.ReadingHabitsView.as_view(), name='reading-habits'),
]
