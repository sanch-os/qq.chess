/* ============================================================================
process.chdir(require('path').join(__dirname, '..'));
   test-items-integrity.js — валидатор целостности системы предметов
   ============================================================================
   Инварианты:
   1. Каждый itemId в encounters.js существует в ITEMS_DB.
   2. Каждый modifier-ключ каталога ЧИТАЕТСЯ кодом (engine/piece-entity/
      app/run-manager) — либо предмет помечен disabled.
   3. disabled-предметы никогда не попадают в пулы (getRandomItems/getShopItems).
   4. У каждого предмета валидные allowedPieces, cost и локализация ru/en/es.
   Плюс функциональные тесты 8 новых механик.
   ========================================================================= */
const fs = require('fs');
const code = ['piece-entity.js', 'chess-engine.js', 'items-db.js', 'encounters.js', 'run-manager.js']
    .map(f => fs.readFileSync(f, 'utf8')).join('\n');
(0, eval)(code + `
globalThis.ChessEngine = ChessEngine; globalThis.PieceEntity = PieceEntity;
globalThis.ITEMS_DB = ITEMS_DB; globalThis.getItemById = getItemById;
globalThis.getEncounters = getEncounters; globalThis.getRandomItems = getRandomItems;
globalThis.getShopItems = getShopItems; globalThis.RunManager = RunManager;`);

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
    cond ? pass++ : fail++;
    console.log((cond ? '✓' : '✗ FAIL'), name, cond ? '' : extra);
};

/* ── 1. Все itemId энкаунтеров существуют ── */
{
    const missing = [];
    for (const enc of getEncounters()) {
        for (const ref of (enc.enemyItems || [])) {
            if (!getItemById(ref.itemId)) missing.push(`${enc.name}: ${ref.itemId}`);
        }
    }
    check('encounters: все itemId существуют в каталоге', missing.length === 0, missing.join(', '));
}

/* ── 2. Каждый modifier-ключ читается кодом (grep по исходникам) ──
   Ключ считается «живым», если его имя встречается в piece-entity /
   chess-engine / app / run-manager вне самого каталога. app.js подключаем
   отдельно (он не исполняется в node — DOM), только как текст. */
{
    const consumerSrc = ['piece-entity.js', 'chess-engine.js', 'app.js', 'run-manager.js']
        .map(f => fs.readFileSync(f, 'utf8')).join('\n');
    const deadKeys = [];
    for (const item of Object.values(ITEMS_DB)) {
        for (const key of Object.keys(item.modifiers || {})) {
            const isRead = new RegExp('\\b' + key + '\\b').test(consumerSrc);
            if (!isRead && !item.disabled) deadKeys.push(`${item.id}.${key}`);
        }
    }
    check('каталог: каждый modifier-ключ активного предмета имеет потребителя в коде',
          deadKeys.length === 0, deadKeys.join(', '));
}

/* ── 3. disabled-предметы вне пулов ── */
{
    const disabledIds = Object.values(ITEMS_DB).filter(i => i.disabled).map(i => i.id);
    check('в каталоге ровно 4 disabled-предмета', disabledIds.length === 4, disabledIds.join(','));
    let leaked = new Set();
    for (let t = 0; t < 300; t++) {
        for (const it of getRandomItems(10)) if (it.disabled) leaked.add(it.id);
        for (const it of getShopItems(9, 9999, 3)) if (it.disabled) leaked.add(it.id);
    }
    check('пулы: disabled-предметы не выпадают (300 прогонов)', leaked.size === 0, [...leaked].join(','));
}

/* ── 4. Структурная валидность каталога ── */
{
    const VALID = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'all'];
    const bad = [];
    for (const item of Object.values(ITEMS_DB)) {
        if (!Array.isArray(item.allowedPieces) || !item.allowedPieces.every(p => VALID.includes(p)))
            bad.push(`${item.id}: allowedPieces`);
        if (!Number.isFinite(item.cost) || item.cost < 0) bad.push(`${item.id}: cost`);
        for (const lang of ['ru', 'en', 'es']) {
            if (!item.name?.[lang]) bad.push(`${item.id}: name.${lang}`);
            if (!item.description?.[lang]) bad.push(`${item.id}: description.${lang}`);
        }
    }
    check('каталог: allowedPieces/cost/локализация валидны у всех предметов',
          bad.length === 0, bad.join(', '));
}

/* ── Функциональные тесты новых механик ── */
const give = (piece, mods) => piece.setItem(piece.getEmptySlot(), { id: 't_' + Object.keys(mods)[0], allowedPieces: ['all'], cost: 0, modifiers: { ...mods } });
function setup(attackerType, victimType, mods = {}, victimMods = {}) {
    const e = new ChessEngine(); e.reset();
    const att = new PieceEntity(attackerType, 'white', 1);
    if (Object.keys(mods).length) give(att, mods);
    const vic = new PieceEntity(victimType, 'black', 2);
    if (Object.keys(victimMods).length) give(vic, victimMods);
    e.setPiece(4, 4, att); e.setPiece(3, 4, vic);
    e.placePiece(7, 7, 'king', 'white'); e.placePiece(0, 0, 'king', 'black');
    return { e, att, vic };
}

// double_loot: x2 за ферзя
{
    const { e } = setup('rook', 'queen', { goldPerCapture: 10, doubleGoldOnQueenCapture: true });
    e.makeMove(4, 4, 3, 4);
    check('double_loot: голд x2 за взятие ферзя (10→20)', e.goldEarned.white === 20, 'got ' + e.goldEarned.white);
}
// scroll_of_greed: x3 за тяжёлую
{
    const { e } = setup('rook', 'rook', { goldPerCapture: 10, tripleGoldOnHeavyCapture: true });
    e.makeMove(4, 4, 3, 4);
    check('scroll_of_greed: голд x3 за ладью (10→30)', e.goldEarned.white === 30, 'got ' + e.goldEarned.white);
}
// demonic_pact: x2 всё
{
    const { e } = setup('rook', 'pawn', { goldPerCapture: 10, doubleGoldAll: true });
    e.makeMove(4, 4, 3, 4);
    check('demonic_pact: весь голд x2 (10→20)', e.goldEarned.white === 20, 'got ' + e.goldEarned.white);
}
// cursed_gold: -N за тихий ход, ничего при взятии
{
    const { e } = setup('rook', 'pawn', { goldLossPerMove: 10 });
    e.makeMove(4, 4, 4, 0); // тихий ход
    check('cursed_gold: -10 за тихий ход', e.goldEarned.white === -10, 'got ' + e.goldEarned.white);
    const s2 = setup('rook', 'pawn', { goldLossPerMove: 10 });
    s2.e.makeMove(4, 4, 3, 4); // взятие
    check('cursed_gold: штрафа нет при взятии', s2.e.goldEarned.white === 0, 'got ' + s2.e.goldEarned.white);
}
// kings_signet: +N × число своих фигур за ход
{
    const e = new ChessEngine(); e.reset();
    const king = new PieceEntity('king', 'white', 1);
    give(king, { goldPerPiecePerTurn: 5 });
    e.setPiece(7, 4, king);
    e.placePiece(6, 0, 'pawn', 'white');
    e.placePiece(6, 1, 'pawn', 'white');
    e.placePiece(0, 0, 'king', 'black');
    e.makeMove(6, 0, 5, 0); // ход пешкой: 3 белые фигуры × 5
    check('kings_signet: +5 × 3 фигуры = 15 за ход', e.goldEarned.white === 15, 'got ' + e.goldEarned.white);
}
// second_chance: превращение при взятии
{
    const { e } = setup('pawn', 'knight', { promoteOnCapture: true });
    e.board[3][4] = null; e.setPiece(3, 3, new PieceEntity('knight', 'black', 3)); // диагональ для взятия пешкой
    e.makeMove(4, 4, 3, 3);
    check('second_chance: пешка превратилась при взятии', e.board[3][3].type === 'queen', 'got ' + e.board[3][3].type);
    const s2 = setup('pawn', 'knight', { promoteOnCapture: true });
    s2.e.board[3][4] = null;
    s2.e.makeMove(4, 4, 3, 4); // тихий ход
    check('second_chance: без взятия остаётся пешкой', s2.e.board[3][4].type === 'pawn', 'got ' + s2.e.board[3][4].type);
}
// last_stand: 60% уклонение на последнем щите
{
    const real = Math.random;
    Math.random = () => 0.5; // 0.5 < 0.6 → уклонение сработает только с last_stand
    const { e, vic } = setup('rook', 'pawn', {}, { shield: 1, dodgeOnLastShield: 0.6 });
    const res = e.makeMove(4, 4, 3, 4);
    Math.random = real;
    check('last_stand: dodge 60% на последнем щите (roll 0.5)', !!res.move._dodged && res.captured === null);
    // без last_stand тот же бросок = взятие через щит
    Math.random = () => 0.5;
    const s2 = setup('rook', 'pawn', {}, { shield: 1 });
    const r2 = s2.e.makeMove(4, 4, 3, 4);
    Math.random = real;
    check('без last_stand: тот же бросок пробивает в щит', !r2.move._dodged && !!r2.move._shielded);
}
// merchants_ring: цена в run-manager через override
{
    const rm = new RunManager();
    rm.active = true; rm.gold = 100;
    const item = { id: 'x', cost: 100, allowedPieces: ['all'], modifiers: {} };
    check('buyItem с override 85 проходит при 100 золота', rm.buyItem(item, 85) === true && rm.gold === 15);
    check('предмет в стеше сохранил каталожную цену', rm.playerItems[0].cost === 100);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
