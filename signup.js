import { app } from './firebase-config.js';
import { getAuth, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

const auth = getAuth(app);
const form = document.getElementById('signupForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  alert('Registrierung erfolgreich! Du bist jetzt eingeloggt und wirst weitergeleitet.');
  window.location.href = 'index.html';
} catch (error) {
  alert('Fehler bei der Registrierung: ' + error.message);
}

});
