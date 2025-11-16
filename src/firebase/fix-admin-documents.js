import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Fix admin documents to ensure they use UID as the primary identifier
 * This script will:
 * 1. Find admin documents that use email as the userId
 * 2. Create new documents with UID as the userId and document ID
 * 3. Remove the old email-based documents
 */

async function fixAdminDocuments() {
  try {
    console.log('Starting admin document fix process...');
    
    const adminsCollection = collection(db, 'admins');
    const snapshot = await getDocs(adminsCollection);
    
    let fixedCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      
      // Check if this document uses email as userId (indicated by @ symbol)
      if (data.userId && data.userId.includes('@') && !docSnapshot.id.includes('@')) {
        console.log(`Found email-based admin document: ${data.userId}`);
        
        // This appears to be an email-based document, we need to check if there's 
        // a corresponding user with this email to get their UID
        
        // For now, we'll just log what needs to be done
        // In a real implementation, you'd need to map emails to UIDs
        console.log(`Would fix document ${docSnapshot.id} with email ${data.userId}`);
      } 
      // Check if document ID doesn't match userId field
      else if (docSnapshot.id !== data.userId) {
        console.log(`Fixing admin document ID mismatch: ${docSnapshot.id} -> ${data.userId}`);
        
        // Remove the old document
        await deleteDoc(doc(db, 'admins', docSnapshot.id));
        
        // Create new document with correct structure
        await setDoc(doc(db, 'admins', data.userId), {
          userId: data.userId,
          email: data.email || 'unknown',
          createdAt: data.createdAt || new Date()
        });
        
        console.log(`Fixed admin document for user ${data.userId}`);
        fixedCount++;
      } else {
        console.log(`Admin document for ${docSnapshot.id} is correctly structured`);
      }
    }
    
    console.log(`Admin document fix process completed. Fixed ${fixedCount} documents.`);
  } catch (error) {
    console.error('Error fixing admin documents:', error);
    throw error;
  }
}

// Run the fix function
// fixAdminDocuments().catch(console.error);

export { fixAdminDocuments };