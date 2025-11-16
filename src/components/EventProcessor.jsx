import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../context/AuthContext';

export default function EventProcessor() {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { processing, result, error, processEvents, clearResult } = useEvents();
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (currentUser && isAdmin) {
      console.log('Admin user authenticated:', currentUser.uid, currentUser.email);
      setFetching(false);
    } else if (currentUser && !isAdmin) {
      // User is authenticated but not an admin
      console.log('User is not authorized for admin access:', currentUser.uid, currentUser.email);
      // Redirect to a user dashboard or show unauthorized message
      navigate('/events');
    } else if (!currentUser) {
      // User is not authenticated
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [currentUser, isAdmin, navigate]);

  const handleProcessEvents = async () => {
    try {
      await processEvents();
    } catch (err) {
      console.error('Component error:', err);
    }
  };

  const handleClear = () => {
    clearResult();
  };

  if (fetching) {
    return(
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Events</h2>
        </div>
        <p>Loading events...</p>
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  // If user is not an admin, don't render the component
  if (!isAdmin) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
        <Link to="/events">Go to Events</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Event Processor</h2>
      
      {currentUser && (
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
          <strong>Logged in as:</strong> {currentUser.email} ({currentUser.uid})<br/>
          <strong>Admin Status:</strong> {isAdmin ? 'Authorized' : 'Not Authorized'}
        </div>
      )}

      <div style={{ margin: '20px 0' }}>
        <button
          onClick={handleProcessEvents}
          disabled={processing}
          style={{
            backgroundColor: processing ? '#ccc' : '#4285f4',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: processing ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {processing ? 'Processing...' : 'Process Events'}
        </button>

        {result && (
          <button
            onClick={handleClear}
            style={{
              backgroundColor: '#f1f1f1',
              color: '#333',
              border: '1px solid #ccc',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              marginLeft: '10px'
            }}
          >
            Clear Results
          </button>
        )}
      </div>

      {processing && (
        <div style={{
          padding: '10px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          Processing events, please wait...
        </div>
      )}

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          Error: {error.message}
        </div>
      )}

      {result && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e8f5e9',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>Processing Results:</h3>
          <ul>
            <li><strong>Copied Events:</strong> {result.copiedEvents.length}</li>
            <li><strong>Total Upcoming Events:</strong> {result.totalUpcoming}</li>
            <li><strong>Recently Served Events:</strong> {result.recentlyServed}</li>
          </ul>
        </div>
      )}
    </div>
  );
}