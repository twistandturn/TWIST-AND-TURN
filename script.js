// ==========================
// PWA: Service Worker + Install Prompt
// ==========================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;

  const btn = document.createElement("button");
  btn.id = "pwa-install-btn";
  btn.textContent = "📲 Install App";
  btn.style.position = "fixed";
  btn.style.bottom = "24px";
  btn.style.left = "50%";
  btn.style.transform = "translateX(-50%)";
  btn.style.zIndex = "9999";
  btn.style.background = "#E8412B";
  btn.style.color = "#fff";
  btn.style.fontFamily = "'Space Grotesk', sans-serif";
  btn.style.fontWeight = "600";
  btn.style.padding = "10px 20px";
  btn.style.borderRadius = "999px";
  btn.style.border = "none";
  btn.style.boxShadow = "0 8px 24px rgba(0,0,0,0.35)";
  btn.style.cursor = "pointer";

  btn.addEventListener("click", async () => {
    btn.remove();
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
  });

  document.body.appendChild(btn);
});

window.addEventListener("appinstalled", () => {
  const btn = document.getElementById("pwa-install-btn");
  if (btn) btn.remove();
});

// ==========================
// Theme Toggle (Dark / Light)
// ==========================

const themeToggleBtn = document.getElementById("theme-toggle-btn");
if (themeToggleBtn) {
  function syncThemeIcon() {
    themeToggleBtn.textContent = document.documentElement.classList.contains("light-theme") ? "☀️" : "🌙";
  }
  syncThemeIcon();
  themeToggleBtn.addEventListener("click", () => {
    document.documentElement.classList.toggle("light-theme");
    const isLight = document.documentElement.classList.contains("light-theme");
    localStorage.setItem("tt-theme", isLight ? "light" : "dark");
    syncThemeIcon();
  });
}

// ==========================
// Language Toggle (EN / HI) — translates key static labels
// ==========================

const i18n = {
  en: {
    "nav-upcoming": "Upcoming", "nav-previous": "Previous", "nav-rules": "Rules",
    "nav-results": "Results", "nav-live": "Live", "nav-scramble": "Scramble",
    "nav-pb": "My Results", "nav-rankings": "Rankings", "nav-gallery": "Gallery",
    "nav-hof": "Hall of Fame", "nav-video": "Submit Video", "nav-faq": "FAQ",
    "nav-organizer": "Organizer", "nav-contact": "Contact"
  },
  hi: {
    "nav-upcoming": "आगामी", "nav-previous": "पिछले", "nav-rules": "नियम",
    "nav-results": "परिणाम", "nav-live": "लाइव", "nav-scramble": "स्क्रैम्बल",
    "nav-pb": "मेरे परिणाम", "nav-rankings": "रैंकिंग", "nav-gallery": "गैलरी",
    "nav-hof": "हॉल ऑफ फेम", "nav-video": "वीडियो जमा करें", "nav-faq": "सवाल-जवाब",
    "nav-organizer": "आयोजक", "nav-contact": "संपर्क"
  }
};

function applyLang(lang) {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (i18n[lang] && i18n[lang][key]) el.textContent = i18n[lang][key];
  });
}

const langToggleBtn = document.getElementById("lang-toggle-btn");
if (langToggleBtn) {
  let currentLang = localStorage.getItem("tt-lang") || "en";
  langToggleBtn.textContent = currentLang.toUpperCase();
  applyLang(currentLang);
  langToggleBtn.addEventListener("click", () => {
    currentLang = currentLang === "en" ? "hi" : "en";
    localStorage.setItem("tt-lang", currentLang);
    langToggleBtn.textContent = currentLang.toUpperCase();
    applyLang(currentLang);
  });
}

// ==========================
// Search Overlay (FAQ + Hall of Fame)
// ==========================

const searchToggleBtn = document.getElementById("search-toggle-btn");
const searchOverlay = document.getElementById("search-overlay");
const searchCloseBtn = document.getElementById("search-close-btn");
const searchInput = document.getElementById("search-input");
const searchResultsEl = document.getElementById("search-results");

if (searchToggleBtn && searchOverlay) {
  searchToggleBtn.addEventListener("click", () => {
    searchOverlay.classList.remove("hidden");
    searchInput.focus();
  });
  searchCloseBtn.addEventListener("click", () => searchOverlay.classList.add("hidden"));
  searchOverlay.addEventListener("click", (e) => { if (e.target === searchOverlay) searchOverlay.classList.add("hidden"); });

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q || !window.ttSearchIndex) {
      searchResultsEl.innerHTML = q ? "" : `<p style="color:var(--ink-muted)">Start typing to search FAQ and Hall of Fame…</p>`;
      return;
    }
    const matches = window.ttSearchIndex.filter(item =>
      item.text.toLowerCase().includes(q)
    ).slice(0, 15);
    if (matches.length === 0) {
      searchResultsEl.innerHTML = `<p style="color:var(--ink-muted)">No matches.</p>`;
      return;
    }
    searchResultsEl.innerHTML = matches.map(m => `
      <button type="button" class="search-result-item block w-full text-left p-3 rounded-lg hover:bg-white/5" data-section="${m.section}">
        <span class="font-mono text-xs" style="color:var(--cube-yellow);">${m.type}</span>
        <p class="text-sm mt-1">${m.text}</p>
      </button>`).join("");
    searchResultsEl.querySelectorAll(".search-result-item").forEach(btn => {
      btn.addEventListener("click", () => {
        searchOverlay.classList.add("hidden");
        scrollToSection(btn.dataset.section);
      });
    });
  });
}

// ==========================
// Countdown Timer
// ==========================

const endDate = new Date("2026-07-31T17:00:00+05:30").getTime();

function updateCountdown(){
  const now = new Date().getTime();
  const distance = endDate - now;

  const countdownEl = document.getElementById("countdown");
  if (!countdownEl) return; // no countdown widget on this page, skip safely

  if(distance <= 0){
    countdownEl.innerHTML = '<h2>Registration Closed</h2><p>The deadline has passed.</p>';
    return;
  }

  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  if (daysEl) daysEl.innerHTML = Math.floor(distance / (1000 * 60 * 60 * 24));
  if (hoursEl) hoursEl.innerHTML = Math.floor((distance / (1000 * 60 * 60)) % 24);
  if (minutesEl) minutesEl.innerHTML = Math.floor((distance / (1000 * 60)) % 60);
  if (secondsEl) secondsEl.innerHTML = Math.floor((distance / 1000) % 60);
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ==========================
// Mobile Menu
// ==========================

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("hidden");
        if (navLinks.classList.contains("hidden")) {
            menuBtn.innerHTML = "☰";
        } else {
            menuBtn.innerHTML = "✖";
        }
    });

    // Close menu when a link is clicked
    const navButtons = navLinks.querySelectorAll("button");
    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            navLinks.classList.add("hidden");
            menuBtn.innerHTML = "☰";
        });
    });
}

// ==========================
// Navbar Scroll Effect
// ==========================

const header = document.querySelector("header") || document.querySelector("nav");

if (header) {
    window.addEventListener("scroll", () => {
        if (window.scrollY > 40) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });
}

// ==========================
// Scroll Animation Observer
// ==========================

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('section, .interactive-card').forEach(el => {
  observer.observe(el);
});

// ==========================
// Interactive Hover Effects (handled via CSS now, JS not needed for .interactive-card)
// ==========================

// ==========================
// Button Click Ripple Animation
// ==========================

document.querySelectorAll('a, button').forEach(btn => {
  btn.addEventListener('click', function(e) {
    if (!e.target.classList.contains('no-ripple')) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');

      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    }
  });
});

// ==========================
// Smooth Scroll to Sections
// ==========================

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Navigate to another page
function goToPage(page) {
  window.location.href = page;
}

// Expose globally
window.scrollToSection = scrollToSection;
window.goToPage = goToPage;

// ==========================
// Scroll Progress Bar
// ==========================

window.addEventListener('scroll', () => {
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;

  let progressBar = document.getElementById('scroll-progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.id = 'scroll-progress';
    progressBar.style.position = 'fixed';
    progressBar.style.top = '0';
    progressBar.style.left = '0';
    progressBar.style.height = '3px';
    progressBar.style.background = 'linear-gradient(90deg, #E8412B, #F2B705)';
    progressBar.style.zIndex = '9999';
    progressBar.style.transition = 'width 0.1s ease';
    document.body.appendChild(progressBar);
  }

  progressBar.style.width = scrolled + '%';
});

// ==========================
// Ripple Effect Style Injection
// ==========================

const rippleStyle = document.createElement('style');
rippleStyle.textContent =
  '.ripple {' +
  '  position: absolute;' +
  '  border-radius: 50%;' +
  '  background: rgba(255, 255, 255, 0.6);' +
  '  transform: scale(0);' +
  '  animation: ripple-animation 0.6s ease-out;' +
  '  pointer-events: none;' +
  '}' +
  '@keyframes ripple-animation {' +
  '  to { transform: scale(4); opacity: 0; }' +
  '}' +
  'a, button { position: relative; overflow: hidden; }' +
  '.animate-in { animation: fadeInUp 0.8s ease-out !important; }';
document.head.appendChild(rippleStyle);
