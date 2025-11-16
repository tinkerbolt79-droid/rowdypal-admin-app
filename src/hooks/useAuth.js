import { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase';

/**
 * Hook to check if user is authenticated
 * This is for pages that should be accessible to all logged-in users
 */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { currentUser, loading };
}
