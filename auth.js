// ==========================================================
// auth.js — shared Firebase Auth + Firestore helpers
// Import this as a module in every page that needs login/signup/user data
// ==========================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  runTransaction,
  arrayUnion,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ---- Sign up a new competitor account ----
export async function signUpUser(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  // Create their Firestore profile — competitorId stays empty until
  // the organizer confirms their first competition participation
  await setDoc(doc(db, "users", cred.user.uid), {
    name: name,
    email: email,
    competitorId: null,
    isAdmin: false,
    results: [],
    createdAt: new Date().toISOString()
  });

  return cred.user;
}

// ---- Log in an existing user ----
export function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// ---- Log out ----
export function logoutUser() {
  return signOut(auth);
}

// ---- Get a user's Firestore profile doc ----
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// ---- Find a user's profile (+ their uid) by email — used by the admin panel ----
export async function findUserByEmail(email) {
  const q = query(collection(db, "users"), where("email", "==", email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { uid: docSnap.id, ...docSnap.data() };
}

// ---- Watch login state (use on every protected page) ----
export function watchAuthState(callback) {
  onAuthStateChanged(auth, callback);
}

// ==========================================================
// Competitor ID generation
// Format: TNT + year + first 4 letters of name (A-Z only) + 2-digit sequence
// e.g. "TNT2026JUNA01"
// Uses a Firestore transaction on a per-year counter doc so two organizers
// assigning IDs at the same moment never collide.
// ==========================================================
function nameToCode(name) {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
  return (letters + "XXXX").slice(0, 4);
}

export async function assignCompetitorId(uid, name, competitionYear) {
  const counterRef = doc(db, "counters", String(competitionYear));
  const userRef = doc(db, "users", uid);

  const newId = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    const current = counterSnap.exists() ? counterSnap.data().count : 0;
    const next = current + 1;

    const code = nameToCode(name);
    const seq = String(next).padStart(2, "0");
    const competitorId = `TNT${competitionYear}${code}${seq}`;

    transaction.set(counterRef, { count: next }, { merge: true });
    transaction.update(userRef, { competitorId: competitorId });

    return competitorId;
  });

  return newId;
}

// ---- Record a result for a user and confirm their participation ----
export async function addResultAndConfirm(uid, name, competitionYear, resultEntry) {
  const profile = await getUserProfile(uid);

  // Only generate a new ID the first time this user is confirmed
  if (!profile.competitorId) {
    await assignCompetitorId(uid, name, competitionYear);
  }

  await updateDoc(doc(db, "users", uid), {
    results: arrayUnion(resultEntry)
  });
}
