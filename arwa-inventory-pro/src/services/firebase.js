import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB8rS9cZ39KQkJGPd5GfNdHgaYF63ZmxNg",
  authDomain: "arwa-001.firebaseapp.com",
  projectId: "arwa-001",
  storageBucket: "arwa-001.firebasestorage.app",
  messagingSenderId: "562303812996",
  appId: "1:562303812996:web:ae939517206e33adbcc9d1",
  measurementId: "G-S2YKFPXKEW",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const fbAuth = getAuth(firebaseApp);
