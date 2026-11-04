(function () {
  'use strict';
  const config = window.AuroraConfig, time = window.AuroraTime;
  const byId = id => document.getElementById(id);
  const waitingDeck = byId('hero-deck').innerHTML, waitingMessage = byId('hero-message').textContent;
  let lastPhase = '', lastAge = '', lastLetters = -1;
  function render(now = Date.now()) {
    const state = time.stateAt(now, config);
    const phase = state.born ? (state.arrivalDay ? 'arrival' : 'born') : (state.arrivalDay ? 'today' : 'waiting');
    Object.entries(state.countdown).forEach(([unit, value]) => { byId(`count-${unit}`).textContent = String(value).padStart(unit === 'days' ? 3 : 2, '0'); });
    const text = time.ageText(state.age);
    if (lastAge !== text) { byId('age-value').textContent = text; lastAge = text; }
    if (phase !== lastPhase) {
      document.body.dataset.phase = phase;
      byId('countdown').hidden = state.born && !state.arrivalDay;
      byId('age-panel').hidden = !state.born;
      byId('today-message').hidden = !state.arrivalDay;
      byId('cartas').hidden = !state.born;
      byId('letters-nav').hidden = !state.born;
      byId('mission-phase').textContent = state.born ? 'BIENVENIDA A NUESTRO UNIVERSO' : 'EN CAMINO A NUESTROS BRAZOS';
      byId('clock-heading').textContent = state.born ? 'NUESTRO GRAN COMIENZO' : 'CUENTA REGRESIVA PARA CONOCERTE';
      byId('clock-context').hidden = state.born;
      if (state.born) {
        byId('hero-deck').replaceChildren(document.createTextNode('Nuestro universo '), Object.assign(document.createElement('em'), { textContent: 'ya tiene tu luz.' }));
        byId('hero-message').textContent = 'Bienvenida, Aurora. Antes de conocerte ya tenías un lugar inmenso en nuestra vida. Ahora empieza lo más bonito: caminar contigo, aprender a tu lado y recordarte cada día cuánto te amamos.';
      } else {
        byId('hero-deck').innerHTML = waitingDeck;
        byId('hero-message').textContent = waitingMessage;
      }
      byId('mission-status').textContent = state.born ? `Bienvenida, Aurora. Hoy tienes ${text}.` : 'Te estamos esperando, Aurora.';
      lastPhase = phase;
    }
    if (state.unlockedLetters !== lastLetters) {
      const list = byId('letter-list');
      const fragment = document.createDocumentFragment();
      for (let year = 1; year <= state.unlockedLetters; year++) {
        const li = document.createElement('li'), link = document.createElement('a');
        link.href = `/aurora/cartas/${String(year).padStart(2, '0')}/`;
        const number = Object.assign(document.createElement('span'), { className: 'letter-number', textContent: String(year).padStart(2, '0') });
        const label = Object.assign(document.createElement('span'), { textContent: year === 1 ? 'Tu primera vuelta al sol' : `Para tus ${year} años` });
        const arrow = Object.assign(document.createElement('span'), { className: 'letter-arrow', textContent: '↗' }); arrow.setAttribute('aria-hidden', 'true');
        link.append(number, label, arrow); li.append(link); fragment.append(li);
      }
      list.replaceChildren(fragment);
      byId('letters-waiting').hidden = state.unlockedLetters > 0;
      lastLetters = state.unlockedLetters;
    }
    return state;
  }
  try {
    const birth = time.instantFor(time.birthParts(config), config.timeZone);
    const date = byId('birth-date');
    date.dateTime = `${config.birthDate}T${config.birthTime}`;
    date.textContent = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: config.timeZone }).format(birth);
    byId('birth-time').textContent = `${config.birthTime} · ${config.timeZone === 'America/Mexico_City' ? 'CIUDAD DE MÉXICO' : config.timeZone}`;
    render();
    window.setInterval(() => { if (!document.hidden) render(); }, 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
    window.addEventListener('pageshow', () => render());
  } catch (_) {
    byId('countdown').hidden = true;
    byId('clock-error').hidden = false;
  }
  const dialog = byId('photo-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-photo]').forEach(button => {
      button.addEventListener('click', () => {
        const image = button.querySelector('img');
        byId('photo-image').src = image.src; byId('photo-image').alt = image.alt;
        byId('photo-caption').textContent = button.closest('figure').querySelector('h3').textContent;
        dialog.showModal();
      });
    });
    byId('photo-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { byId('photo-image').removeAttribute('src'); });
  }
})();
