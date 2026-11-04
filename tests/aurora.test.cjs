const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const config = require('../aurora/config.js');
const time = require('../aurora/time.js');
const html = fs.readFileSync(path.join(root, 'aurora/index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'aurora/aurora.js'), 'utf8');
const at = iso => time.stateAt(Date.parse(iso), config);

test('countdown uses Mexico City midnight and never becomes negative', () => {
  assert.equal(new Date(time.instantFor(time.birthParts(config), config.timeZone)).toISOString(), '2026-11-11T06:00:00.000Z');
  assert.deepEqual(at('2026-11-04T06:00:00Z').countdown, { days: 7, hours: 0, minutes: 0, seconds: 0 });
  assert.deepEqual(at('2026-11-11T05:59:59Z').countdown, { days: 0, hours: 0, minutes: 0, seconds: 1 });
  assert.equal(at('2026-11-11T05:59:59.999Z').born, false);
  assert.equal(at('2026-11-11T06:00:00Z').born, true);
  assert.deepEqual(at('2026-11-11T06:00:00Z').countdown, { days: 0, hours: 0, minutes: 0, seconds: 0 });
});

test('special message spans only November 11 in Mexico City, not UTC date', () => {
  assert.equal(at('2026-11-11T05:59:59Z').arrivalDay, false);
  assert.equal(at('2026-11-11T06:00:00Z').arrivalDay, true);
  assert.equal(at('2026-11-12T05:59:59Z').arrivalDay, true);
  assert.equal(at('2026-11-12T06:00:00Z').arrivalDay, false);
});

test('age counts completed calendar years, months and days with correct Spanish', () => {
  assert.deepEqual(at('2026-11-11T06:00:00Z').age, { years: 0, months: 0, days: 0 });
  assert.deepEqual(at('2026-12-12T06:00:00Z').age, { years: 0, months: 1, days: 1 });
  assert.deepEqual(at('2028-02-29T06:00:00Z').age, { years: 1, months: 3, days: 18 });
  assert.deepEqual(at('2030-01-01T06:00:00Z').age, { years: 3, months: 1, days: 21 });
  assert.equal(time.ageText({ years: 1, months: 1, days: 1 }), '1 año, 1 mes y 1 día');
  assert.equal(time.ageText({ years: 0, months: 2, days: 0 }), '0 años, 2 meses y 0 días');
});

test('letter links unlock only at completed birthdays and stop at 31 without capping age', () => {
  assert.equal(at('2026-11-10T06:00:00Z').unlockedLetters, 0);
  assert.equal(at('2027-11-11T05:59:59Z').unlockedLetters, 0);
  assert.equal(at('2027-11-11T06:00:00Z').unlockedLetters, 1);
  assert.equal(at('2028-11-11T06:00:00Z').unlockedLetters, 2);
  assert.equal(at('2057-11-11T06:00:00Z').unlockedLetters, 31);
  assert.equal(at('2080-11-11T06:00:00Z').unlockedLetters, 31);
  assert.equal(at('2080-11-11T06:00:00Z').age.years, 54);
  for (let year = 1; year <= 31; year++) {
    const anniversary = `${2026 + year}-11-11T06:00:00Z`;
    assert.equal(at(anniversary).unlockedLetters, year);
    assert.equal(time.stateAt(Date.parse(anniversary) - 1, config).unlockedLetters, year - 1);
  }
});

test('future birth-time adjustments respect the configured minute and time zone', () => {
  const updated = { ...config, birthTime: '14:35' };
  assert.equal(time.stateAt(Date.parse('2026-11-11T20:34:59Z'), updated).born, false);
  assert.equal(time.stateAt(Date.parse('2026-11-11T20:34:59Z'), updated).arrivalDay, true);
  assert.equal(time.stateAt(Date.parse('2026-11-11T20:35:00Z'), updated).born, true);
  assert.equal(time.stateAt(Date.parse('2027-11-11T20:34:59Z'), updated).unlockedLetters, 0);
  assert.equal(time.stateAt(Date.parse('2027-11-11T20:35:00Z'), updated).unlockedLetters, 1);
});

test('month-end and February 29 births clamp anniversaries without inventing days', () => {
  const leap = { ...config, birthDate: '2028-02-29' };
  assert.deepEqual(time.stateAt(Date.parse('2029-02-28T06:00:00Z'), leap).age, { years: 1, months: 0, days: 0 });
  assert.equal(time.stateAt(Date.parse('2029-02-28T05:59:59Z'), leap).unlockedLetters, 0);
  const monthEnd = { ...config, birthDate: '2026-01-31' };
  assert.deepEqual(time.stateAt(Date.parse('2026-02-28T06:00:00Z'), monthEnd).age, { years: 0, months: 1, days: 0 });
  assert.deepEqual(time.stateAt(Date.parse('2026-03-30T06:00:00Z'), monthEnd).age, { years: 0, months: 1, days: 30 });
  assert.deepEqual(time.stateAt(Date.parse('2026-03-31T06:00:00Z'), monthEnd).age, { years: 0, months: 2, days: 0 });
  assert.throws(() => time.birthParts({ ...config, birthDate: '2026-02-30' }));
  assert.throws(() => time.birthParts({ ...config, birthTime: '24:00' }));
});

test('visitor system time zones do not change countdown, age or birthdays', () => {
  const command = `const t=require('./aurora/time.js'),c=require('./aurora/config.js');console.log(JSON.stringify(t.stateAt(Date.parse('2027-11-11T06:00:00Z'),c)));`;
  const results = ['Pacific/Auckland', 'America/Los_Angeles', 'UTC'].map(TZ => execFileSync(process.execPath, ['-e', command], { cwd: root, env: { ...process.env, TZ }, encoding: 'utf8' }));
  assert.equal(results[0], results[1]); assert.equal(results[1], results[2]);
});

function fixture(iso) {
  class Element {
    constructor() { this.hidden = false; this.children = []; this.dataset = {}; this.textContent = ''; this.attributes = {}; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes.flatMap(n => n.fragment ? n.children : [n]); }
    setAttribute(key, value) { this.attributes[key] = value; }
    addEventListener() {}
  }
  let now = Date.parse(iso);
  const elements = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m => [m[1], new Element()]));
  const listeners = {}, intervals = [];
  const document = {
    body: new Element(), hidden: false,
    getElementById: id => elements[id],
    createElement: () => new Element(), createTextNode: textContent => ({ textContent }),
    createDocumentFragment: () => Object.assign(new Element(), { fragment: true }),
    querySelectorAll: () => [], addEventListener: (event, callback) => { listeners[event] = callback; }
  };
  const window = { AuroraConfig: config, AuroraTime: time, setInterval: callback => intervals.push(callback), addEventListener: (event, callback) => { listeners[event] = callback; } };
  vm.runInNewContext(app, { document, window, Date: class extends Date { static now() { return now; } }, Intl });
  return { elements, document, intervals, listeners, advance: iso => { now = Date.parse(iso); intervals[0](); } };
}

test('page transitions in place: countdown, today for mom, age, then sequential letter links', () => {
  const f = fixture('2026-11-11T05:59:59Z'), e = f.elements;
  assert.equal(e['cartas'].hidden, true);
  assert.equal(e['letters-nav'].hidden, true);
  assert.equal(e['count-seconds'].textContent, '01');
  assert.equal(e['letter-list'].children.length, 0);
  f.advance('2026-11-11T06:00:00Z');
  assert.equal(e['today-message'].hidden, false);
  assert.equal(e['countdown'].hidden, false);
  assert.equal(e['age-panel'].hidden, false);
  assert.equal(e['cartas'].hidden, false);
  assert.equal(e['letters-waiting'].hidden, false);
  assert.equal(e['age-value'].textContent, '0 años, 0 meses y 0 días');
  f.advance('2026-11-12T06:00:00Z');
  assert.equal(e['today-message'].hidden, true);
  assert.equal(e['countdown'].hidden, true);
  f.advance('2027-11-11T06:00:00Z');
  assert.equal(e['letter-list'].children.length, 1);
  assert.equal(e['letter-list'].children[0].children[0].href, '/aurora/cartas/01/');
  assert.equal(e['letters-waiting'].hidden, true);
  f.advance('2028-11-11T06:00:00Z');
  assert.equal(e['letter-list'].children.length, 2);
  assert.equal(e['letter-list'].children[0].children[0].href, '/aurora/cartas/01/');
  assert.equal(e['letter-list'].children[1].children[0].href, '/aurora/cartas/02/');
  f.advance('2080-11-11T06:00:00Z');
  assert.equal(e['letter-list'].children.length, 31);
  assert.match(e['age-value'].textContent, /^54 años/);
});

test('one timer, no duplicate letter links, no second-by-second live announcements', () => {
  const f = fixture('2028-11-11T06:00:00Z');
  assert.equal(f.intervals.length, 1);
  const node = f.elements['letter-list'].children[0];
  f.advance('2028-11-11T06:00:01Z');
  assert.equal(f.elements['letter-list'].children[0], node);
  assert.doesNotMatch(html.match(/<div class="countdown"[^>]*>/)[0], /aria-live/);
  f.document.hidden = true;
  f.advance('2029-11-11T06:00:00Z');
  assert.equal(f.elements['letter-list'].children.length, 2);
  f.document.hidden = false; f.listeners.visibilitychange();
  assert.equal(f.elements['letter-list'].children.length, 3);
});

test('31 directly loadable standalone letters: only first is authored, remaining letters are honest placeholders', () => {
  const dir = path.join(root, 'aurora/cartas');
  assert.equal(fs.readdirSync(dir).length, 31);
  for (let year = 1; year <= 31; year++) {
    const letter = fs.readFileSync(path.join(dir, String(year).padStart(2, '0'), 'index.html'), 'utf8');
    assert.match(letter, /noindex, nofollow, noarchive, noimageindex/);
    assert.match(letter, /href="\/aurora\/#cartas"/);
    assert.equal((letter.match(/<h1\b/g) || []).length, 1);
    assert.doesNotMatch(letter, /<script|https?:\/\//);
    if (year === 1) { assert.match(letter, /Mi querida Aurora/); assert.doesNotMatch(letter, /aún está por escribirse/); }
    else { assert.match(letter, /aún está por escribirse/); assert.match(letter, new RegExp(`tus ${year} años`)); }
  }
});

test('all local resources and anchors exist; no homepage links, trackers or future letter hrefs', () => {
  const pages = [html, ...fs.readdirSync(path.join(root, 'aurora/cartas')).map(n => fs.readFileSync(path.join(root, 'aurora/cartas', n, 'index.html'), 'utf8'))];
  for (const page of pages) {
    for (const [, url] of page.matchAll(/(?:href|src)="(\/[^"#]+)(?:#[^"]*)?"/g)) assert.ok(fs.existsSync(path.join(root, url)), url);
    const ids = [...page.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, new Set(ids).size);
    for (const [, id] of page.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), id);
  }
  assert.doesNotMatch(html, /href="\/aurora\/cartas\//);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /\/aurora\//);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'script.js'), 'utf8'), /\/aurora\//);
  assert.doesNotMatch(html + app, /https?:\/\/|localStorage|fetch\(|Audio\(/);
  assert.match(html, /<noscript>/);
  assert.match(html, /Es hoy, Aurora\. Mamá/);
  assert.match(fs.readFileSync(path.join(root, '_config.yml'), 'utf8'), /path: "aurora"\s+values:\s+sitemap: false/);
});

test('responsive, reduced-motion, keyboard and photographic privacy conventions', () => {
  const css = fs.readFileSync(path.join(root, 'aurora/aurora.css'), 'utf8');
  assert.match(css, /@media\(max-width:720px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /@media print/);
  assert.match(css, /\[hidden\]\{display:none!important\}/);
  assert.match(html, /<dialog[^>]+aria-labelledby="photo-caption"/);
  assert.match(html, /<button[^>]+aria-label="Ampliar/);
  const photos = fs.readdirSync(path.join(root, 'aurora/images'));
  assert.equal(photos.length, 6);
  let total = 0;
  for (const name of photos) {
    assert.match(name, /\.webp$/);
    const buffer = fs.readFileSync(path.join(root, 'aurora/images', name)); total += buffer.length;
    assert.doesNotMatch(buffer.toString('latin1'), /EXIF|XMP |IPTC|c2pa/);
  }
  assert.ok(total < 1_500_000, `Photos total ${total} bytes`);
});
