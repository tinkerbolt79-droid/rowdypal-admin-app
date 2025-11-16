import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  listAdminUsers,
  addAdminUser,
  removeAdminUser,
  fixAdminDocuments,
} from '../firebase/admin-setup';
import { setupAdminUser, isAdminUser } from '../firebase/setup-admin';

export default function AdminSetup() {
  const { currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadAdmins();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    if (currentUser) {
      const adminStatus = await isAdminUser(currentUser.uid, currentUser.email);
      setIsAdmin(adminStatus);
    }
  };

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const adminList = await listAdminUsers();
      setAdmins(adminList);
    } catch (error) {
      console.error('Error loading admins:', error);
      setMessage('Error loading admin users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async e => {
    e.preventDefault();
    if (!newAdminEmail) {
      setMessage('Please provide email');
      return;
    }

    try {
      setLoading(true);
      await setupAdminUser(newAdminUid || null, newAdminEmail);
      setMessage('Admin user added successfully');
      setNewAdminUid('');
      setNewAdminEmail('');
      await loadAdmins();
      await checkAdminStatus();
    } catch (error) {
      console.error('Error adding admin:', error);
      setMessage('Error adding admin user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async uid => {
    try {
      setLoading(true);
      await removeAdminUser(uid);
      setMessage('Admin user removed successfully');
      await loadAdmins();
      await checkAdminStatus();
    } catch (error) {
      console.error('Error removing admin:', error);
      setMessage('Error removing admin user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFixAdmins = async () => {
    try {
      setLoading(true);
      await fixAdminDocuments();
      setMessage('Admin documents fixed successfully');
      await loadAdmins();
    } catch (error) {
      console.error('Error fixing admins:', error);
      setMessage('Error fixing admin documents: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupCurrentUser = async () => {
    if (!currentUser) {
      setMessage('No user is currently logged in');
      return;
    }

    try {
      setLoading(true);
      await setupAdminUser(currentUser.uid, currentUser.email);
      setMessage('Current user set up as admin successfully');
      await loadAdmins();
      await checkAdminStatus();
    } catch (error) {
      console.error('Error setting up current user as admin:', error);
      setMessage('Error setting up current user as admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div>Please log in to access admin setup</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Admin User Management</h2>

      <div
        style={{
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
        }}
      >
        <strong>Current User:</strong> {currentUser.email} (
        {currentUser.uid || 'No UID'})<br />
        <strong>Admin Status:</strong>{' '}
        {isAdmin ? 'Authorized' : 'Not Authorized'}
        {!isAdmin && (
          <div>
            <button
              onClick={handleSetupCurrentUser}
              disabled={loading}
              style={{ marginTop: '10px' }}
            >
              {loading ? 'Setting up...' : 'Set Up Current User as Admin'}
            </button>
          </div>
        )}
      </div>

      {message && (
        <div
          style={{
            padding: '10px',
            margin: '10px 0',
            backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e9',
            borderRadius: '4px',
          }}
        >
          {message}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Current Admin Users</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {admins.map(admin => (
              <li key={admin.id} style={{ marginBottom: '10px' }}>
                <strong>{admin.email}</strong> ({admin.userId})
                {admin.userId !== (currentUser.uid || currentUser.email) && (
                  <button
                    onClick={() => handleRemoveAdmin(admin.id)}
                    style={{ marginLeft: '10px' }}
                    disabled={loading}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        style={{
          marginBottom: '20px',
          padding: '15px',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
      >
        <h3>Add New Admin User</h3>
        <form onSubmit={handleAddAdmin}>
          <div style={{ marginBottom: '10px' }}>
            <label>
              User UID (optional):
              <input
                type="text"
                value={newAdminUid}
                onChange={e => setNewAdminUid(e.target.value)}
                style={{ display: 'block', width: '100%', padding: '5px' }}
                placeholder="Firebase User UID (optional)"
              />
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              User Email (required):
              <input
                type="email"
                value={newAdminEmail}
                onChange={e => setNewAdminEmail(e.target.value)}
                style={{ display: 'block', width: '100%', padding: '5px' }}
                placeholder="User Email"
                required
              />
            </label>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Admin'}
          </button>
        </form>
      </div>

      <div>
        <h3>Fix Admin Documents</h3>
        <p>Use this to ensure all admin documents are properly structured.</p>
        <button onClick={handleFixAdmins} disabled={loading}>
          {loading ? 'Fixing...' : 'Fix Admin Documents'}
        </button>
      </div>
    </div>
  );
}
