/* ===== Main JS — Omni Static Site ===== */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Ensure hero highlight animation plays only once ----
  const highlightEl = document.querySelector('.hero h1 .highlight');
  if (highlightEl) {
    highlightEl.addEventListener('animationend', () => {
      highlightEl.style.animation = 'none';
      highlightEl.style.backgroundPosition = '0% 0';
    });
    // Fallback: force cleanup after 12s even if animationend didn't fire
    setTimeout(() => {
      if (highlightEl.style.animation !== 'none') {
        highlightEl.style.animation = 'none';
        highlightEl.style.backgroundPosition = '0% 0';
      }
    }, 13000);
  }

  // ---- Mobile hamburger menu ----
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navbar-links');

  if (hamburger && navLinks) {
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';
    document.body.appendChild(backdrop);

    const closeMenu = () => {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    };

    const openMenu = () => {
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      navLinks.classList.add('open');
      backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    hamburger.addEventListener('click', () => {
      if (hamburger.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close when clicking backdrop
    backdrop.addEventListener('click', closeMenu);

    // Close when a nav link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && hamburger.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  // ---- Scroll reveal animation ----
  const revealEls = document.querySelectorAll('.reveal, .reveal-children');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  revealEls.forEach(el => observer.observe(el));

  // ---- FAQ Accordion ----
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));

      // Toggle current
      if (!wasOpen) {
        item.classList.add('open');
      }
    });
  });

  // ---- Support form mailto ----
  const form = document.getElementById('support-form');
  const sendBtn = document.getElementById('send-message-btn');
  if (form && sendBtn) {
    const emailInput = form.querySelector('#email');
    const messageInput = form.querySelector('#message');
    const emailError = form.querySelector('#email-error');
    const messageError = form.querySelector('#message-error');
    const successBox = document.getElementById('form-success');

    sendBtn.addEventListener('click', () => {
      let valid = true;

      // Reset errors
      emailError.classList.remove('visible');
      messageError.classList.remove('visible');
      emailError.textContent = '';
      messageError.textContent = '';

      const email = emailInput.value.trim();
      const message = messageInput.value.trim();

      if (!email) {
        emailError.textContent = 'Please enter your email address.';
        emailError.classList.add('visible');
        valid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailError.textContent = 'Please enter a valid email address.';
        emailError.classList.add('visible');
        valid = false;
      }

      if (!message) {
        messageError.textContent = 'Please enter a message.';
        messageError.classList.add('visible');
        valid = false;
      }

      if (!valid) return;

      const subject = encodeURIComponent('Omni Support');
      const body = encodeURIComponent(`From: ${email}\n\n${message}`);

      // Show success state
      form.style.display = 'none';
      if (successBox) {
        successBox.style.display = 'block';
      }

      // Open mailto
      window.location.href = `mailto:build.it.code@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  // ---- Set active nav link ----
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

});
