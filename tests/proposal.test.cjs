const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { jsPDF } = require('../quotes/vendor/jspdf-4.2.1.umd.min.js');
const { create, filename } = require('../quotes/proposal-pdf.js');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'quotes/protexa/0123.html'), 'utf8');
const numeric = value => Number(value.replace(/[^0-9.]/g, ''));

test('demo stage hours and amounts reconcile; activities expose hours without unit prices', () => {
  let hours = 0, amount = 0;
  const stages = [...html.matchAll(/<details class="milestone"[^>]*>([\s\S]*?)<\/details>/g)];
  assert.equal(stages.length, 3);
  for (const [, stage] of stages) {
    const stageHours = numeric(stage.match(/class="milestone-hours">([^<]+)/)[1]);
    const stageAmount = numeric(stage.match(/class="milestone-amount">([^<]+)/)[1]);
    const table = stage.match(/<table[\s\S]*?<\/table>/)[0];
    assert.doesNotMatch(table, /\$|MXN/);
    const activityHours = [...table.matchAll(/<td>([0-9]+) h<\/td>/g)].map(match => Number(match[1]));
    assert.equal(activityHours.reduce((sum, value) => sum + value, 0), stageHours);
    hours += stageHours; amount += stageAmount;
  }
  assert.equal(hours, 60); assert.equal(amount, 45000);
  assert.match(html, /Total de servicios: 60 horas · \$45,000.00 MXN/);
});

test('cloud and license monthly/annual rows, subtotals and summary reconcile', () => {
  const totals = [];
  for (const [, table] of html.matchAll(/<table class="proposal-table cost-table">([\s\S]*?)<\/table>/g)) {
    const body = table.match(/<tbody>([\s\S]*?)<\/tbody>/)[1];
    let monthly = 0, annual = 0;
    for (const [, row] of body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
      const cells = [...row.matchAll(/<td>([^<]*)<\/td>/g)].map(match => match[1]);
      assert.equal(cells.length, 5);
      const m = numeric(cells[3]), a = numeric(cells[4]);
      assert.equal(a, m * 12); monthly += m; annual += a;
    }
    const footer = table.match(/<tfoot>([\s\S]*?)<\/tfoot>/)[1];
    const sums = [...footer.matchAll(/<td>([^<]*)<\/td>/g)].map(match => numeric(match[1]));
    assert.deepEqual(sums, [monthly, annual]); totals.push([monthly, annual]);
  }
  assert.deepEqual(totals, [[4200, 50400], [900, 10800]]);
  assert.match(html, /\$5,100.00 MXN al mes \/ \$61,200.00 MXN al año/);
});

function model() {
  return {
    title: 'Propuesta de prueba', lead: 'Validación del documento completo.', folio: 'TEST-0123',
    meta: ['CLIENTE', 'FOLIO', 'FECHA', 'VIGENCIA'].map(label => ({ label, value: label === 'FOLIO' ? 'TEST-0123' : 'Demo' })),
    notice: 'Ejemplo ficticio.',
    sections: [{ title: '01 / Actividades', blocks: [{
      type: 'milestone', title: 'Etapa cerrada en pantalla', timing: 'Semana 1', hours: '12 h', amount: '$9,000.00 MXN',
      table: { kind: 'activity', headers: ['Actividad', 'Horas'], rows: [{ cells: ['Hidden stage activity', '12 h'] }], totals: [] }
    }] }],
    closing: { message: 'Gracias por considerar esta propuesta.', salutation: 'Atentamente,', name: 'Hazael Pérez', email: 'me@hazaelperez.com' }
  };
}
const signature = { data: fs.readFileSync(path.join(root, 'assets/firma.png')).toString('base64'), width: 47, height: 62 };

test('real PDF contains stage details, signature image and page numbers as text', () => {
  const pdf = create(model(), { jsPDF, signature });
  const raw = pdf.internal.pages.flat().join('\n');
  assert.match(raw, /Hidden stage activity/);
  assert.match(raw, /Atentamente/);
  assert.match(raw, /P.gina 1 de 1/);
  assert.match(pdf.output(), /\/Subtype \/Image/);
  assert.match(pdf.output(), /^%PDF-/);
  assert.equal(filename('../../Oferta 0123 / México'), 'Propuesta-Oferta-0123-Mexico.pdf');
  assert.throws(() => create(model(), { jsPDF }), /Signature/);
});

test('long descriptions paginate with repeated table headers and stay within A4 margins', () => {
  const data = model();
  data.sections[0].blocks = [{
    type: 'table', kind: 'cost', headers: ['Producto', 'Categoria', 'Descripcion', 'Mensual', 'Anual'],
    rows: [
      { cells: ['Oversized row', 'Demo', 'Long description. '.repeat(1000), '$100.00', '$1,200.00'] },
      ...Array.from({ length: 70 }, (_, i) => ({ cells: [`Producto ${i}`, 'Demo', 'Repeated text '.repeat(6), '$100.00', '$1,200.00'] }))
    ], totals: []
  }];
  const pdf = create(data, { jsPDF, signature });
  assert.ok(pdf.getNumberOfPages() > 5);
  const pages = pdf.internal.pages.slice(1).map(page => page.join('\n'));
  assert.ok(pages.filter(page => page.includes('(Descripcion)')).length > 5);
  for (const page of pages) {
    for (const [, x, y] of page.matchAll(/(-?[\d.]+) (-?[\d.]+) Td/g)) {
      assert.ok(Number(x) >= 40 && Number(x) <= 555, `x=${x}`);
      assert.ok(Number(y) >= 20 && Number(y) <= 823, `y=${y}`);
    }
  }
});

function controller({ missingLibrary = false, failImage = false, embedded = false } = {}) {
  let click;
  let ready;
  let readCount = 0;
  let downloads = 0;
  const events = [];
  const button = { hidden: true, disabled: false, textContent: 'Export to PDF', attrs: {},
    setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(name, fn) { click = fn; } };
  const status = { textContent: '' };
  const image = { naturalWidth: 100, naturalHeight: 131, decode: () => failImage ? Promise.reject(new Error('private diagnostics')) : new Promise(resolve => { ready = resolve; }) };
  const link = { click() { downloads++; }, remove() { events.push('remove'); } };
  const context = { drawImage() {}, fillRect() {} };
  const window = {
    parent: embedded ? { CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } } } : undefined,
    frameElement: embedded ? { id: 'quote-frame', dispatchEvent: event => events.push(event) } : undefined,
    jspdf: missingLibrary ? undefined : { jsPDF: {} },
    QuotePDF: {
      readProposal() { readCount++; return { folio: 'TEST-0123' }; },
      create() { return { output: () => new Blob(['%PDF-test']) }; }, filename
    },
    setTimeout(fn) { events.push(fn); },
    print() { throw new Error('Print must never be used'); }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'quotes/proposal.js'), 'utf8'), {
    window,
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL(url) { events.push(url); } },
    document: {
      getElementById: id => id === 'export-proposal' ? button : status,
      querySelector: () => image, body: { append() {} },
      createElement: tag => tag === 'a' ? link : { getContext: () => context, toDataURL: () => 'data:image/jpeg;base64,test' }
    }
  });
  return { button, status, link, events, click: () => click(), ready: () => ready(), get reads() { return readCount; }, get downloads() { return downloads; } };
}

test('export downloads once, ignores double clicks, preserves its label and releases the blob', async () => {
  const f = controller();
  const pending = f.click(); await f.click();
  assert.equal(f.button.disabled, true); assert.equal(f.reads, 1);
  assert.equal(f.button.textContent, 'Export to PDF');
  f.ready(); await pending;
  assert.equal(f.downloads, 1); assert.equal(f.link.download, 'Propuesta-TEST-0123.pdf');
  assert.equal(f.button.disabled, false); assert.equal(f.button.attrs['aria-busy'], 'false');
  assert.match(f.status.textContent, /PDF generado/);
  f.events.find(event => typeof event === 'function')();
  assert.ok(f.events.includes('blob:test'));
});

test('failed assets or unavailable library show a recoverable error without downloading or printing', async () => {
  for (const options of [{ missingLibrary: true }, { failImage: true }]) {
    const f = controller(options); await f.click();
    assert.equal(f.downloads, 0); assert.equal(f.button.disabled, false);
    assert.match(f.status.textContent, /Recarga la página/);
    assert.doesNotMatch(f.status.textContent, /private diagnostics/);
  }
});

test('embedded export forwards the PDF blob to its host while direct links keep their local download', async () => {
  const f = controller({ embedded: true });
  const pending = f.click(); f.ready(); await pending;
  assert.equal(f.downloads, 0);
  const event = f.events.find(event => event.type === 'quote-download-pdf');
  assert.equal(event.detail.filename, 'Propuesta-TEST-0123.pdf');
  assert.ok(event.detail.blob instanceof Blob);
  assert.match(f.status.textContent, /PDF generado/);
});
