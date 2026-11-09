// Собирает список фраз для озвучки из js/data.js.
// Запуск: node tools/audio-list.js  →  audio/LIST.csv и audio/LIST.md
const fs = require('fs');
const path = require('path');
global.window = {};
require('../js/data.js');
const rows = window.COURSE.audioList();
const dir = path.join(__dirname, '..', 'audio');

fs.writeFileSync(path.join(dir, 'LIST.csv'), 'file;text;section\n' + rows.map(([k, t, s]) => `${k}.mp3;${t};${s}`).join('\n') + '\n');

const order = ['Фразы помощника', 'Названия букв', 'Слова к буквам', 'Слоги', 'Слова по слогам', 'Числа'];
const first = new Set(['Фразы помощника', 'Названия букв', 'Слова к буквам']);
let md = `# Озвучка для ElevenLabs

Всего файлов: ${rows.length}. Сначала нужны первые три раздела (${rows.filter(r => first.has(r[2])).length} файлов), с ними уже звучат все уроки букв. Остальное можно прислать позже: пока файла нет, приложение говорит встроенным голосом планшета.

## Как делать

1. Модель **Eleven Multilingual v2**, один и тот же голос для всех файлов. Лучше тёплый, спокойный, женский или мужской, без «радио-диктора».
2. Настройки: Stability около 50%, Similarity около 75%, Style 0–15%, Speed 0.9.
3. Вставьте текст из колонки «Текст» как есть, вместе с точкой или восклицательным знаком: так интонация получается законченной.
4. Скачайте в **MP3** и назовите файл ровно как в колонке «Файл» (латиница, маленькие буквы).
5. Если голос «съедает» короткий слог или букву, повторите генерацию или добавьте в конце точку.
6. Присылайте файлы сюда пачками, можно архивом. Я положу их в приложение, и они подключатся сами.

`;
for (const sec of order) {
  const rs = rows.filter(r => r[2] === sec);
  md += `## ${sec} (${rs.length})\n\n| Файл | Текст |\n|---|---|\n`;
  for (const [k, t] of rs) {
    let text = t;
    if (sec === 'Слоги' || sec === 'Названия букв' || sec === 'Слова к буквам' || sec === 'Слова по слогам' || sec === 'Числа') text = t + '.';
    md += `| ${k}.mp3 | ${text} |\n`;
  }
  md += '\n';
}
fs.writeFileSync(path.join(dir, 'LIST.md'), md);
console.log(rows.length, 'files listed');
