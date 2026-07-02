// ==========================
// Countdown Timer
// ==========================

const countdown = document.getElementById("countdown");

const targetDate = new Date("2026-07-02T17:00:00+05:30").getTime();

function updateCountdown() {

    if (!countdown) return;

    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
        countdown.innerHTML = `
            <div class="col-span-full rounded-3xl bg-red-50 border border-red-200 p-6 text-center">
                <div class="text-lg font-semibold text-red-700">Registration Closed</div>
                <p class="mt-2 text-sm text-red-600">The deadline has passed.</p>
            </div>
        `;
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    countdown.innerHTML = `
        <div class="rounded-3xl bg-white border border-slate-200 p-4 text-center shadow-sm">
            <div class="text-3xl font-semibold text-slate-900">${days}</div>
            <div class="text-xs uppercase tracking-[0.35em] text-slate-500 mt-2">Days</div>
        </div>

        <div class="rounded-3xl bg-white border border-slate-200 p-4 text-center shadow-sm">
            <div class="text-3xl font-semibold text-slate-900">${hours}</div>
            <div class="text-xs uppercase tracking-[0.35em] text-slate-500 mt-2">Hours</div>
        </div>

        <div class="rounded-3xl bg-white border border-slate-200 p-4 text-center shadow-sm">
            <div class="text-3xl font-semibold text-slate-900">${minutes}</div>
            <div class="text-xs uppercase tracking-[0.35em] text-slate-500 mt-2">Minutes</div>
        </div>

        <div class="rounded-3xl bg-white border border-slate-200 p-4 text-center shadow-sm">
            <div class="text-3xl font-semibold text-slate-900">${seconds}</div>
            <div class="text-xs uppercase tracking-[0.35em] text-slate-500 mt-2">Seconds</div>
        </div>
    `;
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

const header = document.querySelector("header");

window.addEventListener("scroll", () => {

    if(window.scrollY > 40){

        header.classList.add("scrolled");

    }else{

        header.classList.remove("scrolled");

    }

});

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
      entry.target.style.animation = getComputedStyle(entry.target).animation || 'fadeInUp 0.8s ease-out';
      entry.target.classList.add('animate-in');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all sections and cards
document.querySelectorAll('section, .card, .organizer-card, .time-box').forEach(el => {
  observer.observe(el);
});

// ==========================
// Interactive Hover Effects
// ==========================

// Add glow effect to cards on hover
document.querySelectorAll('.card, .organizer-card').forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-15px) scale(1.02)';
  });
  
  card.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
  });
});

// ==========================
// Button Click Animation
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

// Smooth Scroll to Sections
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
// Add Scroll Progress Bar
// ==========================

window.addEventListener('scroll', () => {
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (window.scrollY / scrollHeight) * 100;
  
  let progressBar = document.getElementById('scroll-progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.id = 'scroll-progress';
    progressBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, #22d3ee, #0ea5e9);
      z-index: 9999;
      transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);
  }
  
  progressBar.style.width = scrolled + '%';
});

// ==========================
// Add Ripple Effect Style
// ==========================

const style = document.createElement('style');
style.textContent = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  a, button {
    position: relative;
    overflow: hidden;
  }
  
  .animate-in {
    animation: fadeInUp 0.8s ease-out !important;
  }
`;
document.head.appendChild(style);
