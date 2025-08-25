from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.conf import settings
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .serializers import UserSerializer


@ensure_csrf_cookie
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Register a new user with password protection"""
    
    # Check registration password
    registration_password = request.data.get('registration_password')
    if registration_password != settings.REGISTRATION_PASSWORD:
        return Response({
            'error': 'Invalid registration password. This is a private BookCase instance.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Validate required fields
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    if not all([username, email, password]):
        return Response({
            'error': 'Username, email, and password are required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user already exists
    if User.objects.filter(username=username).exists():
        return Response({
            'error': 'Username already exists.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({
            'error': 'Email already registered.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create user
    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Auto-login after registration
        login(request, user)
        
        response = Response({
            'message': 'Registration successful!',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
        
        return response
        
    except Exception as e:
        return Response({
            'error': 'Registration failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@ensure_csrf_cookie
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login user"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'error': 'Username and password are required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(request, username=username, password=password)
    
    if user:
        login(request, user)
        
        response = Response({
            'message': 'Login successful!',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)
        
        return response
    else:
        return Response({
            'error': 'Invalid username or password.'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout user"""
    logout(request)
    return Response({
        'message': 'Logout successful!'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get current user profile"""
    return Response({
        'user': UserSerializer(request.user).data
    }, status=status.HTTP_200_OK)


@ensure_csrf_cookie
@api_view(['GET'])
def check_auth(request):
    """Check if user is authenticated"""
    if request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user': UserSerializer(request.user).data
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'authenticated': False
        }, status=status.HTTP_200_OK)