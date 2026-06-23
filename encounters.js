/* ============================================
   Encounters — Round definitions
   Full progression: 15 rounds, boss every 5
   ============================================ */

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
            { pieceType: 'king',   pieceIndex: 0, itemId: 'kings_crown' },
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
            { pieceType: 'bishop', pieceIndex: 0, itemId: 'pierce_one' },
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
            { pieceType: 'knight', pieceIndex: 0, itemId: 'dodge_ring' },
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
            { pieceType: 'bishop', pieceIndex: 0, itemId: 'pierce_one' },
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
            { pieceType: 'king',   pieceIndex: 0, itemId: 'kings_crown' },
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
            { pieceType: 'bishop', pieceIndex: 0, itemId: 'pierce_one' },
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
            { pieceType: 'bishop', pieceIndex: 1, itemId: 'pierce_one' },
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
            { pieceType: 'bishop', pieceIndex: 0, itemId: 'pierce_one' },
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
            { pieceType: 'king',   pieceIndex: 0, itemId: 'kings_crown' },
            // Тёмная ферзь с абсолютной мощью
            { pieceType: 'queen',  pieceIndex: 0, itemId: 'omega_rune' },
            // Бессмертные ладьи
            { pieceType: 'rook',   pieceIndex: 0, itemId: 'iron_plate' },
            { pieceType: 'rook',   pieceIndex: 1, itemId: 'iron_plate' },
            // Неуязвимые рыцари
            { pieceType: 'knight', pieceIndex: 0, itemId: 'horseshoe' },
            { pieceType: 'knight', pieceIndex: 1, itemId: 'leap_boots' },
            // Слоны-призраки
            { pieceType: 'bishop', pieceIndex: 0, itemId: 'pierce_one' },
            { pieceType: 'bishop', pieceIndex: 1, itemId: 'compass' },
        ],
        isBoss: true,
        bossName: '💀 Тёмный Лорд',
        bossDescription: 'Финальный босс. Его армия вооружена до зубов. Удачи.',
    },
];

// Try to load custom encounters from localStorage
function getEncounters() {
    try {
        const custom = localStorage.getItem('chess_roguelike_encounters');
        if (custom) {
            const parsed = JSON.parse(custom);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {}
    return ENCOUNTERS;
}

function getEncounterById(id) {
    return getEncounters().find(e => e.id === id);
}
