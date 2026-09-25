// ==========================================================
// auth.js — shared Firebase Auth + Firestore + Storage helpers
// Import this as a module in every page that needs login/signup/user data
// ==========================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  PhoneAuthProvider,
  RecaptchaVerifier,
  linkWithCredential
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
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { firebaseConfig } from "../firebase-config.js";
import { emailjsConfig } from "./emailjs-config.js";
import emailjs from "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

emailjs.init({ publicKey: emailjsConfig.publicKey });

// ==========================================================
// Sign up a new competitor account
// Collects full profile details up front. Account starts in
// "pending_otp" status — not usable until email OTP is verified,
// then "pending_approval" until an admin approves it.
// ==========================================================
export async function signUpUser({ name, email, password, dob, age, phone, wcaId }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  await setDoc(doc(db, "users", cred.user.uid), {
    name: name,
    email: email,
    dob: dob || null,
    age: age || null,
    phone: phone || null,
    emailVerified: false,
    phoneVerified: false,
    wcaId: wcaId || null,
    photoURL: null,
    status: "pending_otp",
    otpCode: null,
    otpExpiresAt: null,
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
// Email OTP verification (signup step 2)
// ==========================================================
function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

// Generates a fresh OTP, stores it on the user doc (10 min expiry),
// and emails it via EmailJS. Safe to call again for "resend code".
export async function sendSignupOtp(uid, name, email) {
  const code = generateOtpCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  await updateDoc(doc(db, "users", uid), {
    otpCode: code,
    otpExpiresAt: expiresAt
  });

  await emailjs.send(emailjsConfig.serviceId, emailjsConfig.otpTemplateId, {
    to_name: name,
    to_email: email,
    otp_code: code
  });
}

// Checks the entered code against what's stored. On success, moves
// the account from "pending_otp" to "pending_approval".
export async function verifySignupOtp(uid, enteredCode) {
  const profile = await getUserProfile(uid);
  if (!profile) return { success: false, reason: "not_found" };
  if (profile.status !== "pending_otp") return { success: false, reason: "already_verified" };
  if (!profile.otpCode || !profile.otpExpiresAt) return { success: false, reason: "no_otp_sent" };
  if (Date.now() > profile.otpExpiresAt) return { success: false, reason: "expired" };
  if (String(enteredCode).trim() !== String(profile.otpCode)) return { success: false, reason: "incorrect" };

  const nextStatus = profile.phoneVerified ? "pending_approval" : "pending_phone";
  await updateDoc(doc(db, "users", uid), {
    status: nextStatus,
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
    otpCode: null,
    otpExpiresAt: null
  });

  return { success: true, nextStatus };
}

// ==========================================================
// Phone OTP verification (signup step 3)
// ==========================================================
let phoneConfirmation = null;
let phoneRecaptcha = null;

export function createPhoneRecaptcha(containerId) {
  if (!phoneRecaptcha) {
    phoneRecaptcha = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  }
  return phoneRecaptcha;
}

export async function sendPhoneOtp(phoneNumber, containerId) {
  const provider = new PhoneAuthProvider(auth);
  const verifier = createPhoneRecaptcha(containerId);
  phoneConfirmation = await provider.verifyPhoneNumber(phoneNumber, verifier);
}

export async function verifyPhoneOtp(uid, enteredCode) {
  if (!phoneConfirmation) return { success: false, reason: "no_otp_sent" };
  const credential = PhoneAuthProvider.credential(phoneConfirmation, String(enteredCode).trim());
  await linkWithCredential(auth.currentUser, credential);

  const profile = await getUserProfile(uid);
  if (!profile) return { success: false, reason: "not_found" };

  const nextStatus = profile.emailVerified ? "pending_approval" : "pending_otp";
  await updateDoc(doc(db, "users", uid), {
    phoneVerified: true,
    phoneVerifiedAt: new Date().toISOString(),
    status: nextStatus
  });
  phoneConfirmation = null;
  return { success: true, nextStatus };
}

// ==========================================================
// Admin approval of new signups
// ==========================================================
export async function getPendingApprovalUsers() {
  const q = query(collection(db, "users"), where("status", "==", "pending_approval"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

// Admin-only (enforced by firestore.rules). Marks the account approved
// and emails the user to let them know they can log in now.
export async function approveUser(uid) {
  const profile = await getUserProfile(uid);
  if (!profile) throw new Error("User not found");

  await updateDoc(doc(db, "users", uid), { status: "approved" });

  await emailjs.send(emailjsConfig.serviceId, emailjsConfig.approvalTemplateId, {
    to_name: profile.name,
    to_email: profile.email,
    login_url: emailjsConfig.loginUrl
  });
}

// ==========================================================
// Competitor ID generation
// Format: TT + first 4 letters of name (A-Z only) + 2-digit GLOBAL
// sequence number (increments across every competitor ever assigned
// an ID, not per name or per year). e.g. "TTEKHL01", next "TTABCD02".
// Uses a Firestore transaction on a single global counter doc so two
// organizers assigning IDs at the same moment never collide.
// ==========================================================
function nameToCode(name) {
  const letters = (name || "").toUpperCase().replace(/[^A-Z]/g, "");
  return (letters + "XXXX").slice(0, 4);
}

export async function assignCompetitorId(uid, name) {
  const counterRef = doc(db, "counters", "global");
  const userRef = doc(db, "users", uid);

  const newId = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    const current = counterSnap.exists() ? counterSnap.data().count : 0;
    const next = current + 1;

    const code = nameToCode(name);
    const seq = String(next).padStart(2, "0");
    const competitorId = `TT${code}${seq}`;

    transaction.set(counterRef, { count: next }, { merge: true });
    transaction.update(userRef, { competitorId: competitorId });

    return competitorId;
  });

  return newId;
}

// ---- Record a result for a user and confirm their participation ----
export async function addResultAndConfirm(uid, name, resultEntry) {
  const profile = await getUserProfile(uid);

  // Only generate a new ID the first time this user is confirmed
  if (!profile.competitorId) {
    await assignCompetitorId(uid, name);
  }

  await updateDoc(doc(db, "users", uid), {
    results: arrayUnion(resultEntry)
  });
}

// ==========================================================
// Profile picture (Firebase Storage)
// If a user never uploads one, dashboard.html falls back to a
// colored initials avatar — same pattern apps like Gmail/Slack use.
// ==========================================================
export async function uploadProfilePicture(uid, file) {
  const picRef = ref(storage, `profilePics/${uid}`);
  await uploadBytes(picRef, file);
  const url = await getDownloadURL(picRef);
  await updateDoc(doc(db, "users", uid), { photoURL: url });
  return url;
}

export async function removeProfilePicture(uid) {
  const picRef = ref(storage, `profilePics/${uid}`);
  try {
    await deleteObject(picRef);
  } catch (err) {
    // ignore if it was already missing
  }
  await updateDoc(doc(db, "users", uid), { photoURL: null });
}

// ==========================================================
// Competitor profile stats (used by dashboard.html)
// Turns the raw `results[]` array on a user doc into a
// WCA-profile-style summary: medals, personal bests per event,
// total competitions. Handles older entries that don't yet have
// `medal` or `time` fields (kept null/skipped).
// ==========================================================
export function computeCompetitorStats(results) {
  results = results || [];
  const events = {}; // eventName -> { medals:{gold,silver,bronze}, best:number|null, bestDisplay:string|null, history:[] }
  let totalGold = 0, totalSilver = 0, totalBronze = 0;
  const competitionsSeen = new Set();

  results.forEach((r) => {
    const eventName = r.event || "Unknown Event";
    if (!events[eventName]) {
      events[eventName] = {
        medals: { gold: 0, silver: 0, bronze: 0 },
        best: null,
        bestDisplay: null,
        history: []
      };
    }
    const ev = events[eventName];

    if (r.medal === "gold") { ev.medals.gold++; totalGold++; }
    else if (r.medal === "silver") { ev.medals.silver++; totalSilver++; }
    else if (r.medal === "bronze") { ev.medals.bronze++; totalBronze++; }

    if (r.time) {
      const numeric = parseFloat(r.time);
      if (!isNaN(numeric) && (ev.best === null || numeric < ev.best)) {
        ev.best = numeric;
        ev.bestDisplay = r.time;
      }
    }

    ev.history.push(r);
    if (r.competition) competitionsSeen.add(`${r.competition}__${r.year || ""}`);
  });

  return {
    events,
    totalGold,
    totalSilver,
    totalBronze,
    totalMedals: totalGold + totalSilver + totalBronze,
    totalEvents: Object.keys(events).length,
    totalCompetitions: competitionsSeen.size
  };
}
