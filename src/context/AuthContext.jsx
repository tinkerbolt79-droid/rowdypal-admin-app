import React, { createContext, useContext, useEffect, useState } from 'react';
import { signOut, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { limit, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db, functions } from '../firebase/firebase';
import { httpsCallable } from 'firebase/functions';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const verifyAndSetAdminClaim = async (userCredential, email) => {
  try {
    // Check if the user exists in the admins collection
    const adminsRef = collection(db, "admins");
    const q = query(adminsRef, where("userId", "==", email), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const adminDoc = querySnapshot.docs[0].data();
      const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
      await setAdminClaim({ uid: userCredential.user.uid });

      // Refresh token to get updated claims
      await userCredential.user.getIdToken(true);

      return userCredential;
    } else {
      await signOut(auth);
      throw new Error('Unauthorized: User is not an admin');
    }
  } catch (err) {
    console.error('Admin verification error:', err);
    throw err;
  }
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login: (email, password) => signInWithEmailAndPassword(auth, email, password).catch(err => {
      console.error('Login error:', err);
      throw err;
    }),
    adminSignInWithEmailAndPassword: async (email, password) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Verify admin status and set claim
        const result = await verifyAndSetAdminClaim(userCredential, email);
        setCurrentUser(result.user);
        return result;
      } catch (err) {
        console.error('Admin sign-in error:', err);
        throw err;
      }
    },
    logout: () => signOut(auth).catch(err => {
      console.error('Logout error:', err);
      throw err;
    }),
    googleSignIn: () => {
      const provider = new GoogleAuthProvider();
      return signInWithPopup(auth, provider).catch(err => {
        console.error('Google sign-in error:', err);
        throw err;
      });
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}