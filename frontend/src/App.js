import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/common/Navbar';

// Import pages (we'll create these next)
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MyTBR from './pages/MyTBR';
import MyLibrary from './pages/MyLibrary';
import MyStats from './pages/MyStats';
import BookSearch from './pages/BookSearch';
import BookDetail from './pages/BookDetail';

import './App.css';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/my-tbr" element={
              <ProtectedRoute>
                <MyTBR />
              </ProtectedRoute>
            } />
            <Route path="/my-library" element={
              <ProtectedRoute>
                <MyLibrary />
              </ProtectedRoute>
            } />
            <Route path="/my-stats" element={
              <ProtectedRoute>
                <MyStats />
              </ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute>
                <BookSearch />
              </ProtectedRoute>
            } />
            <Route path="/book/:bookId" element={
              <ProtectedRoute>
                <BookDetail />
              </ProtectedRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;