/* ============================================
   Encounters — Round definitions
   ============================================ */

const ENCOUNTERS = [
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
        name: 'Гвардейцы',
        description: 'Враг стал умнее. У его фигур есть снаряжение.',
        difficulty: 2,
        aiDepth: 3,
        goldReward: 80,
        enemySetup: 'standard',
        enemyItems: [
            { pieceType: 'queen', pieceIndex: 0, itemId: 'boots_of_speed' },
            { pieceType: 'rook',  pieceIndex: 0, itemId: 'wooden_shield' },
        ],
        isBoss: false,
    },
    {
        id: 'round_3_boss',
        name: 'Тёмный король',
        description: 'Финальный босс. Его армия вооружена до зубов.',
        difficulty: 3,
        aiDepth: 3,
        goldReward: 150,
        enemySetup: 'standard',
        enemyItems: [
            { pieceType: 'king',   pieceIndex: 0, itemId: 'kings_crown' },
            { pieceType: 'queen',  pieceIndex: 0, itemId: 'sharp_blade' },
            { pieceType: 'rook',   pieceIndex: 0, itemId: 'wooden_shield' },
            { pieceType: 'rook',   pieceIndex: 1, itemId: 'diagonal_slide' },
            { pieceType: 'bishop', pieceIndex: 0, itemId: 'compass' },
            { pieceType: 'knight', pieceIndex: 0, itemId: 'horseshoe' },
        ],
        isBoss: true,
        bossName: '♛ Тёмный Король',
        bossDescription: 'Его корона даёт ему силу ферзя. Его армия — закалённые ветераны.',
    }
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
