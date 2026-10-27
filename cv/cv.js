/* Progressive enhancement: native reading/navigation works without JavaScript. */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sections = [...document.querySelectorAll('main > section[id]')];
  const links = [...document.querySelectorAll('.cv-nav a')];
  const button = document.getElementById('cv-expand');
  const jobs = [...document.querySelectorAll('details.cv-job')];
  function updateExpandLabel() {
    const allOpen = jobs.every(job => job.open);
    button.textContent = allOpen ? 'Contraer toda la trayectoria −' : 'Expandir toda la trayectoria +';
  }
  button.addEventListener('click', () => {
    const open = !jobs.every(job => job.open);
    jobs.forEach(job => { job.open = open; });
    updateExpandLabel();
  });
  jobs.forEach(job => job.addEventListener('toggle', updateExpandLabel));
  button.hidden = false;

  if ('IntersectionObserver' in window && !reduced.matches) {
    document.documentElement.classList.add('cv-motion');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('cv-pending'); observer.unobserve(entry.target); }
    }), { rootMargin: '0px 0px 40px 0px', threshold: 0.05 });
    document.querySelectorAll('[data-cv-reveal]').forEach(node => {
      if (node.getBoundingClientRect().top > innerHeight) { node.classList.add('cv-pending'); observer.observe(node); }
    });
    reduced.addEventListener('change', event => {
      if (event.matches) { document.querySelectorAll('.cv-pending').forEach(node => node.classList.remove('cv-pending')); observer.disconnect(); }
    });
  }

  let scheduled = false;
  const progress = document.querySelector('.cv-progress span');
  function updatePosition() {
    const limit = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${limit > 0 ? Math.min(1, Math.max(0, scrollY / limit)) : 0})`;
    const active = [...sections].reverse().find(section => section.getBoundingClientRect().top <= 155) || sections[0];
    links.forEach(link => {
      if (link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scheduled = false;
  }
  window.addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updatePosition); } }, { passive: true });
  window.addEventListener('resize', updatePosition);
  document.addEventListener('toggle', updatePosition, true);
  window.addEventListener('beforeprint', () => document.querySelectorAll('.cv-pending').forEach(node => node.classList.remove('cv-pending')));
  updatePosition();
})();
