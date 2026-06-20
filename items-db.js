/* ============================================
   Items Database — 15 MVP items
   ============================================ */

const ITEMS_DB = {

    // ============================
    // 🏃 MOVEMENT (5 items)
    // ============================

    boots_of_speed: {
        id: 'boots_of_speed',
        name: 'Сапоги скорости',
        description: 'Скользящие фигуры (ладья, слон, ферзь) получают +1 к дальности хода.',
        icon: '👢',
        rarity: 'common',
        category: 'movement',
        cost: 40,
        tags: ['speed', 'range'],
        allowedPieces: ['rook', 'bishop', 'queen'],
        modifiers: { extraRange: 1 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    compass: {
        id: 'compass',
        name: 'Компас',
        description: 'Слон может дополнительно ходить на 1 клетку по прямой.',
        icon: '🧭',
        rarity: 'common',
        category: 'movement',
        cost: 35,
        tags: ['direction'],
        allowedPieces: ['bishop'],
        modifiers: {},
        extraDirections: [[-1,0],[1,0],[0,-1],[0,1]],
        extraKnightOffsets: [],
    },

    diagonal_slide: {
        id: 'diagonal_slide',
        name: 'Диагональное скольжение',
        description: 'Ладья может дополнительно ходить на 1 клетку по диагонали.',
        icon: '💠',
        rarity: 'common',
        category: 'movement',
        cost: 35,
        tags: ['direction'],
        allowedPieces: ['rook'],
        modifiers: {},
        extraDirections: [[-1,-1],[-1,1],[1,-1],[1,1]],
        extraKnightOffsets: [],
    },

    retreat: {
        id: 'retreat',
        name: 'Отступление',
        description: 'Пешка может ходить на 1 клетку назад.',
        icon: '🔙',
        rarity: 'common',
        category: 'movement',
        cost: 30,
        tags: ['pawn', 'direction'],
        allowedPieces: ['pawn'],
        modifiers: { pawnCanRetreat: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    horseshoe: {
        id: 'horseshoe',
        name: 'Подкова',
        description: 'Конь получает дополнительные прыжки: 3×1 (длинный Г).',
        icon: '🐴',
        rarity: 'rare',
        category: 'movement',
        cost: 70,
        tags: ['knight', 'jump'],
        allowedPieces: ['knight'],
        modifiers: {},
        extraDirections: [],
        extraKnightOffsets: [[-3,-1],[-3,1],[3,-1],[3,1],[-1,-3],[-1,3],[1,-3],[1,3]],
    },

    // ============================
    // 🗡 OFFENSE (5 items)
    // ============================

    sharp_blade: {
        id: 'sharp_blade',
        name: 'Острый клинок',
        description: 'Скользящие фигуры получают +1 к дальности взятия.',
        icon: '⚔️',
        rarity: 'common',
        category: 'offense',
        cost: 45,
        tags: ['damage', 'range'],
        allowedPieces: ['rook', 'bishop', 'queen'],
        modifiers: { extraCaptureRange: 1 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    sniper_scope: {
        id: 'sniper_scope',
        name: 'Снайперский прицел',
        description: 'Пешка может брать фигуры на расстоянии 2 клеток по диагонали.',
        icon: '🔭',
        rarity: 'rare',
        category: 'offense',
        cost: 65,
        tags: ['pawn', 'range'],
        allowedPieces: ['pawn'],
        modifiers: { pawnCaptureRange: 2 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    gold_tooth: {
        id: 'gold_tooth',
        name: 'Золотой зуб',
        description: '+15 золота за каждое взятие этой фигурой.',
        icon: '🦷',
        rarity: 'common',
        category: 'offense',
        cost: 40,
        tags: ['gold', 'economy'],
        allowedPieces: ['all'],
        modifiers: { goldPerCapture: 15 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    treasure_map: {
        id: 'treasure_map',
        name: 'Карта сокровищ',
        description: '+50 золота за победу в раунде.',
        icon: '🗺️',
        rarity: 'common',
        category: 'utility',
        cost: 45,
        tags: ['gold', 'economy'],
        allowedPieces: ['all'],
        modifiers: { goldOnWin: 50 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    promotion_scroll: {
        id: 'promotion_scroll',
        name: 'Свиток превращения',
        description: 'Пешка может превратиться уже на 6-м ряду (вместо 8-го).',
        icon: '📜',
        rarity: 'rare',
        category: 'offense',
        cost: 90,
        tags: ['pawn', 'promotion'],
        allowedPieces: ['pawn'],
        modifiers: { earlyPromotion: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    // ============================
    // 🛡 DEFENSE (3 items)
    // ============================

    wooden_shield: {
        id: 'wooden_shield',
        name: 'Деревянный щит',
        description: 'Фигура выживает после первого взятия (одноразовый щит).',
        icon: '🛡️',
        rarity: 'common',
        category: 'defense',
        cost: 50,
        tags: ['shield', 'survival'],
        allowedPieces: ['all'],
        modifiers: { shield: 1 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    iron_armor: {
        id: 'iron_armor',
        name: 'Железная броня',
        description: 'Фигура не может быть взята пешками.',
        icon: '🪖',
        rarity: 'rare',
        category: 'defense',
        cost: 75,
        tags: ['armor', 'immunity'],
        allowedPieces: ['all'],
        modifiers: { immuneToPawns: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    evasion_cloak: {
        id: 'evasion_cloak',
        name: 'Плащ уклонения',
        description: '20% шанс уклониться от взятия.',
        icon: '🧥',
        rarity: 'rare',
        category: 'defense',
        cost: 80,
        tags: ['dodge', 'luck'],
        allowedPieces: ['all'],
        modifiers: { dodgeChance: 0.20 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    // ============================
    // 🔮 SPECIAL (2 items)
    // ============================

    kings_crown: {
        id: 'kings_crown',
        name: 'Корона короля',
        description: 'Король получает возможность ходить как ферзь!',
        icon: '👑',
        rarity: 'epic',
        category: 'movement',
        cost: 150,
        tags: ['king', 'power'],
        allowedPieces: ['king'],
        modifiers: { moveAsQueen: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    wings: {
        id: 'wings',
        name: 'Крылья',
        description: 'Фигура может прыгать через другие фигуры (как конь).',
        icon: '🪽',
        rarity: 'epic',
        category: 'movement',
        cost: 120,
        tags: ['jump', 'mobility'],
        allowedPieces: ['rook', 'bishop', 'queen'],
        modifiers: { canJump: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    // ============================
    // 🆕 НОВЫЕ ПРЕДМЕТЫ
    // ============================

    magic_boots: {
        id: 'magic_boots',
        name: 'Магические сапоги',
        description: 'Фигура может ходить на 1 клетку в любом направлении (как король).',
        icon: '✨',
        rarity: 'rare',
        category: 'movement',
        cost: 60,
        tags: ['mobility', 'direction'],
        allowedPieces: ['rook', 'bishop', 'knight', 'pawn'],
        modifiers: { canStepAnyDirection: true },
        extraDirections: [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]],
        extraKnightOffsets: [],
    },

    shadow_step: {
        id: 'shadow_step',
        name: 'Шаг тени',
        description: 'Конь может переместиться на 2 клетки по прямой (как ладья на 2).',
        icon: '🌑',
        rarity: 'rare',
        category: 'movement',
        cost: 55,
        tags: ['knight', 'extra-move'],
        allowedPieces: ['knight'],
        modifiers: {},
        extraDirections: [],
        extraKnightOffsets: [[-2,0],[2,0],[0,-2],[0,2]],
    },

    fire_sword: {
        id: 'fire_sword',
        name: 'Огненный меч',
        description: '+25 золота за каждое взятие. Огонь сжигает врагов!',
        icon: '🔥',
        rarity: 'rare',
        category: 'offense',
        cost: 80,
        tags: ['gold', 'economy', 'damage'],
        allowedPieces: ['all'],
        modifiers: { goldPerCapture: 25 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    poison_dart: {
        id: 'poison_dart',
        name: 'Отравленная стрела',
        description: 'Пешка может атаковать прямо вперёд (не только по диагонали).',
        icon: '🎯',
        rarity: 'rare',
        category: 'offense',
        cost: 70,
        tags: ['pawn', 'attack'],
        allowedPieces: ['pawn'],
        modifiers: { pawnCanCaptureForward: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    cursed_mirror: {
        id: 'cursed_mirror',
        name: 'Проклятое зеркало',
        description: 'Пешка может атаковать назад по диагонали.',
        icon: '🪞',
        rarity: 'common',
        category: 'offense',
        cost: 35,
        tags: ['pawn', 'direction'],
        allowedPieces: ['pawn'],
        modifiers: { pawnCanCaptureBackward: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    steel_shield: {
        id: 'steel_shield',
        name: 'Стальной щит',
        description: 'Фигура выживает после двух взятий (2 заряда щита).',
        icon: '🔰',
        rarity: 'epic',
        category: 'defense',
        cost: 110,
        tags: ['shield', 'survival'],
        allowedPieces: ['all'],
        modifiers: { shield: 2 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    thorns: {
        id: 'thorns',
        name: 'Шипы',
        description: 'Фигура не может быть взята конями.',
        icon: '🌵',
        rarity: 'common',
        category: 'defense',
        cost: 40,
        tags: ['armor', 'immunity'],
        allowedPieces: ['all'],
        modifiers: { immuneToKnights: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    lucky_coin: {
        id: 'lucky_coin',
        name: 'Счастливая монета',
        description: '+100 золота за победу в раунде.',
        icon: '🍀',
        rarity: 'rare',
        category: 'utility',
        cost: 75,
        tags: ['gold', 'economy'],
        allowedPieces: ['all'],
        modifiers: { goldOnWin: 100 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    phantom_cloak: {
        id: 'phantom_cloak',
        name: 'Плащ призрака',
        description: '35% шанс уклониться от взятия. Редкое везение!',
        icon: '👻',
        rarity: 'epic',
        category: 'defense',
        cost: 130,
        tags: ['dodge', 'luck'],
        allowedPieces: ['all'],
        modifiers: { dodgeChance: 0.35 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    queens_blessing: {
        id: 'queens_blessing',
        name: 'Благословение королевы',
        description: 'Ладья получает ходы по диагонали и может скользить как слон.',
        icon: '💜',
        rarity: 'legendary',
        category: 'movement',
        cost: 200,
        tags: ['rook', 'direction', 'power'],
        allowedPieces: ['rook'],
        modifiers: {},
        extraDirections: [[-1,-1],[-1,1],[1,-1],[1,1]],
        extraKnightOffsets: [],
    },

    // ============================
    // 🏃 MOVEMENT — расширение
    // ============================

    teleport_rune: {
        id: 'teleport_rune',
        name: 'Руна телепорта',
        description: 'Фигура получает ход на 3 клетки в любом направлении.',
        icon: '🔵',
        rarity: 'epic',
        category: 'movement',
        cost: 140,
        tags: ['teleport', 'mobility'],
        allowedPieces: ['all'],
        modifiers: { extraStep: 3 },
        extraDirections: [[-3,0],[3,0],[0,-3],[0,3],[-3,-3],[-3,3],[3,-3],[3,3]],
        extraKnightOffsets: [],
    },

    speed_rune: {
        id: 'speed_rune',
        name: 'Руна ускорения',
        description: '+2 к дальности хода скользящих фигур.',
        icon: '⚡',
        rarity: 'rare',
        category: 'movement',
        cost: 65,
        tags: ['speed', 'range'],
        allowedPieces: ['rook', 'queen'],
        modifiers: { extraRange: 2 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    long_legs: {
        id: 'long_legs',
        name: 'Длинные ноги',
        description: 'Конь ходит по схеме 3+2 (вместо 2+1), большее покрытие.',
        icon: '🦵',
        rarity: 'common',
        category: 'movement',
        cost: 45,
        tags: ['knight', 'range'],
        allowedPieces: ['knight'],
        modifiers: {},
        extraDirections: [],
        extraKnightOffsets: [[-3,-2],[-3,2],[3,-2],[3,2],[-2,-3],[-2,3],[2,-3],[2,3]],
    },

    diagonal_boots: {
        id: 'diagonal_boots',
        name: 'Диагональные ботинки',
        description: 'Ладья получает ход на 1 клетку по диагонали.',
        icon: '👟',
        rarity: 'common',
        category: 'movement',
        cost: 38,
        tags: ['rook', 'direction'],
        allowedPieces: ['rook'],
        modifiers: {},
        extraDirections: [[-1,-1],[-1,1],[1,-1],[1,1]],
        extraKnightOffsets: [],
    },

    horse_legs: {
        id: 'horse_legs',
        name: 'Конские ноги',
        description: 'Пешка дополнительно может ходить как конь (Г-образно).',
        icon: '🐎',
        rarity: 'rare',
        category: 'movement',
        cost: 70,
        tags: ['pawn', 'knight'],
        allowedPieces: ['pawn'],
        modifiers: {},
        extraDirections: [],
        extraKnightOffsets: [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],
    },

    sprinter_scroll: {
        id: 'sprinter_scroll',
        name: 'Свиток спринтера',
        description: 'Пешка всегда может двигаться на 2 клетки вперёд (не только с исходной позиции).',
        icon: '📋',
        rarity: 'common',
        category: 'movement',
        cost: 30,
        tags: ['pawn', 'speed'],
        allowedPieces: ['pawn'],
        modifiers: { pawnAlwaysDouble: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    crab_claws: {
        id: 'crab_claws',
        name: 'Клешни краба',
        description: 'Ладья получает прыжки на 2 клетки вбок (горизонтальный конь).',
        icon: '🦀',
        rarity: 'rare',
        category: 'movement',
        cost: 60,
        tags: ['rook', 'jump'],
        allowedPieces: ['rook', 'queen'],
        modifiers: {},
        extraDirections: [],
        extraKnightOffsets: [[-1,-2],[-1,2],[1,-2],[1,2]],
    },

    moonwalk: {
        id: 'moonwalk',
        name: 'Лунная походка',
        description: 'Ладья получает возможность ходить назад по диагонали на 2 клетки.',
        icon: '🌙',
        rarity: 'epic',
        category: 'movement',
        cost: 100,
        tags: ['rook', 'diagonal'],
        allowedPieces: ['rook'],
        modifiers: {},
        extraDirections: [[2,-2],[2,2]],
        extraKnightOffsets: [],
    },

    spiral_path: {
        id: 'spiral_path',
        name: 'Спиральный путь',
        description: 'Слон может дополнительно двигаться на 1 клетку по прямой.',
        icon: '🌀',
        rarity: 'rare',
        category: 'movement',
        cost: 75,
        tags: ['bishop', 'straight'],
        allowedPieces: ['bishop'],
        modifiers: {},
        extraDirections: [[-1,0],[1,0],[0,-1],[0,1]],
        extraKnightOffsets: [],
    },

    mirror_step: {
        id: 'mirror_step',
        name: 'Зеркальный шаг',
        description: 'Конь получает дополнительные зеркальные прыжки [-1,2] и [1,-2].',
        icon: '🔀',
        rarity: 'rare',
        category: 'movement',
        cost: 65,
        tags: ['knight', 'extra'],
        allowedPieces: ['knight'],
        modifiers: {},
        extraDirections: [],
        extraKnightOffsets: [[-1,-2],[-1,2],[1,-2],[1,2],[-2,-1],[-2,1],[2,-1],[2,1]],
    },

    sidewinder: {
        id: 'sidewinder',
        name: 'Боковой ход',
        description: 'Пешка может ходить на 1 клетку вбок (без взятия).',
        icon: '↔️',
        rarity: 'common',
        category: 'movement',
        cost: 40,
        tags: ['pawn', 'lateral'],
        allowedPieces: ['pawn'],
        modifiers: {},
        extraDirections: [[0,-1],[0,1]],
        extraKnightOffsets: [],
    },

    octopus_arms: {
        id: 'octopus_arms',
        name: 'Щупальца осьминога',
        description: 'Слон получает прямые направления хода (становится ферзём по возможностям).',
        icon: '🐙',
        rarity: 'epic',
        category: 'movement',
        cost: 130,
        tags: ['bishop', 'direction'],
        allowedPieces: ['bishop'],
        modifiers: {},
        extraDirections: [[-1,0],[1,0],[0,-1],[0,1]],
        extraKnightOffsets: [],
    },

    tunnel_drill: {
        id: 'tunnel_drill',
        name: 'Буровой снаряд',
        description: 'Ладья может игнорировать одну фигуру на пути.',
        icon: '⛏️',
        rarity: 'rare',
        category: 'movement',
        cost: 70,
        tags: ['rook', 'pierce'],
        allowedPieces: ['rook'],
        modifiers: { pierceOne: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    cape_of_wind: {
        id: 'cape_of_wind',
        name: 'Плащ ветра',
        description: 'Фигура получает шаг на 1 клетку в любом направлении.',
        icon: '🌬️',
        rarity: 'common',
        category: 'movement',
        cost: 30,
        tags: ['mobility'],
        allowedPieces: ['rook', 'bishop', 'pawn'],
        modifiers: {},
        extraDirections: [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]],
        extraKnightOffsets: [],
    },

    jetpack: {
        id: 'jetpack',
        name: 'Реактивный ранец',
        description: 'Пешка может двигаться до 4 клеток вперёд.',
        icon: '🚀',
        rarity: 'legendary',
        category: 'movement',
        cost: 180,
        tags: ['pawn', 'range'],
        allowedPieces: ['pawn'],
        modifiers: { pawnExtraForward: 3 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    // ============================
    // ⚔️ OFFENSE — новые
    // ============================

    snipers_scope: {
        id: 'snipers_scope',
        name: 'Прицел снайпера',
        description: '+50 золота за взятие с дистанции 3+ клетки.',
        icon: '🎯',
        rarity: 'epic',
        category: 'offense',
        cost: 110,
        tags: ['gold', 'distance'],
        allowedPieces: ['rook', 'queen'],
        modifiers: { goldOnLongCapture: 50 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    assassin_blade: {
        id: 'assassin_blade',
        name: 'Клинок убийцы',
        description: '+30 золота за взятие фигур противника конём.',
        icon: '🗡️',
        rarity: 'rare',
        category: 'offense',
        cost: 90,
        tags: ['knight', 'gold'],
        allowedPieces: ['knight'],
        modifiers: { goldPerCapture: 30 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    battle_axe: {
        id: 'battle_axe',
        name: 'Боевой топор',
        description: 'Фигура может атаковать на 1 клетку по диагонали (дополнительно).',
        icon: '🪓',
        rarity: 'rare',
        category: 'offense',
        cost: 75,
        tags: ['diagonal', 'attack'],
        allowedPieces: ['rook', 'knight'],
        modifiers: {},
        extraDirections: [[-1,-1],[-1,1],[1,-1],[1,1]],
        extraKnightOffsets: [],
    },

    venom_fang: {
        id: 'venom_fang',
        name: 'Ядовитый клык',
        description: '+10 золота за каждое взятие.',
        icon: '🐍',
        rarity: 'common',
        category: 'offense',
        cost: 45,
        tags: ['gold', 'economy'],
        allowedPieces: ['all'],
        modifiers: { goldPerCapture: 10 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    war_drum: {
        id: 'war_drum',
        name: 'Военный барабан',
        description: '+5 золота за каждый ход с взятием.',
        icon: '🥁',
        rarity: 'common',
        category: 'offense',
        cost: 30,
        tags: ['gold', 'capture'],
        allowedPieces: ['all'],
        modifiers: { goldPerCapture: 5 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    burning_bow: {
        id: 'burning_bow',
        name: 'Горящий лук',
        description: 'Слон может атаковать по прямой на 1 клетку.',
        icon: '🏹',
        rarity: 'rare',
        category: 'offense',
        cost: 65,
        tags: ['bishop', 'straight'],
        allowedPieces: ['bishop'],
        modifiers: {},
        extraDirections: [[-1,0],[1,0],[0,-1],[0,1]],
        extraKnightOffsets: [],
    },

    spike_trap: {
        id: 'spike_trap',
        name: 'Шипованная ловушка',
        description: 'Пешка получает +15 золота за взятие.',
        icon: '⚙️',
        rarity: 'common',
        category: 'offense',
        cost: 40,
        tags: ['pawn', 'gold'],
        allowedPieces: ['pawn'],
        modifiers: { goldPerCapture: 15 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    executioners_axe: {
        id: 'executioners_axe',
        name: 'Топор палача',
        description: '+100 золота за взятие ферзя.',
        icon: '⚔️',
        rarity: 'epic',
        category: 'offense',
        cost: 115,
        tags: ['gold', 'queen-killer'],
        allowedPieces: ['all'],
        modifiers: { goldOnQueenCapture: 100 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    hunters_mark: {
        id: 'hunters_mark',
        name: 'Метка охотника',
        description: '+20 золота за взятие коня.',
        icon: '🏹',
        rarity: 'common',
        category: 'offense',
        cost: 50,
        tags: ['gold', 'knight-killer'],
        allowedPieces: ['all'],
        modifiers: { goldOnKnightCapture: 20 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    battle_cry: {
        id: 'battle_cry',
        name: 'Боевой клич',
        description: '+15 золота за взятие ладьи.',
        icon: '📯',
        rarity: 'common',
        category: 'offense',
        cost: 35,
        tags: ['gold', 'rook-killer'],
        allowedPieces: ['all'],
        modifiers: { goldOnRookCapture: 15 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    rune_of_power: {
        id: 'rune_of_power',
        name: 'Руна силы',
        description: 'Взятие тяжёлой фигуры даёт +2 заряда щита.',
        icon: '💪',
        rarity: 'rare',
        category: 'offense',
        cost: 90,
        tags: ['shield', 'capture'],
        allowedPieces: ['all'],
        modifiers: { shieldOnHeavyCapture: 2 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    mirror_strike: {
        id: 'mirror_strike',
        name: 'Удар отражения',
        description: 'Слон может атаковать прямо на 2 клетки.',
        icon: '🌊',
        rarity: 'epic',
        category: 'offense',
        cost: 120,
        tags: ['bishop', 'long-range'],
        allowedPieces: ['bishop'],
        modifiers: {},
        extraDirections: [[-2,0],[2,0],[0,-2],[0,2]],
        extraKnightOffsets: [],
    },

    // ============================
    // 🛡️ DEFENSE — новые
    // ============================

    guardian_rune: {
        id: 'guardian_rune',
        name: 'Руна стража',
        description: 'Фигура не может быть взята слонами.',
        icon: '🔮',
        rarity: 'common',
        category: 'defense',
        cost: 45,
        tags: ['armor', 'immunity'],
        allowedPieces: ['all'],
        modifiers: { immuneToBishops: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    stone_skin: {
        id: 'stone_skin',
        name: 'Каменная кожа',
        description: '30% шанс уклониться от взятия.',
        icon: '🪨',
        rarity: 'rare',
        category: 'defense',
        cost: 70,
        tags: ['dodge', 'defense'],
        allowedPieces: ['pawn', 'rook'],
        modifiers: { dodgeChance: 0.30 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    divine_shield: {
        id: 'divine_shield',
        name: 'Божественный щит',
        description: '3 заряда щита + 25% шанс уклонения.',
        icon: '✨',
        rarity: 'legendary',
        category: 'defense',
        cost: 250,
        tags: ['shield', 'dodge'],
        allowedPieces: ['all'],
        modifiers: { shield: 3, dodgeChance: 0.25 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    titanium_plate: {
        id: 'titanium_plate',
        name: 'Титановая плита',
        description: 'Иммунитет к коням и пешкам.',
        icon: '🏗️',
        rarity: 'legendary',
        category: 'defense',
        cost: 190,
        tags: ['armor', 'immunity'],
        allowedPieces: ['rook', 'queen'],
        modifiers: { immuneToKnights: true, immuneToPawns: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    holy_water: {
        id: 'holy_water',
        name: 'Святая вода',
        description: 'Фигура получает 1 заряд щита.',
        icon: '💧',
        rarity: 'common',
        category: 'defense',
        cost: 35,
        tags: ['shield'],
        allowedPieces: ['all'],
        modifiers: { shield: 1 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    reflective_coat: {
        id: 'reflective_coat',
        name: 'Отражающее покрытие',
        description: 'Фигура не может быть взята ладьями.',
        icon: '🪞',
        rarity: 'rare',
        category: 'defense',
        cost: 85,
        tags: ['armor', 'immunity'],
        allowedPieces: ['all'],
        modifiers: { immuneToRooks: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    silk_robe: {
        id: 'silk_robe',
        name: 'Шёлковый халат',
        description: '15% шанс уклониться от взятия.',
        icon: '👘',
        rarity: 'common',
        category: 'defense',
        cost: 40,
        tags: ['dodge'],
        allowedPieces: ['queen', 'bishop'],
        modifiers: { dodgeChance: 0.15 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    fire_resistance: {
        id: 'fire_resistance',
        name: 'Огнестойкость',
        description: 'Фигура не может быть взята ферзями.',
        icon: '🔥',
        rarity: 'rare',
        category: 'defense',
        cost: 75,
        tags: ['armor', 'immunity'],
        allowedPieces: ['all'],
        modifiers: { immuneToQueens: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    absorb_rune: {
        id: 'absorb_rune',
        name: 'Руна поглощения',
        description: 'При взятии этой фигуры: +50 золота.',
        icon: '💡',
        rarity: 'epic',
        category: 'defense',
        cost: 115,
        tags: ['gold', 'sacrifice'],
        allowedPieces: ['all'],
        modifiers: { goldOnCaptured: 50 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    last_stand: {
        id: 'last_stand',
        name: 'Последний рубеж',
        description: 'При 1 заряде щита: 60% шанс уклонения.',
        icon: '🗡️',
        rarity: 'legendary',
        category: 'defense',
        cost: 200,
        tags: ['dodge', 'shield', 'last-chance'],
        allowedPieces: ['all'],
        modifiers: { dodgeOnLastShield: 0.60 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    reinforced_armor: {
        id: 'reinforced_armor',
        name: 'Усиленная броня',
        description: 'Ладья не может быть взята слонами.',
        icon: '🛡️',
        rarity: 'common',
        category: 'defense',
        cost: 55,
        tags: ['armor', 'immunity'],
        allowedPieces: ['rook'],
        modifiers: { immuneToBishops: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    mirror_armor: {
        id: 'mirror_armor',
        name: 'Зеркальная броня',
        description: '50% шанс уклонения, но -1 к дальности хода.',
        icon: '⚡',
        rarity: 'epic',
        category: 'defense',
        cost: 120,
        tags: ['dodge', 'penalty'],
        allowedPieces: ['all'],
        modifiers: { dodgeChance: 0.50, extraRange: -1 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    // ============================
    // 🔮 UTILITY — новые
    // ============================

    gold_ore: {
        id: 'gold_ore',
        name: 'Золотой самородок',
        description: '+50 золота за победу в раунде.',
        icon: '🪙',
        rarity: 'common',
        category: 'utility',
        cost: 40,
        tags: ['gold', 'economy'],
        allowedPieces: ['all'],
        modifiers: { goldOnWin: 50 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    treasure_map: {
        id: 'treasure_map',
        name: 'Карта сокровищ',
        description: '+150 золота за победу в раунде.',
        icon: '🗺️',
        rarity: 'rare',
        category: 'utility',
        cost: 80,
        tags: ['gold', 'economy'],
        allowedPieces: ['all'],
        modifiers: { goldOnWin: 150 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    gem_collector: {
        id: 'gem_collector',
        name: 'Сборщик самоцветов',
        description: '+20 золота за взятие слона.',
        icon: '💎',
        rarity: 'common',
        category: 'utility',
        cost: 45,
        tags: ['gold', 'bishop-killer'],
        allowedPieces: ['all'],
        modifiers: { goldOnBishopCapture: 20 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    royal_treasury: {
        id: 'royal_treasury',
        name: 'Королевская казна',
        description: '+300 золота за победу в раунде!',
        icon: '🏦',
        rarity: 'legendary',
        category: 'utility',
        cost: 200,
        tags: ['gold', 'economy'],
        allowedPieces: ['all'],
        modifiers: { goldOnWin: 300 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    double_loot: {
        id: 'double_loot',
        name: 'Двойная добыча',
        description: 'Вдвое больше золота за взятие ферзя.',
        icon: '💰',
        rarity: 'rare',
        category: 'utility',
        cost: 95,
        tags: ['gold', 'queen-killer'],
        allowedPieces: ['all'],
        modifiers: { doubleGoldOnQueenCapture: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    bounty_hunter: {
        id: 'bounty_hunter',
        name: 'Охотник за наградой',
        description: '+30 золота за взятие ладьи.',
        icon: '🎖️',
        rarity: 'rare',
        category: 'utility',
        cost: 80,
        tags: ['gold', 'rook-killer'],
        allowedPieces: ['all'],
        modifiers: { goldOnRookCapture: 30 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    iron_will: {
        id: 'iron_will',
        name: 'Железная воля',
        description: '10% шанс получить случайный предмет после взятия.',
        icon: '💪',
        rarity: 'common',
        category: 'utility',
        cost: 50,
        tags: ['chance', 'item'],
        allowedPieces: ['all'],
        modifiers: { itemDropChance: 0.10 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    second_chance: {
        id: 'second_chance',
        name: 'Второй шанс',
        description: 'Пешка может превратиться в любую фигуру при взятии.',
        icon: '🔄',
        rarity: 'epic',
        category: 'utility',
        cost: 125,
        tags: ['pawn', 'promotion'],
        allowedPieces: ['pawn'],
        modifiers: { promoteOnCapture: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    cursed_gold: {
        id: 'cursed_gold',
        name: 'Проклятое золото',
        description: '+200 золота за победу, -10 зол. за каждый ход без взятия.',
        icon: '☠️',
        rarity: 'rare',
        category: 'utility',
        cost: 65,
        tags: ['gold', 'curse'],
        allowedPieces: ['all'],
        modifiers: { goldOnWin: 200, goldLossPerMove: 10 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    scroll_of_greed: {
        id: 'scroll_of_greed',
        name: 'Свиток жадности',
        description: 'x3 золото за взятие тяжёлых фигур (ладья/ферзь).',
        icon: '📜',
        rarity: 'epic',
        category: 'utility',
        cost: 140,
        tags: ['gold', 'heavy-killer'],
        allowedPieces: ['rook', 'queen'],
        modifiers: { tripleGoldOnHeavyCapture: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    experience_orb: {
        id: 'experience_orb',
        name: 'Шар опыта',
        description: 'Следующий предмет в магазине стоит -20 золота.',
        icon: '🔮',
        rarity: 'common',
        category: 'utility',
        cost: 35,
        tags: ['discount', 'economy'],
        allowedPieces: ['all'],
        modifiers: { nextItemDiscount: 20 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    merchants_ring: {
        id: 'merchants_ring',
        name: 'Перстень купца',
        description: '-15% стоимость всех предметов в магазине.',
        icon: '💍',
        rarity: 'rare',
        category: 'utility',
        cost: 70,
        tags: ['discount', 'economy'],
        allowedPieces: ['all'],
        modifiers: { shopDiscount: 0.15 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    kings_signet: {
        id: 'kings_signet',
        name: 'Перстень короля',
        description: 'Каждая ваша фигура на поле даёт +5 золота за ход.',
        icon: '👑',
        rarity: 'legendary',
        category: 'utility',
        cost: 220,
        tags: ['gold', 'passive'],
        allowedPieces: ['king'],
        modifiers: { goldPerPiecePerTurn: 5 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    // ============================
    // 🌟 SPECIAL / LEGENDARY
    // ============================

    star_map: {
        id: 'star_map',
        name: 'Звёздная карта',
        description: 'Ферзь получает Г-образные прыжки как у коня.',
        icon: '⭐',
        rarity: 'legendary',
        category: 'movement',
        cost: 240,
        tags: ['queen', 'knight', 'power'],
        allowedPieces: ['queen'],
        modifiers: {},
        extraDirections: [],
        extraKnightOffsets: [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],
    },

    soul_gem: {
        id: 'soul_gem',
        name: 'Душевный камень',
        description: 'Взятие фигуры врага: воскрешает одну вашу взятую пешку.',
        icon: '🔵',
        rarity: 'legendary',
        category: 'utility',
        cost: 260,
        tags: ['revival', 'pawn', 'special'],
        allowedPieces: ['all'],
        modifiers: { revivePawnOnCapture: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    demonic_pact: {
        id: 'demonic_pact',
        name: 'Демонический пакт',
        description: 'x2 золота за все взятия, но −1 заряд щита навсегда.',
        icon: '😈',
        rarity: 'legendary',
        category: 'utility',
        cost: 300,
        tags: ['gold', 'penalty', 'double'],
        allowedPieces: ['all'],
        modifiers: { doubleGoldAll: true, shieldPenalty: 1 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    angelic_halo: {
        id: 'angelic_halo',
        name: 'Ангельский нимб',
        description: 'Воскрешает одну взятую тяжёлую фигуру в конце раунда.',
        icon: '😇',
        rarity: 'legendary',
        category: 'defense',
        cost: 270,
        tags: ['revival', 'special'],
        allowedPieces: ['all'],
        modifiers: { reviveHeavyOnWin: true },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    chaos_gem: {
        id: 'chaos_gem',
        name: 'Камень хаоса',
        description: 'Каждые 3 хода: случайный мощный эффект (доп. золото, щит или ход).',
        icon: '🌈',
        rarity: 'legendary',
        category: 'utility',
        cost: 290,
        tags: ['random', 'chaos', 'special'],
        allowedPieces: ['all'],
        modifiers: { chaosEffect: true, chaosInterval: 3 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    infinity_stone: {
        id: 'infinity_stone',
        name: 'Камень бесконечности',
        description: 'Ферзь получает ВСЕ типы движений (включая Г-образные прыжки).',
        icon: '💜',
        rarity: 'legendary',
        category: 'movement',
        cost: 350,
        tags: ['queen', 'all-moves', 'power'],
        allowedPieces: ['queen'],
        modifiers: { omnimove: true },
        extraDirections: [],
        extraKnightOffsets: [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],
    },

    omega_rune: {
        id: 'omega_rune',
        name: 'Омега-руна',
        description: '+1 к дальности хода, +1 щит, +10 золота за взятие одновременно.',
        icon: '🔺',
        rarity: 'legendary',
        category: 'utility',
        cost: 400,
        tags: ['all-stats', 'power', 'legendary'],
        allowedPieces: ['all'],
        modifiers: { extraRange: 1, shield: 1, goldPerCapture: 10 },
        extraDirections: [],
        extraKnightOffsets: [],
    },

    beta_tester_cap: {
        id: 'beta_tester_cap',
        name: 'Шапка бета-тестера',
        description: 'Фигура телепортируется на ЛЮБУЮ клетку (кроме своих и вражеского короля) и бьёт любую фигуру там же. 10 зарядов щита.',
        icon: '🧢',
        rarity: 'legendary',
        category: 'movement',
        cost: 999,
        tags: ['teleport', 'invincible', 'anywhere', 'dev'],
        allowedPieces: ['all'],
        modifiers: { moveAnywhere: true, shield: 10 },
        extraDirections: [],
        extraKnightOffsets: [],
    },
};




// --- Helper Functions ---

function getItemById(id) {
    return ITEMS_DB[id] || null;
}

function getItemsByRarity(rarity) {
    return Object.values(ITEMS_DB).filter(i => i.rarity === rarity);
}

function getItemsByCategory(category) {
    return Object.values(ITEMS_DB).filter(i => i.category === category);
}

function getAllItems() {
    return Object.values(ITEMS_DB);
}

function getRandomItems(count, excludeIds = []) {
    const pool = Object.values(ITEMS_DB).filter(i => !excludeIds.includes(i.id));
    const result = [];
    const shuffled = pool.sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        result.push(shuffled[i]);
    }
    return result;
}

function getShopItems(count, playerGold, luckBonus = 0) {
    // Weighted by rarity
    const weights = { common: 50, rare: 30 - luckBonus * 5, epic: 15 + luckBonus * 3, legendary: 5 + luckBonus * 2 };
    const pool = Object.values(ITEMS_DB);
    const result = [];
    const used = new Set();

    for (let i = 0; i < count && pool.length > 0; i++) {
        // Pick rarity first
        const roll = Math.random() * 100;
        let rarity;
        if (roll < weights.legendary) rarity = 'legendary';
        else if (roll < weights.legendary + weights.epic) rarity = 'epic';
        else if (roll < weights.legendary + weights.epic + weights.rare) rarity = 'rare';
        else rarity = 'common';

        // Find items of that rarity
        let candidates = pool.filter(it => it.rarity === rarity && !used.has(it.id));
        if (candidates.length === 0) candidates = pool.filter(it => !used.has(it.id));
        if (candidates.length === 0) break;

        const item = candidates[Math.floor(Math.random() * candidates.length)];
        result.push({ ...item }); // Clone
        used.add(item.id);
    }

    return result;
}

// Rarity colors and labels
const RARITY_CONFIG = {
    common:    { label: 'Обычный',     color: '#9a95b0', bgColor: 'rgba(154,149,176,0.1)', border: 'rgba(154,149,176,0.3)' },
    rare:      { label: 'Редкий',      color: '#4488ff', bgColor: 'rgba(68,136,255,0.1)',  border: 'rgba(68,136,255,0.3)'  },
    epic:      { label: 'Эпический',   color: '#9d93fa', bgColor: 'rgba(157,147,250,0.1)', border: 'rgba(157,147,250,0.3)' },
    legendary: { label: 'Легендарный', color: '#f0c048', bgColor: 'rgba(240,192,72,0.1)',  border: 'rgba(240,192,72,0.3)'  },
};

const CATEGORY_LABELS = {
    movement: '🏃 Движение',
    offense:  '🗡 Атака',
    defense:  '🛡 Защита',
    utility:  '🔮 Утилиты',
};
