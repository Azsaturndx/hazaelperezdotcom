const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'quotes/nic-mg/1177.html'), 'utf8');
const number = value => Number(value.replace(/[^0-9.]/g, ''));

test('NIC-MG reconciles all eight stages, individual hours and USD30 rate', () => {
  const stages = [...html.matchAll(/<details class="milestone"[^>]*>([\s\S]*?)<\/details>/g)];
  assert.equal(stages.length, 8);
  let hours = 0, fee = 0;
  for (const [, stage] of stages) {
    const h = number(stage.match(/class="milestone-hours">([^<]+)/)[1]);
    const amount = number(stage.match(/class="milestone-amount">([^<]+)/)[1]);
    const table = stage.match(/<table[\s\S]*?<\/table>/)[0];
    assert.doesNotMatch(table, /\$/);
    const activities = [...table.matchAll(/<td>([0-9.]+) h<\/td>/g)];
    assert.equal(activities.reduce((sum, match) => sum + Number(match[1]), 0), h);
    assert.equal(amount, h * 30);
    hours += h; fee += amount;
  }
  assert.equal(hours, 79.5); assert.equal(fee, 2385);
});

test('three complete pricing alternatives are explicit and never added together', () => {
  const rows = [...html.matchAll(/<tr data-scenario="([^"]+)" data-monthly="([^"]+)" data-annual="([^"]+)">([\s\S]*?)<\/tr>/g)];
  assert.deepEqual(rows.map(row => [row[1], Number(row[2]), Number(row[3])]), [
    ['payg',1275.50,15306.01], ['reservation-1y',1027.92,12335.04], ['reservation-3y',891.03,10692.36]
  ]);
  for (const row of rows) {
    const cells = [...row[4].matchAll(/<td>([^<]*)<\/td>/g)].map(m => m[1]);
    assert.equal(number(cells[3]), Number(row[2])); assert.equal(number(cells[4]), Number(row[3]));
  }
  assert.equal((html.match(/name="cloud-plan"/g) || []).length, 3);
  assert.equal((html.match(/name="cloud-plan"[^>]*checked/g) || []).length, 1);
  assert.match(html, /mutuamente excluyentes/);
  assert.match(html, /no sumes PAYG/);
  assert.doesNotMatch(html, /Archive|Costos provisionales en las tres alternativas/);
});

test('NIC-MG preserves existing privacy, resource and native PDF conventions', () => {
  assert.match(html, /name="robots" content="noindex, nofollow, noarchive"/);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.match(html, />Export to PDF<\/button>/);
  assert.match(html, /href="\/quotes\/"/);
  assert.doesNotMatch(html, /\{\{|window\.print/);
  for (const [, resource] of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)) {
    assert.ok(fs.existsSync(path.join(root, resource)), resource);
  }
  assert.match(html, /Key Vault/);
  assert.match(html, /Total de licencias incluidas/);
  assert.match(html, /Odoo.*a cargo del cliente/);
});

test('FTE pie uses the existing 79.5 hours and bars reference the pricing table', () => {
  const roles = [...html.matchAll(/data-hours="([0-9.]+)" data-label="([^"]+)"/g)];
  assert.equal(roles.length, 5);
  assert.equal(roles.reduce((sum, match) => sum + Number(match[1]), 0), 79.5);
  assert.match(html, /data-proposal-chart="bars" data-chart-source="cloud-scenarios"/);
  assert.match(html, /data-proposal-chart="pie"/);
});

test('scenario calculator replaces the selected total, reads stage fees and never adds scenarios', () => {
  const elements = new Map(); let change;
  const rows = [['payg',1275.50,15306.01,'PAYG'],['reservation-1y',1027.92,12335.04,'Reserva 1 año'],['reservation-3y',891.03,10692.36,'Reserva 3 años']].map(([scenario,monthly,annual,name]) => ({
    dataset: { scenario, monthly: String(monthly), annual: String(annual) }, cells: [{ textContent: name }],
    classList: { toggle(_, active) { this.selected = active; } }
  }));
  const get = id => { if (!elements.has(id)) elements.set(id, { textContent: '', replaceChildren(...children) { this.children = children; } }); return elements.get(id); };
  elements.set('cloud-scenarios', { tBodies: [{ rows }] });
  elements.set('scenario-picker', { hidden: true, querySelector: () => ({ value: 'payg' }), addEventListener(_, callback) { change = callback; } });
  vm.runInNewContext(fs.readFileSync(path.join(root, 'quotes/cost-scenarios.js'), 'utf8'), {
    document: { getElementById: get, createElement: () => ({}), querySelectorAll: () => [240,60,105,510,390,300,420,360].map(amount => ({ textContent: `$${amount}.00 USD` })) }
  });
  for (const [i, firstYear] of [[0,'17,691.01'],[1,'14,720.04'],[2,'13,077.36'],[0,'17,691.01']]) {
    change({ target: { name: 'cloud-plan', value: rows[i].dataset.scenario } });
    assert.match(get('scenario-first-year').textContent, new RegExp(firstYear.replace('.', '\\.')));
    assert.equal(rows.filter(row => row.classList.selected).length, 1);
    assert.ok(rows[i].classList.selected);
  }
  assert.equal(get('scenario-picker').hidden, false);
});
