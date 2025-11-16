import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../hooks/useAuth'; // Use simple auth hook

export default function ProfilePage() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoadingData(true);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setDob(data.dob || '');
          setAddress(data.address || '');
          setPhone(data.phone || '');
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        if (err.code === 'permission-denied') {
          console.log('Permission denied when fetching profile.');
        } else if (err.code === 'not-found') {
          console.log('User profile not found - this may be expected for new users');
        } else {
          setError(`Failed to fetch profile data: ${err.message || 'Unknown error'}`);
        }
      } finally {
        setLoadingData(false);
      }
    };

    fetchProfile();
  }, [currentUser, loading, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();

    // Trim all inputs
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedAddress = address.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedAddress || !trimmedPhone) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError('');
      setLoadingData(true);

      const userData = {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        dob: dob.trim(),
        address: trimmedAddress,
        phone: trimmedPhone,
        email: currentUser.email,
        userId: currentUser.uid,
        lastUpdated: new Date()
      };

      await setDoc(doc(db, 'users', currentUser.uid), userData, { merge: true });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('Profile update error:', err);
      if (err.code === 'permission-denied') {
        setError('Permission denied: You do not have permission to update profile.');
      } else if (err.code === 'not-found') {
        setError('Profile not found. Please try again or contact support.');
      } else {
        setError(`Failed to update profile: ${err.message || 'Unknown error'}. Please try again.`);
      }
    }

    setLoadingData(false);
  }

  if (loading || loadingData) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2>Loading profile...</h2>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect to login
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Update Profile</h2>

        <div className="user-info">
          <div className="avatar">{currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}</div>
          <div>
            <h3>{currentUser?.email}</h3>
            <p>{currentUser?.email}</p>
          </div>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">Profile updated successfully!</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Address *</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={currentUser?.email || ''}
                disabled
              />
            </div>
          </div>

          <button type="submit" disabled={loadingData} className="btn-primary">
            {loadingData ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}