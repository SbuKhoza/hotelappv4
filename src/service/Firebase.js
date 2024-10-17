import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBn2qVzwq2MAsvo552yRVufZoiq9ka0jcA",
  authDomain: "the-steady-hotel.firebaseapp.com",
  projectId: "the-steady-hotel",
  storageBucket: "the-steady-hotel.appspot.com",
  messagingSenderId: "289244799504",
  appId: "1:289244799504:web:0663b34ee6afde815d2095",
  measurementId: "G-DSBYCXC322"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };