from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/books/', include('apps.books.urls')),
    path('api/stats/', include('apps.stats.urls')),
]