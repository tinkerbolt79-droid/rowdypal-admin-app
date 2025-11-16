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
  const [subscriptions, setSubscriptions] = useState([]);
  const [giftOptions, setGiftOptions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    subscription: '',
    giftOption: ''
  });
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);

  // Fetch subscriptions and gift options from Firestore
  useEffect(() => {
    if (loading) return;
    
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const fetchDropdownData = async () => {
      try {
        // Fetch subscriptions
        const subscriptionsQuery = query(collection(db, 'subscriptions'));
        const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
        const subscriptionsData = subscriptionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSubscriptions(subscriptionsData);
        
        // Set default subscription if available
        if (subscriptionsData.length > 0) {
          setFormData(prev => ({
            ...prev,
            subscription: subscriptionsData[0].id
          }));
        }
        
        // Fetch gift options
        const giftOptionsQuery = query(collection(db, 'giftOptions'));
        const giftOptionsSnapshot = await getDocs(giftOptionsQuery);
        const giftOptionsData = giftOptionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGiftOptions(giftOptionsData);
        
        // Set default gift option if available
        if (giftOptionsData.length > 0) {
          setFormData(prev => ({
            ...prev,
            giftOption: giftOptionsData[0].id
          }));
        }
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
        setError('Failed to fetch subscription and gift options data. Please make sure the collections exist in Firestore.');
      }
    };
    
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

    fetchDropdownData();
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
    
    if (!formData.subscription) {
      setError('Please select a subscription');
      return;
    }
    
    if (!formData.giftOption) {
      setError('Please select a gift option');
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
      setFormData({ 
        name: '', 
        date: '',
        subscription: subscriptions.length > 0 ? subscriptions[0].id : '',
        giftOption: giftOptions.length > 0 ? giftOptions[0].id : ''
      });
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
      subscription: event.subscription || (subscriptions.length > 0 ? subscriptions[0].id : ''),
      giftOption: event.giftOption || (giftOptions.length > 0 ? giftOptions[0].id : '')
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
    setFormData({ 
      name: '', 
      date: '', 
      subscription: subscriptions.length > 0 ? subscriptions[0].id : '',
      giftOption: giftOptions.length > 0 ? giftOptions[0].id : ''
    });
    setShowAddForm(true);
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingEvent(null);
    setFormData({ 
      name: '', 
      date: '', 
      subscription: subscriptions.length > 0 ? subscriptions[0].id : '',
      giftOption: giftOptions.length > 0 ? giftOptions[0].id : ''
    });
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
                    required
                  >
                    <option value="">Select a subscription</option>
                    {subscriptions.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Gift Option</label>
                  <select
                    name="giftOption"
                    value={formData.giftOption}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a gift option</option>
                    {giftOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
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

      <div className="events-table-container">
        {events.length === 0 ? (
          <p className="no-events">No events found. Add your first event!</p>
        ) : (
          <table className="events-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Subscription</th>
                <th>Gift Option</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id}>
                  <td>{event.name}</td>
                  <td>{event.date}</td>
                  <td>
                    <select 
                      value={event.subscription || (subscriptions.length > 0 ? subscriptions[0].id : '')} 
                      onChange={(e) => updateSubscription(event.id, e.target.value)}
                    >
                      {subscriptions.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select 
                      value={event.giftOption || (giftOptions.length > 0 ? giftOptions[0].id : '')} 
                      onChange={(e) => updateGiftOption(event.id, e.target.value)}
                    >
                      {giftOptions.map(option => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(event)} className="btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(event.id)} className="btn-delete">
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