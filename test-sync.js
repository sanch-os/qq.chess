/* ============================================================================
   test-i18n.js — страж локализации
   ============================================================================
   1. В app.js / multiplayer.js нет кириллицы в строковых литералах
      (комментарии допустимы; dev-логи console.* должны быть на английском).
   2. Все ключи, используемые через window.t('...') в коде, существуют в ru.
   3. Словари ru/en/es содержат ОДИНАКОВЫЕ наборы ключей (паритет).
   ========================================================================= */
process.chdir(require('path').join(__dirname, '..'));
const fs = require('fs');

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
    cond ? pass++ : fail++;
    console.log((cond ? '✓' : '✗ FAIL'), name, cond ? '' : '\n    ' + extra);
};

/* Убираем комментарии, чтобы кириллица в них не давала ложных срабатываний. */
function stripComments(src) {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
        .replace(/([;{}(,=+])\s*\/\/[^\n]*$/gm, '$1');
}

/* ── 1. Нет кириллицы в литералах app.js / multiplayer.js ── */
for (const file of ['app.js', 'multiplayer.js']) {
    const src = stripComments(fs.readFileSync(file, 'utf8'));
    const hits = [];
    src.split('\n').forEach((line, i) => {
        // строковые литералы всех трёх видов
        const literals = line.match(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g) || [];
        for (const lit of literals) {
            if (/[А-Яа-яЁё]/.test(lit)) hits.push(`${file}:${i + 1} ${lit.slice(0, 60)}`);
        }
    });
    check(`${file}: нет кириллицы в строковых литералах`, hits.length === 0, hits.slice(0, 8).join('\n    '));
}

/* ── 2+3. Ключи и паритет словарей ── */
globalThis.window = globalThis; // locales.js пишет в window.*
(0, eval)(fs.readFileSync('locales.js', 'utf8') + '\nglobalThis.LOCALES = window.i18n || null;');
check('locales.js: словарь доступен', !!globalThis.LOCALES);
if (globalThis.LOCALES) {
    const langs = ['ru', 'en', 'es'];
    const keysets = Object.fromEntries(langs.map(l => [l, new Set(Object.keys(globalThis.LOCALES[l] || {}))]));

    // Все t('...') из кода существуют в ru
    const codeSrc = ['app.js', 'multiplayer.js'].map(f => stripComments(fs.readFileSync(f, 'utf8'))).join('\n');
    const used = new Set();
    for (const m of codeSrc.matchAll(/(?:window\.t|[^a-zA-Z_]_t|[^a-zA-Z_]tt)\(\s*'([^']+)'/g)) used.add(m[1]);
    // Ключи с завершающей точкой — динамические префиксы вида
    // window.t('piece.' + type): для них проверяем, что в ru есть хотя бы
    // один ключ с таким префиксом; полные ключи проверяем на точное наличие.
    const missing = [...used].filter(k => k.endsWith('.')
        ? ![...keysets.ru].some(rk => rk.startsWith(k))
        : !keysets.ru.has(k));
    check(`все ${used.size} ключей из кода существуют в ru`, missing.length === 0, missing.join(', '));

    // Паритет ru/en/es
    for (const l2 of ['en', 'es']) {
        const onlyRu = [...keysets.ru].filter(k => !keysets[l2].has(k));
        const onlyL2 = [...keysets[l2]].filter(k => !keysets.ru.has(k));
        check(`паритет ключей ru ↔ ${l2}`, onlyRu.length === 0 && onlyL2.length === 0,
              `ru-only: ${onlyRu.slice(0, 5).join(',')} | ${l2}-only: ${onlyL2.slice(0, 5).join(',')}`);
    }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
