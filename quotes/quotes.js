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
  let pending = false;

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
    let navigating = false;
    try {
      // GET also works on static hosts without HEAD support. Do not follow redirects
      // to a generic error page or a different document; no catalog is requested.
      const response = await fetch(path, {
        method: 'GET', cache: 'no-store', credentials: 'omit',
        redirect: 'error', referrerPolicy: 'no-referrer', signal: controller.signal
      });
      if (response.status === 404 || response.status === 410) {
        status.textContent = 'No encontramos una propuesta con esa combinación. Revisa los datos o contacta a Hazael.';
      } else if (!response.ok || !response.headers.get('content-type')?.toLowerCase().includes('text/html')) {
        status.textContent = 'No pudimos consultar la propuesta en este momento. Intenta de nuevo en unos minutos.';
      } else {
        status.textContent = 'Propuesta encontrada. Abriendo documento…';
        window.location.assign(path);
        navigating = true;
      }
      if (response.body) await response.body.cancel();
    } catch {
      status.textContent = 'No pudimos conectar para consultar la propuesta. Revisa tu conexión e intenta de nuevo.';
    } finally {
      window.clearTimeout(timeout);
      if (!navigating) setPending(false);
    }
  });

  // Restore the form when returning through the browser's back/forward cache.
  window.addEventListener('pageshow', () => {
    setPending(false);
    status.textContent = '';
    pin.value = '';
    pin.type = 'password';
    toggle.textContent = 'Mostrar PIN';
    toggle.setAttribute('aria-pressed', 'false');
  });
})();
