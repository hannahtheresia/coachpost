import { app } from './firebase-config.js'; 
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentAccountType = "premium";
let canGenerateImage = true; // globales Flag

// ---------- Auth State & Free/Basic Logic ----------
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
      canGenerateImage = (currentAccountType === "basic" || currentAccountType === "premium");
      console.log("Can generate image:", canGenerateImage);

      const generateBtn = document.getElementById('generateImageBtn');
      const goalSelect = document.getElementById('goal');

      if (currentAccountType === "free") {
        console.log("Free user: limited goals, no image generation");
        if (generateBtn) generateBtn.disabled = true;

        if (goalSelect) {
          Array.from(goalSelect.options).forEach(opt => {
            if (opt.value !== "Personal Brand" && opt.value !== "Fitness") {
              opt.disabled = true;
            }
          });
        }
      } else {
        console.log(currentAccountType + " user: full access, image generation enabled");
        if (generateBtn) generateBtn.disabled = false;
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

const generateBtn = document.getElementById('generateImageBtn');
const generatedImg = document.getElementById('generatedImage');

async function getIdToken() {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken(true);
  } else {
    throw new Error('User ist nicht eingeloggt');
  }
}

// ---------- Image Generator Button ----------
if (generateBtn) {
  generateBtn.addEventListener('click', async () => {
    if (!currentUser) return alert('Please log in to generate images');
    if (!canGenerateImage) return alert('Upgrade to Basic/Premium to generate images');

    const topic = document.getElementById('topic').value.trim();
    if (!topic) return alert('Please enter a topic for the image');

    try {
      generateBtn.disabled = true;
      generateBtn.textContent = "Generating...";

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: topic })
      });

      const data = await res.json();
      if (data.imageUrl) {
        generatedImg.src = data.imageUrl;
        generatedImg.style.display = 'block';
      } else {
        alert('Image generation failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error generating image');
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = "Generate Image";
    }
  });
}

// ---------- Post Form Submission ----------
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

      // ---------- Auto-Generate Image ----------
      if (canGenerateImage && topic) {
        try {
          const resImg = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: topic })
          });
          const dataImg = await resImg.json();
          if (dataImg.imageUrl) {
            generatedImg.src = dataImg.imageUrl;
            generatedImg.style.display = 'block';
          }
        } catch(err) {
          console.error("Image generation failed:", err);
        }
      }

    } catch (err) {
      errorMsg.textContent = err.message;
      errorSection.hidden = false;
    }
  });
}

