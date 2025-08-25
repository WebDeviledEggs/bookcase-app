import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './MyLibrary.css';

const MyLibrary = () => {
  const [finishedBooks, setFinishedBooks] = useState([]);
  const [dnfBooks, setDnfBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // all, recent, rated, unrated
  const [sortBy, setSortBy] = useState('date_finished'); // date_finished, title, author

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      // Get finished books
      const finishedResponse = await axios.get('/api/books/my-books/', {
        params: { status: 'finished' }
      });
      setFinishedBooks(finishedResponse.data.books);

      // Get DNF books
      const dnfResponse = await axios.get('/api/books/my-books/', {
        params: { status: 'dnf' }
      });
      setDnfBooks(dnfResponse.data.books);
    } catch (err) {
      setError('Failed to load your library');
    } finally {
      setLoading(false);
    }
  };

  // Sort and filter books
  const sortBooks = (books, sortBy) => {
    const sorted = [...books].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.book.title.localeCompare(b.book.title);
        case 'author':
          const authorA = a.book.authors[0] || 'Unknown';
          const authorB = b.book.authors[0] || 'Unknown';
          return authorA.localeCompare(authorB);
        case 'date_finished':
        default:
          return new Date(b.date_finished || b.date_added) - new Date(a.date_finished || a.date_added);
      }
    });
    return sorted;
  };

  const filteredAndSortedBooks = sortBooks(finishedBooks, sortBy);

  const LibraryBookCard = ({ userBook }) => (
    <div className="library-book-card card">
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
            {userBook.date_finished && (
              <span className="date-finished">
                Finished {new Date(userBook.date_finished).toLocaleDateString()}
              </span>
            )}
            {userBook.reading_days && (
              <span className="reading-time">
                Read in {userBook.reading_days} days
              </span>
            )}
          </div>

          {userBook.book.genres && userBook.book.genres.length > 0 && (
            <div className="book-genres">
              {userBook.book.genres.slice(0, 3).map((genre, index) => (
                <span key={index} className="genre-tag">
                  {genre}
                </span>
              ))}
            </div>
          )}

          {userBook.notes && (
            <div className="book-notes">
              <strong>Notes:</strong> {userBook.notes}
            </div>
          )}
        </div>
      </div>

      <div className="book-actions">
        <Link 
          to={`/book/${userBook.id}`} 
          className="btn btn-primary btn-sm"
        >
          View & Rate
        </Link>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => {/* TODO: Quick re-read functionality */}}
        >
          Mark as Re-reading
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading your library...</div>
      </div>
    );
  }

  return (
    <div className="my-library-container">
      <div className="page-header">
        <h1 className="page-title">My Library</h1>
        <p className="page-subtitle">Your finished books and reading history</p>
        
        <div className="page-actions">
          <Link to="/search" className="btn btn-primary">
            Add New Books
          </Link>
          <Link to="/my-stats" className="btn btn-secondary">
            View Stats
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Library Stats */}
      {finishedBooks.length > 0 && (
        <section className="library-overview">
          <div className="stats-grid">
            <div className="stat-card card">
              <div className="stat-number">{finishedBooks.length}</div>
              <div className="stat-label">Books Read</div>
            </div>
            <div className="stat-card card">
              <div className="stat-number">
                {finishedBooks.reduce((total, book) => total + (book.book.pages || 0), 0).toLocaleString()}
              </div>
              <div className="stat-label">Total Pages</div>
            </div>
            <div className="stat-card card">
              <div className="stat-number">
                {Math.round(finishedBooks.reduce((total, book) => total + (book.book.pages || 0), 0) / finishedBooks.length) || 0}
              </div>
              <div className="stat-label">Avg Pages/Book</div>
            </div>
            {dnfBooks.length > 0 && (
              <div className="stat-card card">
                <div className="stat-number">{dnfBooks.length}</div>
                <div className="stat-label">Did Not Finish</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Filter and Sort Controls */}
      {finishedBooks.length > 0 && (
        <div className="library-controls">
          <div className="control-group">
            <label className="control-label">Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="control-select"
            >
              <option value="date_finished">Recently Finished</option>
              <option value="title">Title</option>
              <option value="author">Author</option>
            </select>
          </div>
        </div>
      )}

      {/* Finished Books */}
      <section className="finished-books-section">
        <h2 className="section-title">
          Finished Books ({finishedBooks.length})
        </h2>
        
        {finishedBooks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <h3>No finished books yet!</h3>
              <p>Complete some books from your TBR to build your library.</p>
              <Link to="/my-tbr" className="btn btn-primary">
                View TBR
              </Link>
            </div>
          </div>
        ) : (
          <div className="books-grid">
            {filteredAndSortedBooks.map((userBook) => (
              <LibraryBookCard key={userBook.id} userBook={userBook} />
            ))}
          </div>
        )}
      </section>

      {/* DNF Books */}
      {dnfBooks.length > 0 && (
        <section className="dnf-books-section">
          <h2 className="section-title">
            Did Not Finish ({dnfBooks.length})
          </h2>
          <div className="books-grid">
            {dnfBooks.map((userBook) => (
              <div key={userBook.id} className="library-book-card card dnf-book">
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
                      </p>
                    )}
                    
                    <div className="dnf-reason">
                      {userBook.notes ? (
                        <span><strong>Why DNF:</strong> {userBook.notes}</span>
                      ) : (
                        <span className="text-gray-600">Did not finish</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MyLibrary;