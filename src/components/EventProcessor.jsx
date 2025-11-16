import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../context/AuthContext';

export default function EventProcessor() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { processing, result, error, processEvents, clearResult } = useEvents();
  //const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);

useEffect(() => {
    const refreshUserToken = async () => {
      if (currentUser) {
        try {
          await currentUser.getIdToken(true);
          const idTokenResult = await currentUser.getIdTokenResult();
          console.log('Admin claim:', idTokenResult.claims.admin);
        } catch (error) {
          console.error('Error refreshing token:', error);
        }
      }
    };

    refreshUserToken();
  }, [currentUser]);

  const handleProcessEvents = async () => {
    try {
      await processEvents();
    } catch (err) {
      // Error is handled in the hook, but you can add additional error handling here
      setError('Component error:', err);
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

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Event Processor</h2>

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