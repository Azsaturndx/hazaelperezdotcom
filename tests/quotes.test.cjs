/* Behavioral checks with Node's built-in runner; no test dependencies. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'quotes/quotes.js'), 'utf8');

function fixture(fetchImpl = async () => response(200), { autoPause = true, failFrame = false } = {}) {
  const elements = new Map();
  const handlers = new Map();
  const requests = [];
  const destinations = [];
  const timers = new Map();
  const classes = new Set();
  const frameHandlers = new Map();
  let height = 900;
  let onResize;
  const classList = { add: value => classes.add(value), remove: value => classes.delete(value) };
  const frameDocument = {
    documentElement: { classList },
    body: { getBoundingClientRect: () => ({ height }) },
    querySelector: () => ({}), querySelectorAll: () => [],
    addEventListener: (name, handler) => frameHandlers.set(name, handler)
  };
  let focused;
  let nextTimer = 0;
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: '', type: id === 'quote-pin' ? 'password' : 'text',
      textContent: '', hidden: true, disabled: true, readOnly: false, attrs: {}, style: {},
      contentDocument: frameDocument, contentWindow: { location: { pathname: '' } },
      set src(value) {
        this.attrs.src = value; this.contentWindow.location.pathname = value;
        queueMicrotask(() => failFrame ? this.onerror?.() : this.onload?.());
      },
      removeAttribute(name) { delete this.attrs[name]; },
      setAttribute(name, value) { this.attrs[name] = value; },
      addEventListener(name, handler) { handlers.set(`${id}:${name}`, handler); },
      focus() { focused = id; }
    });
    return elements.get(id);
  }
  const window = {
    setTimeout(fn, ms) {
      const id = ++nextTimer; timers.set(id, { fn, ms });
      if (autoPause && ms === 500) queueMicrotask(() => { timers.delete(id); fn(); });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    location: { origin: 'https://example.com', assign(value) { destinations.push(value); } }, scrollTo() {},
    addEventListener(name, handler) { handlers.set(`window:${name}`, handler); }
  };
  vm.runInNewContext(source, {
    document: { getElementById: element, body: { classList } }, window, AbortController, URL,
    ResizeObserver: class { constructor(callback) { onResize = callback; } observe() {} disconnect() { onResize = undefined; } },
    fetch: async (...args) => { requests.push(args); return fetchImpl(...args); }
  });
  return {
    element, requests, destinations, timers, classes,
    resize(value) { height = value; onResize(); },
    returnFromFrame() { frameHandlers.get('click')({ button: 0, target: { closest: () => ({ href: 'https://example.com/quotes/' }) }, preventDefault() {} }); },
    tickPause() { const entry = [...timers.entries()].find(([,timer]) => timer.ms === 500); assert.ok(entry); timers.delete(entry[0]); entry[1].fn(); },
    get focused() { return focused; },
    set(key, code) { element('customer-key').value = key; element('quote-pin').value = code; },
    emit(id, event) { return handlers.get(`${id}:${event}`)({ preventDefault() {} }); },
    submit() { return this.emit('quote-form', 'submit'); }
  };
}
function response(status, type = 'text/html; charset=utf-8') {
  return { status, ok: status >= 200 && status < 300, headers: new Headers({ 'content-type': type }), body: { cancel: async () => {} } };
}

test('normalizes CustomerKey, preserves leading zero, and requests only the exact document', async () => {
  const f = fixture();
  f.set('  PROTEXA  ', '0123');
  await f.submit();
  assert.equal(f.element('customer-key').value, 'protexa');
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0][0], '/quotes/protexa/0123.html');
  assert.deepEqual(f.destinations, []);
  assert.equal(f.element('quote-frame').attrs.src, '/quotes/protexa/0123.html');
  assert.equal(f.element('quote-viewer').hidden, false);
  assert.equal(f.element('main').hidden, true);
  assert.equal(f.requests[0][1].redirect, 'error');
  assert.equal(f.requests[0][1].credentials, 'omit');
  assert.equal(f.requests[0][1].referrerPolicy, 'no-referrer');
  assert.equal(f.timers.size, 0);
});

test('NIC-MG routes the approved PIN to its exact embedded proposal without navigation', async () => {
  const f = fixture(); f.set('  NIC-MG  ', '1177'); await f.submit();
  assert.equal(f.requests[0][0], '/quotes/nic-mg/1177.html');
  assert.equal(f.element('quote-frame').attrs.src, '/quotes/nic-mg/1177.html');
  assert.equal(f.element('quote-viewer').hidden, false);
  assert.deepEqual(f.destinations, []);
});

test('Protexa opens its new proposal without changing the main address', async () => {
  const f = fixture(); f.set('PROTEXA', '1100'); await f.submit();
  assert.equal(f.requests[0][0], '/quotes/protexa/1100.html');
  assert.equal(f.element('quote-frame').attrs.src, '/quotes/protexa/1100.html');
  assert.deepEqual(f.destinations, []);
});

test('rejects path manipulation, encoded input, ambiguous Unicode and invalid boundaries before any request', async () => {
  const invalidKeys = ['', '../', 'a/b', 'a\\b', '%2e%2e', 'a%252fb', 'a b', 'a\nb', '-demo', 'demo-', 'a--b', 'José', 'ＤＥＭＯ', 'K', 'a'.repeat(49), 'a?b', 'a#b'];
  for (const key of invalidKeys) {
    const f = fixture(); f.set(key, '0123'); await f.submit();
    assert.equal(f.requests.length, 0, key);
    assert.equal(f.focused, 'customer-key', key);
    assert.equal(f.element('customer-key').attrs['aria-invalid'], 'true');
  }
  for (const code of ['', '123', '0'.repeat(13), ' 0123', '0123 ', '01/23', '%30%31%32%33', '１２３４', '../0', '01a3']) {
    const f = fixture(); f.set('demo', code); await f.submit();
    assert.equal(f.requests.length, 0, code);
    assert.equal(f.focused, 'quote-pin', code);
  }
  for (const [key, code] of [['a', '0000'], ['demo-2', '012345678901'], ['a'.repeat(48), '9999']]) {
    const f = fixture(); f.set(key, code); await f.submit();
    assert.equal(f.requests.length, 1);
  }
});

test('distinguishes missing proposals from temporary HTTP failures and non-HTML responses', async () => {
  for (const status of [404, 410, 403, 429, 500, 503]) {
    const f = fixture(async () => response(status)); f.set('demo', '0123'); await f.submit();
    const message = f.element('quote-status').textContent;
    assert.match(message, status === 404 || status === 410 ? /No encontramos/ : /en este momento/);
    assert.equal(f.destinations.length, 0);
    assert.equal(f.element('quote-submit').disabled, false);
    assert.equal(f.element('quote-form').attrs['aria-busy'], 'false');
  }
  const f = fixture(async () => response(200, 'application/json'));
  f.set('demo', '0123'); await f.submit();
  assert.equal(f.destinations.length, 0);
  assert.match(f.element('quote-status').textContent, /en este momento/);
});

test('network failure is recoverable and does not reveal technical errors', async () => {
  let fail = true;
  const f = fixture(async () => { if (fail) throw new TypeError('private diagnostic'); return response(200); });
  f.set('demo', '0123'); await f.submit();
  assert.match(f.element('quote-status').textContent, /conexión/);
  assert.doesNotMatch(f.element('quote-status').textContent, /private diagnostic|TypeError/);
  assert.equal(f.element('quote-submit').disabled, false);
  fail = false; await f.submit();
  assert.deepEqual(f.destinations, []);
  assert.equal(f.element('quote-frame').attrs.src, '/quotes/demo/0123.html');
});

test('timeout aborts the request and restores controls', async () => {
  const f = fixture((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')));
  }));
  f.set('demo', '0123');
  const pending = f.submit();
  [...f.timers.values()][0].fn();
  await pending;
  assert.match(f.element('quote-status').textContent, /conexión/);
  assert.equal(f.timers.size, 0);
  assert.equal(f.element('customer-key').readOnly, false);
});

test('loading prevents duplicate submits and retains fixed controls; browser return clears the PIN', async () => {
  let resolve;
  const f = fixture(() => new Promise(done => { resolve = done; }));
  f.set('demo', '0123');
  const pending = f.submit();
  await f.submit();
  assert.equal(f.requests.length, 1);
  assert.equal(f.element('quote-submit').disabled, true);
  assert.equal(f.element('customer-key').readOnly, true);
  assert.equal(f.element('quote-pin').readOnly, true);
  assert.equal(f.element('quote-form').attrs['aria-busy'], 'true');
  resolve(response(200)); await pending;
  f.emit('window', 'pageshow');
  assert.equal(f.element('quote-submit').disabled, false);
  assert.equal(f.element('quote-pin').value, '');
  assert.equal(f.element('quote-pin').type, 'password');
  assert.equal(f.element('quote-status').textContent, '');
});

test('PIN visibility has an accessible pressed state and field edits clear validation', async () => {
  const f = fixture();
  assert.equal(f.element('toggle-pin').hidden, false);
  f.emit('toggle-pin', 'click');
  assert.equal(f.element('quote-pin').type, 'text');
  assert.equal(f.element('toggle-pin').attrs['aria-pressed'], 'true');
  f.emit('toggle-pin', 'click');
  assert.equal(f.element('quote-pin').type, 'password');
  assert.equal(f.element('toggle-pin').attrs['aria-pressed'], 'false');
  f.set('../', '0123'); await f.submit();
  f.emit('customer-key', 'input');
  assert.equal(f.element('customer-error').textContent, '');
  assert.equal(f.element('customer-key').attrs['aria-invalid'], 'false');
});

const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

test('each status remains visible for its own 500ms minimum without unlocking duplicate submits', async () => {
  const f = fixture(undefined, { autoPause: false });
  f.set('protexa', '0123'); const pending = f.submit(); await flush();
  assert.equal(f.element('quote-status').textContent, 'Buscando tu propuesta…');
  assert.equal(f.element('quote-frame').attrs.src, undefined);
  assert.equal(f.element('quote-submit').disabled, true);
  f.tickPause(); await flush();
  assert.equal(f.element('quote-status').textContent, 'Navegando a la propuesta…');
  assert.equal(f.element('quote-viewer').hidden, true);
  await f.submit(); assert.equal(f.requests.length, 1);
  f.tickPause(); await pending;
  assert.equal(f.element('quote-viewer').hidden, false);
  assert.equal(f.focused, 'quote-viewer');
});

test('embedded proposal grows and shrinks, and return restores consultation without navigating', async () => {
  const f = fixture(); f.set('demo', '0123'); await f.submit();
  assert.equal(f.element('quote-frame').style.height, '900px');
  f.resize(1500); assert.equal(f.element('quote-frame').style.height, '1500px');
  f.resize(700); assert.equal(f.element('quote-frame').style.height, '700px');
  f.returnFromFrame();
  assert.equal(f.element('main').hidden, false);
  assert.equal(f.element('quote-viewer').hidden, true);
  assert.equal(f.element('quote-frame').attrs.src, undefined);
  assert.equal(f.element('quote-pin').value, '');
  assert.equal(f.element('quote-skip').attrs.href, '#main');
  assert.equal(f.focused, 'customer-key');
  assert.deepEqual(f.destinations, []);
});

test('failure while loading the iframe leaves consultation usable and does not expose a blank viewer', async () => {
  const f = fixture(undefined, { failFrame: true }); f.set('demo', '0123'); await f.submit();
  assert.equal(f.element('quote-viewer').hidden, true);
  assert.equal(f.element('quote-frame').attrs.src, undefined);
  assert.equal(f.element('quote-submit').disabled, false);
  assert.match(f.element('quote-status').textContent, /conexión/);
});

test('published pages and reusable template retain privacy, resources and proposal navigation', () => {
  const files = ['quotes/index.html', 'quotes/protexa/0123.html', '_templates/proposal.html'];
  for (const file of files) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, /name="robots" content="noindex, nofollow, noarchive"/);
    assert.match(html, /name="referrer" content="no-referrer"/);
    for (const [, resource] of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)) {
      assert.ok(fs.existsSync(path.join(root, resource)), `${file}: ${resource}`);
    }
    if (file !== 'quotes/index.html') {
      assert.match(html, /href="\/quotes\/"/);
      assert.match(html, /src="\/assets\/firma.png"/);
    }
  }
  assert.equal(fs.existsSync(path.join(root, 'sitemap.xml')), false);
  assert.match(fs.readFileSync(path.join(root, '_config.yml'), 'utf8'), /sitemap: false/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'quotes/protexa/0123.html'), 'utf8'), /\{\{/);
});
