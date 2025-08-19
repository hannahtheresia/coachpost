import { app } from './firebase-config.js'; 
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentAccountType = "free";

// ---------- Auth State ----------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'landing.html';
    return;
  }

  currentUser = user;
  try {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      currentAccountType = docSnap.data().accountType;
      console.log("Account type:", currentAccountType);

      const goalSelect = document.getElementById('goal');

      if (currentAccountType === "free") {
        console.log("Free user: limited goals");
        if (goalSelect) {
          Array.from(goalSelect.options).forEach(opt => {
            if (opt.value !== "Personal Brand" && opt.value !== "Fitness") {
              opt.disabled = true;
            }
          });
        }
      } else {
        console.log(currentAccountType + " user: full access");
      }
    }
  } catch (err) {
    console.error("Error fetching user data:", err);
  }
});

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

// ---------- Form Submission ----------
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

// ---------- Logout ----------
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      window.location.href = 'landing.html';
    } catch (err) {
      console.error("Logout error:", err);
    }
  });
}
