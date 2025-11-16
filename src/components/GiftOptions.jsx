import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import '../global.css';

export default function GiftOptions() {
  const { currentUser } = useAuth();
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [giftOptions, setGiftOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGift, setEditingGift] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: ''
  });

  // Fetch gift options from Firestore
  useEffect(() => {
    const fetchGiftOptions = async () => {
      if (!currentUser || !eventId) {
        return;
      }
      
      try {
        setFetching(true);
        const q = query(
          collection(db, 'giftOptions'),
          where('userId', '==', currentUser.uid),
          where('eventId', '==', eventId)
        );
        const querySnapshot = await getDocs(q);
        const giftsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGiftOptions(giftsData);
      } catch (err) {
        setError('Failed to fetch gift options. Please try again.');
      } finally {
        setFetching(false);
      }
    };

    fetchGiftOptions();
  }, [currentUser, eventId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name) {
      setError('Please enter a gift name');
      return;
    }
    
    if (formData.price && isNaN(formData.price)) {
      setError('Price must be a valid number');
      return;
    }
    
    setLoading(true);
    
    try {
      if (editingGift) {
        // Update existing gift option
        const giftRef = doc(db, 'giftOptions', editingGift.id);
        await updateDoc(giftRef, {
          name: formData.name,
          description: formData.description,
          price: formData.price ? parseFloat(formData.price) : null
        });
        
        setGiftOptions(prev => 
          prev.map(gift => 
            gift.id === editingGift.id 
              ? { ...gift, name: formData.name, description: formData.description, price: formData.price ? parseFloat(formData.price) : null } 
              : gift
          )
        );
      } else {
        // Add new gift option
        const docRef = await addDoc(collection(db, 'giftOptions'), {
          name: formData.name,
          description: formData.description,
          price: formData.price ? parseFloat(formData.price) : null,
          userId: currentUser.uid,
          eventId: eventId,
          createdAt: new Date()
        });
        
        setGiftOptions(prev => [
          ...prev,
          { 
            id: docRef.id, 
            name: formData.name,
            description: formData.description,
            price: formData.price ? parseFloat(formData.price) : null,
            userId: currentUser.uid,
            eventId: eventId
          }
        ]);
      }
      
      // Reset form
      setFormData({ name: '', description: '', price: '' });
      setShowAddForm(false);
      setEditingGift(null);
    } catch (err) {
      setError('Failed to save gift option. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (gift) => {
    setEditingGift(gift);
    setFormData({
      name: gift.name,
      description: gift.description || '',
      price: gift.price || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (giftId) => {
    if (window.confirm('Are you sure you want to delete this gift option?')) {
      try {
        await deleteDoc(doc(db, 'giftOptions', giftId));
        setGiftOptions(prev => prev.filter(gift => gift.id !== giftId));
      } catch (err) {
        setError('Failed to delete gift option. Please try again.');
      }
    }
  };

  const handleAddNew = () => {
    setEditingGift(null);
    setFormData({ name: '', description: '', price: '' });
    setShowAddForm(true);
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingGift(null);
    setFormData({ name: '', description: '', price: '' });
    setError('');
  };

  const goBack = () => {
    navigate('/events');
  };

  if (fetching) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Gift Options</h2>
        </div>
        <p>Loading gift options...</p>
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Gift Options</h2>
        <button className="btn-secondary" onClick={goBack}>
          Back to Events
        </button>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="actions-bar">
        <button className="btn-primary" onClick={handleAddNew}>
          Add Gift Option
        </button>
      </div>

      {showAddForm && (
        <div className="event-form-container">
          <h3>{editingGift ? 'Edit Gift Option' : 'Add New Gift Option'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Gift Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <label>Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
              />
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
                {loading ? 'Saving...' : (editingGift ? 'Update Gift' : 'Add Gift')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="gifts-list">
        {giftOptions.length === 0 ? (
          <p className="no-gifts">No gift options found. Add your first gift option!</p>
        ) : (
          <table className="gifts-table">
            <thead>
              <tr>
                <th>Gift Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {giftOptions.map(gift => (
                <tr key={gift.id}>
                  <td>{gift.name}</td>
                  <td>{gift.description || 'No description'}</td>
                  <td>{gift.price ? `$${gift.price.toFixed(2)}` : 'No price'}</td>
                  <td>
                    <button 
                      className="btn-edit"
                      onClick={() => handleEdit(gift)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(gift.id)}
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