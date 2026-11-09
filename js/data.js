// Все данные курса: буквы, уроки, слоги, числа и фразы для озвучки.
// Ключ (key) — имя аудиофайла в папке audio/ без расширения: audio/<key>.mp3
(function () {
  'use strict';

  // name — как букву называем вслух; k — латинское имя для файлов.
  const ALPHABET = [
    { l: 'А', k: 'a', name: 'А', word: 'Арбуз', pic: '🍉' },
    { l: 'Б', k: 'b', name: 'Бэ', word: 'Банан', pic: '🍌' },
    { l: 'В', k: 'v', name: 'Вэ', word: 'Виноград', pic: '🍇' },
    { l: 'Г', k: 'g', name: 'Гэ', word: 'Гриб', pic: '🍄' },
    { l: 'Д', k: 'd', name: 'Дэ', word: 'Дом', pic: '🏠' },
    { l: 'Е', k: 'e', name: 'Е', word: 'Ель', pic: '🌲' },
    { l: 'Ё', k: 'yo', name: 'Ё', word: 'Ёжик', pic: '🦔' },
    { l: 'Ж', k: 'zh', name: 'Жэ', word: 'Жираф', pic: '🦒' },
    { l: 'З', k: 'z', name: 'Зэ', word: 'Зебра', pic: '🦓' },
    { l: 'И', k: 'i', name: 'И', word: 'Индюк', pic: '🦃' },
    { l: 'Й', k: 'y', name: 'И краткое', word: 'Йогурт', pic: '🥛' },
    { l: 'К', k: 'k', name: 'Ка', word: 'Кот', pic: '🐱' },
    { l: 'Л', k: 'l', name: 'Эль', word: 'Лиса', pic: '🦊' },
    { l: 'М', k: 'm', name: 'Эм', word: 'Мяч', pic: '⚽' },
    { l: 'Н', k: 'n', name: 'Эн', word: 'Носорог', pic: '🦏' },
    { l: 'О', k: 'o', name: 'О', word: 'Облако', pic: '☁️' },
    { l: 'П', k: 'p', name: 'Пэ', word: 'Пингвин', pic: '🐧' },
    { l: 'Р', k: 'r', name: 'Эр', word: 'Рыба', pic: '🐟' },
    { l: 'С', k: 's', name: 'Эс', word: 'Слон', pic: '🐘' },
    { l: 'Т', k: 't', name: 'Тэ', word: 'Тигр', pic: '🐯' },
    { l: 'У', k: 'u', name: 'У', word: 'Утка', pic: '🦆' },
    { l: 'Ф', k: 'f', name: 'Эф', word: 'Фламинго', pic: '🦩' },
    { l: 'Х', k: 'h', name: 'Ха', word: 'Хлеб', pic: '🍞' },
    { l: 'Ц', k: 'ts', name: 'Цэ', word: 'Цыплёнок', pic: '🐤' },
    { l: 'Ч', k: 'ch', name: 'Чэ', word: 'Черепаха', pic: '🐢' },
    { l: 'Ш', k: 'sh', name: 'Ша', word: 'Шар', pic: '🎈' },
    { l: 'Щ', k: 'sch', name: 'Ща', word: 'Щенок', pic: '🐶' },
    { l: 'Ъ', k: 'hard', name: 'Твёрдый знак', word: 'Подъезд', pic: '🏢' },
    { l: 'Ы', k: 'yi', name: 'Ы', word: 'Сыр', pic: '🧀' },
    { l: 'Ь', k: 'soft', name: 'Мягкий знак', word: 'Конь', pic: '🐴' },
    { l: 'Э', k: 'ae', name: 'Э', word: 'Эскимо', pic: '🍦' },
    { l: 'Ю', k: 'yu', name: 'Ю', word: 'Юла', pic: '🪀' },
    { l: 'Я', k: 'ya', name: 'Я', word: 'Яблоко', pic: '🍎' }
  ];
  const BY_LETTER = Object.fromEntries(ALPHABET.map(x => [x.l, x]));

  const TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
  const translit = (s) => s.toLowerCase().split('').map(c => TR[c] ?? c).join('');

  // Этап 1. Буквы в порядке букваря: сначала гласные, потом самые простые согласные.
  const LETTER_GROUPS = [
    'АОУ', 'ЫИЭ', 'МСН', 'ЛРТ', 'КПВ', 'ЕЁЯ', 'ЮБГ', 'ДЗЖ', 'ШЧЩ', 'ХЦФ', 'ЙЬЪ'
  ];

  // Этап 2. Слоги: согласная + гласная, затем слова из двух слогов.
  const SYL_LESSONS = [
    { title: 'МА', syl: ['МА', 'МО', 'МУ', 'МЫ', 'МИ'], words: [['МА', 'МА', 'Мама', '👩']] },
    { title: 'ПА', syl: ['ПА', 'ПО', 'ПУ', 'ПЫ', 'ПИ'], words: [['ПА', 'ПА', 'Папа', '👨'], ['ПИ', 'ЛА', 'Пила', '🪚']] },
    { title: 'ЛА', syl: ['ЛА', 'ЛО', 'ЛУ', 'ЛЫ', 'ЛИ'], words: [['ЛУ', 'НА', 'Луна', '🌙'], ['ЛА', 'ПА', 'Лапа', '🐾']] },
    { title: 'НА', syl: ['НА', 'НО', 'НУ', 'НЫ', 'НИ'], words: [['НО', 'ТЫ', 'Ноты', '🎵'], ['НО', 'ГА', 'Нога', '🦵']] },
    { title: 'РА', syl: ['РА', 'РО', 'РУ', 'РЫ', 'РИ'], words: [['РЫ', 'БА', 'Рыба', '🐟'], ['РУ', 'КА', 'Рука', '✋'], ['РО', 'ЗА', 'Роза', '🌹']] },
    { title: 'СА', syl: ['СА', 'СО', 'СУ', 'ЗА', 'ЗО', 'ЗУ'], words: [['СО', 'ВА', 'Сова', '🦉'], ['ЛИ', 'СА', 'Лиса', '🦊'], ['ЗИ', 'МА', 'Зима', '❄️']] },
    { title: 'КА', syl: ['КА', 'КО', 'КУ', 'ГА', 'ГО', 'ГУ'], words: [['КО', 'ЗА', 'Коза', '🐐'], ['КИ', 'НО', 'Кино', '🎬']] },
    { title: 'ВА', syl: ['ВА', 'ВО', 'ВУ', 'ДА', 'ДО', 'ДУ'], words: [['ВО', 'ДА', 'Вода', '💧'], ['ВА', 'ЗА', 'Ваза', '🏺'], ['ДЫ', 'НЯ', 'Дыня', '🍈']] }
  ];

  // Этап 3. Счёт.
  const NUMBERS = ['', 'Один', 'Два', 'Три', 'Четыре', 'Пять', 'Шесть', 'Семь', 'Восемь', 'Девять', 'Десять'];
  const MATH_LESSONS = [
    { title: '1 2 3', nums: [1, 2, 3] },
    { title: '4 5', nums: [4, 5] },
    { title: '6 7', nums: [6, 7] },
    { title: '8 9 10', nums: [8, 9, 10] }
  ];
  const THINGS = ['🍎', '⭐', '🐟', '🎈', '🐞', '🍓', '🚗', '🐥', '🌸', '🧸', '🍪', '🦋'];

  // Фразы помощника.
  const PHRASES = {
    'ph-hello': 'Привет! Давай учиться!',
    'ph-who': 'Кто будет учиться?',
    'ph-this-letter': 'Познакомься с новой буквой!',
    'ph-trace': 'Обведи букву пальчиком.',
    'ph-trace-digit': 'Обведи цифру пальчиком.',
    'ph-pick-letter': 'Послушай и найди букву.',
    'ph-first-letter': 'С какой буквы начинается слово?',
    'ph-merge': 'Нажми на букву, и она побежит к подружке.',
    'ph-pick-syl': 'Послушай и найди слог.',
    'ph-build': 'Собери слово из слогов.',
    'ph-num-learn': 'Нажимай на картинки и считай.',
    'ph-count': 'Сколько здесь картинок?',
    'ph-great': 'Отлично!',
    'ph-good': 'Молодец!',
    'ph-super': 'Умница!',
    'ph-yes': 'Правильно!',
    'ph-try': 'Попробуй ещё.',
    'ph-almost': 'Почти получилось! Обведи всю букву.',
    'ph-lesson-done': 'Урок пройден! Ты молодец!',
    'ph-stage-done': 'Ура! Все буквы пройдены! Теперь можно читать слоги и считать!',
    'ph-locked': 'Этот урок пока закрыт. Сначала пройди предыдущий.'
  };

  // Курс: этапы → уроки. Уроки внутри этапа открываются по порядку;
  // слоги и счёт открываются после всех букв.
  const STAGES = [
    {
      id: 'letters', title: 'Буквы', color: '#F2544B',
      lessons: LETTER_GROUPS.map((g, i) => ({ id: 'L' + (i + 1), type: 'letters', title: g.split('').join(' '), letters: g.split('') }))
    },
    {
      id: 'syllables', title: 'Читаем по слогам', color: '#3AA7F0', requires: 'letters',
      lessons: SYL_LESSONS.map((s, i) => Object.assign({ id: 'S' + (i + 1), type: 'syllables' }, s))
    },
    {
      id: 'math', title: 'Счёт', color: '#3DBE6B', requires: 'letters',
      lessons: MATH_LESSONS.map((m, i) => Object.assign({ id: 'M' + (i + 1), type: 'math' }, m))
    }
  ];

  // Полный список того, что нужно озвучить: [ключ, текст, раздел].
  function audioList() {
    const out = [];
    for (const [k, t] of Object.entries(PHRASES)) out.push([k, t, 'Фразы помощника']);
    for (const x of ALPHABET) out.push(['letter-' + x.k, x.name, 'Названия букв']);
    for (const x of ALPHABET) out.push(['word-' + x.k, x.word, 'Слова к буквам']);
    const syl = new Set();
    for (const s of SYL_LESSONS) { s.syl.forEach(v => syl.add(v)); s.words.forEach(w => { syl.add(w[0]); syl.add(w[1]); }); }
    for (const s of syl) out.push(['syl-' + translit(s), s[0] + s.slice(1).toLowerCase(), 'Слоги']);
    for (const s of SYL_LESSONS) for (const w of s.words) out.push(['sw-' + translit(w[2]), w[2], 'Слова по слогам']);
    for (let n = 1; n <= 10; n++) out.push(['num-' + n, NUMBERS[n], 'Числа']);
    return out;
  }

  window.COURSE = { ALPHABET, BY_LETTER, STAGES, NUMBERS, THINGS, PHRASES, translit, audioList };
})();
