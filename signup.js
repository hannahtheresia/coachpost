import { app } from './firebase-config.js';
import { getAuth, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const auth = getAuth(app);
const db = getFirestore(app);
const form = document.getElementById('signupForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    // User in Firebase Auth erstellen
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // User-Type in Firestore speichern
    await setDoc(doc(db, "users", user.uid), {
      accountType: "free",
      createdAt: new Date(),
      postsThisMonth: 0 // Zähler für Free-Limit
    });

    alert('Registration successful! You are now logged in.');
    window.location.href = 'index.html';
  } catch (error) {
    alert('Error during signup: ' + error.message);
  }
});

