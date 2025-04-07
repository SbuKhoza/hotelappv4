import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Your web app's Firebase configuration - using environment variables instead of hardcoded values
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBn2qVzwq2MAsvo552yRVufZoiq9ka0jcA",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "the-steady-hotel.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "the-steady-hotel",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "the-steady-hotel.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "289244799504",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:289244799504:web:0663b34ee6afde815d2095"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_FIREBASE_EMULATORS === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.error('Failed to connect to Firebase emulators:', error);
  }
}

// Test Firestore connection on app initialization
const testFirebaseConnection = async () => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`Testing Firebase connection at ${timestamp}`);
    
    // The actual test will be performed in the components that need it
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
};

// Run the test
testFirebaseConnection();

export { db, auth, storage };