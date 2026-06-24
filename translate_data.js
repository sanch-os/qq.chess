const fs = require('fs');

const itemsPath = 'C:\\Users\\sanyo\\.gemini\\antigravity\\scratch\\chess-game\\items-db.js';
const itemsSrc = fs.readFileSync(itemsPath, 'utf8');

const itemTranslations = {
    boots_of_speed: { name: { en: "Boots of Speed", es: "Botas de Velocidad" }, description: { en: "+1 Range to horizontal/vertical/diagonal moves.", es: "+1 Rango a movimientos horizontales/verticales/diagonales." } },
    wings_of_pegasus: { name: { en: "Wings of Pegasus", es: "Alas de Pegaso" }, description: { en: "Allows piece to jump over other pieces like a Knight.", es: "Permite que la pieza salte sobre otras piezas como un Caballo." } },
    pawn_rush: { name: { en: "Pawn Rush", es: "Ataque de Peón" }, description: { en: "Pawn can move 2 squares forward indefinitely.", es: "El peón puede moverse 2 casillas hacia adelante indefinidamente." } },
    knight_charge: { name: { en: "Knight's Charge", es: "Carga del Caballo" }, description: { en: "Allows piece to move in a 3x1 L-shape.", es: "Permite a la pieza moverse en forma de L de 3x1." } },
    bishop_diagonals: { name: { en: "Bishop's Path", es: "Camino del Alfil" }, description: { en: "Allows limited diagonal movement.", es: "Permite movimiento diagonal limitado." } },
    sword_of_fury: { name: { en: "Sword of Fury", es: "Espada de Furia" }, description: { en: "+5 gold when capturing a piece.", es: "+5 de oro al capturar una pieza." } },
    assassin_dagger: { name: { en: "Assassin's Dagger", es: "Daga de Asesino" }, description: { en: "If piece captures another piece, it can move again.", es: "Si la pieza captura otra pieza, puede moverse de nuevo." } },
    sniper_bow: { name: { en: "Sniper Bow", es: "Arco de Francotirador" }, description: { en: "+2 Range. Can capture without moving to the square.", es: "+2 Rango. Puede capturar sin moverse a la casilla." } },
    poisoned_blade: { name: { en: "Poisoned Blade", es: "Hoja Envenenada" }, description: { en: "Captures apply a permanent debuff to nearby enemies.", es: "Las capturas aplican un debuff permanente a los enemigos cercanos." } },
    holy_shield: { name: { en: "Holy Shield", es: "Escudo Sagrado" }, description: { en: "Blocks 1 capture. (Shield breaks instead of piece dying)", es: "Bloquea 1 captura. (El escudo se rompe en lugar de que la pieza muera)" } },
    iron_armor: { name: { en: "Iron Armor", es: "Armadura de Hierro" }, description: { en: "Piece cannot be captured by Pawns.", es: "La pieza no puede ser capturada por Peones." } },
    king_guard: { name: { en: "King's Guard", es: "Guardia del Rey" }, description: { en: "If King is in check, this piece can block it.", es: "Si el Rey está en jaque, esta pieza puede bloquearlo." } },
    royal_tax: { name: { en: "Royal Tax", es: "Impuesto Real" }, description: { en: "+5 Gold every turn.", es: "+5 de oro cada turno." } },
    star_map: { name: { en: "Star Map", es: "Mapa Estelar" }, description: { en: "Allows piece to move as a Knight.", es: "Permite que la pieza se mueva como un Caballo." } },
    soul_gem: { name: { en: "Soul Gem", es: "Gema del Alma" }, description: { en: "When piece captures, revives a random friendly piece.", es: "Cuando la pieza captura, revive una pieza aliada al azar." } },
    demonic_pact: { name: { en: "Demonic Pact", es: "Pacto Demoníaco" }, description: { en: "x2 Gold gained, but shield gets -1 penalty.", es: "x2 de Oro ganado, pero el escudo recibe penalización de -1." } },
    angelic_halo: { name: { en: "Angelic Halo", es: "Halo Angelical" }, description: { en: "Revives the piece once after dying.", es: "Revive a la pieza una vez después de morir." } },
    chaos_gem: { name: { en: "Chaos Gem", es: "Gema del Caos" }, description: { en: "Random effects every 3 turns.", es: "Efectos aleatorios cada 3 turnos." } },
    infinity_stone: { name: { en: "Infinity Stone", es: "Piedra del Infinito" }, description: { en: "Piece can move anywhere on the board.", es: "La pieza puede moverse a cualquier parte del tablero." } },
    omega_rune: { name: { en: "Omega Rune", es: "Runa Omega" }, description: { en: "+1 Range, +1 Shield, +10 Gold per capture.", es: "+1 Rango, +1 Escudo, +10 Oro por captura." } },
    beta_tester_cap: { name: { en: "Beta Tester Cap", es: "Gorra de Beta Tester" }, description: { en: "Dev powers: Move anywhere, 10 Shields.", es: "Poderes Dev: Muévete a cualquier parte, 10 Escudos." } }
};

let modifiedItemsSrc = itemsSrc.replace(/name:\s*['"](.*?)['"]/g, (match, p1) => {
    return match;
}).replace(/description:\s*['"](.*?)['"]/g, (match, p1) => {
    return match;
});

// A better way: replace specific fields for each key
let finalItemsSrc = itemsSrc;
for (const [id, trans] of Object.entries(itemTranslations)) {
    const blockRegex = new RegExp(`(${id}:\\s*\\{[\\s\\S]*?name:\\s*)(['"].*?['"])([\\s\\S]*?description:\\s*)(['"].*?['"])`, 'g');
    finalItemsSrc = finalItemsSrc.replace(blockRegex, (match, p1, p2, p3, p4) => {
        const ruName = p2;
        const ruDesc = p4;
        
        const newNameObj = `{ ru: ${ruName}, en: "${trans.name.en}", es: "${trans.name.es}" }`;
        const newDescObj = `{ ru: ${ruDesc}, en: "${trans.description.en}", es: "${trans.description.es}" }`;
        
        return `${p1}${newNameObj}${p3}${newDescObj}`;
    });
}

// Translate config strings
finalItemsSrc = finalItemsSrc.replace(/label:\s*['"]Обычный['"]/g, "label: { ru: 'Обычный', en: 'Common', es: 'Común' }");
finalItemsSrc = finalItemsSrc.replace(/label:\s*['"]Редкий['"]/g, "label: { ru: 'Редкий', en: 'Rare', es: 'Raro' }");
finalItemsSrc = finalItemsSrc.replace(/label:\s*['"]Эпический['"]/g, "label: { ru: 'Эпический', en: 'Epic', es: 'Épico' }");
finalItemsSrc = finalItemsSrc.replace(/label:\s*['"]Легендарный['"]/g, "label: { ru: 'Легендарный', en: 'Legendary', es: 'Legendario' }");

finalItemsSrc = finalItemsSrc.replace(/movement:\s*['"]🏃 Движение['"]/g, "movement: { ru: '🏃 Движение', en: '🏃 Movement', es: '🏃 Movimiento' }");
finalItemsSrc = finalItemsSrc.replace(/offense:\s*['"]⚔️ Атака['"]/g, "offense: { ru: '⚔️ Атака', en: '⚔️ Offense', es: '⚔️ Ataque' }");
finalItemsSrc = finalItemsSrc.replace(/defense:\s*['"]🛡️ Защита['"]/g, "defense: { ru: '🛡️ Защита', en: '🛡️ Defense', es: '🛡️ Defensa' }");
finalItemsSrc = finalItemsSrc.replace(/utility:\s*['"]⚙️ Полезное['"]/g, "utility: { ru: '⚙️ Полезное', en: '⚙️ Utility', es: '⚙️ Utilidad' }");


fs.writeFileSync(itemsPath, finalItemsSrc);

const encPath = 'C:\\Users\\sanyo\\.gemini\\antigravity\\scratch\\chess-game\\encounters.js';
let encSrc = fs.readFileSync(encPath, 'utf8');

const encTranslations = {
    level1: { name: { en: "Lone Pawn", es: "Peón Solitario" } },
    level2: { name: { en: "Two Pawns", es: "Dos Peones" } },
    level3: { name: { en: "A Knight Appears", es: "Aparece un Caballo" } },
    level4: { name: { en: "Bishop's Guard", es: "Guardia del Alfil" } },
    boss1: { name: { en: "The Rook", es: "La Torre" }, bossName: { en: "Giant Rook", es: "Torre Gigante" }, message: { en: "Rook prepares to strike!", es: "¡La Torre se prepara para atacar!" } },
    level6: { name: { en: "Pawn Wall", es: "Muro de Peones" } },
    level7: { name: { en: "Cavalry Charge", es: "Carga de Caballería" } },
    level8: { name: { en: "Royal Guard", es: "Guardia Real" } },
    boss2: { name: { en: "The Queen", es: "La Reina" }, bossName: { en: "Mad Queen", es: "Reina Loca" }, message: { en: "The Queen enters the battlefield!", es: "¡La Reina entra al campo de batalla!" } },
    level10: { name: { en: "Elite Forces", es: "Fuerzas de Élite" } },
    level11: { name: { en: "Shadow Assassins", es: "Asesinos de las Sombras" } },
    boss3: { name: { en: "The King", es: "El Rey" }, bossName: { en: "Corrupted King", es: "Rey Corrupto" }, message: { en: "The King stands before you!", es: "¡El Rey se alza ante ti!" } }
};

for (const [id, trans] of Object.entries(encTranslations)) {
    let blockRegex = new RegExp(`(id:\\s*['"]${id}['"][\\s\\S]*?name:\\s*)(['"].*?['"])`, 'g');
    encSrc = encSrc.replace(blockRegex, (match, p1, p2) => {
        return `${p1}{ ru: ${p2}, en: "${trans.name.en}", es: "${trans.name.es}" }`;
    });
    
    if (trans.bossName) {
        let blockRegex2 = new RegExp(`(id:\\s*['"]${id}['"][\\s\\S]*?bossName:\\s*)(['"].*?['"])`, 'g');
        encSrc = encSrc.replace(blockRegex2, (match, p1, p2) => {
            return `${p1}{ ru: ${p2}, en: "${trans.bossName.en}", es: "${trans.bossName.es}" }`;
        });
    }
    
    if (trans.message) {
        let blockRegex3 = new RegExp(`(id:\\s*['"]${id}['"][\\s\\S]*?message:\\s*)(['"].*?['"])`, 'g');
        encSrc = encSrc.replace(blockRegex3, (match, p1, p2) => {
            return `${p1}{ ru: ${p2}, en: "${trans.message.en}", es: "${trans.message.es}" }`;
        });
    }
}

fs.writeFileSync(encPath, encSrc);
console.log("Done");
