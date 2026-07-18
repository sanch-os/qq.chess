/* Репродукция мультиплеерного desync + проверка фикса.
process.chdir(require('path').join(__dirname, '..'));
   Клиент A (ходящий, авторитетный) и клиент B (получатель) исполняют
   один и тот же ход-взятие по фигуре с dodgeChance=0.5, но с разными
   последовательностями Math.random. */
const fs = require('fs');
const src = fs.readFileSync('./piece-entity.js', 'utf8') + '\n' +
            fs.readFileSync('./chess-engine.js', 'utf8') + '\n' +
            'globalThis.PieceEntity = PieceEntity; globalThis.ChessEngine = ChessEngine;';
(0, eval)(src);

const DODGE_ITEM = { id: 'evasion_cloak', allowedPieces: ['all'], cost: 0,
                     modifiers: { dodgeChance: 0.5 } };

function makeClient() {
    const e = new ChessEngine();
    e.reset();
    // Белая ладья a1, чёрная пешка a5 с плащом уклонения, короли.
    e.placePiece(7, 0, 'rook', 'white');
    const victim = new PieceEntity('pawn', 'black', 500);
    victim.setItem(0, { ...DODGE_ITEM, modifiers: { ...DODGE_ITEM.modifiers } });
    e.setPiece(3, 0, victim);
    e.placePiece(7, 4, 'king', 'white');
    e.placePiece(0, 4, 'king', 'black');
    return e;
}

function boardKey(e) {
    let s = '';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const p = e.board[r][c];
        s += p ? `${p.color[0]}${p.type[0]}${r}${c};` : '';
    }
    return s;
}

const realRandom = Math.random;
function withRandom(seq, fn) {
    let i = 0;
    Math.random = () => seq[Math.min(i++, seq.length - 1)];
    try { return fn(); } finally { Math.random = realRandom; }
}

// ── Сценарий 1: СТАРОЕ поведение (получатель бросает кубик сам) ──
let A = makeClient(), B = makeClient();
withRandom([0.1], () => A.makeMove(7, 0, 3, 0));            // A: 0.1 < 0.5 → dodge сработал
withRandom([0.9], () => B.makeMove(7, 0, 3, 0));            // B: 0.9 > 0.5 → пешка убита
const desynced = boardKey(A) !== boardKey(B);
console.log('1. Старый путь (независимые броски): desync =', desynced ? 'ДА (баг воспроизведён)' : 'нет');

// ── Сценарий 2: НОВЫЙ путь (исходы передаются) ──
A = makeClient(); B = makeClient();
const resA = withRandom([0.1], () => A.makeMove(7, 0, 3, 0));
console.log('   A outcomes:', JSON.stringify(resA.outcomes));
// B применяет исходы A, при этом его локальный RNG говорил бы обратное:
const resB = withRandom([0.9], () => B.makeMove(7, 0, 3, 0, null, resA.outcomes));
console.log('2. Новый путь (forcedOutcomes): boards equal =', boardKey(A) === boardKey(B),
            '| B._dodged =', !!resB.move._dodged);

// ── Сценарий 3: обратный случай — у A НЕ увернулась, у B "хотела" ──
A = makeClient(); B = makeClient();
const resA3 = withRandom([0.9], () => A.makeMove(7, 0, 3, 0));
const resB3 = withRandom([0.1], () => B.makeMove(7, 0, 3, 0, null, resA3.outcomes));
console.log('3. Обратный случай: boards equal =', boardKey(A) === boardKey(B),
            '| captured у B =', resB3.captured ? resB3.captured.type : null);

// ── Сценарий 4: обратная совместимость — без outcomes всё работает как раньше ──
A = makeClient();
const r4 = withRandom([0.9], () => A.makeMove(7, 0, 3, 0));
console.log('4. Локальная игра без outcomes: captured =', r4.captured ? r4.captured.type : null,
            '(ожидаем pawn)');

// ── Сценарий 5: venom через forced ──
A = makeClient(); B = makeClient();
for (const e of [A, B]) {
    const att = e.board[7][0];
    att.setItem(0, { id: 'venom_fang', modifiers: { venomChance: 0.5 } });
}
const r5A = withRandom([0.9, 0.1], () => A.makeMove(7, 0, 3, 0)); // dodge fail→shield? нет щита... пешка dodge 0.9 fail, убита → survivor нет, venom не применим
console.log('5a. venom без выжившего: outcomes =', JSON.stringify(r5A.outcomes));
// теперь с dodge: survivor есть, venom бросается
A = makeClient(); B = makeClient();
for (const e of [A, B]) e.board[7][0].setItem(0, { id: 'venom_fang', modifiers: { venomChance: 0.5 } });
const r5b = withRandom([0.1, 0.2], () => A.makeMove(7, 0, 3, 0)); // dodge yes, venom yes
const r5c = withRandom([0.9, 0.9], () => B.makeMove(7, 0, 3, 0, null, r5b.outcomes));
const frozenA = A.board[7][0] && A.board[7][0].frozen; // survivor swap → пешка на from (7,0)
const frozenB = B.board[7][0] && B.board[7][0].frozen;
console.log('5b. venom forced: A frozen =', frozenA, '| B frozen =', frozenB,
            '| equal =', frozenA === frozenB && boardKey(A) === boardKey(B));

// ── Сценарий 6: DTO не содержит сущностей ──
const dto = { type: 'move',
    move: { from: { row: 7, col: 0 }, to: { row: 3, col: 0 }, promotion: null },
    outcomes: r5b.outcomes };
const hasFunctionsOrEntities = JSON.stringify(dto).includes('_statsCache');
console.log('6. DTO чистый (без PieceEntity/_statsCache):', !hasFunctionsOrEntities,
            '| размер:', JSON.stringify(dto).length, 'байт');
