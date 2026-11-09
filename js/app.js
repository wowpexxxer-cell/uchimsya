(() => {
  'use strict';

  const A = window.ALPHABET;
  const NUMS = window.NUMBERS;
  const COLORS = ['#F2544B', '#FF8A3D', '#E8A400', '#3DBE6B', '#14B8A6', '#3AA7F0', '#6366F1', '#A855F7', '#EC4899'];
  const colorOf = (i) => COLORS[i % COLORS.length];
  const view = document.getElementById('view');
  const titleEl = document.getElementById('title');
  const backBtn = document.getElementById('back');
  const starsEl = document.getElementById('stars');
  const starsNum = document.getElementById('stars-num');

  /* ---------------- прогресс (хранится только на этом устройстве) ---------------- */
  const KEY = 'uchimsya.v1';
  let data = { seen: {}, wrote: {}, gameStars: 0 };
  try { data = Object.assign(data, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { /* без сохранения */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ } };
  const totalStars = () => Object.values(data.wrote).reduce((s, v) => s + v, 0) + data.gameStars;
  function updateStars(bump) {
    starsNum.textContent = totalStars();
    if (bump) { starsEl.classList.remove('bump'); void starsEl.offsetWidth; starsEl.classList.add('bump'); }
  }

  /* ---------------- голос ---------------- */
  let voice = null;
  function pickVoice() {
    try {
      const vs = speechSynthesis.getVoices().filter(v => /^ru/i.test(v.lang));
      voice = vs.find(v => /milena|google|yandex|irina|premium|enhanced/i.test(v.name)) || vs[0] || null;
    } catch (e) { voice = null; }
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text) {
    try {
      if (!('speechSynthesis' in window)) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ru-RU'; if (voice) u.voice = voice;
      u.rate = 0.85; u.pitch = 1.1;
      speechSynthesis.speak(u);
    } catch (e) { /* без звука */ }
  }

  /* ---------------- звуки ---------------- */
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
        g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
      });
    } catch (e) { /* ignore */ }
  }
  const sfx = {
    tap: () => tone([660], 0.08, 'triangle'),
    good: () => tone([523, 659, 784, 1047], 0.18, 'triangle'),
    bad: () => tone([220, 180], 0.16, 'sine', 0.12)
  };

  /* ---------------- салют ---------------- */
  const cf = document.getElementById('confetti');
  const cx = cf.getContext('2d');
  let parts = [], raf = 0;
  function confetti(n = 120) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const dpr = window.devicePixelRatio || 1;
    cf.width = innerWidth * dpr; cf.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = 0; i < n; i++) {
      parts.push({
        x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .45,
        vx: (Math.random() - .5) * 16, vy: -Math.random() * 16 - 6,
        r: Math.random() * 6 + 5, a: Math.random() * 6, va: (Math.random() - .5) * .4,
        c: COLORS[i % COLORS.length], life: 0
      });
    }
    if (!raf) raf = requestAnimationFrame(step);
  }
  function step() {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => p.life < 140 && p.y < innerHeight + 40);
    for (const p of parts) {
      p.life++; p.vy += .45; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c;
      cx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); cx.restore();
    }
    raf = parts.length ? requestAnimationFrame(step) : 0;
    if (!raf) cx.clearRect(0, 0, innerWidth, innerHeight);
  }

  /* ---------------- иконки ---------------- */
  const ico = {
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1-5L16 4l4 4L9 19l-5 1z"/><path d="M13.5 6.5l4 4"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 001.5.9l12-7.5a1 1 0 000-1.8l-12-7.5A1 1 0 007 4.5z"/></svg>',
    erase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    again: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5"/></svg>'
  };
  backBtn.innerHTML = ico.left;

  /* ---------------- навигация ---------------- */
  const stack = [];
  let current = null;
  let cleanup = null;
  function go(name, arg, replace) {
    if (current && !replace) stack.push(current);
    current = { name, arg };
    render();
  }
  function back() {
    sfx.tap();
    current = stack.pop() || { name: 'home' };
    render();
  }
  backBtn.addEventListener('click', back);
  function render() {
    if (cleanup) { cleanup(); cleanup = null; }
    try { speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    const { name, arg } = current;
    backBtn.hidden = name === 'home';
    view.scrollTop = 0;
    ({ home, abc, letter, write, game, math })[name](arg);
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const starsText = (n, max = 3) => '★'.repeat(n) + (max > n ? '<span class="off">' + '★'.repeat(max - n) + '</span>' : '');

  /* ---------------- главная ---------------- */
  function home() {
    titleEl.textContent = 'Учимся играя';
    const learned = A.filter(x => data.seen[x.l]).length;
    view.innerHTML = `
      <section class="home">
        <h1 class="hello">Привет! <span>Во что сегодня поиграем?</span></h1>
        <div class="sections">
          <button class="sec sec-abc" data-go="abc">
            <div class="sec-art">
              <span class="mag" style="--c:${COLORS[0]}">А</span>
              <span class="mag" style="--c:${COLORS[3]}">Б</span>
              <span class="mag" style="--c:${COLORS[6]}">В</span>
            </div>
            <div class="sec-text">
              <b>Азбука</b>
              <small>Буквы, письмо и игра «Какая буква потерялась?» · знаем ${learned} из ${A.length}</small>
              <div class="meter" aria-hidden="true"><i style="width:${Math.round(learned / A.length * 100)}%"></i></div>
            </div>
          </button>
          <button class="sec sec-math" data-go="math">
            <div class="sec-art">
              <span class="mag" style="--c:${COLORS[5]}">1</span>
              <span class="mag" style="--c:${COLORS[1]}">2</span>
              <span class="mag" style="--c:${COLORS[7]}">3</span>
            </div>
            <div class="sec-text">
              <b>Счёт <span class="badge">скоро</span></b>
              <small>Пока знакомимся с цифрами от 1 до 10</small>
            </div>
          </button>
        </div>
      </section>`;
    view.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { sfx.tap(); go(b.dataset.go); }));
  }

  /* ---------------- азбука: все буквы ---------------- */
  function abc() {
    titleEl.textContent = 'Азбука';
    view.innerHTML = `
      <div class="abc-top">
        <p>Нажми на букву, чтобы услышать её и написать</p>
        <button class="pill-btn" style="--c:#A855F7" id="play">${ico.play} Играть</button>
      </div>
      <div class="grid">
        ${A.map((x, i) => `
          <button class="mag tile" style="--c:${colorOf(i)}" data-i="${i}" aria-label="Буква ${x.l}">
            ${x.l}${data.wrote[x.l] ? `<span class="st">${'★'.repeat(data.wrote[x.l])}</span>` : ''}
          </button>`).join('')}
      </div>`;
    view.querySelector('#play').addEventListener('click', () => { sfx.tap(); go('game'); });
    view.querySelectorAll('.tile').forEach(b => b.addEventListener('click', () => { sfx.tap(); go('letter', +b.dataset.i); }));
  }

  /* ---------------- карточка буквы ---------------- */
  function wordHtml(x, color) {
    const w = x.word, k = w.toUpperCase().indexOf(x.l);
    if (k < 0) return esc(w);
    return esc(w.slice(0, k)) + `<mark style="--c:${color}">${esc(w[k])}</mark>` + esc(w.slice(k + 1));
  }
  function letter(i) {
    const x = A[i], c = colorOf(i);
    titleEl.textContent = `Буква ${x.l}`;
    if (!data.seen[x.l]) { data.seen[x.l] = 1; save(); }
    view.innerHTML = `
      <section class="card">
        <div class="card-main">
          <button class="mag big-mag" style="--c:${c}" id="say" aria-label="Послушать букву"><span class="pair">${x.l}<small>${x.l.toLowerCase()}</small></span></button>
          <button class="pic" id="say-word" aria-label="Послушать слово">
            <div class="emoji">${x.pic}</div>
            <div class="word">${wordHtml(x, c)}</div>
          </button>
        </div>
        <div class="card-nav">
          <button class="round-btn" id="prev" aria-label="Предыдущая буква" ${i === 0 ? 'disabled style="opacity:.35"' : ''}>${ico.left}</button>
          <button class="pill-btn" style="--c:#3AA7F0" id="listen">${ico.sound} Послушать</button>
          <button class="pill-btn" style="--c:#3DBE6B" id="towrite">${ico.pencil} Написать</button>
          <button class="round-btn" id="next" aria-label="Следующая буква" ${i === A.length - 1 ? 'disabled style="opacity:.35"' : ''}>${ico.right}</button>
        </div>
      </section>`;
    const sayAll = () => speak(`${x.name}. ${x.word}`);
    view.querySelector('#say').addEventListener('click', () => speak(x.name));
    view.querySelector('#say-word').addEventListener('click', () => speak(x.word));
    view.querySelector('#listen').addEventListener('click', sayAll);
    view.querySelector('#towrite').addEventListener('click', () => { sfx.tap(); go('write', i); });
    view.querySelector('#prev').addEventListener('click', () => { if (i > 0) { sfx.tap(); go('letter', i - 1, true); } });
    view.querySelector('#next').addEventListener('click', () => { if (i < A.length - 1) { sfx.tap(); go('letter', i + 1, true); } });
    setTimeout(sayAll, 250);
  }

  /* ---------------- письмо ---------------- */
  const FONT = (px) => `900 ${px}px Nunito, "Arial Rounded MT Bold", system-ui, sans-serif`;
  // Рисует букву по центру области w×h и возвращает размер шрифта.
  function drawGlyph(ctx, w, h, ch, mode, extra = 0) {
    let size = h * 0.78;
    ctx.font = FONT(size);
    const mw = ctx.measureText(ch).width;
    if (mw > w * 0.8) { size *= (w * 0.8) / mw; ctx.font = FONT(size); }
    const m = ctx.measureText(ch);
    const asc = m.actualBoundingBoxAscent || size * 0.72, desc = m.actualBoundingBoxDescent || 0;
    const y = h / 2 + (asc - desc) / 2;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (mode === 'guide') {
      ctx.fillStyle = '#EDF1F7'; ctx.fillText(ch, w / 2, y);
      ctx.setLineDash([size * 0.035, size * 0.045]); ctx.lineWidth = Math.max(2, size * 0.012);
      ctx.strokeStyle = '#AEB9CC'; ctx.strokeText(ch, w / 2, y); ctx.setLineDash([]);
    } else {
      ctx.fillStyle = '#000'; ctx.fillText(ch, w / 2, y);
      if (extra) { ctx.lineWidth = extra; ctx.strokeStyle = '#000'; ctx.strokeText(ch, w / 2, y); }
    }
    return size;
  }

  function write(i) {
    const x = A[i], c = colorOf(i);
    let upper = true, color = c, strokes = [], cur = null, glyphSize = 100, W = 0, H = 0;
    titleEl.textContent = `Пишем букву ${x.l}`;
    const crayons = [c, '#22304A', '#3AA7F0', '#3DBE6B', '#F2544B'].filter((v, k, a) => a.indexOf(v) === k).slice(0, 4);
    view.innerHTML = `
      <section class="write">
        <div class="write-side">
          <div class="mag" style="--c:${c}" id="wmag">${x.l}</div>
          <div class="seg" role="group" aria-label="Большая или маленькая">
            <button id="up" aria-pressed="true">${x.l}</button>
            <button id="low" aria-pressed="false">${x.l.toLowerCase()}</button>
          </div>
          <div class="crayons" role="group" aria-label="Цвет карандаша">
            ${crayons.map((v, k) => `<button class="crayon" style="--c:${v}" data-c="${v}" aria-label="Цвет ${k + 1}" aria-pressed="${k === 0}"></button>`).join('')}
          </div>
          <div class="write-msg" id="msg">Обведи букву пальчиком по серой дорожке</div>
          <div class="write-tools">
            <button class="pill-btn ghost" id="clear">${ico.erase} Стереть</button>
            <button class="pill-btn" style="--c:#3DBE6B" id="done">${ico.check} Готово</button>
          </div>
        </div>
        <div class="paper" id="paper"><canvas id="guide"></canvas><canvas id="ink"></canvas></div>
      </section>`;
    const paper = view.querySelector('#paper');
    const guide = view.querySelector('#guide'), ink = view.querySelector('#ink');
    const g = guide.getContext('2d'), k = ink.getContext('2d');
    const msg = view.querySelector('#msg');
    const ch = () => upper ? x.l : x.l.toLowerCase();

    function setup() {
      const r = paper.getBoundingClientRect();
      if (!r.width || !r.height) return;
      W = r.width; H = r.height;
      const dpr = window.devicePixelRatio || 1;
      for (const cv of [guide, ink]) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); k.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      // школьная разлиновка
      g.strokeStyle = '#E4EAF3'; g.lineWidth = 2;
      for (const f of [0.14, 0.86]) { g.beginPath(); g.moveTo(0, H * f); g.lineTo(W, H * f); g.stroke(); }
      glyphSize = drawGlyph(g, W, H, ch(), 'guide');
      redraw();
    }
    const brush = () => Math.max(14, glyphSize * 0.11);
    function redraw() {
      k.clearRect(0, 0, W, H);
      for (const s of strokes) drawStroke(s);
    }
    function drawStroke(s) {
      k.strokeStyle = s.color; k.fillStyle = s.color; k.lineWidth = brush(); k.lineCap = 'round'; k.lineJoin = 'round';
      const p = s.pts;
      if (p.length === 1) { k.beginPath(); k.arc(p[0].x * W, p[0].y * H, brush() / 2, 0, Math.PI * 2); k.fill(); return; }
      k.beginPath(); k.moveTo(p[0].x * W, p[0].y * H);
      for (let j = 1; j < p.length; j++) k.lineTo(p[j].x * W, p[j].y * H);
      k.stroke();
    }
    const pos = (e) => { const r = ink.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; };
    ink.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (cur) return;
      try { ink.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
      cur = { color, pts: [pos(e)], id: e.pointerId };
      strokes.push(cur); drawStroke(cur);
      if (msg.classList.contains('good')) { msg.classList.remove('good'); msg.textContent = 'Обведи букву пальчиком по серой дорожке'; }
    });
    ink.addEventListener('pointermove', (e) => {
      if (!cur || e.pointerId !== cur.id) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of (evs.length ? evs : [e])) cur.pts.push(pos(ev));
      const p = cur.pts, n = p.length;
      k.strokeStyle = cur.color; k.lineWidth = brush(); k.lineCap = 'round'; k.lineJoin = 'round';
      k.beginPath(); k.moveTo(p[Math.max(0, n - evs.length - 1)].x * W, p[Math.max(0, n - evs.length - 1)].y * H);
      for (let j = Math.max(0, n - evs.length); j < n; j++) k.lineTo(p[j].x * W, p[j].y * H);
      k.stroke();
    });
    const end = (e) => { if (cur && e.pointerId === cur.id) cur = null; };
    ink.addEventListener('pointerup', end); ink.addEventListener('pointercancel', end);

    // Оценка: какую часть буквы закрасили и сколько штрихов ушло мимо.
    function score() {
      const mw = 160, mh = Math.max(40, Math.round(160 * H / W)), sx = mw / W;
      const mk = (fn) => { const cv = document.createElement('canvas'); cv.width = mw; cv.height = mh; const c2 = cv.getContext('2d'); fn(c2); return c2.getImageData(0, 0, mw, mh).data; };
      const L = mk(c2 => { c2.scale(sx, sx); drawGlyph(c2, W, H, ch(), 'mask'); });
      const LD = mk(c2 => { c2.scale(sx, sx); drawGlyph(c2, W, H, ch(), 'mask', brush() * 1.6); });
      const S = mk(c2 => {
        c2.scale(sx, sx); c2.strokeStyle = '#000'; c2.fillStyle = '#000'; c2.lineWidth = brush() * 1.25; c2.lineCap = 'round'; c2.lineJoin = 'round';
        for (const s of strokes) {
          c2.beginPath(); c2.moveTo(s.pts[0].x * W, s.pts[0].y * H);
          for (const p of s.pts) c2.lineTo(p.x * W, p.y * H);
          if (s.pts.length === 1) c2.lineTo(s.pts[0].x * W + .1, s.pts[0].y * H);
          c2.stroke();
        }
      });
      let l = 0, cov = 0, s = 0, out = 0;
      for (let j = 3; j < L.length; j += 4) {
        const inL = L[j] > 100, inS = S[j] > 100;
        if (inL) { l++; if (inS) cov++; }
        if (inS) { s++; if (LD[j] < 100) out++; }
      }
      return { cover: l ? cov / l : 0, outside: s ? out / s : 1 };
    }

    view.querySelector('#clear').addEventListener('click', () => { sfx.tap(); strokes = []; redraw(); msg.className = 'write-msg'; msg.textContent = 'Обведи букву пальчиком по серой дорожке'; });
    view.querySelector('#done').addEventListener('click', () => {
      if (!strokes.length) { msg.className = 'write-msg'; msg.textContent = 'Сначала обведи букву пальчиком'; speak('Обведи букву пальчиком'); return; }
      const { cover, outside } = score();
      let n = cover >= 0.62 ? 3 : cover >= 0.42 ? 2 : cover >= 0.25 ? 1 : 0;
      if (outside > 0.45 && n > 1) n--;
      if (n === 0) {
        sfx.bad(); msg.className = 'write-msg';
        msg.textContent = 'Почти! Обведи всю букву, до самого конца';
        speak('Почти получилось. Обведи всю букву');
        return;
      }
      sfx.good(); if (n >= 2) confetti(n === 3 ? 160 : 80);
      const prev = data.wrote[x.l] || 0;
      if (n > prev) { data.wrote[x.l] = n; save(); updateStars(true); }
      msg.className = 'write-msg good';
      msg.innerHTML = `<span><span class="big-stars">${'★'.repeat(n)}</span>${n === 3 ? 'Отлично!' : n === 2 ? 'Молодец!' : 'Хорошо! Можно ещё лучше'}</span>`;
      speak(n === 3 ? 'Отлично! Ты написал букву ' + x.name : n === 2 ? 'Молодец!' : 'Хорошо! Попробуй ещё раз');
    });
    const setCase = (u) => {
      upper = u; strokes = []; sfx.tap();
      view.querySelector('#up').setAttribute('aria-pressed', u); view.querySelector('#low').setAttribute('aria-pressed', !u);
      view.querySelector('#wmag').textContent = ch();
      msg.className = 'write-msg'; msg.textContent = 'Обведи букву пальчиком по серой дорожке';
      setup();
    };
    view.querySelector('#up').addEventListener('click', () => setCase(true));
    view.querySelector('#low').addEventListener('click', () => setCase(false));
    view.querySelectorAll('.crayon').forEach(b => b.addEventListener('click', () => {
      color = b.dataset.c; sfx.tap();
      view.querySelectorAll('.crayon').forEach(o => o.setAttribute('aria-pressed', o === b));
    }));

    const ro = new ResizeObserver(() => setup());
    ro.observe(paper);
    cleanup = () => ro.disconnect();
    if (document.fonts && document.fonts.load) document.fonts.load(FONT(100), x.l).then(setup, setup);
  }

  /* ---------------- игра «Какая буква потерялась?» ---------------- */
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const ROUNDS = 10;
  function game() {
    titleEl.textContent = 'Какая буква потерялась?';
    const pool = shuffle(A.filter(x => x.word[0].toUpperCase() === x.l)).slice(0, ROUNDS);
    const marks = [];
    let r = 0, missed = false, busy = false;
    let timer = 0;
    cleanup = () => clearTimeout(timer);

    function round() {
      const x = pool[r];
      const confuse = { 'Е': 'Ё', 'Ё': 'Е', 'И': 'Й', 'Й': 'И', 'Ш': 'Щ', 'Щ': 'Ш' };
      const others = shuffle(A.filter(o => o.l !== x.l && o.l !== confuse[x.l] && !'ЪЬЫ'.includes(o.l))).slice(0, 3);
      const opts = shuffle([x, ...others]);
      missed = false; busy = false;
      view.innerHTML = `
        <section class="game">
          <div class="dots" aria-label="Раунд ${r + 1} из ${ROUNDS}">
            ${Array.from({ length: ROUNDS }, (_, k) => `<i class="${k < r ? marks[k] : k === r ? 'now' : ''}"></i>`).join('')}
          </div>
          <button class="q" id="say" aria-label="Послушать слово">
            <div class="emoji">${x.pic}</div>
            <div class="word"><span class="hole" id="hole">?</span>${esc(x.word.slice(1))}</div>
            <div class="q-hint">С какой буквы начинается слово?</div>
          </button>
          <div class="options">
            ${opts.map(o => `<button class="mag" style="--c:${colorOf(A.indexOf(o))}" data-l="${o.l}">${o.l}</button>`).join('')}
          </div>
          <div class="game-foot"><button class="pill-btn ghost" id="repeat">${ico.sound} Ещё раз</button></div>
        </section>`;
      const sayQ = () => speak(x.word);
      view.querySelector('#say').addEventListener('click', sayQ);
      view.querySelector('#repeat').addEventListener('click', sayQ);
      view.querySelectorAll('.options .mag').forEach(b => b.addEventListener('click', () => {
        if (busy) return;
        if (b.dataset.l === x.l) {
          busy = true; sfx.good(); b.classList.add('right');
          const hole = view.querySelector('#hole'); hole.textContent = x.l; hole.classList.add('filled');
          marks[r] = missed ? 'miss' : 'ok';
          confetti(50); speak(`${x.l === 'Й' ? 'и краткое' : x.name}. ${x.word}`);
          timer = setTimeout(() => { r++; r < ROUNDS ? round() : finish(); }, 1700);
        } else {
          missed = true; sfx.bad(); b.classList.add('wrong'); speak('Попробуй ещё');
        }
      }));
      timer = setTimeout(sayQ, 300);
    }
    function finish() {
      const ok = marks.filter(m => m === 'ok').length;
      const n = ok >= 9 ? 3 : ok >= 6 ? 2 : 1;
      data.gameStars += n; save(); updateStars(true);
      confetti(200); sfx.good();
      view.innerHTML = `
        <section class="result">
          <h3>Ура!</h3>
          <div class="big-stars">${starsText(n)}</div>
          <p>С первого раза угадано ${ok} из ${ROUNDS}</p>
          <div class="card-nav">
            <button class="pill-btn" style="--c:#A855F7" id="again">${ico.again} Играть ещё</button>
            <button class="pill-btn ghost" id="toabc">К буквам</button>
          </div>
        </section>`;
      speak(ok >= 9 ? 'Ура! Ты молодец!' : 'Хорошо поиграли! Давай ещё?');
      view.querySelector('#again').addEventListener('click', () => { sfx.tap(); go('game', null, true); });
      view.querySelector('#toabc').addEventListener('click', back);
    }
    round();
  }

  /* ---------------- счёт: заготовка ---------------- */
  function math() {
    titleEl.textContent = 'Счёт';
    view.innerHTML = `
      <section class="math">
        <p>Скоро здесь появятся игры со счётом. А пока нажимай на цифры и слушай, как они называются.</p>
        <div class="num-row">
          ${NUMS.map((x, i) => `<button class="mag" style="--c:${colorOf(i)}" data-i="${i}">${x.n}</button>`).join('')}
        </div>
        <div class="count-show" id="show" aria-live="polite"></div>
      </section>`;
    const show = view.querySelector('#show');
    const things = ['🍎', '⭐', '🐟', '🎈', '🐞', '🍓', '🚗', '🐥', '🌸', '🧸'];
    view.querySelectorAll('.num-row .mag').forEach(b => b.addEventListener('click', () => {
      const x = NUMS[+b.dataset.i];
      show.textContent = things[+b.dataset.i].repeat(x.n);
      speak(x.word);
    }));
  }

  /* ---------------- старт ---------------- */
  updateStars(false);
  go('home');

  // Офлайн-режим, когда приложение открыто как сайт (на GitHub Pages и т. п.).
  if ('serviceWorker' in navigator && location.protocol === 'https:' && document.querySelector('link[rel="manifest"]')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* без офлайна */ });
  }
})();
