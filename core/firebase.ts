
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDjCCdFym5RGOEz1a2kVSCZJFWIsoazvRE",
  authDomain: "fs-pdf-maker.firebaseapp.com",
  projectId: "fs-pdf-maker",
  storageBucket: "fs-pdf-maker.firebasestorage.app",
  messagingSenderId: "855979649385",
  appId: "1:855979649385:web:7e318f357c8297e86f75f8"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with persistent local cache (Offline Support)
export const dbFirestore = initializeFirestore(app, {
  localCache: persistentLocalCache() 
});
