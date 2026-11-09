// Озвучка. Если в папке audio/ есть записанный файл (список в audio/index.json),
// играет его. Если файла нет, говорит встроенный голос устройства.
(function () {
  'use strict';
  let have = new Set();
  let ready = fetch('audio/index.json', { cache: 'no-cache' })
    .then(r => r.ok ? r.json() : [])
    .then(list => { have = new Set(list); })
    .catch(() => {});

  let ttsVoice = null;
  function pickVoice() {
    try {
      const vs = speechSynthesis.getVoices().filter(v => /^ru/i.test(v.lang));
      ttsVoice = vs.find(v => /milena|google|yandex|irina|premium|enhanced|natural/i.test(v.name)) || vs[0] || null;
    } catch (e) { ttsVoice = null; }
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

  let token = 0;
  let audio = null;
  const cache = new Map();

  function stop() {
    token++;
    if (audio) { try { audio.pause(); } catch (e) { /* ignore */ } audio = null; }
    try { speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  }

  function tts(text, my) {
    return new Promise(res => {
      try {
        if (!('speechSynthesis' in window) || my !== token) return res();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ru-RU'; if (ttsVoice) u.voice = ttsVoice;
        u.rate = 0.85; u.pitch = 1.1;
        const t = setTimeout(res, 600 + text.length * 120);
        u.onend = u.onerror = () => { clearTimeout(t); res(); };
        speechSynthesis.speak(u);
      } catch (e) { res(); }
    });
  }

  function file(key, text, my) {
    return new Promise(res => {
      let a = cache.get(key);
      if (!a) { a = new Audio('audio/' + key + '.mp3'); a.preload = 'auto'; cache.set(key, a); }
      audio = a;
      a.currentTime = 0;
      a.onended = () => res();
      a.onerror = () => { have.delete(key); tts(text, my).then(res); };
      const p = a.play();
      if (p && p.catch) p.catch(() => tts(text, my).then(res));
    });
  }

  // say([[key, text], [key, text]]) — по очереди. Новый вызов прерывает предыдущий.
  async function say(items) {
    stop();
    const my = token;
    await ready;
    for (const [key, text] of items) {
      if (my !== token) return;
      if (key && have.has(key)) await file(key, text, my); else await tts(text, my);
      if (my !== token) return;
      await new Promise(r => setTimeout(r, 120));
    }
  }

  window.Voice = {
    say,
    one: (key, text) => say([[key, text]]),
    stop,
    preload(keys) { ready.then(() => keys.forEach(k => { if (have.has(k) && !cache.has(k)) { const a = new Audio('audio/' + k + '.mp3'); a.preload = 'auto'; cache.set(k, a); } })); },
    hasRecordings: () => have.size > 0
  };
})();
