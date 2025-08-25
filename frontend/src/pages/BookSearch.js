import React, { useState } from 'react';
import axios from 'axios';

const BookSearch = () => {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addingBook, setAddingBook] = useState(null);

  const searchBooks = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get('/api/books/search/', {
        params: { q: query }
      });
      setBooks(response.data.books);
    } catch (err) {
      setError('Failed to search books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addBookToLibrary = async (book, status = 'tbr') => {
    setAddingBook(book.open_library_id);
    setError('');

    try {
      const response = await axios.post('/api/books/add/', {
        book,
        status
      });
      
      // Show success message
      alert(`Book added to your ${status === 'tbr' ? 'TBR' : 'library'}!`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to add book';
      setError(errorMsg);
    } finally {
      setAddingBook(null);
    }
  };

  return (
    <div className="book-search-container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Search Books</h1>
          <p className="card-subtitle">Find books to add to your library</p>
        </div>

        <form onSubmit={searchBooks} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, or ISBN..."
              className="form-input"
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginLeft: '0.5rem' }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
      </div>

      {books.length > 0 && (
        <div className="search-results">
          <h2 className="section-title mb-4">Search Results</h2>
          <div className="books-grid">
            {books.map((book) => (
              <div key={book.open_library_id} className="book-card card">
                <div className="book-card-content">
                  {book.cover_url && (
                    <div className="book-cover">
                      <img 
                        src={book.cover_url} 
                        alt={`${book.title} cover`}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="book-info">
                    <h3 className="book-title">{book.title}</h3>
                    
                    {book.authors && book.authors.length > 0 && (
                      <p className="book-authors">
                        by {book.authors.slice(0, 2).join(', ')}
                        {book.authors.length > 2 && ' et al.'}
                      </p>
                    )}
                    
                    <div className="book-details">
                      {book.first_publish_year && (
                        <span className="book-year">{book.first_publish_year}</span>
                      )}
                      {book.pages && (
                        <span className="book-pages">{book.pages} pages</span>
                      )}
                    </div>

                    {book.subjects && book.subjects.length > 0 && (
                      <div className="book-subjects">
                        {book.subjects.slice(0, 3).map((subject, index) => (
                          <span key={index} className="subject-tag">
                            {subject}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="book-actions">
                  <button
                    onClick={() => addBookToLibrary(book, 'tbr')}
                    className="btn btn-primary btn-sm"
                    disabled={addingBook === book.open_library_id}
                  >
                    {addingBook === book.open_library_id ? 'Adding...' : 'Add to TBR'}
                  </button>
                  
                  <button
                    onClick={() => addBookToLibrary(book, 'reading')}
                    className="btn btn-secondary btn-sm"
                    disabled={addingBook === book.open_library_id}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    {addingBook === book.open_library_id ? 'Adding...' : 'Mark as Reading'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {books.length === 0 && !loading && query && (
        <div className="no-results text-center">
          <p>No books found for "{query}". Try a different search term.</p>
        </div>
      )}
    </div>
  );
};

export default BookSearch;