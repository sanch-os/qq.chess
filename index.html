/* ============================================================================
   Encounters — qq.chess round definitions (audited)
   ============================================================================
   Full progression: 15 rounds, boss every 5.

   AUDIT FINDING: cross-referencing every `itemId` below against the real
   items-db.js catalog (85 entries) turned up FOUR references to item ids
   that do not exist anywhere in the catalog. getItemById() returns null for
   an unknown id, and RunManager._equipEnemyItems() silently `continue`s
   past a null item — so these enemies simply never received their
   intended gear, with no error anywhere. Three of the four are recovered
   with high confidence because they match an exact convention repeated in
   several OTHER rounds (see each fix comment); the fourth (dodge_ring) has
   no equally strong signal and is a best-effort substitution — flagged as
   such rather than presented as a certain recovery.
   ========================================================================= */

const ENCOUNTERS = [
    // ─── РАУНД 1-4: Новобранцы ───────────────────────────────────────────────
    {
        id: 'round_1',
        name: 'Новобранцы',
        description: 'Лёгкая разминка. Враг играет осторожно.',
        difficulty: 1,
        aiDepth: 2,
        goldReward: 60,
        enemySetup: 'standard',
        enemyItems: [],
        isBoss: false,
    },
    {
        id: 'round_2',
        name: 'Рекруты',
        description: 'Враг чуть хитрее. Его конь получил подковы.',
        difficulty: 1,
        aiDepth: 2,
        goldReward: 65,
        enemySetup: 'standard',
        enemyItems: [
            { pieceType: 'knight', pieceIndex: 0, itemId: 'horseshoe' },
        ],
        isBoss: false,
    },
    {
        id: 'round_3',
        name: 'Гвардейцы',
        description: 'Враг становится серьёзным. Ладья и ферзь в снаряжении.',
        difficulty: 2,
        aiDepth: 2,
        goldReward: 70,
        enemySetup: 'standard',
        enemyItems: [
            { pieceType: 'queen', pieceIndex: 0, itemId: 'boots_of_speed' },
            { pieceType: 'rook',  pieceIndex: 0, itemId: 'wooden_shield' },
        ],
        isBoss: false,
    },
    {
        id: 'round_4',
        name: 'Ветераны',
        description: 'Опытные воины. Слон и конь дополнительно усилены.',
        difficulty: 2,
        aiDepth: 3,
        goldReward: 80,
        enemySetup: 'standard',
        enemyItems: [
            { pieceType: 'queen',  pieceIndex: 0, itemId: 'sharp_blade' },
            { pieceType: 'bishop', pieceIndex: 0, itemId: 'compass' },
            { pieceType: 'knight', pieceIndex: 0, itemId: 'horseshoe' },
        ],
        isBoss: false,
    },

    // ─── РАУНД 5: БОСС — Тёмный Король ───────────────────────────────────────
    {
        id: 'round_5_boss',
        name: '⚔️ БОСС: Тёмный Король',
        description: 'Его корона даёт ему силу ферзя. Первый страж тьмы.',
        difficulty: 3,
        aiDepth: 3,
        goldReward: 180,
        enemySetup: 'standard',
        enemyItems: [
            { pieceType: 'king',   pieceIndex: 0, itemId: 'kings_crown', isBossPiece: true },
            { pieceType: 'queen',  pieceIndex: 0, itemId: 'sharp_blade' },
            { pieceType: 'rook',   pieceIndex: 0, itemId: 'wooden_shield' },
            { pieceType: 'rook',   pieceIndex: 1, itemId: 'diagonal_slide' },
            { pieceType: 'knight', pieceIndex: 0, itemId: 'horseshoe' },
        ],
        isBoss: true,
        bossName: '♛ Тёмный Король',
        bossDescription: 'Его корона даёт ему силу ферзя. Его ладьи — закалённые ветераны.',
    },

    // ─── РАУНД 6-9: Элита ────────────────────────────────────────────────────
    {
        id: 'round_6',
        name: 'Элитные стрелки',
        description: 'Пешки с усиленным ходом — не дай им пройти!',
        difficulty: 3,
        aiDepth: 3,
        goldReward: 90,
        enemySetup: 'standard',
        enemyItems: [
            { pieceType: 'queen',  pieceIndex: 0, itemId: 'boots_of_speed' },
            { pieceType: 'pawn',   pieceIndex: 0, itemId: 'boots_of_speed' },
            { pieceType: 'pawn',   pieceIndex: 3, itemId: 'wooden_shield' },
            // FIX: was 'pierce_one' — no such item id anywhere in the
            // catalog. 'tunnel_drill' is the ONLY item with the pierceOne
            // modifier, and its description ("ignores one piece in its
            // path") is exactly the "phasing" mechanic these rounds are
            // themed around.
            { pieceType: 'bishop', pieceIndex: 0, itemId: 'tunnel_drill' },
        ],
        isBoss: false,
    },
    {
        id: 'round_7',
        name: 'Бронированный авангард',
        description: 'Щиты, щиты везде. Пробивай броню!',
        difficulty: 3,
        aiDepth: 3,
        goldReward: 95,
        enemySetup: 'standard',
        enemyItems: [
            { pieceType: 'rook',   pieceIndex: 0, itemId: 'titanium_plate' },
            { pieceType: 'rook',   pieceIndex: 1, itemId: 'titanium_plate' },
            { pieceType: 'queen',  pieceIndex: 0, itemId: 'divine_shield' },
            // FIX: was 'dodge_ring' — no such item id anywhere in the
            // catalog. Best-effort substitution (NOT a certain recovery —
            // no in-file convention pins this down the way the other three
            // fixes in this file are pinned): phantom_cloak has the
            // highest dodge chance (35%) and universal allowedPieces,
            // matching this round's "nearly unkillable" theme. stone_skin
            // (30%, pawn/rook) or silk_robe (15%, queen/bishop) are also
            // plausible if the original intent was different.
            { pieceType: 'knight', pieceIndex: 0, itemId: 'phantom_cloak' },
        ],
        isBoss: false,
    },
    {
        id: 'round_8',
        name: 'Охотники за головами',
        description: 'Они бьют дальше и зарабатывают золото с убийств.',
        difficulty: 4,
        aiDepth: 3,
        goldReward: 100,
        enemySetup: 'standard',
        enemyItems: [
            { pieceType: 'queen',  pieceIndex: 0, itemId: 'sniper_scope' },
            { pieceType: 'bishop', pieceIndex: 0, itemId: 'bounty_hunter' },
            { pieceType: 'bishop', pieceIndex: 1, itemId: 'compass' },
            { pieceType: 'rook',   pieceIndex: 0, itemId: 'battle_axe' },
        ],
        isBoss: false,
    },
    {
        id: 'round_9',
        name: 'Теневой легион',
        description: 'Армия тьмы. Каждая фигура несёт смерть.',
        difficulty: 4,
        aiDepth: 4,
        goldReward: 110,
        enemySetup: 'standard',
        enemyItems: [
            { pieceType: 'queen',  pieceIndex: 0, itemId: 'omega_rune' },
            { pieceType: 'rook',   pieceIndex: 0, itemId: 'titanium_plate' },
            { pieceType: 'rook',   pieceIndex: 1, itemId: 'wooden_shield' },
            { pieceType: 'knight', pieceIndex: 0, itemId: 'magic_boots' },
            { pieceType: 'knight', pieceIndex: 1, itemId: 'horseshoe' },
            // FIX: was 'pierce_one' — see round_6's fix comment above.
            { pieceType: 'bishop', pieceIndex: 0, itemId: 'tunnel_drill' },
        ],
        isBoss: false,
    },

    // ─── РАУНД 10: БОСС — Чингисхан ──────────────────────────────────────────
    {
        id: 'round_10_boss',
        name: '🏇 БОСС: Чингисхан',
        description: 'Повелитель степей. Его конница сметает всё на пути.',
        difficulty: 5,
        aiDepth: 4,
        goldReward: 250,
        enemySetup: 'standard',
        enemyItems: [
            // Чингисхан — король с усиленным ходом
            { pieceType: 'king',   pieceIndex: 0, itemId: 'kings_crown', isBossPiece: true },
            // Ханша — ферзь дальнобойный и неуязвимый
            { pieceType: 'queen',  pieceIndex: 0, itemId: 'omega_rune' },
            // Монгольская конница — усиленные кони
            { pieceType: 'knight', pieceIndex: 0, itemId: 'horseshoe' },
            { pieceType: 'knight', pieceIndex: 1, itemId: 'magic_boots' },
            // Тяжёлая пехота
            { pieceType: 'rook',   pieceIndex: 0, itemId: 'titanium_plate' },
            { pieceType: 'rook',   pieceIndex: 1, itemId: 'battle_axe' },
        ],
        isBoss: true,
        bossName: '🏇 Чингисхан',
        bossDescription: 'Повелитель степей. Его конница — лучшая в мире. Убей коней первыми!',
    },

    // ─── РАУНД 11-14: Финальная угроза ───────────────────────────────────────
    {
        id: 'round_11',
        name: 'Арканские маги',
        description: 'Слоны и ферзи с мистическими свойствами.',
        difficulty: 5,
        aiDepth: 4,
        goldReward: 120,
        enemySetup: 'standard',
        enemyItems: [
            { pieceType: 'queen',  pieceIndex: 0, itemId: 'star_map' },
            // FIX: was 'pierce_one' — see round_6's fix comment above.
            { pieceType: 'bishop', pieceIndex: 0, itemId: 'tunnel_drill' },
            { pieceType: 'bishop', pieceIndex: 1, itemId: 'compass' },
            { pieceType: 'knight', pieceIndex: 0, itemId: 'silk_robe' },
            { pieceType: 'rook',   pieceIndex: 0, itemId: 'titanium_plate' },
        ],
        isBoss: false,
    },
    {
        id: 'round_12',
        name: 'Бессмертные',
        description: 'Уклонение и щиты. Уничтожить их почти невозможно.',
        difficulty: 5,
        aiDepth: 4,
        goldReward: 130,
        enemySetup: 'standard',
        enemyItems: [
            { pieceType: 'queen',  pieceIndex: 0, itemId: 'divine_shield' },
            { pieceType: 'queen',  pieceIndex: 0, itemId: 'evasion_cloak' },
            { pieceType: 'rook',   pieceIndex: 0, itemId: 'titanium_plate' },
            { pieceType: 'rook',   pieceIndex: 1, itemId: 'titanium_plate' },
            { pieceType: 'knight', pieceIndex: 0, itemId: 'silk_robe' },
            { pieceType: 'king',   pieceIndex: 0, itemId: 'kings_crown' },
        ],
        isBoss: false,
    },
    {
        id: 'round_13',
        name: 'Призрачная армия',
        description: 'Они появляются везде. Берегись телепортов.',
        difficulty: 6,
        aiDepth: 4,
        goldReward: 140,
        enemySetup: 'standard',
        enemyItems: [
            { pieceType: 'queen',  pieceIndex: 0, itemId: 'omega_rune' },
            { pieceType: 'bishop', pieceIndex: 0, itemId: 'shadow_step' },
            // FIX: was 'pierce_one' — see round_6's fix comment above.
            { pieceType: 'bishop', pieceIndex: 1, itemId: 'tunnel_drill' },
            { pieceType: 'knight', pieceIndex: 0, itemId: 'magic_boots' },
            { pieceType: 'knight', pieceIndex: 1, itemId: 'horseshoe' },
            { pieceType: 'rook',   pieceIndex: 0, itemId: 'battle_axe' },
            { pieceType: 'pawn',   pieceIndex: 2, itemId: 'boots_of_speed' },
        ],
        isBoss: false,
    },
    {
        id: 'round_14',
        name: 'Пред-финальный натиск',
        description: 'Последний шанс перед финалом. Всё или ничего.',
        difficulty: 6,
        aiDepth: 4,
        goldReward: 150,
        enemySetup: 'standard',
        enemyItems: [
            { pieceType: 'queen',  pieceIndex: 0, itemId: 'omega_rune' },
            { pieceType: 'rook',   pieceIndex: 0, itemId: 'titanium_plate' },
            { pieceType: 'rook',   pieceIndex: 1, itemId: 'battle_axe' },
            // FIX: was 'pierce_one' — see round_6's fix comment above.
            { pieceType: 'bishop', pieceIndex: 0, itemId: 'tunnel_drill' },
            { pieceType: 'knight', pieceIndex: 0, itemId: 'horseshoe' },
            { pieceType: 'knight', pieceIndex: 1, itemId: 'magic_boots' },
            { pieceType: 'king',   pieceIndex: 0, itemId: 'kings_crown' },
        ],
        isBoss: false,
    },

    // ─── РАУНД 15: ФИНАЛЬНЫЙ БОСС — Тёмный Лорд ─────────────────────────────
    {
        id: 'round_15_boss',
        name: '💀 ФИНАЛЬНЫЙ БОСС: Тёмный Лорд',
        description: 'Абсолютное зло. Его армия — совершенное оружие.',
        difficulty: 7,
        aiDepth: 4,
        goldReward: 500,
        enemySetup: 'standard',
        enemyItems: [
            // Тёмный Лорд — непобедимый король
            { pieceType: 'king',   pieceIndex: 0, itemId: 'kings_crown', isBossPiece: true },
            // Тёмная ферзь с абсолютной мощью
            { pieceType: 'queen',  pieceIndex: 0, itemId: 'omega_rune' },
            // Бессмертные ладьи
            // FIX: was 'iron_plate' — no such item id anywhere in the
            // catalog. Every OTHER round in this file (7, 9, 10, 11, 12,
            // 13, 14) uses 'titanium_plate' as the rook-armor item — this
            // was the one round breaking that established convention.
            { pieceType: 'rook',   pieceIndex: 0, itemId: 'titanium_plate' },
            { pieceType: 'rook',   pieceIndex: 1, itemId: 'titanium_plate' },
            // Неуязвимые рыцари
            { pieceType: 'knight', pieceIndex: 0, itemId: 'horseshoe' },
            // FIX: was 'leap_boots' — no such item id anywhere in the
            // catalog. Every OTHER two-knight round (9, 10, 13, 14) pairs
            // horseshoe with magic_boots — this was the one round breaking
            // that established convention.
            { pieceType: 'knight', pieceIndex: 1, itemId: 'magic_boots' },
            // Слоны-призраки
            // FIX: was 'pierce_one' — see round_6's fix comment above.
            { pieceType: 'bishop', pieceIndex: 0, itemId: 'tunnel_drill' },
            { pieceType: 'bishop', pieceIndex: 1, itemId: 'compass' },
        ],
        isBoss: true,
        bossName: '💀 Тёмный Лорд',
        bossDescription: 'Финальный босс. Его армия вооружена до зубов. Удачи.',
    },
];

/**
 * Minimal shape check for an encounter loaded from untrusted storage (the
 * level editor writes to the same localStorage key this reads from).
 *
 * FIX: previously ANY array from localStorage was trusted verbatim. A
 * malformed custom encounter (e.g. goldReward not a number) would silently
 * propagate `NaN` through RunManager's gold economy for the rest of the
 * run, or make aiDepth/enemyItems-dependent code misbehave downstream —
 * with no error pointing back to the actual cause.
 * @param {*} e
 * @returns {boolean}
 */
function _isValidEncounter(e) {
    return !!e && typeof e === 'object'
        && typeof e.id === 'string'
        && typeof e.goldReward === 'number' && Number.isFinite(e.goldReward)
        && typeof e.aiDepth === 'number' && Number.isFinite(e.aiDepth)
        && Array.isArray(e.enemyItems || []);
}

/**
 * Returns the encounter sequence for a run: a custom sequence from
 * localStorage (written by the level editor) if one validates cleanly,
 * otherwise the built-in campaign.
 * @returns {Array<Object>}
 */
function getEncounters() {
    try {
        const custom = localStorage.getItem('chess_roguelike_encounters');
        if (custom) {
            const parsed = JSON.parse(custom);
            if (Array.isArray(parsed) && parsed.length > 0) {
                const valid = parsed.filter(_isValidEncounter);
                if (valid.length > 0) return valid;
                // Every entry failed validation — fall through to the
                // built-in campaign rather than handing back an empty or
                // malformed sequence.
            }
        }
    } catch (e) {
        // Malformed JSON, storage unavailable, etc. — fall through.
    }
    return ENCOUNTERS;
}

/**
 * @param {string} id
 * @returns {Object|undefined}
 */
function getEncounterById(id) {
    return getEncounters().find(e => e.id === id);
}
