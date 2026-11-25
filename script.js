// ==========================
// PWA: Service Worker + Install Prompt
// ==========================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const script = Array.from(document.scripts).find((item) => item.src.endsWith("/script.js"));
    const serviceWorkerUrl = script
      ? new URL("service-worker.js", script.src)
      : new URL("service-worker.js", document.baseURI);
    navigator.serviceWorker.register(serviceWorkerUrl).catch(() => {});
  });
}

let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (sessionStorage.getItem('pwaDismissed')) return;

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

  const close = document.createElement("span");
  close.textContent = "  ✕";
  close.className = "no-ripple";
  close.addEventListener("click", (ev) => { ev.stopPropagation(); btn.remove(); sessionStorage.setItem('pwaDismissed', '1'); });
  btn.appendChild(close);
  document.body.appendChild(btn);
});

window.addEventListener("appinstalled", () => {
  const btn = document.getElementById("pwa-install-btn");
  if (btn) btn.remove();
});

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
    const navButtons = navLinks.querySelectorAll("a");
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

      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (x - size / 2) + 'px';
      ripple.style.top = (y - size / 2) + 'px';
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

(function () {
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0;background:linear-gradient(90deg,#E8412B,#F2B705);z-index:9999;transition:width .1s ease;pointer-events:none';
  document.body.appendChild(bar);
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  }, { passive: true });
})();

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
  'a, button { position: relative; overflow: hidden; }';
document.head.appendChild(rippleStyle);


// Escape text coming from Firestore before putting it in innerHTML
window.escapeHtml = function (v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
};
