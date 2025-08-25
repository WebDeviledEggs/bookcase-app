import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero text-center mb-8">
        <h1 className="hero-title">
          Welcome to <span className="text-primary">The BookCase</span>
        </h1>
        <p className="hero-subtitle">
          Your personalized reading companion with detailed ratings and insights
        </p>
        
        {!isAuthenticated ? (
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary mr-4">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
        ) : (
          <div className="hero-actions">
            <h2 className="welcome-back">
              Welcome back, {user?.username}! 📚
            </h2>
            <Link to="/search" className="btn btn-primary mr-4">
              Search Books
            </Link>
            <Link to="/my-tbr" className="btn btn-secondary">
              View TBR
            </Link>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="section-title text-center mb-6">Features</h2>
        <div className="grid grid-3">
          <div className="feature-card card">
            <div className="feature-icon">⭐</div>
            <h3 className="feature-title">Detailed Ratings</h3>
            <p className="feature-description">
              Rate books with half-stars across multiple categories: plot, characters, 
              prose, themes, and more.
            </p>
          </div>
          
          <div className="feature-card card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Reading Analytics</h3>
            <p className="feature-description">
              Track your reading pace, favorite genres, most-read authors, 
              and discover your reading patterns.
            </p>
          </div>
          
          <div className="feature-card card">
            <div className="feature-icon">📚</div>
            <h3 className="feature-title">Smart Organization</h3>
            <p className="feature-description">
              Organize your TBR list, track reading progress, and maintain 
              your personal library with ease.
            </p>
          </div>
        </div>
      </section>

      {isAuthenticated && (
        <section className="quick-access mt-8">
          <h2 className="section-title text-center mb-6">Quick Access</h2>
          <div className="grid grid-2">
            <Link to="/my-library" className="quick-link card">
              <h3>My Library</h3>
              <p>View your finished books and ratings</p>
              <span className="quick-link-arrow">→</span>
            </Link>
            
            <Link to="/my-stats" className="quick-link card">
              <h3>My Stats</h3>
              <p>Explore your reading analytics</p>
              <span className="quick-link-arrow">→</span>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;