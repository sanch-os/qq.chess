import re
import json

items_path = r"C:\Users\sanyo\.gemini\antigravity\scratch\chess-game\items-db.js"
with open(items_path, "r", encoding="utf-8") as f:
    items_src = f.read()

item_translations = {
    "boots_of_speed": { "name": { "en": "Boots of Speed", "es": "Botas de Velocidad" }, "description": { "en": "+1 Range to horizontal/vertical/diagonal moves.", "es": "+1 Rango a movimientos horizontales/verticales/diagonales." } },
    "wings_of_pegasus": { "name": { "en": "Wings of Pegasus", "es": "Alas de Pegaso" }, "description": { "en": "Allows piece to jump over other pieces like a Knight.", "es": "Permite que la pieza salte sobre otras piezas como un Caballo." } },
    "pawn_rush": { "name": { "en": "Pawn Rush", "es": "Ataque de Peón" }, "description": { "en": "Pawn can move 2 squares forward indefinitely.", "es": "El peón puede moverse 2 casillas hacia adelante indefinidamente." } },
    "knight_charge": { "name": { "en": "Knight's Charge", "es": "Carga del Caballo" }, "description": { "en": "Allows piece to move in a 3x1 L-shape.", "es": "Permite a la pieza moverse en forma de L de 3x1." } },
    "bishop_diagonals": { "name": { "en": "Bishop's Path", "es": "Camino del Alfil" }, "description": { "en": "Allows limited diagonal movement.", "es": "Permite movimiento diagonal limitado." } },
    "sword_of_fury": { "name": { "en": "Sword of Fury", "es": "Espada de Furia" }, "description": { "en": "+5 gold when capturing a piece.", "es": "+5 de oro al capturar una pieza." } },
    "assassin_dagger": { "name": { "en": "Assassin's Dagger", "es": "Daga de Asesino" }, "description": { "en": "If piece captures another piece, it can move again.", "es": "Si la pieza captura otra pieza, puede moverse de nuevo." } },
    "sniper_bow": { "name": { "en": "Sniper Bow", "es": "Arco de Francotirador" }, "description": { "en": "+2 Range. Can capture without moving to the square.", "es": "+2 Rango. Puede capturar sin moverse a la casilla." } },
    "poisoned_blade": { "name": { "en": "Poisoned Blade", "es": "Hoja Envenenada" }, "description": { "en": "Captures apply a permanent debuff to nearby enemies.", "es": "Las capturas aplican un debuff permanente a los enemigos cercanos." } },
    "holy_shield": { "name": { "en": "Holy Shield", "es": "Escudo Sagrado" }, "description": { "en": "Blocks 1 capture. (Shield breaks instead of piece dying)", "es": "Bloquea 1 captura. (El escudo se rompe en lugar de que la pieza muera)" } },
    "iron_armor": { "name": { "en": "Iron Armor", "es": "Armadura de Hierro" }, "description": { "en": "Piece cannot be captured by Pawns.", "es": "La pieza no puede ser capturada por Peones." } },
    "king_guard": { "name": { "en": "King's Guard", "es": "Guardia del Rey" }, "description": { "en": "If King is in check, this piece can block it.", "es": "Si el Rey está en jaque, esta pieza puede bloquearlo." } },
    "royal_tax": { "name": { "en": "Royal Tax", "es": "Impuesto Real" }, "description": { "en": "+5 Gold every turn.", "es": "+5 de oro cada turno." } },
    "star_map": { "name": { "en": "Star Map", "es": "Mapa Estelar" }, "description": { "en": "Allows piece to move as a Knight.", "es": "Permite que la pieza se mueva como un Caballo." } },
    "soul_gem": { "name": { "en": "Soul Gem", "es": "Gema del Alma" }, "description": { "en": "When piece captures, revives a random friendly piece.", "es": "Cuando la pieza captura, revive una pieza aliada al azar." } },
    "demonic_pact": { "name": { "en": "Demonic Pact", "es": "Pacto Demoníaco" }, "description": { "en": "x2 Gold gained, but shield gets -1 penalty.", "es": "x2 de Oro ganado, pero el escudo recibe penalización de -1." } },
    "angelic_halo": { "name": { "en": "Angelic Halo", "es": "Halo Angelical" }, "description": { "en": "Revives the piece once after dying.", "es": "Revive a la pieza una vez después de morir." } },
    "chaos_gem": { "name": { "en": "Chaos Gem", "es": "Gema del Caos" }, "description": { "en": "Random effects every 3 turns.", "es": "Efectos aleatorios cada 3 turnos." } },
    "infinity_stone": { "name": { "en": "Infinity Stone", "es": "Piedra del Infinito" }, "description": { "en": "Piece can move anywhere on the board.", "es": "La pieza puede moverse a cualquier parte del tablero." } },
    "omega_rune": { "name": { "en": "Omega Rune", "es": "Runa Omega" }, "description": { "en": "+1 Range, +1 Shield, +10 Gold per capture.", "es": "+1 Rango, +1 Escudo, +10 Oro por captura." } },
    "beta_tester_cap": { "name": { "en": "Beta Tester Cap", "es": "Gorra de Beta Tester" }, "description": { "en": "Dev powers: Move anywhere, 10 Shields.", "es": "Poderes Dev: Muévete a cualquier parte, 10 Escudos." } }
}

final_items_src = items_src
for item_id, trans in item_translations.items():
    block_regex = r"(" + item_id + r":\s*\{[\s\S]*?name:\s*)(['\"].*?['\"])([\s\S]*?description:\s*)(['\"].*?['\"])"
    def replacer(match):
        p1 = match.group(1)
        ruName = match.group(2)
        p3 = match.group(3)
        ruDesc = match.group(4)
        newNameObj = '{ ru: ' + ruName + ', en: "' + trans["name"]["en"] + '", es: "' + trans["name"]["es"] + '" }'
        newDescObj = '{ ru: ' + ruDesc + ', en: "' + trans["description"]["en"] + '", es: "' + trans["description"]["es"] + '" }'
        return p1 + newNameObj + p3 + newDescObj
    
    final_items_src = re.sub(block_regex, replacer, final_items_src, count=1)

# Translating configs
final_items_src = re.sub(r"label:\s*['\"]Обычный['\"]", "label: { ru: 'Обычный', en: 'Common', es: 'Común' }", final_items_src)
final_items_src = re.sub(r"label:\s*['\"]Редкий['\"]", "label: { ru: 'Редкий', en: 'Rare', es: 'Raro' }", final_items_src)
final_items_src = re.sub(r"label:\s*['\"]Эпический['\"]", "label: { ru: 'Эпический', en: 'Epic', es: 'Épico' }", final_items_src)
final_items_src = re.sub(r"label:\s*['\"]Легендарный['\"]", "label: { ru: 'Легендарный', en: 'Legendary', es: 'Legendario' }", final_items_src)

final_items_src = re.sub(r"movement:\s*['\"]🏃 Движение['\"]", "movement: { ru: '🏃 Движение', en: '🏃 Movement', es: '🏃 Movimiento' }", final_items_src)
final_items_src = re.sub(r"offense:\s*['\"]⚔️ Атака['\"]", "offense: { ru: '⚔️ Атака', en: '⚔️ Offense', es: '⚔️ Ataque' }", final_items_src)
final_items_src = re.sub(r"defense:\s*['\"]🛡️ Защита['\"]", "defense: { ru: '🛡️ Защита', en: '🛡️ Defense', es: '🛡️ Defensa' }", final_items_src)
final_items_src = re.sub(r"utility:\s*['\"]⚙️ Полезное['\"]", "utility: { ru: '⚙️ Полезное', en: '⚙️ Utility', es: '⚙️ Utilidad' }", final_items_src)

with open(items_path, "w", encoding="utf-8") as f:
    f.write(final_items_src)


enc_path = r"C:\Users\sanyo\.gemini\antigravity\scratch\chess-game\encounters.js"
with open(enc_path, "r", encoding="utf-8") as f:
    enc_src = f.read()

enc_translations = {
    "level1": { "name": { "en": "Lone Pawn", "es": "Peón Solitario" } },
    "level2": { "name": { "en": "Two Pawns", "es": "Dos Peones" } },
    "level3": { "name": { "en": "A Knight Appears", "es": "Aparece un Caballo" } },
    "level4": { "name": { "en": "Bishop's Guard", "es": "Guardia del Alfil" } },
    "boss1": { "name": { "en": "The Rook", "es": "La Torre" }, "bossName": { "en": "Giant Rook", "es": "Torre Gigante" }, "message": { "en": "Rook prepares to strike!", "es": "¡La Torre se prepara para atacar!" } },
    "level6": { "name": { "en": "Pawn Wall", "es": "Muro de Peones" } },
    "level7": { "name": { "en": "Cavalry Charge", "es": "Carga de Caballería" } },
    "level8": { "name": { "en": "Royal Guard", "es": "Guardia Real" } },
    "boss2": { "name": { "en": "The Queen", "es": "La Reina" }, "bossName": { "en": "Mad Queen", "es": "Reina Loca" }, "message": { "en": "The Queen enters the battlefield!", "es": "¡La Reina entra al campo de batalla!" } },
    "level10": { "name": { "en": "Elite Forces", "es": "Fuerzas de Élite" } },
    "level11": { "name": { "en": "Shadow Assassins", "es": "Asesinos de las Sombras" } },
    "boss3": { "name": { "en": "The King", "es": "El Rey" }, "bossName": { "en": "Corrupted King", "es": "Rey Corrupto" }, "message": { "en": "The King stands before you!", "es": "¡El Rey se alza ante ti!" } }
}

for enc_id, trans in enc_translations.items():
    block_regex = r"(id:\s*['\"]" + enc_id + r"['\"][\s\S]*?name:\s*)(['\"].*?['\"])"
    def replacer_name(match):
        return match.group(1) + '{ ru: ' + match.group(2) + ', en: "' + trans["name"]["en"] + '", es: "' + trans["name"]["es"] + '" }'
    enc_src = re.sub(block_regex, replacer_name, enc_src, count=1)
    
    if "bossName" in trans:
        block_regex2 = r"(id:\s*['\"]" + enc_id + r"['\"][\s\S]*?bossName:\s*)(['\"].*?['\"])"
        def replacer_boss(match):
            return match.group(1) + '{ ru: ' + match.group(2) + ', en: "' + trans["bossName"]["en"] + '", es: "' + trans["bossName"]["es"] + '" }'
        enc_src = re.sub(block_regex2, replacer_boss, enc_src, count=1)
        
    if "message" in trans:
        block_regex3 = r"(id:\s*['\"]" + enc_id + r"['\"][\s\S]*?message:\s*)(['\"].*?['\"])"
        def replacer_msg(match):
            return match.group(1) + '{ ru: ' + match.group(2) + ', en: "' + trans["message"]["en"] + '", es: "' + trans["message"]["es"] + '" }'
        enc_src = re.sub(block_regex3, replacer_msg, enc_src, count=1)

with open(enc_path, "w", encoding="utf-8") as f:
    f.write(enc_src)
print("Translations generated.")
