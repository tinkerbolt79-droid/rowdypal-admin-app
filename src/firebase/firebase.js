import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions'; // Add this import

const firebaseConfig = {
  apiKey: 'AIzaSyC6jr90-eY7kOLriEkYeoxEc2PzbjQ9xbQ',
  authDomain: 'rowdypal-8db00.firebaseapp.com',
  projectId: 'rowdypal-8db00',
  storageBucket: 'rowdypal-8db00.firebasestorage.app',
  messagingSenderId: '649719210764',
  appId: '1:649719210764:web:22a76238f457b42f329f29',
  measurementId: 'G-9GRH15FJJ6',
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export { analytics };
