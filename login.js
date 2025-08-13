import { app } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

const auth = getAuth(app);
const form = document.getElementById('loginForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // Login erfolgreich, weiterleiten zur Hauptseite
    window.location.href = 'index.html';
  } catch (error) {
    alert('Login fehlgeschlagen: ' + error.message);
  }
});

// Falls Nutzer schon eingeloggt ist, direkt weiterleiten
onAuthStateChanged(auth, user => {
  if (user) {
    window.location.href = 'index.html';
  }
});
