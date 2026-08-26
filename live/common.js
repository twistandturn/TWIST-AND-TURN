// ============================================================
// Shared helpers used across every /live page
// ============================================================

export const EVENTS = {
  "333":  { name: "3x3x3 Cube",          short: "3x3",   kind: "time" },
  "222":  { name: "2x2x2 Cube",          short: "2x2",   kind: "time" },
  "444":  { name: "4x4x4 Cube",          short: "4x4",   kind: "time" },
  "555":  { name: "5x5x5 Cube",          short: "5x5",   kind: "time" },
  "666":  { name: "6x6x6 Cube",          short: "6x6",   kind: "time" },
  "777":  { name: "7x7x7 Cube",          short: "7x7",   kind: "time" },
  "333bf": { name: "3x3x3 Blindfolded",  short: "3BLD",  kind: "time" },
  "333oh": { name: "3x3x3 One-Handed",   short: "OH",    kind: "time" },
  "clock": { name: "Clock",              short: "Clock", kind: "time" },
  "minx":  { name: "Megaminx",           short: "Mega",  kind: "time" },
  "pyram": { name: "Pyraminx",           short: "Pyra",  kind: "time" },
  "skewb": { name: "Skewb",              short: "Skewb", kind: "time" },
  "sq1":   { name: "Square-1",           short: "Sq-1",  kind: "time" },
  "333fm": { name: "3x3x3 Fewest Moves", short: "FMC",   kind: "moves" },
  "444bf": { name: "4x4x4 Blindfolded",  short: "4BLD",  kind: "time" },
  "555bf": { name: "5x5x5 Blindfolded",  short: "5BLD",  kind: "time" },
};

export const FORMATS = {
  "ao5":  { label: "Average of 5", attempts: 5, hasAverage: true,  avgLabel: "Average" },
  "mo3":  { label: "Mean of 3",    attempts: 3, hasAverage: true,  avgLabel: "Mean" },
  "bo3":  { label: "Best of 3",    attempts: 3, hasAverage: false, avgLabel: "" },
  "bo1":  { label: "Best of 1",    attempts: 1, hasAverage: false, avgLabel: "" },
  "fmc-mo3": { label: "Mean of 3 (moves)", attempts: 3, hasAverage: true, avgLabel: "Mean" },
};

// Rough country -> flag emoji map for the countries most likely to show up.
// Falls back to a globe if not found.
const FLAGS = {
  "India": "🇮🇳", "United States": "🇺🇸", "Canada": "🇨🇦", "Israel": "🇮🇱",
  "Jordan": "🇯🇴", "United Kingdom": "🇬🇧", "Australia": "🇦🇺", "Germany": "🇩🇪",
  "France": "🇫🇷", "Japan": "🇯🇵", "China": "🇨🇳", "South Korea": "🇰🇷",
  "Brazil": "🇧🇷", "Mexico": "🇲🇽", "Pakistan": "🇵🇰", "Bangladesh": "🇧🇩",
  "Nepal": "🇳🇵", "Sri Lanka": "🇱🇰", "UAE": "🇦🇪", "Singapore": "🇸🇬",
  "Malaysia": "🇲🇾", "Indonesia": "🇮🇩", "Philippines": "🇵🇭", "Thailand": "🇹🇭",
  "Nigeria": "🇳🇬", "South Africa": "🇿🇦", "Egypt": "🇪🇬", "Spain": "🇪🇸",
  "Italy": "🇮🇹", "Netherlands": "🇳🇱", "Russia": "🇷🇺", "New Zealand": "🇳🇿",
};
export function flagFor(country) {
  return FLAGS[country] || "🏳️";
}

// ---- time <-> string helpers -------------------------------------------
// Internally a solve is stored as a number of centiseconds for "time" events
// (e.g. 12.34s -> 1234), or as a plain integer for "moves" events (FMC).
// DNF -> -1, DNS -> -2 (WCA convention).
export const DNF = -1;
export const DNS = -2;

export function parseAttemptInput(raw, kind) {
  const v = (raw || "").trim();
  if (!v) return null;
  const up = v.toUpperCase();
  if (up === "DNF") return DNF;
  if (up === "DNS") return DNS;
  if (kind === "moves") {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  }
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100); // seconds -> centiseconds
}

export function formatAttempt(val, kind) {
  if (val === null || val === undefined) return "—";
  if (val === DNF) return "DNF";
  if (val === DNS) return "DNS";
  if (kind === "moves") return String(val);
  return (val / 100).toFixed(2);
}

// Compute best + average/mean for a set of attempts given a format.
// attempts: array of numbers/DNF/DNS (length may be less than format.attempts while round is in progress)
export function computeResult(attempts, formatKey, kind) {
  const fmt = FORMATS[formatKey] || FORMATS.bo3;
  const clean = attempts.filter(a => a !== null && a !== undefined);
  if (clean.length === 0) return { best: null, average: null };

  const validVals = clean.filter(a => a !== DNF && a !== DNS);
  const best = validVals.length ? Math.min(...validVals) : (clean.includes(DNF) ? DNF : DNS);

  let average = null;
  if (fmt.hasAverage && clean.length === fmt.attempts) {
    if (fmt.attempts === 5) {
      const dnfCount = clean.filter(a => a === DNF || a === DNS).length;
      if (dnfCount >= 2) {
        average = DNF;
      } else {
        const sorted = [...clean].sort((a, b) => {
          // DNF/DNS sort as worst (highest)
          const av = a < 0 ? Infinity : a, bv = b < 0 ? Infinity : b;
          return av - bv;
        });
        const middle = sorted.slice(1, 4); // drop best & worst
        if (middle.some(a => a === DNF || a === DNS)) {
          average = DNF;
        } else {
          average = Math.round(middle.reduce((s, a) => s + a, 0) / 3);
        }
      }
    } else if (fmt.attempts === 3) {
      if (clean.some(a => a === DNF || a === DNS)) {
        average = DNF;
      } else {
        const sum = clean.reduce((s, a) => s + a, 0);
        average = kind === "moves" ? +(sum / 3).toFixed(2) : Math.round(sum / 3);
      }
    }
  }
  return { best, average };
}

// Sort competitors within a round: valid average first (ascending), then valid best, then DNF/no-result last.
export function rankResults(rows) {
  const rank = (r) => {
    const avgVal = r.average;
    const bestVal = r.best;
    const hasAvg = avgVal !== null && avgVal !== undefined && avgVal > 0;
    const hasBest = bestVal !== null && bestVal !== undefined && bestVal > 0;
    return { hasAvg, hasBest, avgVal, bestVal };
  };
  return [...rows].sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    if (ra.hasAvg || rb.hasAvg) {
      if (ra.hasAvg && !rb.hasAvg) return -1;
      if (!ra.hasAvg && rb.hasAvg) return 1;
      if (ra.hasAvg && rb.hasAvg) return ra.avgVal - rb.avgVal;
    }
    if (ra.hasBest && !rb.hasBest) return -1;
    if (!ra.hasBest && rb.hasBest) return 1;
    if (ra.hasBest && rb.hasBest) return ra.bestVal - rb.bestVal;
    return 0;
  });
}

export function fmtDate(d) {
  if (!d) return "";
  const dt = (d.toDate) ? d.toDate() : new Date(d);
  return dt.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}
export function fmtTime(t) {
  if (!t) return "";
  return t;
}

export function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c === null || c === undefined) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}
