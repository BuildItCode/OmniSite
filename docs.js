/* Local documentation navigation and search. No service or dependency required. */
(() => {
  'use strict';
  const sections = [...document.querySelectorAll('[data-doc-section]')];
  const links = [...document.querySelectorAll('[data-doc-link]')];
  const search = document.getElementById('docs-search-input');
  const status = document.getElementById('docs-search-status');
  const empty = document.getElementById('docs-empty');
  const sidebar = document.querySelector('.docs-sidebar');
  const toggle = document.querySelector('.docs-menu-toggle');
  const reading = document.getElementById('docs-reading-title');
  const progress = document.getElementById('docs-reading-progress');
  const label = document.getElementById('docs-reading-label');
  const index = sections.map(section => ({ section, text: section.textContent.toLocaleLowerCase().replace(/\s+/g, ' ') }));
  const setMenu = open => {
    sidebar.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.lastElementChild.textContent = open ? '−' : '＋';
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('site-menu-open', () => setMenu(false));
  matchMedia('(min-width: 681px)').addEventListener('change', () => setMenu(false));

  const updateReading = () => {
    const shown = sections.filter(section => !section.hidden);
    let current = shown[0];
    shown.forEach(section => { if (section.getBoundingClientRect().top <= 180) current = section; });
    links.forEach(link => {
      if (current && link.dataset.docLink === current.dataset.docSection) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (!current) {
      reading.textContent = 'No matching topics'; reading.removeAttribute('href');
      progress.style.width = '0%'; label.textContent = '00 / 12'; return;
    }
    const position = sections.indexOf(current) + 1;
    reading.textContent = links.find(link => link.dataset.docLink === current.dataset.docSection).childNodes[1].textContent;
    reading.href = '#' + current.dataset.docSection;
    progress.style.width = (position / sections.length * 100) + '%';
    label.textContent = String(position).padStart(2, '0') + ' / ' + sections.length;
  };
  let framePending = false;
  const queueReading = () => {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(() => { framePending = false; updateReading(); });
  };
  addEventListener('scroll', queueReading, { passive: true });
  addEventListener('resize', queueReading, { passive: true });
  const filter = () => {
    const query = search.value.trim().toLocaleLowerCase();
    const words = query.split(/\s+/).filter(Boolean);
    index.forEach(({section, text}) => { section.hidden = !words.every(word => text.includes(word)); });
    links.forEach(link => { link.hidden = document.querySelector('[data-doc-section="' + link.dataset.docLink + '"]').hidden; });
    document.querySelectorAll('.docs-nav-group').forEach(group => { group.hidden = [...group.querySelectorAll('a')].every(link => link.hidden); });
    const count = sections.filter(section => !section.hidden).length;
    status.hidden = !query;
    status.textContent = count + (count === 1 ? ' topic matches ' : ' topics match ') + '“' + search.value.trim() + '”.';
    empty.hidden = count !== 0;
    updateReading();
  };
  search.addEventListener('input', filter);
  document.getElementById('clear-docs-search').addEventListener('click', () => {
    search.value = ''; filter();
    if (matchMedia('(max-width: 680px)').matches) setMenu(true);
    search.focus();
  });
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    if (search.value) { search.value = ''; filter(); }
    if (sidebar.contains(link)) {
      setMenu(false);
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  }));
  document.addEventListener('keydown', event => {
    const editing = event.target.matches('input, textarea, select, [contenteditable="true"]');
    if (event.key === '/' && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      if (matchMedia('(max-width: 680px)').matches) setMenu(true);
      search.focus();
    }
    if (event.key === 'Escape') {
      if (search.value) { search.value = ''; filter(); }
      else if (toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
      else if (document.activeElement === search) search.blur();
    }
  });
  updateReading();
})();
