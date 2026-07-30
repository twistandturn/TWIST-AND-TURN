import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const params = new URLSearchParams(window.location.search);
const playerId = params.get("id");

if (!playerId) {
    showError("No Player ID Found");
} else {
    loadPlayer(playerId);
}

async function loadPlayer(id) {
    try {

        const playerRef = doc(db, "players", id);
        const snap = await getDoc(playerRef);

        if (!snap.exists()) {
            showError("Player Not Found");
            return;
        }

        const p = snap.data();

        document.getElementById("playerName").textContent =
            p.name || "Unknown Player";

        document.getElementById("playerId").textContent =
            p.playerId || id;

        document.getElementById("playerCity").textContent =
            p.city || "Unknown";

        document.getElementById("playerLevel").textContent =
            p.level || "Rookie";

        document.getElementById("rank").textContent =
            "#" + (p.rank ?? "-");

        document.getElementById("pb").textContent =
            p.pb || "--";

        document.getElementById("rating").textContent =
            p.rating ?? "1200";

        document.getElementById("competitions").textContent =
            p.competitions ?? "0";

        document.getElementById("playerPhoto").src =
            p.photo || "default-avatar.png";

        if (!p.verified) {
            document.getElementById("verifiedBadge").style.display = "none";
        }

    } catch (err) {
        console.error(err);
        showError("Something Went Wrong");
    }
}

function showError(message) {
    document.getElementById("playerName").textContent = message;
}