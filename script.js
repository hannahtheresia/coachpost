import { app } from './firebase-config.js';
import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

const auth = getAuth(app);

async function getIdToken() {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken(true);
  } else {
    throw new Error('User ist nicht eingeloggt');
  }
}


const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = 'login.html';
  } catch (error) {
    alert('Fehler beim Logout: ' + error.message);
  }
});



const form = document.getElementById('postForm');
const outputSection = document.getElementById('outputSection');
const outputPre = document.getElementById('output');
const errorSection = document.getElementById('errorSection');
const errorMsg = document.getElementById('error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  outputSection.hidden = true;
  errorSection.hidden = true;
  outputPre.textContent = '';
  errorMsg.textContent = '';

  const platform = document.getElementById('platform').value;
  const topic = document.getElementById('topic').value.trim();
  const goal = document.getElementById('goal').value.trim();

  // Nur Platform und Goal sind Pflicht
  if (!platform || !goal) {
    errorMsg.textContent = 'Please select a platform and goal.';
    errorSection.hidden = false;
    return;
  }

  try {
  const token = await getIdToken(); // Hole den Firebase User Token

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,  // Token im Authorization-Header mitschicken
    },
    body: JSON.stringify({ platform, topic: topic || null, goal }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'API error');
  }

  const data = await res.json();
  outputPre.textContent = data.output;
  outputSection.hidden = false;
} catch (err) {
  errorMsg.textContent = err.message;
  errorSection.hidden = false;
}

});

