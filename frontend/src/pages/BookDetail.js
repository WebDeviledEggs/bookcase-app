import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './BookDetail.css';

// Simple Star Rating Component with half-star support
const StarRating = ({ rating, onRatingChange, readonly = false, label }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleStarClick = (starValue) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const handleStarHover = (starValue) => {
    if (!readonly) {
      setHoverRating(starValue);
    }
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const displayRating = hoverRating || rating || 0;

  const renderStarOptions = () => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      const halfValue = i - 0.5;
      const fullValue = i;
      
      stars.push(
        <div key={i} className="star-group">
          {/* Half star button */}
          <button
            type="button"
            className={`star-btn half-star ${displayRating >= halfValue ? 'active' : ''}`}
            onClick={() => handleStarClick(halfValue)}
            onMouseEnter={() => handleStarHover(halfValue)}
            disabled={readonly}
            title={`${halfValue} stars`}
          >
            {displayRating >= halfValue ? '★' : '☆'}
          </button>
          
          {/* Full star button */}
          <button
            type="button"
            className={`star-btn full-star ${displayRating >= fullValue ? 'active' : ''}`}
            onClick={() => handleStarClick(fullValue)}
            onMouseEnter={() => handleStarHover(fullValue)}
            disabled={readonly}
            title={`${fullValue} stars`}
          >
            {displayRating >= fullValue ? '★' : '☆'}
          </button>
        </div>
      );
    }
    
    return stars;
  };

  return (
    <div className="star-rating-component">
      {label && <label className="rating-label">{label}</label>}
      <div className="stars-container" onMouseLeave={handleMouseLeave}>
        {renderStarOptions()}
        <span className="rating-value">
          {rating > 0 ? `${rating}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  );
};

const BookDetail = () => {
  const { bookId } = useParams(); // This is the userBook ID
  const navigate = useNavigate();
  
  const [userBook, setUserBook] = useState(null);
  const [ratings, setRatings] = useState({});
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Rating categories matching your backend model
  const ratingCategories = [
    { key: 'overall', label: 'Overall Rating', description: 'Your overall impression' },
    { key: 'enjoyment', label: 'Enjoyment', description: 'How much you enjoyed it' },
    { key: 'critique', label: 'Critical Assessment', description: 'Objective literary merit' },
    { key: 'plot', label: 'Plot', description: 'Story structure and pacing' },
    { key: 'character', label: 'Character Development', description: 'Character depth and growth' },
    { key: 'setting', label: 'Setting/World Building', description: 'Environment and atmosphere' },
    { key: 'theme', label: 'Themes', description: 'Depth of themes and messages' },
    { key: 'prose', label: 'Prose/Writing Style', description: 'Quality of writing and style' }
  ];

  useEffect(() => {
    fetchBookDetails();
    fetchRatings();
  }, [bookId]);

  const fetchBookDetails = async () => {
    try {
      // For now, let's get book details through the my-books endpoint
      // You might want to create a specific endpoint for single book details
      const response = await axios.get('/api/books/my-books/');
      const book = response.data.books.find(b => b.id == bookId);
      
      if (book) {
        setUserBook(book);
      } else {
        setError('Book not found');
      }
    } catch (err) {
      setError('Failed to load book details');
      console.error('Fetch book error:', err);
    }
  };

  const fetchRatings = async () => {
    try {
      const response = await axios.get(`/api/books/user-book/${bookId}/ratings/`);
      
      // Convert array of ratings to object keyed by rating_type
      const ratingsObj = {};
      response.data.ratings.forEach(rating => {
        ratingsObj[rating.rating_type] = parseFloat(rating.rating);
        if (rating.rating_type === 'overall' && rating.review) {
          setReview(rating.review);
        }
      });
      
      setRatings(ratingsObj);
    } catch (err) {
      // It's okay if there are no ratings yet
      console.log('No ratings found (this is normal for unrated books)');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (category, value) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }));
    
    // Clear any previous messages
    setError('');
    setSuccessMessage('');
  };

  const handleSaveRatings = async () => {
    // Check if user has at least one rating
    if (Object.keys(ratings).length === 0) {
      setError('Please provide at least one rating before saving.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await axios.post(`/api/books/user-book/${bookId}/rate/`, {
        ratings: ratings,
        review: review
      });
      
      setSuccessMessage('Ratings saved successfully! 🎉');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save ratings');
      console.error('Save ratings error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`/api/books/user-book/${bookId}/update/`, {
        status: newStatus
      });
      
      setUserBook(prev => ({
        ...prev,
        status: newStatus
      }));
      
      setSuccessMessage(`Book status updated to ${newStatus}!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      setError('Failed to update book status');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading book details...</div>
      </div>
    );
  }

  if (error && !userBook) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <Link to="/my-library" className="btn btn-primary">
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="book-detail-container">
      {/* Book Header */}
      <div className="book-header">
        <div className="book-header-content">
          <div className="book-cover-large">
            {userBook?.book.cover_url ? (
              <img 
                src={userBook.book.cover_url} 
                alt={`${userBook.book.title} cover`}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="no-cover">
                📚
                <span>No Cover</span>
              </div>
            )}
          </div>
          
          <div className="book-info-large">
            <h1 className="book-title-large">{userBook?.book.title}</h1>
            
            {userBook?.book.authors && userBook.book.authors.length > 0 && (
              <p className="book-authors-large">
                by {userBook.book.authors.slice(0, 2).join(', ')}
                {userBook.book.authors.length > 2 && ' et al.'}
              </p>
            )}
            
            <div className="book-meta">
              {userBook?.book.pages && (
                <span className="meta-item">📄 {userBook.book.pages} pages</span>
              )}
              {userBook?.book.publish_date && (
                <span className="meta-item">📅 Published {userBook.book.publish_date}</span>
              )}
              <span className="meta-item status-badge status-{userBook?.status}">
                {userBook?.status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {userBook?.book.genres && userBook.book.genres.length > 0 && (
              <div className="book-genres-large">
                {userBook.book.genres.slice(0, 5).map((genre, index) => (
                  <span key={index} className="genre-tag-large">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Quick Status Actions */}
            <div className="status-actions">
              <button 
                className={`status-btn ${userBook?.status === 'reading' ? 'active' : ''}`}
                onClick={() => handleStatusChange('reading')}
              >
                📖 Currently Reading
              </button>
              <button 
                className={`status-btn ${userBook?.status === 'finished' ? 'active' : ''}`}
                onClick={() => handleStatusChange('finished')}
              >
                ✅ Finished
              </button>
              <button 
                className={`status-btn ${userBook?.status === 'dnf' ? 'active' : ''}`}
                onClick={() => handleStatusChange('dnf')}
              >
                ❌ DNF
              </button>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <Link to="/my-library" className="btn btn-secondary">
            ← Back to Library
          </Link>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}

      {/* Rating System */}
      <div className="ratings-section">
        <div className="section-header">
          <h2>Rate This Book</h2>
          <p>Rate different aspects of the book on a scale of 0.5 to 5 stars</p>
        </div>

        <div className="ratings-grid">
          {ratingCategories.map((category) => (
            <div key={category.key} className="rating-category">
              <div className="category-info">
                <h3>{category.label}</h3>
                <p className="category-description">{category.description}</p>
              </div>
              
              <StarRating
                rating={ratings[category.key] || 0}
                onRatingChange={(value) => handleRatingChange(category.key, value)}
              />
            </div>
          ))}
        </div>

        {/* Review Section */}
        <div className="review-section">
          <h3>Write a Review (Optional)</h3>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your thoughts about this book..."
            className="review-textarea"
            rows="6"
          />
        </div>

        {/* Save Button */}
        <div className="save-section">
          <button 
            onClick={handleSaveRatings}
            disabled={saving}
            className="btn btn-primary btn-large"
          >
            {saving ? 'Saving Ratings...' : 'Save Ratings & Review'}
          </button>
        </div>
      </div>

      {/* Reading History */}
      {userBook && (
        <div className="reading-history">
          <h3>Reading History</h3>
          <div className="history-details">
            <div className="history-item">
              <strong>Added to library:</strong> {new Date(userBook.date_added).toLocaleDateString()}
            </div>
            {userBook.date_started && (
              <div className="history-item">
                <strong>Started reading:</strong> {new Date(userBook.date_started).toLocaleDateString()}
              </div>
            )}
            {userBook.date_finished && (
              <div className="history-item">
                <strong>Finished reading:</strong> {new Date(userBook.date_finished).toLocaleDateString()}
              </div>
            )}
            {userBook.reading_days && (
              <div className="history-item">
                <strong>Time to read:</strong> {userBook.reading_days} days
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetail;