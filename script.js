import { app } from './firebase-config.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const auth = getAuth(app);
const db = getFirestore(app);

// ---------- Auth State & Free/Basic Logic ----------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const accountType = docSnap.data().accountType;

        if (accountType === "free") {
          console.log("Free user: Restricted goals, image generation disabled");

          const generateBtn = document.getElementById('generateImageBtn');
          if (generateBtn) generateBtn.disabled = true;

          const goalSelect = document.getElementById('goal');
          if (goalSelect) {
            Array.from(goalSelect.options).forEach(opt => {
              if (opt.value !== "Personal Brand" && opt.value !== "Fitness") {
                opt.disabled = true;
              }
            });
          }
        } else if (accountType === "basic") {
          console.log("Basic user: Full access to all goals and image generation");

          const generateBtn = document.getElementById('generateImageBtn');
          if (generateBtn) generateBtn.disabled = false;

          const goalSelect = document.getElementById('goal');
          if (goalSelect) {
            Array.from(goalSelect.options).forEach(opt => opt.disabled = false);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  } else {
    // Nicht eingeloggt → Landing Page
    window.location.href = 'landing.html';
  }
});

// ---------- Logout ----------
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      window.location.href = 'login.html';
    } catch (error) {
      alert('Fehler beim Logout: ' + error.message);
    }
  });
}

// ---------- Post Form ----------
const form = document.getElementById('postForm');
const outputSection = document.getElementById('outputSection');
const outputPre = document.getElementById('output');
const errorSection = document.getElementById('errorSection');
const errorMsg = document.getElementById('error');

async function getIdToken() {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken(true);
  } else {
    throw new Error('User ist nicht eingeloggt');
  }
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    outputSection.hidden = true;
    errorSection.hidden = true;
    outputPre.textContent = '';
    errorMsg.textContent = '';

    const platform = document.getElementById('platform').value;
    const topic = document.getElementById('topic').value.trim();
    const goal = document.getElementById('goal').value.trim();

    if (!platform || !goal) {
      errorMsg.textContent = 'Please select a platform and goal.';
      errorSection.hidden = false;
      return;
    }

    try {
      const token = await getIdToken();
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
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
}
