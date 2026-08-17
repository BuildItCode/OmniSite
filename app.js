/* OmniStack landing — UI behaviour (no 3D here; see scene3d.js) */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ── Boot loader ── */
  const boot = document.getElementById("boot");
  const bootFill = document.getElementById("boot-fill");
  const bootStatus = document.getElementById("boot-status");
  const bootSteps = ["INITIALIZING HARNESS…", "LINKING RUN KERNEL…", "CALIBRATING NEON GRID…", "HARNESS ONLINE"];
  let bootProgress = 0;

  /* Skip the boot sequence entirely on return visits — the inline head
     script already hid the overlay. The actual "finish" happens after the
     counters are defined (see below), to stay clear of the TDZ. */
  const skipBoot = document.documentElement.classList.contains("skip-boot");

  const bootTimer = skipBoot
    ? null
    : setInterval(() => {
    bootProgress = clamp(bootProgress + 12 + Math.random() * 16, 0, 100);
    bootFill.style.width = bootProgress + "%";
    bootStatus.textContent = bootSteps[Math.min(bootSteps.length - 1, Math.floor(bootProgress / 28))];
    if (bootProgress >= 100) {
      clearInterval(bootTimer);
      setTimeout(() => {
        boot.classList.add("done");
        document.body.removeAttribute("data-loading");
        startCounters();
      }, 320);
    }
  }, 130);

  /* ── Custom cursor + magnetic buttons ── */
  const dot = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { x: mouse.x, y: mouse.y };

  if (!isTouch) {
    addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      dot.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%,-50%)`;
    }, { passive: true });

    (function ringLoop() {
      ringPos.x = lerp(ringPos.x, mouse.x, 0.16);
      ringPos.y = lerp(ringPos.y, mouse.y, 0.16);
      ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%,-50%)`;
      requestAnimationFrame(ringLoop);
    })();

    document.querySelectorAll("[data-hover]").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("hot"));
      el.addEventListener("mouseleave", () => ring.classList.remove("hot"));
    });

    document.querySelectorAll("[data-magnet]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.22}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ── Nav + scroll progress + parallax hook for the 3D scene ── */
  const nav = document.getElementById("nav");
  const progressFill = document.getElementById("scroll-progress-fill");

  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle("scrolled", y > 40);
    const max = document.documentElement.scrollHeight - innerHeight;
    progressFill.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    // consumed by scene3d.js
    window.__scrollRatio = max > 0 ? y / max : 0;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ── Reveal on scroll ── */
  /* On return visits the boot loader is skipped, so there is no staged
     entrance to wait for — reveal everything immediately instead of
     leaving content hidden until each section scrolls into view. */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.transitionDelay = `${(i % 4) * 90}ms`;
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    if (skipBoot) {
      el.classList.add("in");
    } else {
      revealObserver.observe(el);
    }
  });

  /* ── Animated hero counters ── */
  const counters = document.querySelectorAll("[data-count]");
  let countersStarted = false;

  function startCounters() {
    if (countersStarted) return;
    countersStarted = true;
    counters.forEach((el) => {
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      if (reduceMotion) { el.textContent = target + suffix; return; }
      const t0 = performance.now();
      const dur = 1600;
      (function tick(now) {
        const p = clamp((now - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }

  /* Return visit: everything is defined now — release the page instantly. */
  if (skipBoot) {
    boot.classList.add("done");
    document.body.removeAttribute("data-loading");
    startCounters();
  }

  /* ── Terminal typing ── */
  const typedCmd = document.getElementById("typed-cmd");
  const missionLine = "omnistack run --mission \"Get the test suite green\"";
  let typingStarted = false;

  const typeObserver = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting || typingStarted) return;
    typingStarted = true;
    if (reduceMotion) { typedCmd.textContent = missionLine; return; }
    let i = 0;
    (function type() {
      typedCmd.textContent = missionLine.slice(0, ++i);
      if (i < missionLine.length) setTimeout(type, 34 + Math.random() * 46);
    })();
  }, { threshold: 0.4 });
  typeObserver.observe(document.getElementById("terminal"));

  /* ── Card tilt + spotlight ── */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      let raf = null;
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", `${px * 100}%`);
        card.style.setProperty("--my", `${py * 100}%`);
        if (raf) return;
        raf = requestAnimationFrame(() => {
          card.style.transform =
            `perspective(900px) rotateX(${(0.5 - py) * 9}deg) rotateY(${(px - 0.5) * 11}deg) translateY(-4px)`;
          raf = null;
        });
      });
      card.addEventListener("mouseleave", () => {
        if (raf) cancelAnimationFrame(raf), (raf = null);
        card.style.transform = "";
      });
    });
  }

  /* ── Demo modal ── */
  const modal = document.getElementById("demo-modal");
  const openers = [document.getElementById("open-demo"), document.getElementById("open-demo-2")];
  const closeBtn = document.getElementById("modal-close");
  const backdrop = document.getElementById("modal-backdrop");
  let lastFocus = null;

  const openModal = () => {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  };
  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  };

  openers.forEach((b) => b && b.addEventListener("click", openModal));
  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  /* ── Neon particle field on the #fx canvas ── */
  const fx = document.getElementById("fx");
  const ctx = fx.getContext("2d");
  let W = 0, H = 0, particles = [];
  const COLORS = ["0,240,255", "255,47,214", "139,92,255"];

  const resizeFx = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    fx.width = W * dpr;
    fx.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resizeFx();
  addEventListener("resize", resizeFx, { passive: true });

  const spawn = (n) => {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.6 + Math.random() * 1.8,
        vy: 0.12 + Math.random() * 0.4,
        vx: (Math.random() - 0.5) * 0.12,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        a: 0.15 + Math.random() * 0.5,
        tw: Math.random() * Math.PI * 2,
      });
    }
  };
  spawn(reduceMotion ? 0 : Math.min(90, Math.floor(innerWidth / 16)));

  // burst of sparks where the pointer moves
  if (!isTouch && !reduceMotion) {
    let last = 0;
    addEventListener("mousemove", (e) => {
      const now = performance.now();
      if (now - last < 40) return;
      last = now;
      particles.push({
        x: e.clientX, y: e.clientY,
        r: 0.8 + Math.random() * 1.6,
        vy: -0.3 - Math.random() * 0.6,
        vx: (Math.random() - 0.5) * 0.8,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        a: 0.8, tw: 0, life: 1,
      });
      if (particles.length > 260) particles.splice(0, particles.length - 260);
    }, { passive: true });
  }

  (function fxLoop() {
    ctx.clearRect(0, 0, W, H);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.y -= p.vy;
      p.x += p.vx;
      p.tw += 0.04;
      if (p.life !== undefined) {
        p.life -= 0.016;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
      }
      if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; }
      const alpha = p.a * (p.life !== undefined ? p.life : 0.6 + 0.4 * Math.sin(p.tw));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.c},${alpha})`;
      ctx.shadowColor = `rgba(${p.c},0.9)`;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    requestAnimationFrame(fxLoop);
  })();
})();
