import { app } from './firebase-config.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const auth = getAuth(app);
const db = getFirestore(app);

// ---------- Auth State & Free/Basic Logic ----------
let currentUser = null;
let currentAccountType = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        currentAccountType = docSnap.data().accountType;

        if (currentAccountType === "free") {
          console.log("Free user: Max 20 posts/month, only 1–2 goals available, no image generation");
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
        } else if (currentAccountType === "basic") {
          console.log("Basic user: Unlimited posts, access to all goals, image generation enabled");
        }
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  } else {
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
  if (currentUser) {
    return await currentUser.getIdToken(true);
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
      // Free-Limit prüfen
      if (currentAccountType === "free") {
        const userRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(userRef);
        const postsThisMonth = docSnap.data().postsThisMonth || 0;

        if (postsThisMonth >= 20) {
          errorMsg.textContent = 'Free users can only create 20 posts per month.';
          errorSection.hidden = false;
          return;
        }
      }

      // API-Call
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

      // Free-Post-Zähler erhöhen
      if (currentAccountType === "free") {
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, { postsThisMonth: (docSnap.data().postsThisMonth || 0) + 1 }, { merge: true });
      }

    } catch (err) {
      errorMsg.textContent = err.message;
      errorSection.hidden = false;
    }
  });
}
