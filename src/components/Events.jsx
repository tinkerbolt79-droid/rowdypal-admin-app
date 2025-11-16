import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import '../global.css';

export default function Events() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Removed console.log for security reasons
  
  const [events, setEvents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    subscription: 'None',
    giftOption: 'Flowers'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);

  // Fetch events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      if (!currentUser) {
        // No current user, skipping fetch
        return;
      }
      
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
  }, [currentUser]);

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
    
    setLoading(true);
    
    try {
      if (editingEvent) {
        // Update existing event
        const eventRef = doc(db, 'events', editingEvent.id);
        await updateDoc(eventRef, {
          name: formData.name,
          date:formData.date,
          subscription: formData.subscription, // Include subscription in update
          giftOption: formData.giftOption // Include giftOption in update
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
          subscription: formData.subscription, // Include subscription in creation
          giftOption: formData.giftOption, // Include giftOption in creation
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
      setLoading(false);
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
      subscription: event.subscription || 'None', // Include subscription in form data
      giftOption: event.giftOption || 'Flowers' // Include giftOption in form data
    });
    setShowAddForm(true);
  };

  const handleDelete= async (eventId)=> {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
        setEvents(prev => prev.filter(event => event.id !== eventId));
      } catch (err) {
        if(err.code === 'permission-denied') {
          setError('Permission denied to delete event.');
        } else {
          setError('Failed to delete event. Please try again.');
        }
      }
    }
  };

  const handleAddNew = () => {
    setEditingEvent(null);
    setFormData({ name: '',date:'', subscription: 'None', giftOption: 'Flowers'});
    setShowAddForm(true);
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingEvent(null);
    setFormData({ name: '', date: '', subscription: 'None', giftOption: 'Flowers' });
    setError('');
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

  return(
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Events</h2>
        <button className="btn-primary" onClick={handleAddNew}>
          Add Event
        </button>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="event-form-container">
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
              <label>Event Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Subscription</label>
              <div className="subscription-options">
                <button
                  type="button"
                  className={`subscription-btn ${formData.subscription === 'Yearly' ? 'selected' : ''}`}
                  onClick={() => setFormData({...formData, subscription: 'Yearly'})}
                >
                  Yearly
                </button>
                <button
                  type="button"
                  className={`subscription-btn ${formData.subscription === 'Monthly' ? 'selected' : ''}`}
                  onClick={() => setFormData({...formData, subscription: 'Monthly'})}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={`subscription-btn ${formData.subscription === 'None' ? 'selected' : ''}`}
                  onClick={() => setFormData({...formData, subscription: 'None'})}
                >
                  None
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label>Gift Option</label>
              <div className="subscription-options">
                <button
                  type="button"
                  className={`subscription-btn ${formData.giftOption === 'Flowers' ? 'selected' : ''}`}
                  onClick={() => setFormData({...formData, giftOption: 'Flowers'})}
                >
                  Flowers
                </button>
                <button
                  type="button"
                  className={`subscription-btn ${formData.giftOption === 'Movie Tickets' ? 'selected' : ''}`}
                  onClick={() => setFormData({...formData, giftOption: 'Movie Tickets'})}
                >
                  Movie Tickets
                </button>
                <button
                  type="button"
                  className={`subscription-btn ${formData.giftOption === 'Chocolates' ? 'selected' : ''}`}
                  onClick={() => setFormData({...formData, giftOption: 'Chocolates'})}
                >
                  Chocolates
                </button>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={cancelForm}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingEvent ? 'Update Event' : 'Add Event')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="events-list">
        {fetching ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <p className="no-events">No events found.Add your first event!</p>
        ) : (
          <table className="events-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Event Date</th>
                <th>Preferred Gift</th>
                <th>Subscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id}>
                  <td>
                    <button 
                      className="btn-link"
                      onClick={() =>handleEdit(event)}
                    >
                      {event.name}
                    </button>
                  </td>
                  <td>{event.date ?new Date(event.date).toLocaleDateString() : 'No date'}</td>
                  <td>{event.giftOption}</td>
                  <td>
                    <div className="subscription-display">
                      <div className="subscription-buttons">
                        <button className={`subscription-btn ${event.subscription === 'Yearly' ? 'selected' : ''}`}
                          onClick={() => updateSubscription(event.id,'Yearly')}
                        >
                          Yearly
                        </button>
                        <button
                          className={`subscription-btn ${event.subscription === 'Monthly' ? 'selected' : ''}`}
                          onClick={() => updateSubscription(event.id, 'Monthly')}
                        >
                          Monthly
                        </button>
                        <button
                          className={`subscription-btn ${event.subscription === 'None' ? 'selected' : ''}`}
                          onClick={() => updateSubscription(event.id, 'None')}
                        >
                          None
                        </button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(event.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}