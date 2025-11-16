import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import Events from './components/Events';
import EventProcessor from './components/EventProcessor';
import GiftOptions from './components/GiftOptions';
import PaymentMethods from './components/PaymentMethods';
import ProfilePage from './components/ProfilePage';
import DebugEvents from './components/DebugEvents';
import './global.css';

function App() {
  const { currentUser, logout } = useAuth();
  const location = useLocation(); // Add this to track current location
  
  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      return <Navigate to="/login" />;
    }
    return children;
  };
  
  // Public route component (redirects logged in users)
  const PublicRoute = ({ children }) => {
    if (currentUser) {
      return <Navigate to="/events" />;
    }
    return children;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  return (
    <div className="App">
      {currentUser && (
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/events">Dear Friend</Link>
            <h5>Admin console</h5>
          </div>
          <div className="nav-links">
              <div className="user-menu">
                <span className="user-icon">👤</span>
                <div className="user-dropdown">
                    <Link to="/events" className={`dropdown-item ${location.pathname === '/events' ? 'active' : ''}`}>Events</Link>
                    <Link to="/eventProcessor" className={`dropdown-item ${location.pathname === '/eventProcessor' ? 'active' : ''}`}>Event Processor</Link>
                    <Link to="/payments" className={`dropdown-item ${location.pathname === '/payments' ? 'active' : ''}`}>Payment Types</Link>
                    <Link to="/profile" className={`dropdown-item ${location.pathname === '/profile' ? 'active' : ''}`}>Profile</Link>
                    <button onClick={handleLogout} className="dropdown-item logout-btn">Logout</button>
                </div>
              </div>
          </div>
        </nav>
      )}
      
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/events" element={
          <ProtectedRoute>
            <Events />
          </ProtectedRoute>
        } />
        <Route path="/eventProcessor" element={
              <ProtectedRoute>
                <EventProcessor />
              </ProtectedRoute>
        } />
        <Route path="/events/:eventId/gifts" element={
          <ProtectedRoute>
            <GiftOptions />
          </ProtectedRoute>
        } />
        <Route path="/payments" element={
          <ProtectedRoute>
            <PaymentMethods />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/debug" element={
          <ProtectedRoute>
            <DebugEvents />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/events" />} />
      </Routes>
    </div>
  );
}

function AppWrapper() {
  return (
    <AuthProvider>
      <Router>
        <App />
      </Router>
    </AuthProvider>
  );
}

export default AppWrapper;