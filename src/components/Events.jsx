import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../hooks/useAuth'; // Use simple auth hook
import '../global.css';

export default function Events() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    subscription: 'None',
    giftOption: 'Flowers'
  });
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);

  // Fetch events from Firestore
  useEffect(() => {
    if (loading) return;
    
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const fetchEvents = async () => {
      try {
        setFetching(true);
        // Fetching events for user
        
        // First try to fetch with ordering
        const q = query(
          collection(db, 'events'),
          where('userId', '==', currentUser.uid),
          orderBy('date')
        );
        const querySnapshot = await getDocs(q);
        const eventsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(eventsData);
      } catch (err) {
        // If ordering fails, try without ordering
        try {
          const q = query(
            collection(db, 'events'),
            where('userId', '==', currentUser.uid)
          );
          const querySnapshot = await getDocs(q);
          const eventsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setEvents(eventsData);
        } catch (fallbackErr) {
          if (fallbackErr.code ==='permission-denied') {
            setError('Permission denied when loading events.');
          } else {
            setError('Failed to fetch events. Please try again.');
          }
        }
      } finally {
        setFetching(false);
      }
    };

    fetchEvents();
  }, [currentUser, loading, navigate]);

  const handleInputChange = (e)=>{
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.date) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoadingData(true);
    
    try {
      if (editingEvent) {
        // Update existing event
        const eventRef = doc(db, 'events', editingEvent.id);
        await updateDoc(eventRef, {
          name: formData.name,
          date:formData.date,
          subscription: formData.subscription,
          giftOption: formData.giftOption
        });
        
        setEvents(prev => 
          prev.map(event => 
            event.id === editingEvent.id 
              ? { ...event, name: formData.name, date: formData.date, subscription: formData.subscription, giftOption: formData.giftOption } 
              : event
          )
        );
      }else {
        // Add new event
        const docRef = await addDoc(collection(db, 'events'), {
          name: formData.name,
          date: formData.date,
          subscription: formData.subscription,
          giftOption: formData.giftOption,
          userId: currentUser.uid,
          createdAt: new Date()
        });
        setEvents(prev=> [
          ...prev,
          { 
            id: docRef.id, 
            name: formData.name, 
            date: formData.date,
            subscription: formData.subscription,
            giftOption: formData.giftOption,
            userId: currentUser.uid
          }
        ]);
      }
      
      // Reset form
      setFormData({ name:'', date: '',subscription:'None', giftOption: 'Flowers'});
      setShowAddForm(false);
      setEditingEvent(null);
    } catch (err) {
      if (err.code === 'permission-denied') {
        setError('Permission denied to save event.');
      } else {
        setError('Failed to save event. Please try again.');
      }
    }finally{
      setLoadingData(false);
    }
  };

  // Function to update subscription for an event
  const updateSubscription = async (eventId, subscriptionValue) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        subscription: subscriptionValue
      });
      
      //Update local state
      setEvents(prev => 
        prev.map(event => 
          event.id === eventId 
            ? { ...event, subscription: subscriptionValue } 
            : event
        )
      );
    } catch (err) {
      setError('Failed to update subscription. Please try again.');
    }
  };

  //Function to update gift option for an event
  const updateGiftOption = async (eventId, giftOptionValue) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        giftOption: giftOptionValue
      });
      
      // Update local state
      setEvents(prev =>
        prev.map(event => 
          event.id === eventId 
            ? { ...event, giftOption: giftOptionValue } 
            : event
        )
      );
    } catch (err) {
      setError('Failed to update gift option. Please try again.');
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      date: event.date,
      subscription: event.subscription || 'None',
      giftOption: event.giftOption || 'Flowers'
    });
    setShowAddForm(true);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
        setEvents(prev => prev.filter(event => event.id !== eventId));
      } catch (err) {
        setError('Failed to delete event. Please try again.');
      }
    }
  };

  const handleAddNew = () => {
    setEditingEvent(null);
    setFormData({ name: '', date: '', subscription: 'None', giftOption: 'Flowers' });
    setShowAddForm(true);
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingEvent(null);
    setFormData({ name: '', date: '', subscription: 'None', giftOption: 'Flowers' });
    setError('');
  };

  if (loading || fetching) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Events</h2>
        </div>
        <p>Loading events...</p>
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect to login
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Events</h2>
        <button className="btn-secondary" onClick={() => navigate('/profile')}>
          Profile
        </button>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="actions-bar">
        <button className="btn-primary" onClick={handleAddNew}>
          Add Event
        </button>
        <Link to="/event-processor" className="btn-secondary">
          Event Processor (Admin Only)
        </Link>
      </div>

      {showAddForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Event Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subscription</label>
                  <select
                    name="subscription"
                    value={formData.subscription}
                    onChange={handleInputChange}
                  >
                    <option value="None">None</option>
                    <option value="Flowers">Flowers</option>
                    <option value="Chocolates">Chocolates</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Gift Option</label>
                  <select
                    name="giftOption"
                    value={formData.giftOption}
                    onChange={handleInputChange}
                  >
                    <option value="Flowers">Flowers</option>
                    <option value="Chocolates">Chocolates</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={cancelForm} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loadingData} className="btn-primary">
                  {loadingData ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="events-list">
        {events.length === 0 ? (
          <p>No events found. Add your first event!</p>
        ) : (
          events.map(event => (
            <div key={event.id} className="event-card">
              <div className="event-header">
                <h3>{event.name}</h3>
                <div className="event-actions">
                  <button onClick={() => handleEdit(event)} className="btn-icon">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button onClick={() => handleDelete(event.id)} className="btn-icon">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div className="event-details">
                <p><strong>Date:</strong> {event.date}</p>
                <p><strong>Subscription:</strong> {event.subscription || 'None'}</p>
                <p><strong>Gift Option:</strong> {event.giftOption || 'Flowers'}</p>
              </div>
              <div className="event-controls">
                <div className="control-group">
                  <label>Subscription:</label>
                  <select 
                    value={event.subscription || 'None'} 
                    onChange={(e) => updateSubscription(event.id, e.target.value)}
                  >
                    <option value="None">None</option>
                    <option value="Flowers">Flowers</option>
                    <option value="Chocolates">Chocolates</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
                <div className="control-group">
                  <label>Gift Option:</label>
                  <select 
                    value={event.giftOption || 'Flowers'} 
                    onChange={(e) => updateGiftOption(event.id, e.target.value)}
                  >
                    <option value="Flowers">Flowers</option>
                    <option value="Chocolates">Chocolates</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}