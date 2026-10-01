/* Continuum landing page — no runtime dependencies. */
(() => {
  'use strict';
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const inspectorTabs = [...document.querySelectorAll('[data-inspector]')];
  const selectInspector = name => {
    inspectorTabs.forEach(tab => {
      const active = tab.dataset.inspector === name;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
  };
  inspectorTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectInspector(tab.dataset.inspector));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? inspectorTabs[0] : event.key === 'End' ? inspectorTabs.at(-1) : inspectorTabs[(index + 1) % inspectorTabs.length];
      selectInspector(next.dataset.inspector); next.focus();
    });
  });
  document.getElementById('show-artifact').addEventListener('click', () => {
    selectInspector('preview'); document.getElementById('preview-tab').focus();
  });
  const profiles = {
    code: { agent: 'Software engineer', initial: 'S', heading: 'Build a website for my next big idea', summary: '8 reads · 3 changes', duration: '2 min 14 s', file: 'index.html', second: 'styles.css', kind: 'Website', detailTitle: 'From concept to a working site', detail: 'A colorful hero, scroll-driven graphics, and responsive layouts. Open the preview alongside the conversation and keep shaping the result.', thinking: 'Review the brief, establish a visual direction, then build and check the responsive page.' },
    research: { agent: 'Researcher', initial: 'R', heading: 'Find the opportunity. Build a launch brief.', summary: '12 sources · 2 outputs', duration: '3 min 08 s', file: 'launch-brief.md', second: 'sources.md', kind: 'Research brief', detailTitle: 'A direction worth exploring', detail: 'The findings bring the market, open questions and potential opportunities together. Your brief and supporting sources stay here for the next conversation.', thinking: 'Compare the available sources, separate evidence from assumptions, and organize the findings into a useful launch brief.' },
    design: { agent: 'Designer', initial: 'D', heading: 'Create an onboarding experience for my app', summary: '2 screens · 1 design system', duration: '2 min 42 s', file: 'onboarding.canvas', second: 'tokens.json', kind: 'Editable design', detailTitle: 'A foundation for the next screen', detail: 'Two onboarding concepts, a considered palette, and reusable components. Explore the visual direction alongside the conversation, then refine it together.', thinking: 'Map the first-run experience, explore two screens, and define consistent typography, colors and components.' },
    schedule: { agent: 'Main', initial: 'M', heading: 'Keep a daily price history I can explore', summary: '1 plan · ready for review', duration: '48 s', file: 'price-tracking-plan.md', second: 'schedule.json', kind: 'Scheduled work plan', detailTitle: 'A plan you can come back to', detail: 'Review the cadence, source and execution budget before starting. Each completed reading can add a dated entry, so the history is ready for your next question.', thinking: 'Define the source, schedule and saved result. Prepare a plan with clear criteria and a reviewable execution budget.' }
  };
  const scenarios = {
    research: {
      prompt: 'Research the market, find the opportunities, and turn the findings into a launch brief.',
      response: 'Let’s connect the dots. I’ll gather the research, compare the opportunities, and create a brief you can build on.',
      steps: [['Research gathered', 'Sources attached'], ['Opportunities mapped', 'Analysis saved'], ['Launch brief created', 'Ready to explore ↗']],
      category: 'RESEARCH / STRATEGY', title: 'Your next\nbig move.', description: 'Market landscape & launch opportunities', file: 'launch-brief.md'
    },
    code: {
      prompt: 'Build a colorful home for my app. Make the graphics come alive as you scroll.',
      response: 'Your idea now has a home. I’ve built a complete landing page with a distinctive visual identity.',
      steps: [['Responsive layout', 'Desktop + mobile'], ['Interactions checked', 'Ready to explore']],
      category: 'CODE / VERIFICATION', title: 'From failing\nto shipping.', description: 'A focused fix, with checks you can review', file: 'release-review.md'
    },
    design: {
      prompt: 'Design the onboarding screens for my app, then create a reusable visual system.',
      response: 'I’ll shape an onboarding flow, create editable screens, and collect the typography, colors and components for your next idea.',
      steps: [['Flow outlined', 'Direction set'], ['Screens designed', 'Editable canvas'], ['Design system created', 'Ready to reuse ↗']],
      category: 'DESIGN / FOUNDATIONS', title: 'An idea.\nA whole system.', description: 'Onboarding screens & reusable components', file: 'onboarding.canvas'
    },
    schedule: {
      prompt: 'Track this price every day, keep a dated history, and help me explore the changes later.',
      response: 'I’ll draft scheduled work with a source, cadence and budget for you to review. Keep the desktop host running for the daily readings.',
      steps: [['Objective outlined', 'Price + date + source'], ['Daily plan drafted', 'Your review needed'], ['Result format prepared', 'A history to explore ↗']],
      category: 'SCHEDULED WORK / PLAN', title: 'Keep the\nthread going.', description: 'Daily readings. A history you can return to.', file: 'price-tracking-plan.md'
    }
  };
  const scenarioButtons = [...document.querySelectorAll('[data-scenario]')];
  scenarioButtons.forEach(button => button.addEventListener('click', () => {
    const name = button.dataset.scenario;
    const selected = scenarios[name];
    const profile = profiles[name];
    document.querySelector('.product-demo').dataset.previewScenario = name;
    document.querySelectorAll('[data-artifact]').forEach(artifact => { artifact.hidden = artifact.dataset.artifact !== name; });
    selectInspector('preview');
    const content = { 'conversation-title': profile.heading, 'agent-name': profile.agent, 'agent-initial': profile.initial, 'composer-agent': profile.agent + ' · medium', 'run-summary': profile.summary, 'run-duration': profile.duration, 'chat-file': profile.file, 'chat-file-secondary': profile.second, 'response-heading': profile.detailTitle, 'response-detail': profile.detail, 'thinking-detail': profile.thinking, 'preview-address': 'omnistack-artifact://my-project/' + profile.file };
    Object.entries(content).forEach(([id, text]) => { document.getElementById(id).textContent = text; });
    document.querySelector('.product-thinking').open = false;
    document.querySelector('.product-transcript').scrollTop = 0;
    scenarioButtons.forEach(item => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active)); });
    document.getElementById('example-prompt').textContent = selected.prompt;
    document.getElementById('example-response').textContent = selected.response;
    document.getElementById('example-steps').replaceChildren(...selected.steps.map(([label, detail]) => {
      const step = document.createElement('span');
      step.append('✓ \u00a0 ' + label + ' ');
      const note = document.createElement('small'); note.textContent = detail; step.append(note); return step;
    }));
    document.getElementById('output-category').textContent = selected.category;
    const title = document.getElementById('output-title');
    const lines = selected.title.split('\n');
    title.replaceChildren(document.createTextNode(lines[0]), document.createElement('br'), document.createTextNode(lines[1]));
    document.getElementById('output-description').textContent = selected.description;
    const filename = document.getElementById('output-filename');
    const caption = document.createElement('small'); caption.textContent = profile.kind + ' · ready to preview';
    filename.replaceChildren(document.createTextNode(profile.file), caption);
  }));

  const designViews = {
    canvas: 'Desktop and mobile artboards share one canvas. Pan, zoom and shape the whole experience.',
    layers: 'Organize your work with layers, components and colors. Bring in a design system or create one in chat.',
    properties: 'Fine-tune position, size, appearance and prototype actions. The details stay editable.'
  };
  const designViewButtons = [...document.querySelectorAll('[data-design-view]')];
  designViewButtons.forEach(button => button.addEventListener('click', () => {
    const view = button.dataset.designView;
    document.querySelector('.design-editor-frame').dataset.designFocus = view;
    designViewButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.getElementById('design-view-description').textContent = designViews[view];
  }));
  const designDialog = document.getElementById('design-image-dialog');
  const designImageTrigger = document.getElementById('open-design-image');
  designImageTrigger.addEventListener('click', () => {
    designDialog.showModal(); document.getElementById('close-design-image').focus();
  });
  document.getElementById('close-design-image').addEventListener('click', () => designDialog.close());
  designDialog.addEventListener('click', event => {
    const rect = designDialog.getBoundingClientRect();
    if (event.target === designDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) designDialog.close();
  });
  designDialog.addEventListener('close', () => designImageTrigger.focus());

  // A single, event-driven frame updates scroll graphics; no perpetual render loop.
  const body = document.body;
  const flow = document.querySelector('.flow-art');
  const flowLayout = document.querySelector('.flow-layout');
  const steps = [...document.querySelectorAll('[data-flow-step]')];
  const motionToggle = document.querySelector('.motion-toggle');
  let manualPause = false;
  let pendingFrame = 0;
  let flowState = -1;
  let geometry;
  const clamp = value => Math.max(0, Math.min(1, value));
  const reduced = () => manualPause || motionPreference.matches;

  const measure = () => {
    const y = window.scrollY;
    geometry = {
      flowTop: flowLayout.getBoundingClientRect().top + y,
      flowBottom: flowLayout.getBoundingClientRect().bottom + y,
      stepCenters: steps.map(step => { const rect = step.getBoundingClientRect(); return rect.top + y + rect.height / 2; }),
      stepHeadings: steps.map(step => step.querySelector('h3').getBoundingClientRect().top + y)
    };
    queueFrame();
  };
  const update = () => {
    pendingFrame = 0;
    if (!geometry || document.hidden) return;
    const y = window.scrollY;
    if (reduced()) return;

    if (y + innerHeight > geometry.flowTop && y < geometry.flowBottom) {
      // On narrow screens the art pins above the current paragraph.
      const mobile = innerWidth <= 680;
      const focus = y + innerHeight * (mobile ? 0.62 : 0.58);
      const centers = geometry.stepCenters;
      const fraction = clamp((focus - centers[0]) / (centers[2] - centers[0]));
      const active = mobile
        ? geometry.stepHeadings.reduce((current, top, index) => top <= focus ? index : current, 0)
        : focus < (centers[0] + centers[1]) / 2 ? 0 : focus < (centers[1] + centers[2]) / 2 ? 1 : 2;
      flow.style.setProperty('--flow-progress', fraction.toFixed(3));
      if (active !== flowState) {
        flowState = active;
        flow.dataset.flowState = String(active);
        flow.querySelector('.flow-counter').textContent = '0' + (active + 1) + ' / 03';
        flow.querySelectorAll('.flow-dots i').forEach((dot, index) => dot.classList.toggle('active', index === active));
      }
    }
  };
  function queueFrame() {
    if (!pendingFrame) pendingFrame = requestAnimationFrame(update);
  }
  const syncMotion = () => {
    body.classList.toggle('motion-paused', reduced());
    document.documentElement.classList.toggle('motion-is-paused', reduced());
    motionToggle.setAttribute('aria-pressed', String(reduced()));
    motionToggle.querySelector('.motion-label').textContent = motionPreference.matches ? 'Reduced motion' : manualPause ? 'Resume motion' : 'Pause motion';
    motionToggle.firstElementChild.textContent = reduced() ? '▷' : 'Ⅱ';
    motionToggle.disabled = motionPreference.matches;
    if (reduced()) {
      flow.dataset.flowState = '2';
      flow.querySelector('.flow-counter').textContent = '03 / 03';
      flow.querySelectorAll('.flow-dots i').forEach((dot, index) => dot.classList.toggle('active', index === 2));
      flowState = -1;
    }
    queueFrame();
  };
  motionToggle.addEventListener('click', () => { manualPause = !manualPause; syncMotion(); });
  motionPreference.addEventListener('change', syncMotion);
  addEventListener('scroll', queueFrame, { passive: true });
  addEventListener('resize', measure, { passive: true });
  document.addEventListener('visibilitychange', () => {
    body.classList.toggle('page-inactive', document.hidden);
    if (!document.hidden) measure();
  });

  if ('IntersectionObserver' in window) {
    const reveals = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        reveals.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(item => reveals.observe(item));
    body.classList.add('motion-ready');
    const regions = new Map([
      [document.querySelector('.harness-stage'), 'scene-offscreen'],
      [flow, 'flow-offscreen'],
      [document.querySelector('.download-section'), 'download-offscreen']
    ]);
    const visibility = new IntersectionObserver(entries => entries.forEach(entry => body.classList.toggle(regions.get(entry.target), !entry.isIntersecting)));
    regions.forEach((_, region) => visibility.observe(region));
  }
  new ResizeObserver(measure).observe(document.querySelector('main'));
  document.fonts.ready.then(measure);
  syncMotion();
  measure();
})();
