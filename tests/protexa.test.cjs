const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'quotes/protexa/1100.html'), 'utf8');
const number = value => Number(value.replace(/[^0-9.]/g, ''));

test('Protexa workbook activities reconcile at USD20/h with contingency separate', () => {
  const stages = [...html.matchAll(/<details class="milestone"[^>]*>([\s\S]*?)<\/details>/g)];
  assert.equal(stages.length, 6);
  const totals = stages.map(([, stage]) => {
    const hours = number(stage.match(/class="milestone-hours">([^<]+)/)[1]);
    const fee = number(stage.match(/class="milestone-amount">([^<]+)/)[1]);
    const table = stage.match(/<table[\s\S]*?<\/table>/)[0];
    const activities = [...table.matchAll(/<td>([0-9.]+) h<\/td>/g)];
    assert.equal(activities.reduce((sum, row) => sum + Number(row[1]), 0), hours);
    assert.equal(fee, hours * 20);
    assert.doesNotMatch(table, /\$/);
    return [hours, fee, activities.length];
  });
  assert.deepEqual(totals.map(row => row[0]), [7,12,19,12,14,8]);
  assert.equal(totals.slice(0,5).reduce((s,r)=>s+r[2],0), 25);
  assert.equal(totals.reduce((s,r)=>s+r[0],0), 72);
  assert.equal(totals.reduce((s,r)=>s+r[1],0), 1440);
  assert.match(html, /50% · Anticipo/);
  assert.equal((html.match(/USD 720/g)||[]).length, 2);
});

test('Protexa charts preserve units and source savings assumptions without inventing recurring costs', () => {
  assert.equal([...html.matchAll(/data-hours="([0-9.]+)"/g)].reduce((sum,r)=>sum+Number(r[1]),0),72);
  assert.match(html, /data-chart-detail="hours"/);
  assert.match(html, /data-chart-source="avoidable-costs" data-chart-max="120"/);
  assert.match(html, /data-monthly="108"/);
  assert.match(html, /data-monthly="0"/);
  assert.match(html, /13.33/);
  assert.match(html, /-\$144.00/);
  assert.equal(73 + 35, 108); assert.equal(108*12-1440,-144);
  assert.match(html, /no representa la factura completa/);
  assert.match(html, /por evaluar/);
  assert.match(html, /Vigencia comercial: por confirmar/);
});

test('Protexa uses shared assets, privacy metadata and actual PDF export without publishing its workbook', () => {
  for (const [, resource] of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)) assert.ok(fs.existsSync(path.join(root, resource)),resource);
  assert.match(html, /name="robots" content="noindex, nofollow, noarchive"/);
  assert.match(html, />Export to PDF<\/button>/);
  assert.match(html, /href="\/quotes\/"/);
  assert.doesNotMatch(html, /(?:href|src)="[^"]*\.xlsx|\{\{|window\.print/);
});
