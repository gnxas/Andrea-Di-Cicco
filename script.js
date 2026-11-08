/* Prof. Andrea Di Cicco — site interactions */
(function () {
  "use strict";

  const header = document.getElementById("site-header");
  const nav = document.getElementById("main-nav");
  const toggle = document.getElementById("nav-toggle");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header border on scroll */
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile navigation */
  const closeNav = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  };
  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });

  /* Active section highlighting */
  const navLinks = Array.from(nav.querySelectorAll('a[href^="#"]'));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = "#" + entry.target.id;
          navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === id));
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => sectionObserver.observe(s));

  /* Reveal on scroll */
  const revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* Count-up for stats */
  const fmt = new Intl.NumberFormat("en-US");
  const countEls = document.querySelectorAll("[data-count]");
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    if (reduceMotion) { el.textContent = fmt.format(target); return; }
    const duration = 1600;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt.format(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const countObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  countEls.forEach((el) => countObserver.observe(el));

  /* EXAFS-like signal: k^2 chi(k) as a sum of damped coordination shells */
  const curve = document.getElementById("signal-curve");
  if (curve) {
    const shells = [
      { N: 4, R: 2.35, s2: 0.0035, phi: -0.6 },
      { N: 12, R: 3.84, s2: 0.009, phi: -0.9 },
      { N: 12, R: 4.5, s2: 0.011, phi: -1.1 }
    ];
    const pts = [];
    const n = 500;
    let max = 0;
    for (let i = 0; i <= n; i++) {
      const k = 2.5 + (i / n) * 13.5;
      let chi = 0;
      shells.forEach((sh) => {
        chi += (sh.N / (k * sh.R * sh.R)) *
          Math.exp(-2 * sh.s2 * k * k) *
          Math.sin(2 * k * sh.R + sh.phi);
      });
      const y = chi * k * k;
      max = Math.max(max, Math.abs(y));
      pts.push(y);
    }
    const d = pts
      .map((y, i) => (i ? "L" : "M") + ((i / n) * 1000).toFixed(1) + " " + (30 - (y / max) * 26).toFixed(2))
      .join(" ");
    curve.setAttribute("d", d);

    if (!reduceMotion) {
      const len = curve.getTotalLength();
      curve.style.strokeDasharray = len;
      curve.style.strokeDashoffset = len;
      const signalObserver = new IntersectionObserver((entries, obs) => {
        if (entries[0].isIntersecting) {
          curve.classList.add("is-drawing");
          curve.style.strokeDashoffset = "0";
          obs.disconnect();
        }
      });
      signalObserver.observe(curve);
    }
  }

  /* Copy e-mail */
  const copyBtn = document.getElementById("copy-email");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.copy);
        copyBtn.textContent = "Copied ✓";
        copyBtn.classList.add("is-copied");
        setTimeout(() => {
          copyBtn.textContent = "Copy address";
          copyBtn.classList.remove("is-copied");
        }, 2000);
      } catch (err) {
        window.location.href = "mailto:" + copyBtn.dataset.copy;
      }
    });
  }

  /* Footer year */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
