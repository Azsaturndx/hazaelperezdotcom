/* Static lookup only. These identifiers are not authentication credentials. */
(() => {
  'use strict';
  const form = document.getElementById('quote-form');
  const customer = document.getElementById('customer-key');
  const pin = document.getElementById('quote-pin');
  const toggle = document.getElementById('toggle-pin');
  const submit = document.getElementById('quote-submit');
  const label = document.getElementById('submit-label');
  const status = document.getElementById('quote-status');
  const access = document.getElementById('main');
  const viewer = document.getElementById('quote-viewer');
  const frame = document.getElementById('quote-frame');
  const skip = document.getElementById('quote-skip');
  let pending = false;
  let resizeObserver;
  const pause = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  // Start embedded downloads in the top document for consistent browser support.
  frame.addEventListener('quote-download-pdf', event => {
    if (viewer.hidden || !event.detail) return;
    const { blob, filename } = event.detail;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.append(link);
    try { link.click(); } finally {
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
  });

  function closeViewer(focus = true) {
    resizeObserver?.disconnect();
    resizeObserver = undefined;
    viewer.hidden = true;
    access.hidden = false;
    document.body.classList.remove('is-viewing');
    frame.removeAttribute('src');
    frame.style.height = '';
    skip.setAttribute('href', '#main');
    setPending(false);
    status.textContent = '';
    pin.value = '';
    pin.type = 'password';
    toggle.textContent = 'Mostrar PIN';
    toggle.setAttribute('aria-pressed', 'false');
    if (focus) customer.focus();
  }

  function loadProposal(path) {
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        window.clearTimeout(timer);
        frame.onload = null;
        frame.onerror = null;
      };
      const timer = window.setTimeout(() => { cleanup(); reject(new Error('Frame timeout')); }, 12000);
      frame.onerror = () => { cleanup(); reject(new Error('Frame unavailable')); };
      frame.onload = () => {
        cleanup();
        try {
          const doc = frame.contentDocument;
          if (frame.contentWindow.location.pathname !== path || !doc?.querySelector('.proposal article')) throw new Error('Unexpected document');
          doc.documentElement.classList.add('proposal-embedded');
          const resize = () => {
            frame.style.height = `${Math.ceil(doc.body.getBoundingClientRect().height)}px`;
          };
          // Keep a single scrollbar as milestones expand or images finish loading.
          resizeObserver = new ResizeObserver(resize);
          resizeObserver.observe(doc.body);
          doc.addEventListener('click', event => {
            if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            const link = event.target.closest('a[href]');
            if (!link) return;
            const destination = new URL(link.href);
            if (destination.origin === window.location.origin && ['/quotes', '/quotes/', '/quotes/index.html'].includes(destination.pathname)) {
              event.preventDefault(); closeViewer(); window.scrollTo(0, 0);
            }
          });
          // Home leaves the consultation rather than opening the site in the frame.
          doc.querySelectorAll('a[href="/"]').forEach(link => { link.target = '_top'; });
          resolve(resize);
        } catch (error) { reject(error); }
      };
      frame.src = path;
    });
  }

  // Trim outside whitespace; internal whitespace is invalid. Never decode input.
  const normalizeCustomer = value => value.trim().replace(/[A-Z]/g, letter => letter.toLowerCase());
  const validCustomer = value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 48;
  const validPin = value => /^[0-9]{4,12}$/.test(value);

  toggle.hidden = false;
  submit.disabled = false;
  toggle.addEventListener('click', () => {
    const show = pin.type === 'password';
    pin.type = show ? 'text' : 'password';
    toggle.textContent = show ? 'Ocultar PIN' : 'Mostrar PIN';
    toggle.setAttribute('aria-pressed', String(show));
  });

  function fieldError(input, id, message) {
    input.setAttribute('aria-invalid', String(Boolean(message)));
    document.getElementById(id).textContent = message;
  }

  for (const [input, errorId] of [[customer, 'customer-error'], [pin, 'pin-error']]) {
    input.addEventListener('input', () => {
      fieldError(input, errorId, '');
      if (!pending) status.textContent = '';
    });
  }

  function setPending(value) {
    pending = value;
    form.setAttribute('aria-busy', String(value));
    submit.disabled = value;
    customer.readOnly = value;
    pin.readOnly = value;
    label.textContent = value ? 'Consultando…' : 'Consultar propuesta';
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    const key = normalizeCustomer(customer.value);
    const code = pin.value; // Keep as text, including leading zeroes.
    customer.value = key;
    const customerOK = validCustomer(key);
    const pinOK = validPin(code);
    fieldError(customer, 'customer-error', customerOK ? '' : 'Usa hasta 48 letras sin acentos, números o guiones entre grupos. No incluyas espacios ni símbolos.');
    fieldError(pin, 'pin-error', pinOK ? '' : 'Ingresa entre 4 y 12 dígitos, sin espacios ni símbolos.');
    if (!customerOK || !pinOK) {
      status.textContent = 'Revisa los campos indicados.';
      (customerOK ? pin : customer).focus();
      return;
    }

    const path = `/quotes/${key}/${code}.html`;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    setPending(true);
    status.textContent = 'Buscando tu propuesta…';
    const searching = pause(500);
    try {
      // GET also works on static hosts without HEAD support. Do not follow redirects
      // to a generic error page or a different document; no catalog is requested.
      const response = await fetch(path, {
        method: 'GET', cache: 'no-store', credentials: 'omit',
        redirect: 'error', referrerPolicy: 'no-referrer', signal: controller.signal
      });
      window.clearTimeout(timeout);
      if (response.body) await response.body.cancel();
      await searching;
      if (response.status === 404 || response.status === 410) {
        status.textContent = 'No encontramos una propuesta con esa combinación. Revisa los datos o contacta a Hazael.';
      } else if (!response.ok || !response.headers.get('content-type')?.toLowerCase().includes('text/html')) {
        status.textContent = 'No pudimos consultar la propuesta en este momento. Intenta de nuevo en unos minutos.';
      } else {
        status.textContent = 'Navegando a la propuesta…';
        // Load in parallel with the second readable status; never change the
        // parent URL or add the proposal's path/PIN to its browsing history.
        const [loaded] = await Promise.allSettled([loadProposal(path), pause(500)]);
        if (loaded.status === 'rejected') throw loaded.reason;
        const resize = loaded.value;
        access.hidden = true;
        viewer.hidden = false;
        document.body.classList.add('is-viewing');
        skip.setAttribute('href', '#quote-viewer');
        resize();
        pin.value = '';
        viewer.focus();
        window.scrollTo(0, 0);
      }
    } catch {
      await searching;
      resizeObserver?.disconnect();
      frame.removeAttribute('src');
      status.textContent = 'No pudimos conectar para consultar la propuesta. Revisa tu conexión e intenta de nuevo.';
    } finally {
      window.clearTimeout(timeout);
      setPending(false);
    }
  });

  // Restore the form when returning through the browser's back/forward cache.
  window.addEventListener('pageshow', () => closeViewer(false));
})();
