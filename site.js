/* Shared navigation and reading progress for Home and Docs, including file://. */
(() => {
  'use strict';
  const header = document.querySelector('.header');
  if (!header) return;
  const menu = header.querySelector('.menu-toggle');
  const navigation = header.querySelector('#navigation');
  const progress = header.querySelector('.scroll-progress');
  const closeMenu = () => {
    menu.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
    if (open) document.dispatchEvent(new Event('site-menu-open'));
  });
  navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu(); menu.focus();
    }
  });
  matchMedia('(min-width: 681px)').addEventListener('change', closeMenu);

  let frame = 0;
  const updateProgress = () => {
    frame = 0;
    const range = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    progress.style.transform = 'scaleX(' + Math.min(1, Math.max(0, scrollY / range)) + ')';
  };
  const queueProgress = () => { if (!frame) frame = requestAnimationFrame(updateProgress); };
  addEventListener('scroll', queueProgress, { passive: true });
  addEventListener('resize', queueProgress, { passive: true });
  new ResizeObserver(queueProgress).observe(document.body);
  document.fonts.ready.then(queueProgress);
  updateProgress();
})();
