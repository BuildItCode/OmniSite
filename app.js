/* Continuum — shared site behaviour (home and docs). */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const supportsObserver = "IntersectionObserver" in window;

  const nav = document.getElementById("nav");
  const progressFill = document.getElementById("scroll-progress-fill");
  const spyLinks = Array.from(document.querySelectorAll("[data-spy]"));
  const spySections = spyLinks
    .map((link) => document.getElementById(link.dataset.spy))
    .filter((section) => section !== null);
  const heroVisual = document.querySelector("[data-mock]");

  let activeSpy = null;

  /* ── Scroll-driven state: nav, progress bar, section spy, hero parallax ── */
  const updateScrollState = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (nav) nav.classList.toggle("scrolled", y > 24);
    if (progressFill) progressFill.style.width = (max > 0 ? clamp(y / max, 0, 1) * 100 : 0) + "%";

    if (spySections.length) {
      let current = spySections[0];
      spySections.forEach((section) => {
        if (section.getBoundingClientRect().top <= 150) current = section;
      });
      if (current.id !== activeSpy) {
        activeSpy = current.id;
        spyLinks.forEach((link) => {
          if (link.dataset.spy === activeSpy) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }
    }
  };

  const updateParallax = () => {
    if (!heroVisual || reduceMotion) return;
    const rect = heroVisual.getBoundingClientRect();
    const offset = clamp((window.innerHeight / 2 - (rect.top + rect.height / 2)) * 0.035, -16, 16);
    heroVisual.style.transform = offset ? "translate3d(0," + offset.toFixed(1) + "px,0)" : "";
  };

  let ticking = false;
  const onFrame = () => {
    ticking = false;
    updateScrollState();
    updateParallax();
  };
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onFrame);
  };

  addEventListener("scroll", requestUpdate, { passive: true });
  addEventListener("resize", requestUpdate, { passive: true });
  requestUpdate();
  updateParallax();

  /* ── Reveal and stagger on scroll ── */
  const revealTargets = document.querySelectorAll("[data-reveal], [data-stagger]");
  if (reduceMotion || !supportsObserver) {
    revealTargets.forEach((el) => el.classList.add("in"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  }

  /* ── Readout decode ──
     Mono labels resolve left-to-right out of noise. The true string is
     published as an accessible name before the first frame, so assistive
     technology never hears the scramble, and mono type keeps the width stable
     while the glyphs change. The attribute value is the delay in ms. */
  const DECODE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/#%*+=?";
  const decodeTargets = Array.from(document.querySelectorAll("[data-decode]"));

  const textNodesOf = (element) => {
    const nodes = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeValue.trim()) nodes.push(node);
    }
    return nodes;
  };

  const decode = (element) => {
    const nodes = textNodesOf(element);
    if (!nodes.length) return;
    const original = nodes.map((node) => node.nodeValue);
    const longest = original.reduce((most, text) => Math.max(most, text.length), 0);
    const duration = 360 + longest * 46;
    const started = performance.now();
    element.setAttribute("aria-label", original.join(" ").trim());

    const frame = (now) => {
      const progress = clamp((now - started) / duration, 0, 1);
      nodes.forEach((node, index) => {
        const source = original[index];
        const settled = Math.floor(progress * source.length);
        let output = "";
        for (let i = 0; i < source.length; i++) {
          const character = source[i];
          if (i < settled || character === " ") output += character;
          else output += DECODE_GLYPHS[Math.floor(Math.random() * DECODE_GLYPHS.length)];
        }
        node.nodeValue = output;
      });
      if (progress < 1) requestAnimationFrame(frame);
      else nodes.forEach((node, index) => { node.nodeValue = original[index]; });
    };
    requestAnimationFrame(frame);
  };

  if (decodeTargets.length && !reduceMotion && supportsObserver) {
    const decodeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          decodeObserver.unobserve(entry.target);
          const delay = Number(entry.target.dataset.decode) || 0;
          if (delay) setTimeout(() => decode(entry.target), delay);
          else decode(entry.target);
        });
      },
      { threshold: 0.6 },
    );
    decodeTargets.forEach((el) => decodeObserver.observe(el));
  }

  /* ── Readout counters ──
     Each [data-count] counts up as it reaches the viewport, so the stats strip
     and the run card's budget animate on their own timing. The real number is
     authored in the markup and only zeroed here, so the page still reads
     correctly without JavaScript. */
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    if (reduceMotion) {
      el.textContent = String(target);
      return;
    }
    el.classList.add("counted");
    const started = performance.now();
    const duration = 1200;
    const tick = (now) => {
      const progress = clamp((now - started) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const counters = Array.from(document.querySelectorAll("[data-count]"));
  if (counters.length) {
    if (reduceMotion || !supportsObserver) {
      counters.forEach(countUp);
    } else {
      counters.forEach((el) => { el.textContent = "0"; });
      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            counterObserver.unobserve(entry.target);
            countUp(entry.target);
          });
        },
        { threshold: 0.4 },
      );
      counters.forEach((el) => counterObserver.observe(el));
    }
  }

  /* ── Stepped lists (run card, activity panel) ── */
  const playSteps = (nodes, delay) => {
    nodes.forEach((node, index) => {
      if (reduceMotion) {
        node.classList.add("is-on");
        return;
      }
      setTimeout(() => node.classList.add("is-on"), index * delay);
    });
  };

  const runCard = document.querySelector("[data-run]");
  if (runCard) {
    const steps = runCard.querySelectorAll(".run-step");
    if (reduceMotion || !supportsObserver) {
      steps.forEach((step) => step.classList.add("is-on"));
      runCard.classList.add("is-lit");
    } else {
      const runObserver = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return;
          runObserver.disconnect();
          runCard.classList.add("is-lit");
          playSteps(steps, 260);
        },
        { threshold: 0.35 },
      );
      runObserver.observe(runCard);
    }
  }

  /* ── Hero illustration: typed prompt, then a live run ── */
  if (heroVisual) {
    const typed = heroVisual.querySelector("[data-type]");
    const prompt = typed ? typed.dataset.type || "" : "";
    const tabs = Array.from(heroVisual.querySelectorAll("[data-tab]"));
    const panels = Array.from(heroVisual.querySelectorAll("[data-panel]"));
    const steps = heroVisual.querySelectorAll(".activity-step");
    let rotation = 0;
    let rotationTimer = 0;

    const selectTab = (name) => {
      tabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.tab === name)));
      panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === name));
      if (name === "activity") playSteps(steps, 320);
    };

    const stopRotation = () => {
      if (!rotationTimer) return;
      clearInterval(rotationTimer);
      rotationTimer = 0;
    };

    const startRotation = () => {
      if (reduceMotion || rotationTimer || tabs.length < 2) return;
      const order = tabs.map((tab) => tab.dataset.tab);
      rotationTimer = setInterval(() => {
        rotation = (rotation + 1) % order.length;
        selectTab(order[rotation]);
      }, 4600);
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        stopRotation();
        selectTab(tab.dataset.tab);
      });
    });
    ["pointerdown", "focusin", "keydown"].forEach((type) => {
      heroVisual.addEventListener(type, stopRotation);
    });

    const finishRun = () => {
      heroVisual.classList.add("is-live");
      startRotation();
    };

    if (!typed || !prompt || reduceMotion) {
      if (typed) typed.textContent = prompt;
      finishRun();
    } else {
      typed.textContent = "";
      heroVisual.classList.add("is-typing");
      let index = 0;
      const typeNext = () => {
        typed.textContent = prompt.slice(0, ++index);
        if (index < prompt.length) {
          setTimeout(typeNext, 24);
          return;
        }
        heroVisual.classList.remove("is-typing");
        setTimeout(finishRun, 280);
      };
      setTimeout(typeNext, 480);
    }
  }

  /* No pointer-position effects: the hero wash, the console and the download
     cards all hold still under the cursor. Motion on this page comes from
     scroll-triggered entrance choreography and hover paint changes. */

  /* ── Demo video modal ── */
  const modal = document.getElementById("demo-modal");
  const videoFrame = document.getElementById("demo-video");
  const closeButton = document.getElementById("modal-close");
  const backdrop = document.getElementById("modal-backdrop");

  if (modal && videoFrame && closeButton) {
    const videoSrc = videoFrame.getAttribute("src");
    let lastFocus = null;

    /* Resetting src unloads the player, so playback stops on close. */
    const stopVideo = () => {
      videoFrame.src = "";
      videoFrame.src = videoSrc;
    };

    const openModal = () => {
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      closeButton.focus();
    };

    const closeModal = () => {
      stopVideo();
      modal.hidden = true;
      document.body.style.overflow = "";
      if (lastFocus instanceof HTMLElement) lastFocus.focus();
    };

    document.querySelectorAll("#open-demo, #open-demo-2").forEach((button) => {
      button.addEventListener("click", openModal);
    });
    closeButton.addEventListener("click", closeModal);
    if (backdrop) backdrop.addEventListener("click", closeModal);
    addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeModal();
    });
  }
})();
