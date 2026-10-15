/* Vanilla JavaScript. Local-only interactions; no tracking or network calls. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lang = 'es';
  let activeStep = 0;
  let toastTimer;

  const english = {
    skip: 'Skip to content', navAbout: 'About', navExpertise: 'Expertise', navJourney: 'Journey', navContact: 'Let’s talk',
    heroEyebrow: 'STRATEGY. ARCHITECTURE. IMPACT.', heroLine1: 'Cloud with', heroLine2: 'intention.',
    heroDescription: 'I connect business decisions with cloud architecture. From technical complexity to a clear next step.',
    heroCta: 'Let’s build what’s next', heroSecondary: 'Explore my approach', heroLocation: 'Monterrey, Mexico · Global perspective',
    identityLabel: 'YOUR NEXT CONVERSATION', stageNote: 'Designed to move forward.', scroll: 'SCROLL TO EXPLORE',
    stripLabel: 'ONE VISION. MULTIPLE CLOUDS.', stripFoot: 'The platform follows the strategy.',
    aboutIndex: 'PERSPECTIVE', aboutHeading: 'Technology matters.<br>What it enables, more.',
    aboutNote: 'An architect’s thinking.<br>A business conversation.', aboutLead: 'I’m Hazael, Customer Technology Advisor Cloud and Associate Director at Kyndryl Mexico.',
    aboutBody: 'I help organizations turn priorities into clear technology decisions: what to modernize, how to design it, and where to invest. My work connects strategy, architecture, and cloud economics to create a viable path from the current state to what the business needs.',
    aboutBody2: 'I combine depth in Azure with a perspective across AWS and Google Cloud, a strong foundation in software development, and a constant drive to simplify complexity. From discovery to architecture, from costs to the operating model.',
    linkedinCta: 'Explore my career on LinkedIn', expertiseIndex: 'FOCUS AREAS', expertiseHeading: 'Technical depth.<br>Clear direction.',
    expertiseIntro: 'The conversation starts with your challenge.<br>The architecture follows.', cloudTitle: 'Architecture that makes sense.',
    cloudBody: 'Cloud discovery, design, and modernization with explicit decisions about resilience, security, operations, and cost.',
    finopsTitle: 'Every decision has a cost.', finopsBody: 'Consumption visibility, right-sizing, and economic scenarios to prioritize improvements with evidence.',
    modernTitle: 'Modernization with purpose.', modernBody: 'Evolution paths for applications and platforms: migration, containers, managed services, and automation.',
    dataTitle: 'Data ready for what’s next.', dataBody: 'Architecture and capacity for analytics platforms. Data integration, performance, and consumption economics.',
    governTitle: 'Control that enables progress.', governBody: 'Governance, identity, and observability for operational visibility. Clear policies and defined responsibilities.',
    approachIndex: 'HOW I WORK', approachHeading: 'Understand first.<br>Then build.', approachIntro: 'A good technical answer starts with the right question.',
    step0: 'Understand the context', step1: 'Design the options', step2: 'Decide with evidence', step3: 'Support the evolution',
    consoleLabel: 'Console command', consoleHint: 'A little easter egg. Try: help, about, stack, contact.', consoleFootnote: 'Clarity from start to finish.',
    journeyIndex: 'PROFESSIONAL JOURNEY', journeyHeading: 'Experience that<br>connects perspectives.', journeyIntro: 'From technical detail<br>to strategic decisions.',
    present: 'CURRENTLY', oneYear: '1 YEAR', sixYears: '6 YEARS',
    kyndrylBody: 'Cloud technology advisory connecting client priorities, architecture, and business value. An integrated perspective on modernization, governance, and optimization.',
    inbestSubtitle: 'A new cloud perspective', inbestBody: 'A period of learning and collaboration that broadened my professional perspective, adding new challenges and connections to my technology journey.',
    bwdSubtitle: 'The foundation of my evolution', bwdBody: 'Six years of projects, teamwork, and professional growth. A period that built the foundations of how I approach problems and collaborate with others.',
    credentialsLabel: 'CONTINUOUS LEARNING', clientIndex: 'TRUST & DISCRETION', clientHeading: 'Different scales.<br>The same commitment.',
    clientBody: 'From Mexican SMBs to Fortune 500 companies. Every organization has its own context; all deserve the same depth of analysis.',
    ndaNote: 'Client identities and project details protected by non-disclosure agreements (NDAs).', smbLabel: 'Mexican SMBs',
    distributionNote: 'Distribution of clients served throughout my career.', contactIndex: 'NEXT STEP', contactEyebrow: 'A good conversation can change the direction.',
    contactHeading: 'Let’s talk about<br>what’s next<span>.</span>', footerLocation: 'Made with intention. From Monterrey.', backTop: 'Back to top',
    paletteTitle: 'Where shall we go?', paletteHint: 'Navigate with ↑ ↓ and Enter.'
  };
  const spanish = Object.fromEntries($$('[data-i18n]').map(el => [el.dataset.i18n, el.innerHTML]));
  const stages = {
    es: [
      {tag:'01 / DISCOVER', title:'El contexto define la solución.', body:'Prioridades de negocio, estado actual, restricciones y dependencias. Antes de hablar de servicios, entendamos qué debe cambiar y por qué.', checks:['Prioridades y criterios de éxito','Inventario y contexto operativo','Restricciones y dependencias']},
      {tag:'02 / DESIGN', title:'Más de un camino. Una dirección.', body:'Traducir necesidades en opciones de arquitectura. Comparar alternativas y hacer visibles sus implicaciones de seguridad, resiliencia, operación y costo.', checks:['Opciones y decisiones de arquitectura','Dependencias y modelo operativo','Trade-offs explícitos']},
      {tag:'03 / DECIDE', title:'La evidencia ordena las prioridades.', body:'Evaluar escenarios con datos de consumo, capacidad y costos. Distinguir oportunidades de hipótesis y construir una secuencia de decisiones con sustento.', checks:['Línea base técnica y económica','Escenarios y supuestos documentados','Prioridades y próximos pasos']},
      {tag:'04 / EVOLVE', title:'El valor se construye en el tiempo.', body:'Conectar la arquitectura con el roadmap. Definir responsables, puntos de validación y un ciclo de mejora para que la estrategia mantenga relación con la operación.', checks:['Roadmap y responsabilidades','Validaciones y seguimiento','Optimización continua']}
    ],
    en: [
      {tag:'01 / DISCOVER', title:'Context defines the solution.', body:'Business priorities, the current state, constraints, and dependencies. Before discussing services, understand what needs to change and why.', checks:['Priorities and success criteria','Inventory and operational context','Constraints and dependencies']},
      {tag:'02 / DESIGN', title:'More than one path. One direction.', body:'Translate needs into architecture options. Compare alternatives and make their security, resilience, operational, and cost implications visible.', checks:['Architecture options and decisions','Dependencies and operating model','Explicit trade-offs']},
      {tag:'03 / DECIDE', title:'Evidence sets the priorities.', body:'Evaluate scenarios with consumption, capacity, and cost data. Distinguish opportunities from hypotheses and build an evidence-based sequence of decisions.', checks:['Technical and economic baseline','Documented scenarios and assumptions','Priorities and next steps']},
      {tag:'04 / EVOLVE', title:'Value is built over time.', body:'Connect architecture to the roadmap. Define ownership, validation checkpoints, and an improvement cycle to keep strategy connected to operations.', checks:['Roadmap and responsibilities','Validation and follow-up','Continuous optimization']}
    ]
  };

  function setStage(index) {
    activeStep = index;
    const content = stages[lang][index];
    const tabs = $$('.approach-tab');
    tabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    $('#approach-panel').setAttribute('aria-labelledby', tabs[index].id);
    $('#terminal-stage').textContent = content.tag;
    $('#step-title').textContent = content.title;
    $('#step-description').textContent = content.body;
    const checks = $('#terminal-checks');
    checks.replaceChildren();
    content.checks.forEach(text => {
      const row = document.createElement('div');
      row.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>';
      row.append(document.createTextNode(text));
      checks.append(row);
    });
  }
  $$('.approach-tab').forEach((tab, index) => {
    tab.addEventListener('click', () => setStage(index));
    tab.addEventListener('keydown', e => {
      let next;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (index + 1) % 4;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (index + 3) % 4;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = 3;
      if (next !== undefined) { e.preventDefault(); setStage(next); $$('.approach-tab')[next].focus(); }
    });
  });

  function showToast(text) {
    $('#toast').textContent = text;
    $('#toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3000);
  }
  $('#language').addEventListener('click', () => {
    lang = lang === 'es' ? 'en' : 'es';
    const dictionary = lang === 'en' ? english : spanish;
    $$('[data-i18n]').forEach(el => { if (dictionary[el.dataset.i18n]) el.innerHTML = dictionary[el.dataset.i18n]; });
    document.documentElement.lang = lang;
    document.title = lang === 'es' ? 'Hazael Pérez — Cloud con intención.' : 'Hazael Pérez — Cloud with intention.';
    $('#language').innerHTML = `${lang === 'es' ? 'EN' : 'ES'}<span class="language-dot"></span>`;
    $('#language').setAttribute('aria-label', lang === 'es' ? 'Switch to English' : 'Cambiar a español');
    $('#console-input').placeholder = lang === 'es' ? 'Escribe help y presiona Enter' : 'Type help and press Enter';
    $('#copy-email').setAttribute('aria-label', lang === 'es' ? 'Copiar correo' : 'Copy email address');
    $('#command-trigger').setAttribute('aria-label', lang === 'es' ? 'Abrir navegación rápida' : 'Open quick navigation');
    $('#close-palette').setAttribute('aria-label', lang === 'es' ? 'Cerrar navegación rápida' : 'Close quick navigation');
    $('#menu-trigger').setAttribute('aria-label', lang === 'es' ? 'Abrir menú' : 'Open menu');
    $('.donut').setAttribute('aria-label', lang === 'es' ? 'Distribución de clientes: 50% Fortune 500, 30% Corporate y Enterprise, 20% SMBs de México' : 'Client distribution: 50% Fortune 500, 30% Corporate and Enterprise, 20% Mexican SMBs');
    $('.hero-stage').setAttribute('aria-label', lang === 'es' ? 'Visualización abstracta de una arquitectura cloud conectada' : 'Abstract visualization of connected cloud architecture');
    $('#console-form button').setAttribute('aria-label', lang === 'es' ? 'Ejecutar comando' : 'Run command');
    $('.approach-tabs').setAttribute('aria-label', lang === 'es' ? 'Enfoque de trabajo' : 'Working approach');
    $('.site-header .wordmark').setAttribute('aria-label', lang === 'es' ? 'Hazael Pérez, inicio' : 'Hazael Pérez, home');
    $('.footer .wordmark').setAttribute('aria-label', lang === 'es' ? 'Volver al inicio' : 'Back to home');
    setStage(activeStep);
  });

  const menu = $('#mobile-nav');
  function closeMenu() { menu.hidden = true; $('#menu-trigger').setAttribute('aria-expanded','false'); }
  $('#menu-trigger').addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    $('#menu-trigger').setAttribute('aria-expanded', String(!menu.hidden));
    if (!menu.hidden) menu.querySelector('a').focus();
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', e => { if (!e.target.closest('.site-header')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) {closeMenu(); $('#menu-trigger').focus();} });

  const dialog = $('#command-dialog');
  let paletteOpener;
  function openPalette() {
    if (dialog.open) return;
    paletteOpener = document.activeElement;
    dialog.showModal();
    $('.palette-links a').focus();
  }
  function closePalette() { dialog.close(); paletteOpener?.focus(); }
  $('#command-trigger').addEventListener('click', openPalette);
  $('#close-palette').addEventListener('click', closePalette);
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePalette(); } });
  $$('.palette-links a').forEach(link => link.addEventListener('click', () => {
    const target = $(link.getAttribute('href'));
    dialog.close();
    // Move focus to the section after navigation instead of leaving it in a closed dialog.
    requestAnimationFrame(() => { target.setAttribute('tabindex','-1'); target.focus({preventScroll:true}); });
  }));
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dialog.open ? closePalette() : openPalette(); }
  });
  dialog.addEventListener('keydown', e => {
    if (!['ArrowUp','ArrowDown','Home','End'].includes(e.key)) return;
    e.preventDefault();
    const links = $$('.palette-links a');
    const current = links.indexOf(document.activeElement);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? links.length - 1 : (current + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
    links[next].focus();
  });

  $('#copy-email').addEventListener('click', async () => {
    const email = 'me@hazaelperez.com';
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(email);
      showToast(lang === 'es' ? 'Correo copiado. Hablemos pronto.' : 'Email copied. Let’s talk soon.');
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents($('.email-link'));
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      showToast(lang === 'es' ? 'Correo seleccionado. Usa Copiar para guardarlo.' : 'Email selected. Use Copy to save it.');
    }
  });

  const commandResponses = {
    es: {help:'Comandos: about · stack · approach · contact · clear\nPista: Ctrl/⌘ + K abre la navegación rápida.', about:'Hazael Pérez / Associate Director · CTA Cloud, Kyndryl México.\nEstrategia, arquitectura y economía cloud.', stack:'Azure · AWS · Google Cloud\nFabric · Databricks · AKS / GKE · Arc · Entra ID\nArquitectura · Modernización · FinOps · Gobierno', approach:'1. Entender el contexto\n2. Diseñar las opciones\n3. Decidir con evidencia\n4. Acompañar la evolución', contact:'me@hazaelperez.com\nAbre la sección de contacto para iniciar una conversación.'},
    en: {help:'Commands: about · stack · approach · contact · clear\nTip: Ctrl/⌘ + K opens quick navigation.', about:'Hazael Pérez / Associate Director · CTA Cloud, Kyndryl Mexico.\nStrategy, architecture, and cloud economics.', stack:'Azure · AWS · Google Cloud\nFabric · Databricks · AKS / GKE · Arc · Entra ID\nArchitecture · Modernization · FinOps · Governance', approach:'1. Understand the context\n2. Design the options\n3. Decide with evidence\n4. Support the evolution', contact:'me@hazaelperez.com\nVisit the contact section to start a conversation.'}
  };
  $('#console-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#console-input');
    const raw = input.value.trim(); input.value = '';
    if (!raw) return;
    const output = $('#console-output');
    if (raw.toLowerCase() === 'clear') { output.replaceChildren(); return; }
    const entry = document.createElement('div');
    const echo = document.createElement('div'); echo.className = 'input-echo'; echo.textContent = `❯ ${raw}`;
    const result = document.createElement('div');
    const key = raw.toLowerCase();
    result.textContent = Object.hasOwn(commandResponses[lang], key) ? commandResponses[lang][key] : (lang === 'es' ? 'Comando no disponible. Escribe help para ver las opciones.' : 'Command unavailable. Type help to see the options.');
    entry.append(echo, result); output.append(entry);
    while (output.children.length > 12) output.firstElementChild.remove();
    output.scrollTop = output.scrollHeight;
  });
  $('#year').textContent = new Date().getFullYear();
  setStage(0);

  if ('IntersectionObserver' in window) {
    if (!motion.matches) {
      document.documentElement.classList.add('js-motion');
      const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {entry.target.classList.add('visible');revealObserver.unobserve(entry.target);}
      }), {threshold:.08});
      $$('.reveal').forEach(el => revealObserver.observe(el));
    }
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          $$('.nav-glass a').forEach(link => {
            const active = link.getAttribute('href') === `#${entry.target.id}`;
            link.classList.toggle('active', active);
            active ? link.setAttribute('aria-current','location') : link.removeAttribute('aria-current');
          });
        }
      });
    }, {rootMargin:'-20% 0px -55% 0px',threshold:0});
    $$('main section[id]').forEach(section => navObserver.observe(section));
  }
  if (window.matchMedia('(pointer: fine)').matches && !motion.matches) {
    $$('.bento-card').forEach(card => card.addEventListener('pointermove', e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    }));
  }

  // A lightweight architectural wireframe: no WebGL, libraries, or remote assets.
  const canvas = $('#cloud-orb');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let w = 0, h = 0, lastFrame = 0, angle = .45, frame = null, visible = true;
  const meshes = [];
  for (let lat = -75; lat <= 75; lat += 15) {
    const line = [], phi = lat * Math.PI / 180;
    for (let lon = 0; lon <= 360; lon += 4) {
      const theta = lon * Math.PI / 180;
      line.push([Math.cos(phi)*Math.cos(theta), Math.sin(phi), Math.cos(phi)*Math.sin(theta)]);
    }
    meshes.push(line);
  }
  for (let lon = 0; lon < 360; lon += 15) {
    const line = [], theta = lon * Math.PI / 180;
    for (let lat = -90; lat <= 90; lat += 4) {
      const phi = lat * Math.PI / 180;
      line.push([Math.cos(phi)*Math.cos(theta), Math.sin(phi), Math.cos(phi)*Math.sin(theta)]);
    }
    meshes.push(line);
  }
  const hubs = [[.15,.44],[.59,-.22],[1.7,.3],[2.65,-.48],[4.4,.17],[5.3,-.57]].map(([lon,lat])=>[Math.cos(lat)*Math.cos(lon),Math.sin(lat),Math.cos(lat)*Math.sin(lon)]);
  function project(point, radius, cx, cy) {
    const x = point[0] * Math.cos(angle) - point[2] * Math.sin(angle);
    const z = point[0] * Math.sin(angle) + point[2] * Math.cos(angle);
    const tilt = -.23;
    const y = point[1] * Math.cos(tilt) - z * Math.sin(tilt);
    const depth = point[1] * Math.sin(tilt) + z * Math.cos(tilt);
    const perspective = 1 + depth * .055;
    return {x:cx+x*radius*perspective,y:cy+y*radius*perspective,z:depth};
  }
  function draw() {
    ctx.clearRect(0,0,w,h);
    const radius = Math.min(w*.377,h*.35), cx = w*.5, cy = h*.445;
    const glow = ctx.createRadialGradient(cx,cy,0,cx,cy,radius*1.5);
    glow.addColorStop(0,'rgba(135,176,103,.075)');glow.addColorStop(.6,'rgba(90,130,60,.025)');glow.addColorStop(1,'rgba(80,100,60,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(-.4);
    ctx.beginPath();ctx.ellipse(0,0,radius*1.35,radius*.4,0,0,Math.PI*2);ctx.strokeStyle='rgba(179,210,150,.16)';ctx.lineWidth=.7;ctx.stroke();
    ctx.setLineDash([2,7]);ctx.beginPath();ctx.ellipse(0,0,radius*1.44,radius*.44,0,0,Math.PI*2);ctx.strokeStyle='rgba(179,210,150,.07)';ctx.stroke();ctx.restore();
    meshes.forEach(line => {
      for (let i=1;i<line.length;i++) {
        const a=project(line[i-1],radius,cx,cy),b=project(line[i],radius,cx,cy);
        const depth=(a.z+b.z)/2;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
        ctx.strokeStyle=`rgba(178,211,143,${depth>0?.10+depth*.24:.035})`;ctx.lineWidth=depth>.4?.7:.5;ctx.stroke();
      }
    });
    const rim=ctx.createLinearGradient(cx-radius,cy-radius,cx+radius,cy+radius);
    rim.addColorStop(0,'rgba(199,235,165,.09)');rim.addColorStop(.55,'rgba(199,235,165,.30)');rim.addColorStop(1,'rgba(199,235,165,.03)');
    ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.strokeStyle=rim;ctx.lineWidth=.6;ctx.stroke();
    hubs.forEach(point=>{const p=project(point,radius,cx,cy);if(p.z<.05)return;
      const glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,11);glow.addColorStop(0,'rgba(200,245,154,.30)');glow.addColorStop(1,'rgba(200,245,154,0)');ctx.fillStyle=glow;ctx.fillRect(p.x-11,p.y-11,22,22);
      ctx.beginPath();ctx.arc(p.x,p.y,2.1,0,Math.PI*2);ctx.fillStyle='#c7ec9f';ctx.fill();ctx.beginPath();ctx.arc(p.x,p.y,5.5,0,Math.PI*2);ctx.strokeStyle='rgba(199,236,159,.25)';ctx.lineWidth=.5;ctx.stroke();
    });
    // Registration marks reinforce the console-like visual without adding content noise.
    [[cx-radius*1.2,cy-radius*.8],[cx+radius*1.13,cy+radius*.8]].forEach(([x,y])=>{ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.strokeStyle='#a3c08755';ctx.lineWidth=.6;ctx.stroke();});
  }
  function tick(time) {
    if (time-lastFrame>40) { angle += .0015; draw(); lastFrame=time; }
    frame=requestAnimationFrame(tick);
  }
  function syncAnimation() {
    if(frame!==null) {cancelAnimationFrame(frame);frame=null;}
    if(!motion.matches && !document.hidden && visible) frame=requestAnimationFrame(tick); else draw();
  }
  function resize() {
    const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;
    const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();
  }
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncAnimation();}).observe(canvas);
  document.addEventListener('visibilitychange',syncAnimation);
  motion.addEventListener('change',()=>{if(motion.matches)document.documentElement.classList.remove('js-motion');syncAnimation();});
  resize();syncAnimation();
})();
