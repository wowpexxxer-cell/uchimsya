(() => {
  'use strict';

  const { ALPHABET: A, BY_LETTER, STAGES, NUMBERS, THINGS, PHRASES, translit } = window.COURSE;
  const V = window.Voice;
  const COLORS = ['#F2544B', '#FF8A3D', '#E8A400', '#3DBE6B', '#14B8A6', '#3AA7F0', '#6366F1', '#A855F7', '#EC4899'];
  const colorOf = (i) => COLORS[((i % COLORS.length) + COLORS.length) % COLORS.length];
  const letterColor = (l) => colorOf(A.findIndex(x => x.l === l));
  const AVATARS = ['🦊', '🐻', '🐰', '🐼', '🐯', '🦁', '🐸', '🐨', '🦄', '🐱'];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const view = $('#view');
  const titleEl = $('#title');
  const backBtn = $('#back');
  const progEl = $('#prog');
  const whoBtn = $('#who');
  const starsEl = $('#stars');
  const starsNum = $('#stars-num');

  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const uniq = (a) => Array.from(new Set(a));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  /* ---------------- голос: удобные обёртки ---------------- */
  const ph = (k) => [k, PHRASES[k]];
  const letterSay = (l) => { const x = BY_LETTER[l]; return ['letter-' + x.k, x.name]; };
  const wordSay = (l) => { const x = BY_LETTER[l]; return ['word-' + x.k, x.word]; };
  const sylSay = (s) => ['syl-' + translit(s), s.toLowerCase()];
  const swSay = (w) => ['sw-' + translit(w), w];
  const numSay = (n) => ['num-' + n, NUMBERS[n]];
  const praise = () => ph(['ph-great', 'ph-good', 'ph-super', 'ph-yes'][Math.floor(Math.random() * 4)]);

  /* ---------------- профили (хранятся на этом устройстве) ---------------- */
  const KEY = 'uchimsya.v2';
  let db = { profiles: [], current: null };
  try { db = Object.assign(db, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { /* без сохранения */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* ignore */ } };
  const me = () => db.profiles.find(p => p.id === db.current) || null;
  function newProfile(name, avatar) {
    const p = { id: 'p' + Date.now().toString(36), name, avatar, lessons: {}, wrote: {}, bonus: 0, unlockAll: false };
    db.profiles.push(p); db.current = p.id; save(); return p;
  }
  const totalStars = (p) => p ? Object.values(p.lessons).reduce((s, v) => s + v, 0) + Object.values(p.wrote).reduce((s, v) => s + v, 0) + (p.bonus || 0) : 0;
  function updateHeader(bump) {
    const p = me();
    whoBtn.hidden = !p; starsEl.hidden = !p;
    if (!p) return;
    whoBtn.innerHTML = `<span class="ava">${p.avatar}</span><span class="who-name">${esc(p.name)}</span>`;
    starsNum.textContent = totalStars(p);
    if (bump) { starsEl.classList.remove('bump'); void starsEl.offsetWidth; starsEl.classList.add('bump'); }
  }

  /* ---------------- курс: что открыто ---------------- */
  const stageById = (id) => STAGES.find(s => s.id === id);
  const isDone = (p, id) => (p.lessons[id] || 0) > 0;
  const stageDone = (p, st) => st.lessons.every(l => isDone(p, l.id));
  function unlocked(p, st, i) {
    if (p.unlockAll) return true;
    if (st.requires && !stageDone(p, stageById(st.requires))) return false;
    return i === 0 || isDone(p, st.lessons[i - 1].id);
  }
  function nextLesson(p) {
    for (const st of STAGES) for (let i = 0; i < st.lessons.length; i++) {
      if (!isDone(p, st.lessons[i].id) && unlocked(p, st, i)) return { st, i };
    }
    return null;
  }

  /* ---------------- звуки и салют ---------------- */
  let ac = null;
  function tone(freqs, dur = 0.14, type = 'sine', gap = 0.09) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      freqs.forEach((f, k) => {
        const o = ac.createOscillator(), g = ac.createGain();
        const t = ac.currentTime + k * gap;
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
      });
    } catch (e) { /* ignore */ }
  }
  const sfx = {
    tap: () => tone([660], 0.07, 'triangle'),
    good: () => tone([523, 659, 784, 1047], 0.18, 'triangle'),
    bad: () => tone([220, 180], 0.16, 'sine', 0.12),
    whoosh: () => tone([300, 420, 560], 0.1, 'triangle', 0.05)
  };
  const cf = $('#confetti'), cx = cf.getContext('2d');
  let parts = [], raf = 0;
  function confetti(n = 120) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const dpr = window.devicePixelRatio || 1;
    cf.width = innerWidth * dpr; cf.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = 0; i < n; i++) {
      parts.push({ x: innerWidth / 2 + (Math.random() - .5) * 240, y: innerHeight * .45, vx: (Math.random() - .5) * 16, vy: -Math.random() * 16 - 6, r: Math.random() * 6 + 5, a: Math.random() * 6, va: (Math.random() - .5) * .4, c: COLORS[i % COLORS.length], life: 0 });
    }
    if (!raf) raf = requestAnimationFrame(step);
  }
  function step() {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => p.life < 140 && p.y < innerHeight + 40);
    for (const p of parts) {
      p.life++; p.vy += .45; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c; cx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); cx.restore();
    }
    raf = parts.length ? requestAnimationFrame(step) : 0;
    if (!raf) cx.clearRect(0, 0, innerWidth, innerHeight);
  }

  /* ---------------- иконки и совёнок ---------------- */
  const ico = {
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1-5L16 4l4 4L9 19l-5 1z"/><path d="M13.5 6.5l4 4"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 001.5.9l12-7.5a1 1 0 000-1.8l-12-7.5A1 1 0 007 4.5z"/></svg>',
    erase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    again: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V8a5 5 0 0110 0v2h1a1 1 0 011 1v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9a1 1 0 011-1h1zm2 0h6V8a3 3 0 00-6 0v2z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M4 5a2 2 0 012-2h5v17H6a2 2 0 01-2-2V5zM20 5a2 2 0 00-2-2h-5v17h5a2 2 0 002-2V5z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'
  };
  const OWL = `<svg class="owl" viewBox="0 0 120 124" aria-hidden="true">
    <path d="M26 30 L34 8 L46 24 Z M94 30 L86 8 L74 24 Z" fill="#A9622F"/>
    <ellipse cx="22" cy="76" rx="12" ry="26" fill="#A9622F" transform="rotate(14 22 76)"/>
    <ellipse cx="98" cy="76" rx="12" ry="26" fill="#A9622F" transform="rotate(-14 98 76)"/>
    <ellipse cx="60" cy="68" rx="42" ry="48" fill="#C97B42"/>
    <ellipse cx="60" cy="86" rx="27" ry="27" fill="#F8DDB5"/>
    <path d="M48 80q4 4 8 0M64 80q4 4 8 0M54 92q4 4 8 0" stroke="#E4B987" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <circle cx="43" cy="52" r="18" fill="#F8DDB5"/><circle cx="77" cy="52" r="18" fill="#F8DDB5"/>
    <g class="eyes"><circle cx="43" cy="52" r="13" fill="#fff"/><circle cx="77" cy="52" r="13" fill="#fff"/>
    <circle cx="45" cy="53" r="7.5" fill="#22304A"/><circle cx="75" cy="53" r="7.5" fill="#22304A"/>
    <circle cx="47.5" cy="50" r="2.6" fill="#fff"/><circle cx="77.5" cy="50" r="2.6" fill="#fff"/></g>
    <path d="M54 64h12l-6 10z" fill="#FFB800"/>
    <circle cx="32" cy="66" r="5" fill="#F59E8B" opacity=".55"/><circle cx="88" cy="66" r="5" fill="#F59E8B" opacity=".55"/>
    <path d="M44 114q4 6 8 0M68 114q4 6 8 0" stroke="#FFB800" stroke-width="5" fill="none" stroke-linecap="round"/>
  </svg>`;
  const helper = (text, cls = '') => `<div class="helper ${cls}">${OWL}<div class="bubble">${text}</div></div>`;

  /* ---------------- навигация ---------------- */
  const stack = [];
  let current = null, cleanup = null;
  function go(name, arg, replace) {
    if (current && !replace) stack.push(current);
    current = { name, arg };
    render();
  }
  function back() {
    sfx.tap();
    current = stack.pop() || { name: me() ? 'map' : 'profiles' };
    render();
  }
  function home() { stack.length = 0; current = { name: me() ? 'map' : 'profiles' }; render(); }
  backBtn.addEventListener('click', back);
  whoBtn.addEventListener('click', () => { sfx.tap(); go('parents'); });
  function render() {
    if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
    V.stop();
    const { name, arg } = current;
    document.body.dataset.view = name;
    backBtn.hidden = name === 'map' || (name === 'profiles' && !me());
    backBtn.innerHTML = name === 'lesson' ? ico.close : ico.left;
    backBtn.setAttribute('aria-label', name === 'lesson' ? 'Закрыть урок' : 'Назад');
    progEl.hidden = name !== 'lesson'; titleEl.hidden = name === 'lesson';
    view.scrollTop = 0;
    updateHeader(false);
    VIEWS[name](arg);
  }

  /* ================= ПРОФИЛИ ================= */
  function profiles() {
    titleEl.textContent = 'Учимся играя';
    view.innerHTML = `
      <section class="profiles">
        ${helper('Кто будет учиться?', 'big')}
        <div class="kid-grid">
          ${db.profiles.map(p => `
            <button class="kid" data-id="${p.id}">
              <span class="kid-ava">${p.avatar}</span>
              <b>${esc(p.name)}</b>
              <small>★ ${totalStars(p)}</small>
            </button>`).join('')}
          <button class="kid add" id="add"><span class="kid-ava">${ico.plus}</span><b>Новый ученик</b><small>&nbsp;</small></button>
        </div>
      </section>`;
    $$('.kid[data-id]').forEach(b => b.addEventListener('click', () => {
      db.current = b.dataset.id; save(); sfx.good(); stack.length = 0; current = { name: 'map' }; render();
      V.say([ph('ph-hello')]);
    }));
    $('#add').addEventListener('click', () => { sfx.tap(); go('newKid'); });
    if (!db.profiles.length) setTimeout(() => V.say([ph('ph-who')]), 300);
  }

  function newKid() {
    titleEl.textContent = 'Новый ученик';
    let ava = AVATARS[db.profiles.length % AVATARS.length];
    view.innerHTML = `
      <section class="new-kid">
        <form class="panel" id="f" autocomplete="off">
          <label for="kid-name">Как зовут ребёнка?</label>
          <input id="kid-name" maxlength="20" placeholder="Например, Маша" enterkeyhint="done">
          <span class="label">Выбери зверька</span>
          <div class="ava-grid">${AVATARS.map(a => `<button type="button" class="ava-pick" aria-pressed="${a === ava}" data-a="${a}">${a}</button>`).join('')}</div>
          <button class="pill-btn big" style="--c:#3DBE6B" id="go" disabled>${ico.play} Поехали!</button>
          <p class="note">Прогресс сохраняется на этом планшете. Можно завести несколько учеников.</p>
        </form>
      </section>`;
    const inp = $('#kid-name'), goB = $('#go');
    inp.addEventListener('input', () => { goB.disabled = !inp.value.trim(); });
    $$('.ava-pick').forEach(b => b.addEventListener('click', () => { ava = b.dataset.a; sfx.tap(); $$('.ava-pick').forEach(o => o.setAttribute('aria-pressed', o === b)); }));
    $('#f').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = inp.value.trim(); if (!name) return;
      newProfile(name, ava); sfx.good(); confetti(80);
      stack.length = 0; current = { name: 'map' }; render();
      V.say([ph('ph-hello')]);
    });
    setTimeout(() => inp.focus(), 100);
  }

  /* ================= КАРТА УРОКОВ ================= */
  function map() {
    const p = me(); if (!p) return go('profiles', null, true);
    titleEl.textContent = 'Учимся играя';
    const nx = nextLesson(p);
    const greet = nx
      ? `Привет, ${esc(p.name)}! ${Object.keys(p.lessons).length ? 'Продолжим?' : 'Начнём с первого урока!'}`
      : `${esc(p.name)}, все уроки пройдены! Скоро будут новые.`;
    view.innerHTML = `
      <section class="map">
        <div class="hero">
          ${helper(greet, 'big')}
          <div class="hero-actions">
            ${nx ? `<button class="pill-btn big" style="--c:${nx.st.color}" id="cont">${ico.play} ${Object.keys(p.lessons).length ? 'Продолжить' : 'Начать'}</button>` : ''}
            <button class="pill-btn ghost" id="free">${ico.book} Все буквы</button>
            <button class="pill-btn ghost" id="game">Игра «Какая буква?»</button>
          </div>
        </div>
        ${STAGES.map(st => {
          const done = st.lessons.filter(l => isDone(p, l.id)).length;
          const locked = !p.unlockAll && st.requires && !stageDone(p, stageById(st.requires));
          return `
          <div class="stage ${locked ? 'locked' : ''}" style="--c:${st.color}">
            <div class="stage-head">
              <h3>${st.title}</h3>
              <span class="stage-count">${locked ? `${ico.lock} откроется после этапа «${stageById(st.requires).title}»` : `${done} из ${st.lessons.length}`}</span>
            </div>
            <div class="path" data-stage="${st.id}">
              <svg class="trail" aria-hidden="true"></svg>
              ${st.lessons.map((l, i) => {
                const un = unlocked(p, st, i), dn = isDone(p, l.id);
                const cur = nx && nx.st === st && nx.i === i;
                const x = Math.round(Math.sin(i * 1.15) * 12);
                return `
                <div class="node-wrap" style="--x:${x}">
                  ${cur ? `<div class="here">${OWL}</div>` : ''}
                  <button class="node ${dn ? 'done' : ''} ${un ? '' : 'off'} ${cur ? 'cur' : ''} ${l.type}" data-st="${st.id}" data-i="${i}" aria-label="Урок ${i + 1}: ${esc(l.title)}${un ? '' : ', закрыт'}">
                    ${un ? `<span class="nlabel">${esc(l.title)}</span>` : ico.lock}
                  </button>
                  <div class="nstars">${dn ? '<span>★</span>'.repeat(p.lessons[l.id]) + '<span class="off">★</span>'.repeat(3 - p.lessons[l.id]) : ''}</div>
                </div>`;
              }).join('')}
            </div>
          </div>`;
        }).join('')}
      </section>`;
    const startLesson = (st, i) => { sfx.tap(); go('lesson', { stage: st.id, i }); };
    if (nx) $('#cont').addEventListener('click', () => startLesson(nx.st, nx.i));
    $('#free').addEventListener('click', () => { sfx.tap(); go('abc'); });
    $('#game').addEventListener('click', () => { sfx.tap(); go('game'); });
    $$('.node').forEach(b => b.addEventListener('click', () => {
      const st = stageById(b.dataset.st), i = +b.dataset.i;
      if (!unlocked(p, st, i)) { sfx.bad(); b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle'); V.say([ph('ph-locked')]); return; }
      startLesson(st, i);
    }));
    const draw = () => $$('.path').forEach(drawTrail);
    const ro = new ResizeObserver(draw); ro.observe(view);
    cleanup = () => ro.disconnect();
    draw();
    const cur = $('.node.cur');
    if (cur && Object.keys(p.lessons).length) setTimeout(() => cur.scrollIntoView({ block: 'center', behavior: 'smooth' }), 200);
  }
  function drawTrail(path) {
    const svg = $('.trail', path), r0 = path.getBoundingClientRect();
    const pts = $$('.node', path).map(n => { const r = n.getBoundingClientRect(); return [r.left - r0.left + r.width / 2, r.top - r0.top + r.height / 2]; });
    svg.setAttribute('viewBox', `0 0 ${r0.width} ${r0.height}`);
    let d = '';
    pts.forEach(([x, y], i) => {
      if (!i) { d += `M${x} ${y}`; return; }
      const [px, py] = pts[i - 1], my = (py + y) / 2;
      d += ` C${px} ${my} ${x} ${my} ${x} ${y}`;
    });
    svg.innerHTML = `<path d="${d}" class="trail-bg"/><path d="${d}" class="trail-dash"/>`;
  }

  /* ================= УРОК ================= */
  function buildSteps(st, li) {
    const L = st.lessons[li];
    const steps = [];
    if (L.type === 'letters') {
      const before = st.lessons.slice(0, li).flatMap(x => x.letters);
      for (const l of L.letters) { steps.push({ t: 'learn', l }); steps.push({ t: 'trace', ch: l, color: letterColor(l) }); }
      const confuse = { 'Е': 'Ё', 'Ё': 'Е', 'И': 'Й', 'Й': 'И', 'Ш': 'Щ', 'Щ': 'Ш', 'Ь': 'Ъ', 'Ъ': 'Ь' };
      const opts = (target) => shuffle(uniq([target, ...L.letters, ...shuffle(before.filter(b => b !== confuse[target])).slice(0, 1)])).slice(0, 4);
      const quiz = [];
      const targets = shuffle([...L.letters, ...L.letters]).slice(0, 5);
      for (const t of targets) quiz.push({ t: 'pick', l: t, opts: shuffle(uniq([t, ...opts(t)])).slice(0, 4) });
      for (const l of L.letters) if (BY_LETTER[l].word[0] === l) quiz.push({ t: 'first', l, opts: shuffle(uniq([l, ...opts(l)])).slice(0, 4) });
      steps.push(...shuffle(quiz));
    } else if (L.type === 'syllables') {
      for (const s of L.syl) steps.push({ t: 'merge', s });
      for (const s of shuffle([...L.syl]).slice(0, 4)) steps.push({ t: 'pickSyl', s, opts: shuffle([s, ...shuffle(L.syl.filter(o => o !== s)).slice(0, 2)]) });
      for (const w of L.words) {
        const extra = shuffle(L.syl.filter(o => o !== w[0] && o !== w[1]))[0];
        steps.push({ t: 'build', w, tiles: shuffle([w[0], w[1], extra]) });
      }
    } else if (L.type === 'math') {
      for (const n of L.nums) { steps.push({ t: 'numLearn', n }); steps.push({ t: 'trace', ch: String(n), color: colorOf(n), digit: true }); }
      const max = Math.max(...L.nums);
      for (let k = 0; k < 4; k++) {
        const n = k < L.nums.length ? L.nums[k] : 1 + Math.floor(Math.random() * max);
        const near = shuffle([n - 2, n - 1, n + 1, n + 2].filter(v => v >= 1 && v <= 10)).slice(0, 2);
        steps.push({ t: 'count', n, opts: shuffle([n, ...near]), thing: THINGS[Math.floor(Math.random() * THINGS.length)] });
      }
    }
    return steps;
  }

  function lesson({ stage, i }) {
    const p = me(); const st = stageById(stage); const L = st.lessons[i];
    const steps = buildSteps(st, i);
    let k = 0, mistakes = 0, timer = 0, sub = null;
    const later = (fn, ms) => { clearTimeout(timer); timer = setTimeout(fn, ms); };
    cleanup = () => { clearTimeout(timer); if (sub) sub(); };
    const bar = $('i', progEl);
    const miss = () => { mistakes++; };
    const next = () => { k++; k < steps.length ? show() : finish(); };

    function show() {
      if (sub) { sub(); sub = null; }
      bar.style.width = Math.round(k / steps.length * 100) + '%';
      bar.style.background = st.color;
      const s = steps[k];
      view.scrollTop = 0;
      sub = STEP[s.t](s, { next, miss, later }) || null;
    }
    function finish() {
      bar.style.width = '100%';
      const n = mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1;
      const wasStageDone = stageDone(p, st);
      if (n > (p.lessons[L.id] || 0)) p.lessons[L.id] = n;
      save(); updateHeader(true);
      const stageNow = !wasStageDone && stageDone(p, st);
      confetti(stageNow ? 260 : 180); sfx.good();
      view.innerHTML = `
        <section class="result">
          ${helper(stageNow && st.id === 'letters' ? 'Ура! Все буквы пройдены! Теперь открыты слоги и счёт.' : 'Урок пройден! Ты молодец!', 'big')}
          <div class="big-stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(3 - n)}</span></div>
          <div class="card-nav">
            <button class="pill-btn big" style="--c:${st.color}" id="tomap">${ico.check} Дальше</button>
            <button class="pill-btn ghost" id="again">${ico.again} Ещё раз</button>
          </div>
        </section>`;
      V.say([ph(stageNow && st.id === 'letters' ? 'ph-stage-done' : 'ph-lesson-done')]);
      $('#tomap').addEventListener('click', () => { sfx.tap(); home(); });
      $('#again').addEventListener('click', () => { sfx.tap(); go('lesson', { stage, i }, true); });
    }
    show();
  }

  /* ---------- шаги урока ---------- */
  const nextBtn = (c = '#3DBE6B') => `<button class="pill-btn big next" style="--c:${c}" id="next">Дальше ${ico.right}</button>`;
  function correct(btn, after, ctl, say) {
    sfx.good(); if (btn) btn.classList.add('right'); confetti(40);
    V.say(say || [praise()]);
    ctl.later(ctl.next, after);
  }
  function wrong(btn, ctl) {
    sfx.bad(); ctl.miss(); btn.classList.add('wrong');
    V.say([ph('ph-try')]);
  }

  const STEP = {
    learn(s, ctl) {
      const x = BY_LETTER[s.l], c = letterColor(s.l);
      const k = x.word.toUpperCase().indexOf(s.l);
      const word = esc(x.word.slice(0, k)) + `<mark style="--c:${c}">${esc(x.word[k])}</mark>` + esc(x.word.slice(k + 1));
      view.innerHTML = `
        <section class="step">
          ${helper(`Это буква <b style="color:${c}">${s.l}</b>`)}
          <div class="card-main">
            <button class="mag big-mag" style="--c:${c}" id="say"><span class="pair">${s.l}<small>${s.l.toLowerCase()}</small></span></button>
            <button class="pic" id="sayw"><div class="emoji">${x.pic}</div><div class="word">${word}</div></button>
          </div>
          <div class="card-nav">
            <button class="pill-btn" style="--c:#3AA7F0" id="listen">${ico.sound} Послушать</button>
            ${nextBtn()}
          </div>
        </section>`;
      const all = () => V.say([letterSay(s.l), wordSay(s.l)]);
      $('#say').addEventListener('click', () => V.say([letterSay(s.l)]));
      $('#sayw').addEventListener('click', () => V.say([wordSay(s.l)]));
      $('#listen').addEventListener('click', all);
      $('#next').addEventListener('click', () => { sfx.tap(); ctl.next(); });
      ctl.later(() => V.say([ph('ph-this-letter'), letterSay(s.l), wordSay(s.l)]), 250);
    },

    trace(s, ctl) {
      view.innerHTML = `
        <section class="step">
          ${helper(s.digit ? 'Обведи цифру пальчиком' : 'Обведи букву пальчиком')}
          <div class="trace-wrap">
            <div class="paper" id="paper"><canvas class="guide"></canvas><canvas class="ink"></canvas></div>
            <div class="trace-tools">
              <button class="pill-btn ghost" id="clear">${ico.erase} Стереть</button>
              <div class="write-msg" id="msg"></div>
              <button class="pill-btn big" style="--c:#3DBE6B" id="done">${ico.check} Готово</button>
            </div>
          </div>
        </section>`;
      const tr = tracer($('#paper'), s.ch, s.color);
      const msg = $('#msg');
      $('#clear').addEventListener('click', () => { sfx.tap(); tr.clear(); msg.textContent = ''; });
      $('#done').addEventListener('click', () => {
        if (!tr.count()) { V.say([ph(s.digit ? 'ph-trace-digit' : 'ph-trace')]); return; }
        const n = tr.stars();
        if (!n) { sfx.bad(); ctl.miss(); msg.className = 'write-msg'; msg.textContent = 'Почти! Обведи до конца'; V.say([ph('ph-almost')]); return; }
        const p = me();
        if (!s.digit && n > (p.wrote[s.ch] || 0)) { p.wrote[s.ch] = n; save(); updateHeader(true); }
        msg.className = 'write-msg good'; msg.innerHTML = `<span class="big-stars">${'★'.repeat(n)}</span>`;
        $('#done').disabled = true;
        correct(null, 1600, ctl);
      });
      ctl.later(() => V.say([ph(s.digit ? 'ph-trace-digit' : 'ph-trace')]), 250);
      return tr.destroy;
    },

    pick(s, ctl) {
      view.innerHTML = `
        <section class="step">
          ${helper('Послушай и найди букву')}
          <button class="speaker" id="hear" aria-label="Послушать ещё раз">${ico.sound}</button>
          <div class="options">${s.opts.map(o => `<button class="mag" style="--c:${letterColor(o)}" data-v="${o}">${o}</button>`).join('')}</div>
        </section>`;
      const hear = () => V.say([letterSay(s.l)]);
      $('#hear').addEventListener('click', hear);
      let busy = false;
      $$('.options .mag').forEach(b => b.addEventListener('click', () => {
        if (busy) return;
        if (b.dataset.v === s.l) { busy = true; correct(b, 1300, ctl, [letterSay(s.l), praise()]); } else wrong(b, ctl);
      }));
      ctl.later(() => V.say([ph('ph-pick-letter'), letterSay(s.l)]), 250);
    },

    first(s, ctl) {
      const x = BY_LETTER[s.l];
      view.innerHTML = `
        <section class="step">
          ${helper('С какой буквы начинается слово?')}
          <button class="q" id="hear"><div class="emoji">${x.pic}</div><div class="word"><span class="hole" id="hole">?</span>${esc(x.word.slice(1))}</div></button>
          <div class="options">${s.opts.map(o => `<button class="mag" style="--c:${letterColor(o)}" data-v="${o}">${o}</button>`).join('')}</div>
        </section>`;
      $('#hear').addEventListener('click', () => V.say([wordSay(s.l)]));
      let busy = false;
      $$('.options .mag').forEach(b => b.addEventListener('click', () => {
        if (busy) return;
        if (b.dataset.v === s.l) {
          busy = true; const h = $('#hole'); h.textContent = s.l; h.classList.add('filled');
          correct(b, 1500, ctl, [wordSay(s.l), praise()]);
        } else wrong(b, ctl);
      }));
      ctl.later(() => V.say([ph('ph-first-letter'), wordSay(s.l)]), 250);
    },

    merge(step, ctl) {
      const s = step.s;
      const c1 = letterColor(s[0]), c2 = letterColor(s[1]);
      view.innerHTML = `
        <section class="step">
          ${helper('Нажми на букву, и она побежит к подружке')}
          <div class="merge" id="m">
            <button class="mag m1" style="--c:${c1}" id="go">${s[0]}</button>
            <svg class="hill" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 50 Q100 -10 200 50" fill="none" stroke="#B9C4D6" stroke-width="5" stroke-dasharray="10 10" stroke-linecap="round"/></svg>
            <span class="mag m2" style="--c:${c2}">${s[1]}</span>
            <div class="syl-done" id="sd"><span style="color:${c1}">${s[0]}</span><span style="color:${c2}">${s[1]}</span></div>
          </div>
          <div class="card-nav" id="after" hidden>
            <button class="pill-btn" style="--c:#3AA7F0" id="rep">${ico.sound} Ещё раз</button>
            ${nextBtn()}
          </div>
        </section>`;
      const m = $('#m');
      let done = false;
      const run = () => {
        if (done) { V.say([sylSay(s)]); return; }
        done = true; sfx.whoosh();
        V.say([letterSay(s[0])]);
        const m1 = $('.m1', m), m2 = $('.m2', m);
        m1.style.transform = `translateX(${m2.offsetLeft - m1.offsetLeft - m1.offsetWidth + 8}px)`;
        ctl.later(() => { m.classList.add('joined'); sfx.good(); V.say([sylSay(s)]); $('#after').hidden = false; }, 900);
      };
      $('#go').addEventListener('click', run);
      $('#rep').addEventListener('click', () => V.say([letterSay(s[0]), letterSay(s[1]), sylSay(s)]));
      $('#next').addEventListener('click', () => { sfx.tap(); ctl.next(); });
      ctl.later(() => V.say([ph('ph-merge')]), 250);
    },

    pickSyl(s, ctl) {
      view.innerHTML = `
        <section class="step">
          ${helper('Послушай и найди слог')}
          <button class="speaker" id="hear" aria-label="Послушать ещё раз">${ico.sound}</button>
          <div class="options syl">${s.opts.map((o, i) => `<button class="mag wide" style="--c:${colorOf(i * 3 + 5)}" data-v="${o}">${o}</button>`).join('')}</div>
        </section>`;
      $('#hear').addEventListener('click', () => V.say([sylSay(s.s)]));
      let busy = false;
      $$('.options .mag').forEach(b => b.addEventListener('click', () => {
        if (busy) return;
        if (b.dataset.v === s.s) { busy = true; correct(b, 1300, ctl, [sylSay(s.s), praise()]); } else wrong(b, ctl);
      }));
      ctl.later(() => V.say([ph('ph-pick-syl'), sylSay(s.s)]), 250);
    },

    build(s, ctl) {
      const [a, b, word, pic] = s.w;
      view.innerHTML = `
        <section class="step">
          ${helper('Собери слово из слогов')}
          <button class="q" id="hear"><div class="emoji">${pic}</div>
            <div class="slots"><span class="slot" id="s0"></span><span class="dash">-</span><span class="slot" id="s1"></span></div>
          </button>
          <div class="options syl">${s.tiles.map((o, i) => `<button class="mag wide" style="--c:${colorOf(i * 2 + 1)}" data-v="${o}">${o}</button>`).join('')}</div>
        </section>`;
      const need = [a, b]; let pos = 0;
      $('#hear').addEventListener('click', () => V.say(pos ? [sylSay(need[0])] : [swSay(word)]));
      $$('.options .mag').forEach(t => t.addEventListener('click', () => {
        if (pos >= 2 || t.classList.contains('used')) return;
        if (t.dataset.v === need[pos]) {
          sfx.tap(); t.classList.add('used');
          const sl = $('#s' + pos); sl.textContent = need[pos]; sl.classList.add('filled');
          V.say([sylSay(need[pos])]);
          pos++;
          if (pos === 2) correct(null, 1900, ctl, [sylSay(a), sylSay(b), swSay(word), praise()]);
        } else wrong(t, ctl);
      }));
      ctl.later(() => V.say([ph('ph-build')]), 250);
    },

    numLearn(s, ctl) {
      const thing = THINGS[(s.n * 5) % THINGS.length];
      view.innerHTML = `
        <section class="step">
          ${helper(`Это цифра <b style="color:${colorOf(s.n)}">${s.n}</b>. Нажимай на картинки и считай`)}
          <div class="num-learn">
            <button class="mag big-num" style="--c:${colorOf(s.n)}" id="say">${s.n}</button>
            <div class="things" id="things" style="--cols:${Math.min(s.n, 5)}">${Array.from({ length: s.n }, (_, i) => `<button class="thing" data-i="${i}">${thing}<i></i></button>`).join('')}</div>
          </div>
          <div class="card-nav" id="after" hidden>${nextBtn()}</div>
        </section>`;
      let cnt = 0;
      $('#say').addEventListener('click', () => V.say([numSay(s.n)]));
      $$('.thing').forEach(t => t.addEventListener('click', () => {
        if (t.classList.contains('counted')) return;
        cnt++; t.classList.add('counted'); $('i', t).textContent = cnt; sfx.tap();
        V.say([numSay(cnt)]);
        if (cnt === s.n) ctl.later(() => { sfx.good(); V.say([numSay(s.n), praise()]); $('#after').hidden = false; }, 700);
      }));
      $('#next').addEventListener('click', () => { sfx.tap(); ctl.next(); });
      ctl.later(() => V.say([numSay(s.n), ph('ph-num-learn')]), 250);
    },

    count(s, ctl) {
      view.innerHTML = `
        <section class="step">
          ${helper('Сколько здесь картинок?')}
          <div class="things show" style="--cols:${Math.min(s.n, 5)}">${Array.from({ length: s.n }, () => `<span class="thing">${s.thing}</span>`).join('')}</div>
          <div class="options">${s.opts.map(o => `<button class="mag" style="--c:${colorOf(o)}" data-v="${o}">${o}</button>`).join('')}</div>
        </section>`;
      let busy = false;
      $$('.options .mag').forEach(b => b.addEventListener('click', () => {
        if (busy) return;
        if (+b.dataset.v === s.n) { busy = true; correct(b, 1300, ctl, [numSay(s.n), praise()]); } else wrong(b, ctl);
      }));
      ctl.later(() => V.say([ph('ph-count')]), 250);
    }
  };

  /* ================= ПИСЬМО ПАЛЬЧИКОМ ================= */
  const FONT = (px) => `900 ${px}px Nunito, "Arial Rounded MT Bold", system-ui, sans-serif`;
  function drawGlyph(ctx, w, h, ch, mode, extra = 0) {
    let size = h * 0.78;
    ctx.font = FONT(size);
    const mw = ctx.measureText(ch).width;
    if (mw > w * 0.8) { size *= (w * 0.8) / mw; ctx.font = FONT(size); }
    const m = ctx.measureText(ch);
    const asc = m.actualBoundingBoxAscent || size * 0.72, desc = m.actualBoundingBoxDescent || 0;
    const y = h / 2 + (asc - desc) / 2;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (mode === 'guide') {
      ctx.fillStyle = '#EEF2F8'; ctx.fillText(ch, w / 2, y);
      ctx.setLineDash([size * 0.035, size * 0.045]); ctx.lineWidth = Math.max(2, size * 0.012);
      ctx.strokeStyle = '#AEB9CC'; ctx.strokeText(ch, w / 2, y); ctx.setLineDash([]);
    } else {
      ctx.fillStyle = '#000'; ctx.fillText(ch, w / 2, y);
      if (extra) { ctx.lineWidth = extra; ctx.strokeStyle = '#000'; ctx.strokeText(ch, w / 2, y); }
    }
    return size;
  }
  function tracer(paper, ch, color) {
    const guide = $('.guide', paper), ink = $('.ink', paper);
    const g = guide.getContext('2d'), k = ink.getContext('2d');
    let strokes = [], cur = null, glyph = 100, W = 0, H = 0;
    function setup() {
      const r = paper.getBoundingClientRect(); if (!r.width || !r.height) return;
      W = r.width; H = r.height; const dpr = window.devicePixelRatio || 1;
      for (const cv of [guide, ink]) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); k.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.strokeStyle = '#E4EAF3'; g.lineWidth = 2;
      for (const f of [0.1, 0.9]) { g.beginPath(); g.moveTo(0, H * f); g.lineTo(W, H * f); g.stroke(); }
      glyph = drawGlyph(g, W, H, ch, 'guide'); redraw();
    }
    const brush = () => Math.max(14, glyph * 0.11);
    function line(s) {
      k.strokeStyle = s.color; k.fillStyle = s.color; k.lineWidth = brush(); k.lineCap = 'round'; k.lineJoin = 'round';
      const p = s.pts;
      if (p.length === 1) { k.beginPath(); k.arc(p[0].x * W, p[0].y * H, brush() / 2, 0, Math.PI * 2); k.fill(); return; }
      k.beginPath(); k.moveTo(p[0].x * W, p[0].y * H); for (let j = 1; j < p.length; j++) k.lineTo(p[j].x * W, p[j].y * H); k.stroke();
    }
    function redraw() { k.clearRect(0, 0, W, H); strokes.forEach(line); }
    const pos = (e) => { const r = ink.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; };
    ink.addEventListener('pointerdown', (e) => {
      e.preventDefault(); if (cur) return;
      try { ink.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
      cur = { color: api.color, pts: [pos(e)], id: e.pointerId }; strokes.push(cur); line(cur);
    });
    ink.addEventListener('pointermove', (e) => {
      if (!cur || e.pointerId !== cur.id) return;
      const evs = (e.getCoalescedEvents && e.getCoalescedEvents().length) ? e.getCoalescedEvents() : [e];
      const from = cur.pts[cur.pts.length - 1];
      for (const ev of evs) cur.pts.push(pos(ev));
      k.strokeStyle = cur.color; k.lineWidth = brush(); k.lineCap = 'round'; k.lineJoin = 'round';
      k.beginPath(); k.moveTo(from.x * W, from.y * H);
      for (let j = cur.pts.length - evs.length; j < cur.pts.length; j++) k.lineTo(cur.pts[j].x * W, cur.pts[j].y * H);
      k.stroke();
    });
    const end = (e) => { if (cur && e.pointerId === cur.id) cur = null; };
    ink.addEventListener('pointerup', end); ink.addEventListener('pointercancel', end);
    function score() {
      const mw = 160, mh = Math.max(40, Math.round(160 * H / W)), sx = mw / W;
      const mk = (fn) => { const cv = document.createElement('canvas'); cv.width = mw; cv.height = mh; const c2 = cv.getContext('2d'); fn(c2); return c2.getImageData(0, 0, mw, mh).data; };
      const L = mk(c2 => { c2.scale(sx, sx); drawGlyph(c2, W, H, ch, 'mask'); });
      const LD = mk(c2 => { c2.scale(sx, sx); drawGlyph(c2, W, H, ch, 'mask', brush() * 1.6); });
      const S = mk(c2 => {
        c2.scale(sx, sx); c2.strokeStyle = '#000'; c2.lineWidth = brush() * 1.25; c2.lineCap = 'round'; c2.lineJoin = 'round';
        for (const s of strokes) { c2.beginPath(); c2.moveTo(s.pts[0].x * W, s.pts[0].y * H); for (const p of s.pts) c2.lineTo(p.x * W, p.y * H); if (s.pts.length === 1) c2.lineTo(s.pts[0].x * W + .1, s.pts[0].y * H); c2.stroke(); }
      });
      let l = 0, cov = 0, s = 0, out = 0;
      for (let j = 3; j < L.length; j += 4) { const inL = L[j] > 100, inS = S[j] > 100; if (inL) { l++; if (inS) cov++; } if (inS) { s++; if (LD[j] < 100) out++; } }
      return { cover: l ? cov / l : 0, outside: s ? out / s : 1 };
    }
    const ro = new ResizeObserver(setup); ro.observe(paper);
    if (document.fonts && document.fonts.load) document.fonts.load(FONT(100), ch).then(setup, setup);
    const api = {
      color,
      setChar(c) { ch = c; strokes = []; setup(); },
      clear() { strokes = []; redraw(); },
      count: () => strokes.length,
      stars() {
        const { cover, outside } = score();
        let n = cover >= 0.62 ? 3 : cover >= 0.42 ? 2 : cover >= 0.25 ? 1 : 0;
        if (outside > 0.45 && n > 1) n--;
        return n;
      },
      destroy: () => ro.disconnect()
    };
    return api;
  }

  /* ================= СВОБОДНЫЙ РЕЖИМ: все буквы ================= */
  function abc() {
    const p = me();
    titleEl.textContent = 'Все буквы';
    view.innerHTML = `
      <div class="abc-top"><p>Нажми на букву, чтобы услышать её и написать</p></div>
      <div class="grid">
        ${A.map((x, i) => `<button class="mag tile" style="--c:${colorOf(i)}" data-i="${i}" aria-label="Буква ${x.l}">${x.l}${p && p.wrote[x.l] ? `<span class="st">${'★'.repeat(p.wrote[x.l])}</span>` : ''}</button>`).join('')}
      </div>`;
    $$('.tile').forEach(b => b.addEventListener('click', () => { sfx.tap(); go('letter', +b.dataset.i); }));
  }

  function letter(i) {
    const x = A[i], c = colorOf(i);
    titleEl.textContent = `Буква ${x.l}`;
    const k = x.word.toUpperCase().indexOf(x.l);
    const word = esc(x.word.slice(0, k)) + `<mark style="--c:${c}">${esc(x.word[k])}</mark>` + esc(x.word.slice(k + 1));
    view.innerHTML = `
      <section class="card">
        <div class="card-main">
          <button class="mag big-mag" style="--c:${c}" id="say"><span class="pair">${x.l}<small>${x.l.toLowerCase()}</small></span></button>
          <button class="pic" id="sayw"><div class="emoji">${x.pic}</div><div class="word">${word}</div></button>
        </div>
        <div class="card-nav">
          <button class="round-btn" id="prev" aria-label="Предыдущая буква" ${i === 0 ? 'disabled' : ''}>${ico.left}</button>
          <button class="pill-btn" style="--c:#3AA7F0" id="listen">${ico.sound} Послушать</button>
          <button class="pill-btn" style="--c:#3DBE6B" id="towrite">${ico.pencil} Написать</button>
          <button class="round-btn" id="nextl" aria-label="Следующая буква" ${i === A.length - 1 ? 'disabled' : ''}>${ico.right}</button>
        </div>
      </section>`;
    const all = () => V.say([letterSay(x.l), wordSay(x.l)]);
    $('#say').addEventListener('click', () => V.say([letterSay(x.l)]));
    $('#sayw').addEventListener('click', () => V.say([wordSay(x.l)]));
    $('#listen').addEventListener('click', all);
    $('#towrite').addEventListener('click', () => { sfx.tap(); go('write', i); });
    $('#prev').addEventListener('click', () => { if (i > 0) { sfx.tap(); go('letter', i - 1, true); } });
    $('#nextl').addEventListener('click', () => { if (i < A.length - 1) { sfx.tap(); go('letter', i + 1, true); } });
    const t = setTimeout(all, 250); cleanup = () => clearTimeout(t);
  }

  function write(i) {
    const x = A[i], c = colorOf(i);
    titleEl.textContent = `Пишем букву ${x.l}`;
    const crayons = uniq([c, '#22304A', '#3AA7F0', '#3DBE6B', '#F2544B']).slice(0, 4);
    view.innerHTML = `
      <section class="step">
        <div class="trace-wrap">
          <div class="paper" id="paper"><canvas class="guide"></canvas><canvas class="ink"></canvas></div>
          <div class="trace-tools">
            <div class="seg" role="group" aria-label="Большая или маленькая">
              <button id="up" aria-pressed="true">${x.l}</button><button id="low" aria-pressed="false">${x.l.toLowerCase()}</button>
            </div>
            <div class="crayons" role="group" aria-label="Цвет">${crayons.map((v, k) => `<button class="crayon" style="--c:${v}" data-c="${v}" aria-label="Цвет ${k + 1}" aria-pressed="${k === 0}"></button>`).join('')}</div>
            <button class="pill-btn ghost" id="clear">${ico.erase} Стереть</button>
            <div class="write-msg" id="msg">Обведи букву пальчиком</div>
            <button class="pill-btn big" style="--c:#3DBE6B" id="done">${ico.check} Готово</button>
          </div>
        </div>
      </section>`;
    const tr = tracer($('#paper'), x.l, c); const msg = $('#msg');
    const reset = () => { msg.className = 'write-msg'; msg.textContent = 'Обведи букву пальчиком'; };
    $('#clear').addEventListener('click', () => { sfx.tap(); tr.clear(); reset(); });
    const setCase = (u) => { sfx.tap(); tr.setChar(u ? x.l : x.l.toLowerCase()); $('#up').setAttribute('aria-pressed', u); $('#low').setAttribute('aria-pressed', !u); reset(); };
    $('#up').addEventListener('click', () => setCase(true));
    $('#low').addEventListener('click', () => setCase(false));
    $$('.crayon').forEach(b => b.addEventListener('click', () => { tr.color = b.dataset.c; sfx.tap(); $$('.crayon').forEach(o => o.setAttribute('aria-pressed', o === b)); }));
    $('#done').addEventListener('click', () => {
      if (!tr.count()) { V.say([ph('ph-trace')]); return; }
      const n = tr.stars();
      if (!n) { sfx.bad(); msg.textContent = 'Почти! Обведи до конца'; V.say([ph('ph-almost')]); return; }
      sfx.good(); if (n >= 2) confetti(n === 3 ? 160 : 80);
      const p = me(); if (p && n > (p.wrote[x.l] || 0)) { p.wrote[x.l] = n; save(); updateHeader(true); }
      msg.className = 'write-msg good'; msg.innerHTML = `<span class="big-stars">${'★'.repeat(n)}</span>`;
      V.say([praise()]);
    });
    cleanup = tr.destroy;
  }

  /* ================= ИГРА «Какая буква потерялась?» ================= */
  function game() {
    titleEl.textContent = 'Какая буква потерялась?';
    const ROUNDS = 10;
    const pool = shuffle(A.filter(x => x.word[0] === x.l)).slice(0, ROUNDS);
    const marks = []; let r = 0, missed = false, busy = false, timer = 0;
    cleanup = () => clearTimeout(timer);
    function round() {
      const x = pool[r];
      const confuse = { 'Е': 'Ё', 'Ё': 'Е', 'И': 'Й', 'Й': 'И', 'Ш': 'Щ', 'Щ': 'Ш' };
      const opts = shuffle([x, ...shuffle(A.filter(o => o.l !== x.l && o.l !== confuse[x.l] && !'ЪЬЫ'.includes(o.l))).slice(0, 3)]);
      missed = false; busy = false;
      view.innerHTML = `
        <section class="step">
          <div class="dots">${Array.from({ length: ROUNDS }, (_, k) => `<i class="${k < r ? marks[k] : k === r ? 'now' : ''}"></i>`).join('')}</div>
          <button class="q" id="hear"><div class="emoji">${x.pic}</div><div class="word"><span class="hole" id="hole">?</span>${esc(x.word.slice(1))}</div></button>
          <div class="options">${opts.map(o => `<button class="mag" style="--c:${letterColor(o.l)}" data-v="${o.l}">${o.l}</button>`).join('')}</div>
        </section>`;
      $('#hear').addEventListener('click', () => V.say([wordSay(x.l)]));
      $$('.options .mag').forEach(b => b.addEventListener('click', () => {
        if (busy) return;
        if (b.dataset.v === x.l) {
          busy = true; sfx.good(); b.classList.add('right');
          const h = $('#hole'); h.textContent = x.l; h.classList.add('filled');
          marks[r] = missed ? 'miss' : 'ok'; confetti(40);
          V.say([wordSay(x.l), praise()]);
          timer = setTimeout(() => { r++; r < ROUNDS ? round() : finish(); }, 1700);
        } else { missed = true; sfx.bad(); b.classList.add('wrong'); V.say([ph('ph-try')]); }
      }));
      timer = setTimeout(() => V.say([wordSay(x.l)]), 300);
    }
    function finish() {
      const ok = marks.filter(m => m === 'ok').length;
      const n = ok >= 9 ? 3 : ok >= 6 ? 2 : 1;
      const p = me(); if (p) { p.bonus = (p.bonus || 0) + n; save(); updateHeader(true); }
      confetti(200); sfx.good();
      view.innerHTML = `
        <section class="result">
          ${helper(`С первого раза угадано ${ok} из ${ROUNDS}!`, 'big')}
          <div class="big-stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(3 - n)}</span></div>
          <div class="card-nav">
            <button class="pill-btn big" style="--c:#A855F7" id="again">${ico.again} Играть ещё</button>
            <button class="pill-btn ghost" id="out">На карту</button>
          </div>
        </section>`;
      V.say([ph('ph-great')]);
      $('#again').addEventListener('click', () => { sfx.tap(); go('game', null, true); });
      $('#out').addEventListener('click', () => { sfx.tap(); home(); });
    }
    round();
  }

  /* ================= ДЛЯ РОДИТЕЛЕЙ ================= */
  function parents() {
    const p = me(); if (!p) return go('profiles', null, true);
    titleEl.textContent = 'Для родителей';
    const done = Object.keys(p.lessons).length, all = STAGES.reduce((s, st) => s + st.lessons.length, 0);
    view.innerHTML = `
      <section class="parents">
        <div class="panel">
          <div class="kid-line"><span class="kid-ava">${p.avatar}</span><div><b>${esc(p.name)}</b><small>Пройдено уроков: ${done} из ${all} · звёздочек: ${totalStars(p)}</small></div></div>
          ${STAGES.map(st => `<div class="meter-row"><span>${st.title}</span><div class="meter"><i style="width:${Math.round(st.lessons.filter(l => isDone(p, l.id)).length / st.lessons.length * 100)}%;background:${st.color}"></i></div></div>`).join('')}
        </div>
        <div class="panel list">
          <button class="row-btn" id="switch">Сменить ученика или добавить нового</button>
          <label class="row-btn toggle"><span>Открыть все уроки сразу</span><input type="checkbox" id="unlock" ${p.unlockAll ? 'checked' : ''}></label>
          <button class="row-btn danger" id="reset">Сбросить прогресс ${esc(p.name)}</button>
          <div class="confirm" id="confirm" hidden>
            <span>Точно сбросить все звёздочки и уроки?</span>
            <button class="pill-btn" style="--c:#F2544B" id="yes">Да, сбросить</button>
            <button class="pill-btn ghost" id="no">Отмена</button>
          </div>
        </div>
        <p class="note">Озвучка: ${V.hasRecordings() ? 'записанный голос' : 'встроенный голос планшета. Когда появятся записи, они подключатся сами.'}</p>
      </section>`;
    $('#switch').addEventListener('click', () => { sfx.tap(); db.current = null; save(); stack.length = 0; current = { name: 'profiles' }; render(); });
    $('#unlock').addEventListener('change', (e) => { p.unlockAll = e.target.checked; save(); });
    $('#reset').addEventListener('click', () => { $('#confirm').hidden = false; });
    $('#no').addEventListener('click', () => { $('#confirm').hidden = true; });
    $('#yes').addEventListener('click', () => { p.lessons = {}; p.wrote = {}; p.bonus = 0; save(); home(); });
  }

  const VIEWS = { profiles, newKid, map, lesson, abc, letter, write, game, parents };

  /* ---------------- старт ---------------- */
  current = { name: me() ? 'map' : 'profiles' };
  render();

  if ('serviceWorker' in navigator && location.protocol === 'https:' && document.querySelector('link[rel="manifest"]')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* без офлайна */ });
  }
})();
