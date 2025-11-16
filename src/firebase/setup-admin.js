import { doc, setDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Utility function to set up an admin user document with proper structure
 * This should be called when adding a new admin user
 * 
 * @param {string} uid - Firebase user UID (can be null for email-only auth)
 * @param {string} email - User's email address
 */
export async function setupAdminUser(uid, email) {
  try {
    // For randomly generated document IDs, we'll add a new document
    const docRef = await addDoc(collection(db, 'admins'), {
      userId: uid || email,
      email: email,
      createdAt: new Date()
    });
    
    console.log(`Successfully set up admin user: ${email} with document ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error setting up admin user:', error);
    throw error;
  }
}

/**
 * Check if user is admin by checking if there's any document in admins collection
 * with userId matching the provided uid or email
 * 
 * @param {string} uid - Firebase user UID
 * @param {string} email - User's email address
 */
export async function isAdminUser(uid, email) {
  try {
    const adminsRef = collection(db, 'admins');
    // Query for documents where userId matches either uid or email
    const q = query(adminsRef, where('userId', 'in', [uid, email]));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Example usage:
// setupAdminUser('eXmyQi2t90Mh4xKeMB6dZxx8ECD2', 'tinkerbolt79@gmail.com');
// setupAdminUser(null, 'tinkerbolt79@gmail.com'); // For email-only auth