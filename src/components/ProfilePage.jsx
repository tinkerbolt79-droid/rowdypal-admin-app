import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const fetchProfile = async () => {
      try {
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
        // Provide more specific error information
        if (err.code === 'permission-denied') {
          // This might be because the user doesn't have a profile yet, or security rules are not set up correctly
          console.log('Permission denied when fetching profile.');
          // We won't show an error to the user here since it's expected for new users
          // The form fields will remain empty and the user can fill them in
        } else if (err.code === 'not-found') {
          // This is not necessarily an error - the user might not have a profile yet
          console.log('User profile not found - this may be expected for new users');
        } else {
          setError(`Failed to fetch profile data: ${err.message || 'Unknown error'}`);
        }
      }
    };

    fetchProfile();
  }, [currentUser]);

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
      setLoading(true);

      const userData = {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        dob: dob.trim(),
        address: trimmedAddress,
        phone: trimmedPhone,
        email: currentUser.email,
        userId: currentUser.uid,  // Include user ID for security rules
        lastUpdated: new Date()
      };

      // Try to update the user document
      await setDoc(doc(db, 'users', currentUser.uid), userData, { merge: true });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('Profile update error:', err);
      // Provide more specific error information
      if (err.code === 'permission-denied') {
        setError('Permission denied: You do not have permission to update profile.');
      } else if (err.code === 'not-found') {
        setError('Profile not found. Please try again or contact support.');
      } else {
        setError(`Failed to update profile: ${err.message || 'Unknown error'}. Please try again.`);
      }
    }

    setLoading(false);
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Update Profile</h2>

        <div className="user-info">
          <div className="avatar">{currentUser?.displayName?.charAt(0)}</div>
          <div>
            <h3>{currentUser?.displayName || 'User'}</h3>
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

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}