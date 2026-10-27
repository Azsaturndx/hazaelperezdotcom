const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'cv/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'cv/cv.js'), 'utf8');

test('CV assets and anchor targets exist; PDF original is identified accurately', () => {
  for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"#]+)"/g)) assert.ok(fs.existsSync(path.join(root,url)),url);
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id),id);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.match(html, /Descargar CV original/);
  assert.match(html, /Esta versión digital incorpora las actualizaciones/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test('CV reflects supplied career corrections without inventing Onesec responsibilities', () => {
  assert.match(html, /datetime="2026-05"/);
  assert.match(html, /datetime="2025-08"/);
  assert.match(html, /datetime="2026-04"/);
  assert.match(html, /datetime="2024-09"/);
  const onesec = html.match(/<article class="cv-job cv-job-compact"[\s\S]*?<\/article>/)[0];
  assert.match(onesec,/datetime="2025-03"/); assert.match(onesec,/datetime="2025-07"/);
  assert.doesNotMatch(onesec,/Director|Architect|Arquitecto|Developer|Gerente/);
  assert.ok(html.indexOf('Kyndryl</strong>') < html.indexOf('<span>Dotech</span>'));
  assert.ok(html.indexOf('<span>Dotech</span>') < html.indexOf('<strong>Onesec</strong>'));
  assert.match(html,/no equivale a ventas cerradas/);
});

test('CV progressive enhancements toggle native jobs and keep reduced-motion content visible', () => {
  const callbacks = {};
  const jobs = [true,false,false].map(open=>({open,addEventListener(){}}));
  const button = { hidden:true,addEventListener(name,fn){callbacks[name]=fn;} };
  const progress = {style:{}};
  const links = [{hash:'#perfil',setAttribute(k,v){this[k]=v;},removeAttribute(k){delete this[k];}}];
  vm.runInNewContext(script, {
    document: {
      getElementById:()=>button,
      querySelector:()=>progress,
      querySelectorAll:selector=>selector==='main > section[id]'?[{id:'perfil',getBoundingClientRect:()=>({top:0})}]:selector==='.cv-nav a'?links:selector==='details.cv-job'?jobs:[],
      documentElement:{scrollHeight:2000,classList:{add(){throw Error('No motion in reduced mode');}}},addEventListener(){}
    },
    window:{matchMedia:()=>({matches:true}),addEventListener(){}},innerHeight:900,scrollY:0
  });
  assert.equal(button.hidden,false);
  callbacks.click(); assert.ok(jobs.every(j=>j.open)); assert.match(button.textContent,/Contraer/);
  callbacks.click(); assert.ok(jobs.every(j=>!j.open)); assert.match(button.textContent,/Expandir/);
  assert.equal(links[0]['aria-current'],'location');
});

test('homepage exposes the digital CV in desktop/mobile navigation and translated teaser', () => {
  const home = fs.readFileSync(path.join(root,'index.html'),'utf8');
  const translations = fs.readFileSync(path.join(root,'script.js'),'utf8');
  assert.ok((home.match(/href="\/cv\/"/g)||[]).length>=3);
  for (const key of ['navCv','cvInviteLabel','cvInviteTitle','cvInviteBody']) assert.ok(translations.includes(`${key}:`));
  const css = fs.readFileSync(path.join(root,'cv/cv.css'),'utf8');
  assert.match(css,/prefers-reduced-motion/); assert.match(css,/@media print/);
  assert.doesNotMatch(html, /https?:\/\/(?:fonts|cdn|unpkg)/);
});
