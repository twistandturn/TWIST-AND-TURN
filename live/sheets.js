// ============================================================
// Reads data straight out of a Google Sheet (published tabs) —
// no backend, no database, no login system needed.
// ============================================================
import Papa from "https://esm.sh/papaparse@5.4.1";
import { SHEET_ID } from "./config.js";

const cache = {};

export async function loadSheet(tabName) {
  if (cache[tabName]) return cache[tabName];
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Could not load the "${tabName}" tab. Check that: (1) the Sheet ID in assets/config.js is correct, ` +
      `(2) the tab is named exactly "${tabName}", and (3) the sheet is shared as "Anyone with the link → Viewer".`
    );
  }
  const text = await res.text();
  const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
  const rows = parsed.data.map(row => {
    const clean = {};
    for (const k in row) clean[k.trim()] = (row[k] ?? "").toString().trim();
    return clean;
  });
  cache[tabName] = rows;
  return rows;
}

// Call this before re-fetching if you want fresh data instead of the cached copy.
export function clearCache(tabName) {
  if (tabName) delete cache[tabName];
  else for (const k in cache) delete cache[k];
}

// Small helper: keep a page's data fresh by silently re-polling every N seconds.
export function pollEvery(seconds, fn) {
  fn();
  return setInterval(() => { clearCache(); fn(); }, seconds * 1000);
}
