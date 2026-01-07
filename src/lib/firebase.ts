import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA8c7p4RHZ3Ee5Gns8W995Hzir2q1oEGrU",
  authDomain: "red-netflix-dd585.firebaseapp.com",
  databaseURL: "https://red-netflix-dd585-default-rtdb.firebaseio.com",
  projectId: "red-netflix-dd585",
  storageBucket: "red-netflix-dd585.appspot.com",
  messagingSenderId: "125531254412",
  appId: "1:125531254412:web:d70b0ed1f2f8d5aa33d5a9",
  measurementId: "G-ZYVTZ7NC9S"
};

let app: FirebaseApp;
let auth: Auth;
let db: Database;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
db = getDatabase(app);

export { app, auth, db };
