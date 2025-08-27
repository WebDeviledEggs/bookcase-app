import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const MyTBR = () => {
  const [tbrBooks, setTbrBooks] = useState([]);
  const [readingBooks, setReadingBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingBook, setUpdatingBook] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      // Get TBR books
      const tbrResponse = await axios.get('/api/books/my-books/', {
        params: { status: 'tbr' }
      });
      setTbrBooks(tbrResponse.data.books);

      // Get currently reading books
      const readingResponse = await axios.get('/api/books/my-books/', {
        params: { status: 'reading' }
      });
      setReadingBooks(readingResponse.data.books);
    } catch (err) {
      setError('Failed to load your books');
    } finally {
      setLoading(false);
    }
  };

  const updateBookStatus = async (userBookId, newStatus) => {
    setUpdatingBook(userBookId);
    try {
      await axios.put(`/api/books/user-book/${userBookId}/update/`, {
        status: newStatus
      });
      
      // Refresh the books list
      fetchBooks();
      
      // Show success message
      const statusDisplay = {
        'reading': 'Currently Reading',
        'finished': 'Finished',
        'dnf': 'Did Not Finish'
      };
      alert(`Book moved to ${statusDisplay[newStatus]}!`);
    } catch (err) {
      setError('Failed to update book status');
    } finally {
      setUpdatingBook(null);
    }
  };

  const BookCard = ({ userBook, showMoveActions = true }) => (
    <div className="user-book-card card">
      <div className="book-card-content">
        {userBook.book.cover_url && (
          <div className="book-cover">
            <img 
              src={userBook.book.cover_url} 
              alt={`${userBook.book.title} cover`}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="book-info">
          <h3 className="book-title">{userBook.book.title}</h3>
          
          {userBook.book.authors && userBook.book.authors.length > 0 && (
            <p className="book-authors">
              by {userBook.book.authors.slice(0, 2).join(', ')}
              {userBook.book.authors.length > 2 && ' et al.'}
            </p>
          )}
          
          <div className="book-details">
            {userBook.book.pages && (
              <span className="book-pages">{userBook.book.pages} pages</span>
            )}
            <span className="date-added">
              Added {new Date(userBook.date_added).toLocaleDateString()}
            </span>
          </div>

          {userBook.status === 'reading' && userBook.current_page > 0 && (
            <div className="reading-progress">
              <div className="progress-text">
                Page {userBook.current_page} of {userBook.book.pages || '?'}
                {userBook.progress_percentage > 0 && (
                  <span className="progress-percent">
                    ({Math.round(userBook.progress_percentage)}%)
                  </span>
                )}
              </div>
              {userBook.book.pages && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${userBook.progress_percentage}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {userBook.notes && (
            <div className="book-notes">
              <strong>Notes:</strong> {userBook.notes}
            </div>
          )}
        </div>
      </div>

      {showMoveActions && (
        <div className="book-actions">
          {userBook.status === 'tbr' && (
            <>
              <button
                onClick={() => updateBookStatus(userBook.id, 'reading')}
                className="btn btn-primary btn-sm"
                disabled={updatingBook === userBook.id}
              >
                {updatingBook === userBook.id ? 'Moving...' : 'Start Reading'}
              </button>
              <button
                onClick={() => updateBookStatus(userBook.id, 'finished')}
                className="btn btn-secondary btn-sm"
                disabled={updatingBook === userBook.id}
              >
                Mark as Read
              </button>
            </>
          )}
          
          {userBook.status === 'reading' && (
            <>
              <button
                onClick={() => updateBookStatus(userBook.id, 'finished')}
                className="btn btn-primary btn-sm"
                disabled={updatingBook === userBook.id}
              >
                {updatingBook === userBook.id ? 'Moving...' : 'Mark as Finished'}
              </button>
              <button
                onClick={() => updateBookStatus(userBook.id, 'tbr')}
                className="btn btn-secondary btn-sm"
                disabled={updatingBook === userBook.id}
              >
                Move to TBR
              </button>
              <button
                onClick={() => updateBookStatus(userBook.id, 'dnf')}
                className="btn btn-danger btn-sm"
                disabled={updatingBook === userBook.id}
              >
                Did Not Finish
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading your books...</div>
      </div>
    );
  }

  return (
    <div className="my-tbr-container">
      <div className="page-header">
        <h1 className="page-title">My TBR</h1>
        <p className="page-subtitle">Manage your ever-growing TBR and currently-reading books</p>
        
        <div className="page-actions">
          <Link to="/search" className="btn btn-primary">
            Add New Books
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Currently Reading Section */}
      {readingBooks.length > 0 && (
        <section className="reading-section">
          <h2 className="section-title">Currently Reading ({readingBooks.length})</h2>
          <div className="books-grid">
            {readingBooks.map((userBook) => (
              <BookCard key={userBook.id} userBook={userBook} />
            ))}
          </div>
        </section>
      )}

      {/* TBR Section */}
      <section className="tbr-section">
        <h2 className="section-title">
          To Be Read ({tbrBooks.length})
          {tbrBooks.length > 0 && (
            <span className="section-subtitle">
              Your reading queue awaits!
            </span>
          )}
        </h2>
        
        {tbrBooks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <h3>Your TBR is empty!</h3>
              <p>Start building your reading list by searching for books.</p>
              <Link to="/search" className="btn btn-primary">
                Search Books
              </Link>
            </div>
          </div>
        ) : (
          <div className="books-grid">
            {tbrBooks.map((userBook) => (
              <BookCard key={userBook.id} userBook={userBook} />
            ))}
          </div>
        )}
      </section>

      {/* Quick Stats */}
      {(tbrBooks.length > 0 || readingBooks.length > 0) && (
        <section className="tbr-stats">
          <div className="stats-grid">
            <div className="stat-card card">
              <div className="stat-number">{tbrBooks.length}</div>
              <div className="stat-label">Books in TBR</div>
            </div>
            <div className="stat-card card">
              <div className="stat-number">{readingBooks.length}</div>
              <div className="stat-label">Currently Reading</div>
            </div>
            <div className="stat-card card">
              <div className="stat-number">
                {tbrBooks.reduce((total, book) => total + (book.book.pages || 0), 0) +
                 readingBooks.reduce((total, book) => total + (book.book.pages || 0), 0)}
              </div>
              <div className="stat-label">Total Pages</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default MyTBR;