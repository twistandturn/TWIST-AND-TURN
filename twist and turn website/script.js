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
        navLinks.classList.toggle("bg-indigo-600");
        if (navLinks.classList.contains("hidden")) {
            menuBtn.innerHTML = "☰";
        } else {
            menuBtn.innerHTML = "✖";
        }
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
