import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero text-center mb-8">
        <h1 className="hero-title">
          Welcome to <span className="text-primary">BookCase</span>
        </h1>
        <p className="hero-subtitle">
          Your virtual bookshelf and personal librarian.
        </p>
        
        {!isAuthenticated ? (
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary mr-4">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Sign In
            </Link>
          {/* Features Section */}
          <section className="features">
            <h2 className="section-title text-center mb-6">Features</h2>
            <div className="grid grid-3">
              <div className="feature-card card">
                <div className="feature-icon">⭐</div>
                <h3 className="feature-title">Detailed Ratings</h3>
                <p className="feature-description">
                  Trash or class books with half-star accuracy across multiple categories.
                </p>
              </div>
              
              <div className="feature-card card">
                <div className="feature-icon">📊</div>
                <h3 className="feature-title">Reading Analytics</h3>
                <p className="feature-description">
                  Track your stats and discover your reading patterns.
                </p>
              </div>
              
              <div className="feature-card card">
                <div className="feature-icon">📚</div>
                <h3 className="feature-title">Smart Organization</h3>
                <p className="feature-description">
                  Organize your massive honking TBR list.
                </p>
              </div>
            </div>
          </section>
          </div>

        ) : (
          <div className="hero-actions">
            <h2 className="welcome-back">
              Welcome back, {user?.username}! 📚
            </h2>
            {/* <Link to="/search" className="btn btn-primary mr-4">
              Search Books
            </Link>
            <Link to="/my-tbr" className="btn btn-secondary">
              View TBR
            </Link> */}
          </div>
        )}
      </section>
      {isAuthenticated && (
        <section className="bookshelf-section mt-8">
          <div className="bookshelf-image-container">
            <div className="bookshelf-background">
              {/* Overlay links positioned over shelves */}
              <Link to="/my-library" className="shelf-overlay shelf-1">
                <div className="shelf-text">
                  <span className="shelf-title">My Library</span>
                  <span className="shelf-description">Finished Books</span>
                </div>
              </Link>
              
              <Link to="/my-tbr" className="shelf-overlay shelf-2">
                <div className="shelf-text">
                  <span className="shelf-title">My TBR</span>
                  <span className="shelf-description">To Be Read</span>
                </div>
              </Link>
              
              <Link to="/my-stats" className="shelf-overlay shelf-3">
                <div className="shelf-text">
                  <span className="shelf-title">My Stats</span>
                  <span className="shelf-description">Reading Analytics</span>
                </div>
              </Link>

              <Link to="/search" className="shelf-overlay shelf-4">
                <div className="shelf-text">
                  <span className="shelf-title">Search Books</span>
                  <span className="shelf-description">Find New Reads</span>
                </div>
              </Link>
              

            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;