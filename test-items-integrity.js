/* Тест персистентности забега: round-trip serialize→JSON→restore,
process.chdir(require('path').join(__dirname, '..'));
   защита от битых/устаревших/подделанных сейвов. */
const fs = require('fs');
const src = fs.readFileSync('./piece-entity.js', 'utf8') + '\n' +
            fs.readFileSync('./items-db.js', 'utf8') + '\n' +
            fs.readFileSync('./encounters.js', 'utf8') + '\n' +
            fs.readFileSync('./run-manager.js', 'utf8') + '\n' +
            'globalThis.RunManager = RunManager; globalThis.getItemById = getItemById;';
(0, eval)(src);

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : fail++; console.log((cond ? '✓' : '✗ FAIL'), name); };

// 1. Round-trip: активный забег с прогрессом
const rm = new RunManager();
rm.startRun();
rm.gold = 245;
rm.currentRound = 3;
rm.bonusPieces = { knight: 2, pawn: 1 };
rm.roundResults = [{ round: 0, result: 'win' }, { round: 1, result: 'win' }, { round: 2, result: 'win' }];

const json = JSON.stringify(rm.serialize());
const rm2 = new RunManager();
const ok = rm2.restore(JSON.parse(json));
check('restore() принимает валидный сейв', ok === true);
check('gold восстановлен', rm2.gold === 245);
check('currentRound восстановлен', rm2.currentRound === 3);
check('bonusPieces восстановлены', rm2.bonusPieces.knight === 2 && rm2.bonusPieces.pawn === 1);
check('roundResults восстановлены', rm2.roundResults.length === 3 && rm2.roundResults[2].result === 'win');
check('стеш: те же 12 предметов (по id)', 
      rm2.playerItems.length === rm.playerItems.length &&
      rm2.playerItems.every((it, i) => it.id === rm.playerItems[i].id));
check('стеш: modifiers — свежие копии, не алиасы каталога',
      rm2.playerItems.every(it => it.modifiers !== getItemById(it.id).modifiers));
check('active=true, состояние setup', rm2.active && rm2.state === 'setup');
check('encounters регенерированы', rm2.encounters.length > 0);

// 2. Неизвестный item id (баланс-патч удалил предмет) — молча выброшен
const save2 = rm.serialize();
save2.playerItems.push('deleted_legacy_item_9000');
const rm3 = new RunManager();
rm3.restore(save2);
check('неизвестный id выброшен без падения', rm3.playerItems.length === rm.playerItems.length);

// 3. Чужая версия формата — отказ
const save3 = { ...rm.serialize(), v: 999 };
check('чужая версия отвергнута', new RunManager().restore(save3) === false);

// 4. Подделанные значения — санитизация
const save4 = rm.serialize();
save4.gold = -50; save4.bonusPieces = { king: 5, knight: -1, rook: 2 };
const rm4 = new RunManager();
rm4.restore(save4);
check('отрицательное золото → 0', rm4.gold === 0);
check('king не рекрутируется, мусор отброшен',
      !rm4.bonusPieces.king && !rm4.bonusPieces.knight && rm4.bonusPieces.rook === 2);

// 5. Мусор вместо сейва
check('null отвергнут', new RunManager().restore(null) === false);
check('битый объект отвергнут', new RunManager().restore({ v: 1, active: true, currentRound: 'x' }) === false);
check('неактивный забег отвергнут', new RunManager().restore({ ...rm.serialize(), active: false }) === false);

// 6. Размер сейва
console.log(`\nРазмер сейва: ${json.length} байт`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
