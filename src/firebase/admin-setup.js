import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Utility functions to help set up and verify admin users in Firestore
 */

/**
 * List all documents in the admins collection
 */
export async function listAdminUsers() {
  try {
    const adminsCollection = collection(db, 'admins');
    const snapshot = await getDocs(adminsCollection);

    console.log('Admin users in Firestore:');
    const admins = [];
    snapshot.forEach(doc => {
      console.log(`- Document ID: ${doc.id}`, doc.data());
      admins.push({ id: doc.id, ...doc.data() });
    });

    return admins;
  } catch (error) {
    console.error('Error listing admin users:', error);
    throw error;
  }
}

/**
 * Check if a specific user is an admin
 */
export async function checkIfAdmin(uid, email) {
  try {
    console.log(`Checking if user is admin - UID: ${uid}, Email: ${email}`);

    // Check by UID
    const uidDoc = await getDoc(doc(db, 'admins', uid));
    if (uidDoc.exists()) {
      console.log(`Found admin document with UID ${uid}`);
      return true;
    }

    // Check by email
    const emailDoc = await getDoc(doc(db, 'admins', email));
    if (emailDoc.exists()) {
      console.log(`Found admin document with email ${email}`);
      return true;
    }

    console.log(`No admin document found for user ${uid} (${email})`);
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Add a user as an admin
 * @param {string} uid - Firebase user UID
 * @param {string} email - User's email address
 */
export async function addAdminUser(uid, email) {
  try {
    // Add admin document with UID as document ID
    await setDoc(doc(db, 'admins', uid), {
      userId: uid,
      email: email,
      createdAt: new Date(),
    });

    console.log(
      `Successfully added ${email} (${uid}) as admin with document ID: ${uid}`
    );
  } catch (error) {
    console.error('Error adding admin user:', error);
    throw error;
  }
}

/**
 * Remove a user from admins
 * @param {string} uid - Firebase user UID
 */
export async function removeAdminUser(uid) {
  try {
    await deleteDoc(doc(db, 'admins', uid));
    console.log(`Successfully removed admin with UID: ${uid}`);
  } catch (error) {
    console.error('Error removing admin user:', error);
    throw error;
  }
}

/**
 * Fix admin documents to ensure they use UID as document ID
 */
export async function fixAdminDocuments() {
  try {
    const adminsCollection = collection(db, 'admins');
    const snapshot = await getDocs(adminsCollection);

    console.log('Checking admin documents for proper structure...');

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();

      // If document ID doesn't match userId field, we need to fix it
      if (docSnapshot.id !== data.userId) {
        console.log(
          `Fixing admin document: ${docSnapshot.id} -> ${data.userId}`
        );

        // Remove the old document
        await deleteDoc(doc(db, 'admins', docSnapshot.id));

        // Create new document with correct structure
        await setDoc(doc(db, 'admins', data.userId), {
          userId: data.userId,
          email: data.email || 'unknown',
          createdAt: data.createdAt || new Date(),
        });

        console.log(`Fixed admin document for user ${data.userId}`);
      } else {
        console.log(
          `Admin document for ${docSnapshot.id} is correctly structured`
        );
      }
    }

    console.log('Admin document fix process completed');
  } catch (error) {
    console.error('Error fixing admin documents:', error);
    throw error;
  }
}

// Example usage:
// listAdminUsers().then(admins => console.log('Found admins:', admins));
// addAdminUser('user-uid-here', 'admin@example.com');
// removeAdminUser('user-uid-here');
// fixAdminDocuments();
