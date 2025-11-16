import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export default function DebugEvents() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllEvents = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      console.log('Fetching all events for user:', currentUser.uid);
      const q = query(
        collection(db, 'events'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('All events fetched:', eventsData);
      setEvents(eventsData);
    } catch (err) {
      console.error('Error fetching all events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEvents();
  }, [currentUser]);

  return (
    <div>
      <h3>Debug Events</h3>
      <button onClick={fetchAllEvents} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh Events'}
      </button>
      <div>
        <h4>Events Count: {events.length}</h4>
        <pre>{JSON.stringify(events, null, 2)}</pre>
      </div>
    </div>
  );
}