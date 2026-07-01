/* ============================================
   Items Database — 15 MVP items
   ============================================ */

const ITEMS_DB = {

    // ============================
    // 🏃 MOVEMENT (5 items)
    // ============================

    boots_of_speed: {
        id: 'boots_of_speed',
        name: { ru: 'Сапоги Скорости', en: "Boots of Speed", es: "Botas de Velocidad" },
        description: { ru: '+1 к дальности хода (по прямой или диагонали).', en: "+1 Range to horizontal/vertical/diagonal moves.", es: "+1 Rango a movimientos horizontales/verticales/diagonales." },
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
        name: { ru: "Компас", en: "Compass", es: "Brújula" },
        description: { ru: "Слон может дополнительно ходить на 1 клетку по прямой.", en: "The Bishop can additionally move 1 square in a straight line.", es: "El Alfil puede moverse adicionalmente 1 casilla en línea recta." },
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
        name: { ru: "Диагональное скольжение", en: "Diagonal Slide", es: "Deslizamiento Diagonal" },
        description: { ru: "Ладья может дополнительно ходить на 1 клетку по диагонали.", en: "The Rook can additionally move 1 square diagonally.", es: "La Torre puede moverse adicionalmente 1 casilla en diagonal." },
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
        name: { ru: "Отступление", en: "Retreat", es: "Retirada" },
        description: { ru: "Пешка может ходить на 1 клетку назад.", en: "The Pawn can move 1 square backwards.", es: "El Peón puede moverse 1 casilla hacia atrás." },
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
        name: { ru: "Подкова", en: "Horseshoe", es: "Herradura" },
        description: { ru: "Конь получает дополнительные прыжки: 3×1 (длинный Г).", en: "The Knight gains additional jumps: 3x1 (long L-shape).", es: "El Caballo obtiene saltos adicionales: 3x1 (forma de L larga)." },
        icon: '🐴',
        rarity: 'rare',
        category: 'movement',
        cost: 70,
        tags: ['knight', 'jump'],
        allowedPieces: ['knight'],
        modifiers: {},
        synergy: {
            3: { modifiers: { moveAnywhere: true } }
        },
        extraDirections: [],
        extraKnightOffsets: [[-3,-1],[-3,1],[3,-1],[3,1],[-1,-3],[-1,3],[1,-3],[1,3]],
    },

    // ============================
    // 🗡 OFFENSE (5 items)
    // ============================

    sharp_blade: {
        id: 'sharp_blade',
        name: { ru: "Острый клинок", en: "Sharp Blade", es: "Cuchilla Afilada" },
        description: { ru: "Скользящие фигуры получают +1 к дальности взятия.", en: "Sliding pieces gain +1 to capture range.", es: "Las piezas deslizantes obtienen +1 al rango de captura." },
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
        name: { ru: "Снайперский прицел", en: "Sniper Scope", es: "Mira de Francotirador" },
        description: { ru: "Пешка может брать фигуры на расстоянии 2 клеток по диагонали.", en: "The Pawn can capture pieces at a distance of 2 squares diagonally.", es: "El Peón puede capturar piezas a una distancia de 2 casillas en diagonal." },
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
        name: { ru: "Золотой зуб", en: "Gold Tooth", es: "Diente de Oro" },
        description: { ru: "+15 золота за каждое взятие этой фигурой.", en: "+15 gold for each capture by this piece.", es: "+15 de oro por cada captura de esta pieza." },
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

    small_treasure_map: {
        id: 'small_treasure_map',
        name: { ru: "Потёртая карта", en: "Worn Treasure Map", es: "Mapa Gastado" },
        description: { ru: "+50 золота за победу в раунде.", en: "+50 gold for winning the round.", es: "+50 de oro por ganar la ronda." },
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
        name: { ru: "Свиток превращения", en: "Promotion Scroll", es: "Pergamino de Coronación" },
        description: { ru: "Пешка может превратиться уже на 6-м ряду (вместо 8-го).", en: "The Pawn can promote on the 6th rank (instead of the 8th).", es: "El Peón puede coronar en la 6ª fila (en lugar de la 8ª)." },
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
        name: { ru: "Деревянный щит", en: "Wooden Shield", es: "Escudo de Madera" },
        description: { ru: "Фигура выживает после первого взятия (одноразовый щит).", en: "The piece survives its first capture (one-time shield).", es: "La pieza sobrevive a su primera captura (escudo de un solo uso)." },
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
        name: { ru: 'Железная Броня', en: "Iron Armor", es: "Armadura de Hierro" },
        description: { ru: 'Фигура получает иммунитет к атакам пешек.', en: "Piece cannot be captured by Pawns.", es: "La pieza no puede ser capturada por Peones." },
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
        name: { ru: "Плащ уклонения", en: "Cloak of Evasion", es: "Capa de Evasión" },
        description: { ru: "20% шанс уклониться от взятия.", en: "20% chance to evade a capture.", es: "20% de probabilidad de evadir una captura." },
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
        name: { ru: "Корона короля", en: "King's Crown", es: "Corona del Rey" },
        description: { ru: "Король получает возможность ходить как ферзь!", en: "The King gains the ability to move like a Queen!", es: "¡El Rey obtiene la habilidad de moverse como una Reina!" },
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
        name: { ru: "Крылья", en: "Wings", es: "Alas" },
        description: { ru: "Фигура может прыгать через другие фигуры (как конь).", en: "The piece can jump over other pieces (like a Knight).", es: "La pieza puede saltar sobre otras piezas (como un Caballo)." },
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
        name: { ru: "Магические сапоги", en: "Magic Boots", es: "Botas Mágicas" },
        description: { ru: "Фигура может ходить на 1 клетку в любом направлении (как король).", en: "The piece can move 1 square in any direction (like a King).", es: "La pieza puede moverse 1 casilla en cualquier dirección (como un Rey)." },
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
        name: { ru: "Шаг тени", en: "Shadow Step", es: "Paso de Sombra" },
        description: { ru: "Конь может переместиться на 2 клетки по прямой (как ладья на 2).", en: "The Knight can move 2 squares in a straight line (like a Rook for 2 squares).", es: "El Caballo puede moverse 2 casillas en línea recta (como una Torre por 2 casillas)." },
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
        name: { ru: "Огненный меч", en: "Fire Sword", es: "Espada de Fuego" },
        description: { ru: "+25 золота за каждое взятие. Огонь сжигает врагов!", en: "+25 gold for each capture. Fire burns the enemies!", es: "+25 de oro por cada captura. ¡El fuego quema a los enemigos!" },
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
        name: { ru: "Отравленная стрела", en: "Poison Dart", es: "Dardo Envenenado" },
        description: { ru: "Пешка может атаковать прямо вперёд (не только по диагонали).", en: "The Pawn can attack straight forward (not just diagonally).", es: "El Peón puede atacar hacia adelante (no solo en diagonal)." },
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
        name: { ru: "Проклятое зеркало", en: "Cursed Mirror", es: "Espejo Maldito" },
        description: { ru: "Пешка может атаковать назад по диагонали.", en: "The Pawn can attack backwards diagonally.", es: "El Peón puede atacar hacia atrás en diagonal." },
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
        name: { ru: "Стальной щит", en: "Steel Shield", es: "Escudo de Acero" },
        description: { ru: "Фигура выживает после двух взятий (2 заряда щита).", en: "The piece survives two captures (2 shield charges).", es: "La pieza sobrevive a dos capturas (2 cargas de escudo)." },
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
        name: { ru: "Шипы", en: "Thorns", es: "Espinas" },
        description: { ru: "Фигура не может быть взята конями.", en: "The piece cannot be captured by Knights.", es: "La pieza no puede ser capturada por Caballos." },
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
        name: { ru: "Счастливая монета", en: "Lucky Coin", es: "Moneda de la Suerte" },
        description: { ru: "+100 золота за победу в раунде.", en: "+100 gold for winning the round.", es: "+100 de oro por ganar la ronda." },
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
        name: { ru: "Плащ призрака", en: "Phantom Cloak", es: "Capa Fantasma" },
        description: { ru: "35% шанс уклониться от взятия. Редкое везение!", en: "35% chance to evade a capture. Rare luck!", es: "35% de probabilidad de evadir una captura. ¡Suerte rara!" },
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
        name: { ru: "Благословение королевы", en: "Queen's Blessing", es: "Bendición de la Reina" },
        description: { ru: "Ладья получает ходы по диагонали и может скользить как слон.", en: "The Rook gains diagonal moves and can slide like a Bishop.", es: "La Torre obtiene movimientos en diagonal y puede deslizarse como un Alfil." },
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
        name: { ru: "Руна телепорта", en: "Teleport Rune", es: "Runa de Teletransporte" },
        description: { ru: "Фигура получает ход на 3 клетки в любом направлении.", en: "The piece gains a move of up to 3 squares in any direction.", es: "La pieza obtiene un movimiento de hasta 3 casillas en cualquier dirección." },
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
        name: { ru: "Руна ускорения", en: "Speed Rune", es: "Runa de Velocidad" },
        description: { ru: "+2 к дальности хода скользящих фигур.", en: "+2 to the movement range of sliding pieces.", es: "+2 al rango de movimiento de las piezas deslizantes." },
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
        name: { ru: "Длинные ноги", en: "Long Legs", es: "Piernas Largas" },
        description: { ru: "Конь ходит по схеме 3+2 (вместо 2+1), большее покрытие.", en: "The Knight moves in a 3+2 pattern (instead of 2+1), greater coverage.", es: "El Caballo se mueve en un patrón de 3+2 (en lugar de 2+1), mayor cobertura." },
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
        name: { ru: "Диагональные ботинки", en: "Diagonal Boots", es: "Botas Diagonales" },
        description: { ru: "Ладья получает ход на 1 клетку по диагонали.", en: "The Rook gains a move of 1 square diagonally.", es: "La Torre obtiene un movimiento de 1 casilla en diagonal." },
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
        name: { ru: "Конские ноги", en: "Horse Legs", es: "Patas de Caballo" },
        description: { ru: "Пешка дополнительно может ходить как конь (Г-образно).", en: "The Pawn can additionally move like a Knight (L-shape).", es: "El Peón puede moverse adicionalmente como un Caballo (en forma de L)." },
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
        name: { ru: "Свиток спринтера", en: "Sprinter Scroll", es: "Pergamino de Velocista" },
        description: { ru: "Пешка всегда может двигаться на 2 клетки вперёд (не только с исходной позиции).", en: "The Pawn can always move 2 squares forward (not just from the starting position).", es: "El Peón siempre puede moverse 2 casillas hacia adelante (no solo desde la posición inicial)." },
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
        name: { ru: "Клешни краба", en: "Crab Claws", es: "Pinzas de Cangrejo" },
        description: { ru: "Ладья получает прыжки на 2 клетки вбок (горизонтальный конь).", en: "The Rook gains 2-square horizontal jumps (horizontal Knight).", es: "La Torre obtiene saltos de 2 casillas hacia los lados (Caballo horizontal)." },
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
        name: { ru: "Лунная походка", en: "Moonwalk", es: "Paso Lunar" },
        description: { ru: "Ладья получает возможность ходить назад по диагонали на 2 клетки.", en: "The Rook gains the ability to move backwards diagonally by 2 squares.", es: "La Torre obtiene la habilidad de moverse hacia atrás en diagonal 2 casillas." },
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
        name: { ru: "Спиральный путь", en: "Spiral Path", es: "Camino en Espiral" },
        description: { ru: "Слон может дополнительно двигаться на 1 клетку по прямой.", en: "The Bishop can additionally move 1 square in a straight line.", es: "El Alfil puede moverse adicionalmente 1 casilla en línea recta." },
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
        name: { ru: "Зеркальный шаг", en: "Mirror Step", es: "Paso Espejo" },
        description: { ru: "Конь получает дополнительные зеркальные прыжки [-1,2] и [1,-2].", en: "The Knight gains additional mirror jumps [-1,2] and [1,-2].", es: "El Caballo obtiene saltos espejo adicionales [-1,2] y [1,-2]." },
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
        name: { ru: "Боковой ход", en: "Sidewinder", es: "Movimiento Lateral" },
        description: { ru: "Пешка может ходить на 1 клетку вбок (без взятия).", en: "The Pawn can move 1 square horizontally (without capturing).", es: "El Peón puede moverse 1 casilla horizontalmente (sin capturar)." },
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
        name: { ru: "Щупальца осьминога", en: "Octopus Arms", es: "Tentáculos de Pulpo" },
        description: { ru: "Слон получает прямые направления хода (становится ферзём по возможностям).", en: "The Bishop gains straight movement directions (becomes a Queen in capabilities).", es: "El Alfil obtiene direcciones de movimiento rectas (se convierte en una Reina en capacidades)." },
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
        name: { ru: "Буровой снаряд", en: "Tunnel Drill", es: "Taladro de Túnel" },
        description: { ru: "Ладья может игнорировать одну фигуру на пути.", en: "The Rook can ignore one piece in its path.", es: "La Torre puede ignorar una pieza en su camino." },
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
        name: { ru: "Плащ ветра", en: "Cape of Wind", es: "Capa de Viento" },
        description: { ru: "Фигура получает шаг на 1 клетку в любом направлении.", en: "The piece gains a 1-square step in any direction.", es: "La pieza obtiene un paso de 1 casilla en cualquier dirección." },
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
        name: { ru: "Реактивный ранец", en: "Jetpack", es: "Mochila Propulsora" },
        description: { ru: "Пешка может двигаться до 4 клеток вперёд.", en: "The Pawn can move up to 4 squares forward.", es: "El Peón puede moverse hasta 4 casillas hacia adelante." },
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
        name: { ru: "Прицел снайпера", en: "Sniper's Scope", es: "Mira de Francotirador" },
        description: { ru: "+50 золота за взятие с дистанции 3+ клетки.", en: "+50 gold for capturing from a distance of 3+ squares.", es: "+50 de oro por capturar desde una distancia de más de 3 casillas." },
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
        name: { ru: "Клинок убийцы", en: "Assassin's Blade", es: "Cuchilla de Asesino" },
        description: { ru: "+30 золота за взятие фигур противника конём.", en: "+30 gold for capturing opponent's pieces with a Knight.", es: "+30 de oro por capturar piezas del oponente con un Caballo." },
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
        name: { ru: "Боевой топор", en: "Battle Axe", es: "Hacha de Batalla" },
        description: { ru: "Фигура может атаковать на 1 клетку по диагонали (дополнительно).", en: "The piece can attack 1 square diagonally (additionally).", es: "La pieza puede atacar 1 casilla en diagonal (adicionalmente)." },
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
        name: { ru: "Ядовитый клык", en: "Venom Fang", es: "Colmillo Venenoso" },
        description: { ru: "+10 золота за каждое взятие.", en: "+10 gold for each capture.", es: "+10 de oro por cada captura." },
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
        name: { ru: "Военный барабан", en: "War Drum", es: "Tambor de Guerra" },
        description: { ru: "+5 золота за каждый ход с взятием.", en: "+5 gold for each move with a capture.", es: "+5 de oro por cada movimiento con una captura." },
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
        name: { ru: "Горящий лук", en: "Burning Bow", es: "Arco Ardiente" },
        description: { ru: "Слон может атаковать по прямой на 1 клетку.", en: "The Bishop can attack in a straight line for 1 square.", es: "El Alfil puede atacar en línea recta por 1 casilla." },
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
        name: { ru: "Шипованная ловушка", en: "Spike Trap", es: "Trampa de Picos" },
        description: { ru: "Пешка получает +15 золота за взятие.", en: "The Pawn gains +15 gold per capture.", es: "El Peón obtiene +15 de oro por captura." },
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
        name: { ru: "Топор палача", en: "Executioner's Axe", es: "Hacha de Verdugo" },
        description: { ru: "+100 золота за взятие ферзя.", en: "+100 gold for capturing a Queen.", es: "+100 de oro por capturar una Reina." },
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
        name: { ru: "Метка охотника", en: "Hunter's Mark", es: "Marca de Cazador" },
        description: { ru: "+20 золота за взятие коня.", en: "+20 gold for capturing a Knight.", es: "+20 de oro por capturar un Caballo." },
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
        name: { ru: "Боевой клич", en: "Battle Cry", es: "Grito de Batalla" },
        description: { ru: "+15 золота за взятие ладьи.", en: "+15 gold for capturing a Rook.", es: "+15 de oro por capturar una Torre." },
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
        name: { ru: "Руна силы", en: "Rune of Power", es: "Runa de Poder" },
        description: { ru: "Взятие тяжёлой фигуры даёт +2 заряда щита.", en: "Capturing a major piece grants +2 shield charges.", es: "Capturar una pieza mayor otorga +2 cargas de escudo." },
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
        name: { ru: "Удар отражения", en: "Mirror Strike", es: "Golpe Espejo" },
        description: { ru: "Слон может атаковать прямо на 2 клетки.", en: "The Bishop can attack straight ahead for 2 squares.", es: "El Alfil puede atacar en línea recta por 2 casillas." },
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
        name: { ru: "Руна стража", en: "Guardian Rune", es: "Runa de Guardián" },
        description: { ru: "Фигура не может быть взята слонами.", en: "The piece cannot be captured by Bishops.", es: "La pieza no puede ser capturada por Alfiles." },
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
        name: { ru: "Каменная кожа", en: "Stone Skin", es: "Piel de Piedra" },
        description: { ru: "30% шанс уклониться от взятия.", en: "30% chance to evade a capture.", es: "30% de probabilidad de evadir una captura." },
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
        name: { ru: "Божественный щит", en: "Divine Shield", es: "Escudo Divino" },
        description: { ru: "3 заряда щита + 25% шанс уклонения.", en: "3 shield charges + 25% chance of evasion.", es: "3 cargas de escudo + 25% de probabilidad de evasión." },
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
        name: { ru: "Титановая плита", en: "Titanium Plate", es: "Placa de Titanio" },
        description: { ru: "Иммунитет к коням и пешкам.", en: "Immunity to Knights and Pawns.", es: "Inmunidad a Caballos y Peones." },
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
        name: { ru: "Святая вода", en: "Holy Water", es: "Agua Bendita" },
        description: { ru: "Фигура получает 1 заряд щита.", en: "The piece gains 1 shield charge.", es: "La pieza obtiene 1 carga de escudo." },
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
        name: { ru: "Отражающее покрытие", en: "Reflective Coat", es: "Abrigo Reflectante" },
        description: { ru: "Фигура не может быть взята ладьями.", en: "The piece cannot be captured by Rooks.", es: "La pieza no puede ser capturada por Torres." },
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
        name: { ru: "Шёлковый халат", en: "Silk Robe", es: "Túnica de Seda" },
        description: { ru: "15% шанс уклониться от взятия.", en: "15% chance to evade a capture.", es: "15% de probabilidad de evadir una captura." },
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
        name: { ru: "Огнестойкость", en: "Fire Resistance", es: "Resistencia al Fuego" },
        description: { ru: "Фигура не может быть взята ферзями.", en: "The piece cannot be captured by Queens.", es: "La pieza no puede ser capturada por Reinas." },
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
        name: { ru: "Руна поглощения", en: "Absorb Rune", es: "Runa de Absorción" },
        description: { ru: "При взятии этой фигуры: +50 золота.", en: "When this piece is captured: +50 gold.", es: "Cuando esta pieza es capturada: +50 de oro." },
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
        name: { ru: "Последний рубеж", en: "Last Stand", es: "Última Batalla" },
        description: { ru: "При 1 заряде щита: 60% шанс уклонения.", en: "With 1 shield charge remaining: 60% chance of evasion.", es: "Con 1 carga de escudo restante: 60% de probabilidad de evasión." },
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
        name: { ru: "Усиленная броня", en: "Reinforced Armor", es: "Armadura Reforzada" },
        description: { ru: "Ладья не может быть взята слонами.", en: "The Rook cannot be captured by Bishops.", es: "La Torre no puede ser capturada por Alfiles." },
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
        name: { ru: "Зеркальная броня", en: "Mirror Armor", es: "Armadura Espejo" },
        description: { ru: "50% шанс уклонения, но -1 к дальности хода.", en: "50% chance of evasion, but -1 to movement range.", es: "50% de probabilidad de evasión, pero -1 al rango de movimiento." },
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
        name: { ru: "Золотой самородок", en: "Gold Nugget", es: "Pepita de Oro" },
        description: { ru: "+50 золота за победу в раунде.", en: "+50 gold for winning the round.", es: "+50 de oro por ganar la ronda." },
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
        name: { ru: "Карта сокровищ", en: "Treasure Map", es: "Mapa del Tesoro" },
        description: { ru: "+150 золота за победу в раунде.", en: "+150 gold for winning the round.", es: "+150 de oro por ganar la ronda." },
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
        name: { ru: "Сборщик самоцветов", en: "Gem Collector", es: "Coleccionista de Gemas" },
        description: { ru: "+20 золота за взятие слона.", en: "+20 gold for capturing a Bishop.", es: "+20 de oro por capturar un Alfil." },
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
        name: { ru: "Королевская казна", en: "Royal Treasury", es: "Tesorería Real" },
        description: { ru: "+300 золота за победу в раунде!", en: "+300 gold for winning the round!", es: "¡+300 de oro por ganar la ronda!" },
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
        name: { ru: "Двойная добыча", en: "Double Loot", es: "Doble Botín" },
        description: { ru: "Вдвое больше золота за взятие ферзя.", en: "Double gold for capturing a Queen.", es: "Doble de oro por capturar una Reina." },
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
        name: { ru: "Охотник за наградой", en: "Bounty Hunter", es: "Cazarrecompensas" },
        description: { ru: "+30 золота за взятие ладьи.", en: "+30 gold for capturing a Rook.", es: "+30 de oro por capturar una Torre." },
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
        name: { ru: "Железная воля", en: "Iron Will", es: "Voluntad de Hierro" },
        description: { ru: "10% шанс получить случайный предмет после взятия.", en: "10% chance to receive a random item after a capture.", es: "10% de probabilidad de recibir un objeto aleatorio después de una captura." },
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
        name: { ru: "Второй шанс", en: "Second Chance", es: "Segunda Oportunidad" },
        description: { ru: "Пешка может превратиться в любую фигуру при взятии.", en: "The Pawn can promote to any piece upon capture.", es: "El Peón puede coronar a cualquier pieza al capturar." },
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
        name: { ru: "Проклятое золото", en: "Cursed Gold", es: "Oro Maldito" },
        description: { ru: "+200 золота за победу, -10 зол. за каждый ход без взятия.", en: "+200 gold for winning, -10 gold for each move without a capture.", es: "+200 de oro por ganar, -10 de oro por cada movimiento sin captura." },
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
        name: { ru: "Свиток жадности", en: "Scroll of Greed", es: "Pergamino de Avaricia" },
        description: { ru: "x3 золото за взятие тяжёлых фигур (ладья/ферзь).", en: "x3 gold for capturing major pieces (Rook/Queen).", es: "x3 de oro por capturar piezas mayores (Torre/Reina)." },
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
        name: { ru: "Шар опыта", en: "Experience Orb", es: "Orbe de Experiencia" },
        description: { ru: "Следующий предмет в магазине стоит -20 золота.", en: "The next item in the shop costs -20 gold.", es: "El siguiente objeto en la tienda cuesta -20 de oro." },
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
        name: { ru: "Перстень купца", en: "Merchant's Ring", es: "Anillo de Comerciante" },
        description: { ru: "-15% стоимость всех предметов в магазине.", en: "-15% to the cost of all items in the shop.", es: "-15% al costo de todos los objetos en la tienda." },
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
        name: { ru: "Перстень короля", en: "King's Signet", es: "Sello del Rey" },
        description: { ru: "Каждая ваша фигура на поле даёт +5 золота за ход.", en: "Each of your pieces on the board gives +5 gold per turn.", es: "Cada una de tus piezas en el tablero da +5 de oro por turno." },
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
        name: { ru: 'Звездная Карта', en: "Star Map", es: "Mapa Estelar" },
        description: { ru: 'Позволяет фигуре ходить как Конь.', en: "Allows piece to move as a Knight.", es: "Permite que la pieza se mueva como un Caballo." },
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
        name: { ru: 'Камень Души', en: "Soul Gem", es: "Gema del Alma" },
        description: { ru: 'При взятии случайная мертвая дружественная фигура возрождается.', en: "When piece captures, revives a random friendly piece.", es: "Cuando la pieza captura, revive una pieza aliada al azar." },
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
        name: { ru: 'Демонический Пакт', en: "Demonic Pact", es: "Pacto Demoníaco" },
        description: { ru: 'Золото x2, но вычитается 1 щит.', en: "x2 Gold gained, but shield gets -1 penalty.", es: "x2 de Oro ganado, pero el escudo recibe penalización de -1." },
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
        name: { ru: 'Ангельский Нимб', en: "Angelic Halo", es: "Halo Angelical" },
        description: { ru: 'Возрождает фигуру один раз после смерти.', en: "Revives the piece once after dying.", es: "Revive a la pieza una vez después de morir." },
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
        name: { ru: 'Камень Хаоса', en: "Chaos Gem", es: "Gema del Caos" },
        description: { ru: 'Случайный эффект каждые 3 хода.', en: "Random effects every 3 turns.", es: "Efectos aleatorios cada 3 turnos." },
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
        name: { ru: 'Камень Бесконечности', en: "Infinity Stone", es: "Piedra del Infinito" },
        description: { ru: 'Фигура может походить на любую клетку доски.', en: "Piece can move anywhere on the board.", es: "La pieza puede moverse a cualquier parte del tablero." },
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
        name: { ru: 'Омега Руна', en: "Omega Rune", es: "Runa Omega" },
        description: { ru: '+1 дальность, +1 щит, +10 золота за взятие.', en: "+1 Range, +1 Shield, +10 Gold per capture.", es: "+1 Rango, +1 Escudo, +10 Oro por captura." },
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
        name: { ru: 'Шапка Бета-Тестера', en: "Beta Tester Cap", es: "Gorra de Beta Tester" },
        description: { ru: 'Сила разработчика: Ход куда угодно, 10 щитов.', en: "Dev powers: Move anywhere, 10 Shields.", es: "Poderes Dev: Muévete a cualquier parte, 10 Escudos." },
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
    common:    { label: { ru: 'Обычный', en: 'Common', es: 'Común' },     color: '#9a95b0', bgColor: 'rgba(154,149,176,0.1)', border: 'rgba(154,149,176,0.3)' },
    rare:      { label: { ru: 'Редкий', en: 'Rare', es: 'Raro' },      color: '#4488ff', bgColor: 'rgba(68,136,255,0.1)',  border: 'rgba(68,136,255,0.3)'  },
    epic:      { label: { ru: 'Эпический', en: 'Epic', es: 'Épico' },   color: '#9d93fa', bgColor: 'rgba(157,147,250,0.1)', border: 'rgba(157,147,250,0.3)' },
    legendary: { label: { ru: 'Легендарный', en: 'Legendary', es: 'Legendario' }, color: '#f0c048', bgColor: 'rgba(240,192,72,0.1)',  border: 'rgba(240,192,72,0.3)'  },
};

const CATEGORY_LABELS = {
    movement: { ru: '🏃 Движение', en: '🏃 Movement', es: '🏃 Movimiento' },
    offense:  '🗡 Атака',
    defense:  '🛡 Защита',
    utility:  '🔮 Утилиты',
};
