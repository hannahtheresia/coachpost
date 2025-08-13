// firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';

const firebaseConfig = {
  apiKey: "AIzaSyDfHbRRAw-SloGjzhSr9_I4O-rJ8z8KpZc",
  authDomain: "login-58a5e.firebaseapp.com",
  projectId: "login-58a5e",
  storageBucket: "login-58a5e.firebasestorage.app",
  messagingSenderId: "807155101182",
  appId: "1:807155101182:web:1317e93780f28dcce2a4af"
};

const app = initializeApp(firebaseConfig);
export { app };
