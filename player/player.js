import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig } from "../firebase-config.js"; // Agar path alag hai to mujhe bata dena

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// URL se Player ID read karega
const params = new URLSearchParams(window.location.search);
const playerId = params.get("id");

if (!playerId) {
    document.getElementById("playerName").innerText = "Player Not Found";
    throw new Error("No Player ID");
}

// Firestore se data fetch
const playerRef = doc(db, "players", playerId);

getDoc(playerRef).then((snap) => {

    if (!snap.exists()) {

        document.getElementById("playerName").innerText = "Player Not Found";
        return;

    }

    const p = snap.data();

    document.getElementById("playerName").innerText = p.name;
    document.getElementById("playerId").innerText = p.playerId;
    document.getElementById("playerCity").innerText = p.city;

    document.getElementById("rank").innerText = "#" + p.rank;
    document.getElementById("pb").innerText = p.pb;
    document.getElementById("rating").innerText = p.rating;
    document.getElementById("competitions").innerText = p.competitions;

    document.getElementById("playerLevel").innerText = p.level;

    if (p.photo) {
        document.getElementById("playerPhoto").src = p.photo;
    }

    if (!p.verified) {
        document.getElementById("verifiedBadge").style.display = "none";
    }

}).catch(console.error);