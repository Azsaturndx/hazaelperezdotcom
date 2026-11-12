const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { jsPDF } = require('../quotes/vendor/jspdf-4.2.1.umd.min.js');
const { readProposal, create } = require('../quotes/proposal-pdf.js');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'quotes/protexa/1101.html'), 'utf8');
const original = 'https://hazaelperez.com/quotes/protexa/1100.html';

test('PCR has six agreed tasks, preserves scope and only states its total at the end', () => {
  const table = html.match(/<tbody>([\s\S]*?)<\/tbody>/)[1];
  const hours = [...table.matchAll(/<td>([\d.]+) h<\/td>/g)].map(m => Number(m[1]));
  assert.deepEqual(hours, [0.5, 2, 0.5, 1, 0.5, 1]);
  assert.equal(hours.reduce((sum, value) => sum + value, 0), 5.5);
  assert.match(html, /<tfoot>[\s\S]*?5\.5 h/);
  assert.match(html, /la propuesta original se mantienen sin cambios/);
  assert.match(html, /SMTP corporativo que Protexa ya tiene/);
  const [before, after] = html.split('aria-labelledby="pcr-investment"');
  assert.doesNotMatch(before, /\bUSD\b|\$\d/);
  assert.deepEqual(after.match(/\b\d+ USD\b/g), ['160 USD']);
  assert.match(html, /noindex, nofollow, noarchive/);
  assert.match(html, /href="https:\/\/hazaelperez\.com\/quotes\/protexa\/1100\.html"/);
  for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"#]+)"/g)) assert.ok(fs.existsSync(path.join(root, url)), url);
});

test('PDF extracts the explicit reference and preserves a real clickable URL', () => {
  const p = (value, url) => ({ tagName: 'P', textContent: value, matches: () => false,
    querySelector: () => url ? { textContent: value, getAttribute: () => url } : null });
  const title = { textContent: 'Continuidad del correo de facturación.' };
  const closing = { querySelector: () => ({ textContent: 'Hazael Pérez' }) };
  const section = { querySelector: () => ({ textContent: '01 / Referencia' }), children: [p(original, original), p('160 USD'), p('No vincular', 'javascript:alert(1)')] };
  const article = {
    getAttribute: () => 'pcr',
    querySelector: selector => selector === '.proposal-closing' ? closing : title,
    querySelectorAll: selector => selector === '.proposal-section' ? [section] : [{ querySelector: () => ({ textContent: 'PTX-2026-PCR-01' }) }]
  };
  const model = readProposal({ querySelector: () => article });
  assert.equal(model.kind, 'pcr');
  assert.deepEqual(model.sections[0].blocks, [
    { type: 'reference', text: original, url: original },
    { type: 'paragraph', text: '160 USD' }, { type: 'paragraph', text: 'No vincular' }
  ]);
  const signature = { data: fs.readFileSync(path.join(root, 'assets/firma.png')).toString('base64'), width: 47, height: 58 };
  const doc = create(model, { jsPDF, signature });
  assert.match(doc.internal.pages.flat().join('\n'), /PROJECT CHANGE REQUEST/);
  assert.match(doc.output(), /\/Subtype \/Link.*\/URI \(https:\/\/hazaelperez\.com\/quotes\/protexa\/1100\.html\)/s);
  assert.doesNotMatch(doc.output(), /javascript:alert/);
});
