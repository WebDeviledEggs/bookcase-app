import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo/Brand */}
        <Link to="/" className="navbar-brand">
          📚 The BookCase
        </Link>

        {/* Navigation Links */}
        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              <Link to="/search" className="navbar-link">Search Books</Link>
              <Link to="/my-tbr" className="navbar-link">My TBR</Link>
              <Link to="/my-library" className="navbar-link">My Library</Link>
              <Link to="/my-stats" className="navbar-link">My Stats</Link>
              
              <div className="navbar-user">
                <span className="user-greeting">Welcome, {user?.username}!</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="navbar-auth">
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/register" className="navbar-link register-link">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;