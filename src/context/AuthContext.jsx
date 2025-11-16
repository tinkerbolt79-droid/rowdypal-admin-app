import React, { createContext, useContext, useEffect, useState } from 'react';
import { signOut, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { isAdminUser } from '../firebase/setup-admin';
import { auth } from '../firebase/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export async function checkAdminStatus(user) {
  if (!user) return false;
  
  try {
    console.log('Checking admin status for user:', user.uid, user.email);
    const isAdmin = await isAdminUser(user.uid, user.email);
    console.log('Admin status:', isAdmin);
    return isAdmin;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Check if user is admin
        const adminStatus = await checkAdminStatus(user);
        setIsAdmin(adminStatus);
        console.log('User admin status:', adminStatus);
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAdmin,
    login: (email, password) => signInWithEmailAndPassword(auth, email, password).catch(err => {
      console.error('Login error:', err);
      throw err;
    }),
    adminSignInWithEmailAndPassword: async (email, password) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in:', userCredential.user.uid, userCredential.user.email);
        
        // Verify admin status
        const adminStatus = await checkAdminStatus(userCredential.user);
        console.log('Admin status check result:', adminStatus);
        
        if (!adminStatus) {
          await signOut(auth);
          throw new Error('Unauthorized: User is not an admin');
        }
        
        setCurrentUser(userCredential.user);
        setIsAdmin(true);
        return userCredential;
      } catch (err) {
        console.error('Admin sign-in error:', err);
        throw err;
      }
    },
    logout: async () => {
      try {
        await signOut(auth);
        setCurrentUser(null);
        setIsAdmin(false);
      } catch (err) {
        console.error('Logout error:', err);
        throw err;
      }
    },
    googleSignIn: async () => {
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        console.log('User logged in with Google:', userCredential.user.uid, userCredential.user.email);
        
        // Verify admin status for Google sign-in
        const adminStatus = await checkAdminStatus(userCredential.user);
        console.log('Admin status check result:', adminStatus);
        
        if (!adminStatus) {
          await signOut(auth);
          throw new Error('Unauthorized: User is not an admin');
        }
        
        setCurrentUser(userCredential.user);
        setIsAdmin(true);
        return userCredential;
      } catch (err) {
        console.error('Google sign-in error:', err);
        throw err;
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}