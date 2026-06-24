import json

input_file = r"C:\Users\sanyo\.gemini\antigravity\scratch\chess-game\untranslated.json"
output_file = r"C:\Users\sanyo\.gemini\antigravity\scratch\chess-game\translated.json"

translations = {
    "boots_of_speed": {"en_name": "Compass", "es_name": "Brújula", "en_desc": "The Bishop can additionally move 1 square in a straight line.", "es_desc": "El Alfil puede moverse adicionalmente 1 casilla en línea recta."},
    "diagonal_slide": {"en_name": "Diagonal Slide", "es_name": "Deslizamiento Diagonal", "en_desc": "The Rook can additionally move 1 square diagonally.", "es_desc": "La Torre puede moverse adicionalmente 1 casilla en diagonal."},
    "retreat": {"en_name": "Retreat", "es_name": "Retirada", "en_desc": "The Pawn can move 1 square backwards.", "es_desc": "El Peón puede moverse 1 casilla hacia atrás."},
    "horseshoe": {"en_name": "Horseshoe", "es_name": "Herradura", "en_desc": "The Knight gains additional jumps: 3x1 (long L-shape).", "es_desc": "El Caballo obtiene saltos adicionales: 3x1 (forma de L larga)."},
    "sharp_blade": {"en_name": "Sharp Blade", "es_name": "Cuchilla Afilada", "en_desc": "Sliding pieces gain +1 to capture range.", "es_desc": "Las piezas deslizantes obtienen +1 al rango de captura."},
    "sniper_scope": {"en_name": "Sniper Scope", "es_name": "Mira de Francotirador", "en_desc": "The Pawn can capture pieces at a distance of 2 squares diagonally.", "es_desc": "El Peón puede capturar piezas a una distancia de 2 casillas en diagonal."},
    "gold_tooth": {"en_name": "Gold Tooth", "es_name": "Diente de Oro", "en_desc": "+15 gold for each capture by this piece.", "es_desc": "+15 de oro por cada captura de esta pieza."},
    "treasure_map": {"en_name": "Treasure Map", "es_name": "Mapa del Tesoro", "en_desc": "+150 gold for winning the round.", "es_desc": "+150 de oro por ganar la ronda."},
    "promotion_scroll": {"en_name": "Promotion Scroll", "es_name": "Pergamino de Coronación", "en_desc": "The Pawn can promote on the 6th rank (instead of the 8th).", "es_desc": "El Peón puede coronar en la 6ª fila (en lugar de la 8ª)."},
    "wooden_shield": {"en_name": "Wooden Shield", "es_name": "Escudo de Madera", "en_desc": "The piece survives its first capture (one-time shield).", "es_desc": "La pieza sobrevive a su primera captura (escudo de un solo uso)."},
    "iron_armor": {"en_name": "Cloak of Evasion", "es_name": "Capa de Evasión", "en_desc": "20% chance to evade a capture.", "es_desc": "20% de probabilidad de evadir una captura."},
    "kings_crown": {"en_name": "King's Crown", "es_name": "Corona del Rey", "en_desc": "The King gains the ability to move like a Queen!", "es_desc": "¡El Rey obtiene la habilidad de moverse como una Reina!"},
    "wings": {"en_name": "Wings", "es_name": "Alas", "en_desc": "The piece can jump over other pieces (like a Knight).", "es_desc": "La pieza puede saltar sobre otras piezas (como un Caballo)."},
    "magic_boots": {"en_name": "Magic Boots", "es_name": "Botas Mágicas", "en_desc": "The piece can move 1 square in any direction (like a King).", "es_desc": "La pieza puede moverse 1 casilla en cualquier dirección (como un Rey)."},
    "shadow_step": {"en_name": "Shadow Step", "es_name": "Paso de Sombra", "en_desc": "The Knight can move 2 squares in a straight line (like a Rook for 2 squares).", "es_desc": "El Caballo puede moverse 2 casillas en línea recta (como una Torre por 2 casillas)."},
    "fire_sword": {"en_name": "Fire Sword", "es_name": "Espada de Fuego", "en_desc": "+25 gold for each capture. Fire burns the enemies!", "es_desc": "+25 de oro por cada captura. ¡El fuego quema a los enemigos!"},
    "poison_dart": {"en_name": "Poison Dart", "es_name": "Dardo Envenenado", "en_desc": "The Pawn can attack straight forward (not just diagonally).", "es_desc": "El Peón puede atacar hacia adelante (no solo en diagonal)."},
    "cursed_mirror": {"en_name": "Cursed Mirror", "es_name": "Espejo Maldito", "en_desc": "The Pawn can attack backwards diagonally.", "es_desc": "El Peón puede atacar hacia atrás en diagonal."},
    "steel_shield": {"en_name": "Steel Shield", "es_name": "Escudo de Acero", "en_desc": "The piece survives two captures (2 shield charges).", "es_desc": "La pieza sobrevive a dos capturas (2 cargas de escudo)."},
    "thorns": {"en_name": "Thorns", "es_name": "Espinas", "en_desc": "The piece cannot be captured by Knights.", "es_desc": "La pieza no puede ser capturada por Caballos."},
    "lucky_coin": {"en_name": "Lucky Coin", "es_name": "Moneda de la Suerte", "en_desc": "+100 gold for winning the round.", "es_desc": "+100 de oro por ganar la ronda."},
    "phantom_cloak": {"en_name": "Phantom Cloak", "es_name": "Capa Fantasma", "en_desc": "35% chance to evade a capture. Rare luck!", "es_desc": "35% de probabilidad de evadir una captura. ¡Suerte rara!"},
    "queens_blessing": {"en_name": "Queen's Blessing", "es_name": "Bendición de la Reina", "en_desc": "The Rook gains diagonal moves and can slide like a Bishop.", "es_desc": "La Torre obtiene movimientos en diagonal y puede deslizarse como un Alfil."},
    "teleport_rune": {"en_name": "Teleport Rune", "es_name": "Runa de Teletransporte", "en_desc": "The piece gains a move of up to 3 squares in any direction.", "es_desc": "La pieza obtiene un movimiento de hasta 3 casillas en cualquier dirección."},
    "speed_rune": {"en_name": "Speed Rune", "es_name": "Runa de Velocidad", "en_desc": "+2 to the movement range of sliding pieces.", "es_desc": "+2 al rango de movimiento de las piezas deslizantes."},
    "long_legs": {"en_name": "Long Legs", "es_name": "Piernas Largas", "en_desc": "The Knight moves in a 3+2 pattern (instead of 2+1), greater coverage.", "es_desc": "El Caballo se mueve en un patrón de 3+2 (en lugar de 2+1), mayor cobertura."},
    "diagonal_boots": {"en_name": "Diagonal Boots", "es_name": "Botas Diagonales", "en_desc": "The Rook gains a move of 1 square diagonally.", "es_desc": "La Torre obtiene un movimiento de 1 casilla en diagonal."},
    "horse_legs": {"en_name": "Horse Legs", "es_name": "Patas de Caballo", "en_desc": "The Pawn can additionally move like a Knight (L-shape).", "es_desc": "El Peón puede moverse adicionalmente como un Caballo (en forma de L)."},
    "sprinter_scroll": {"en_name": "Sprinter Scroll", "es_name": "Pergamino de Velocista", "en_desc": "The Pawn can always move 2 squares forward (not just from the starting position).", "es_desc": "El Peón siempre puede moverse 2 casillas hacia adelante (no solo desde la posición inicial)."},
    "crab_claws": {"en_name": "Crab Claws", "es_name": "Pinzas de Cangrejo", "en_desc": "The Rook gains 2-square horizontal jumps (horizontal Knight).", "es_desc": "La Torre obtiene saltos de 2 casillas hacia los lados (Caballo horizontal)."},
    "moonwalk": {"en_name": "Moonwalk", "es_name": "Paso Lunar", "en_desc": "The Rook gains the ability to move backwards diagonally by 2 squares.", "es_desc": "La Torre obtiene la habilidad de moverse hacia atrás en diagonal 2 casillas."},
    "spiral_path": {"en_name": "Spiral Path", "es_name": "Camino en Espiral", "en_desc": "The Bishop can additionally move 1 square in a straight line.", "es_desc": "El Alfil puede moverse adicionalmente 1 casilla en línea recta."},
    "mirror_step": {"en_name": "Mirror Step", "es_name": "Paso Espejo", "en_desc": "The Knight gains additional mirror jumps [-1,2] and [1,-2].", "es_desc": "El Caballo obtiene saltos espejo adicionales [-1,2] y [1,-2]."},
    "sidewinder": {"en_name": "Sidewinder", "es_name": "Movimiento Lateral", "en_desc": "The Pawn can move 1 square horizontally (without capturing).", "es_desc": "El Peón puede moverse 1 casilla horizontalmente (sin capturar)."},
    "octopus_arms": {"en_name": "Octopus Arms", "es_name": "Tentáculos de Pulpo", "en_desc": "The Bishop gains straight movement directions (becomes a Queen in capabilities).", "es_desc": "El Alfil obtiene direcciones de movimiento rectas (se convierte en una Reina en capacidades)."},
    "tunnel_drill": {"en_name": "Tunnel Drill", "es_name": "Taladro de Túnel", "en_desc": "The Rook can ignore one piece in its path.", "es_desc": "La Torre puede ignorar una pieza en su camino."},
    "cape_of_wind": {"en_name": "Cape of Wind", "es_name": "Capa de Viento", "en_desc": "The piece gains a 1-square step in any direction.", "es_desc": "La pieza obtiene un paso de 1 casilla en cualquier dirección."},
    "jetpack": {"en_name": "Jetpack", "es_name": "Mochila Propulsora", "en_desc": "The Pawn can move up to 4 squares forward.", "es_desc": "El Peón puede moverse hasta 4 casillas hacia adelante."},
    "snipers_scope": {"en_name": "Sniper's Scope", "es_name": "Mira de Francotirador", "en_desc": "+50 gold for capturing from a distance of 3+ squares.", "es_desc": "+50 de oro por capturar desde una distancia de más de 3 casillas."},
    "assassin_blade": {"en_name": "Assassin's Blade", "es_name": "Cuchilla de Asesino", "en_desc": "+30 gold for capturing opponent's pieces with a Knight.", "es_desc": "+30 de oro por capturar piezas del oponente con un Caballo."},
    "battle_axe": {"en_name": "Battle Axe", "es_name": "Hacha de Batalla", "en_desc": "The piece can attack 1 square diagonally (additionally).", "es_desc": "La pieza puede atacar 1 casilla en diagonal (adicionalmente)."},
    "venom_fang": {"en_name": "Venom Fang", "es_name": "Colmillo Venenoso", "en_desc": "+10 gold for each capture.", "es_desc": "+10 de oro por cada captura."},
    "war_drum": {"en_name": "War Drum", "es_name": "Tambor de Guerra", "en_desc": "+5 gold for each move with a capture.", "es_desc": "+5 de oro por cada movimiento con una captura."},
    "burning_bow": {"en_name": "Burning Bow", "es_name": "Arco Ardiente", "en_desc": "The Bishop can attack in a straight line for 1 square.", "es_desc": "El Alfil puede atacar en línea recta por 1 casilla."},
    "spike_trap": {"en_name": "Spike Trap", "es_name": "Trampa de Picos", "en_desc": "The Pawn gains +15 gold per capture.", "es_desc": "El Peón obtiene +15 de oro por captura."},
    "executioners_axe": {"en_name": "Executioner's Axe", "es_name": "Hacha de Verdugo", "en_desc": "+100 gold for capturing a Queen.", "es_desc": "+100 de oro por capturar una Reina."},
    "hunters_mark": {"en_name": "Hunter's Mark", "es_name": "Marca de Cazador", "en_desc": "+20 gold for capturing a Knight.", "es_desc": "+20 de oro por capturar un Caballo."},
    "battle_cry": {"en_name": "Battle Cry", "es_name": "Grito de Batalla", "en_desc": "+15 gold for capturing a Rook.", "es_desc": "+15 de oro por capturar una Torre."},
    "rune_of_power": {"en_name": "Rune of Power", "es_name": "Runa de Poder", "en_desc": "Capturing a major piece grants +2 shield charges.", "es_desc": "Capturar una pieza mayor otorga +2 cargas de escudo."},
    "mirror_strike": {"en_name": "Mirror Strike", "es_name": "Golpe Espejo", "en_desc": "The Bishop can attack straight ahead for 2 squares.", "es_desc": "El Alfil puede atacar en línea recta por 2 casillas."},
    "guardian_rune": {"en_name": "Guardian Rune", "es_name": "Runa de Guardián", "en_desc": "The piece cannot be captured by Bishops.", "es_desc": "La pieza no puede ser capturada por Alfiles."},
    "stone_skin": {"en_name": "Stone Skin", "es_name": "Piel de Piedra", "en_desc": "30% chance to evade a capture.", "es_desc": "30% de probabilidad de evadir una captura."},
    "divine_shield": {"en_name": "Divine Shield", "es_name": "Escudo Divino", "en_desc": "3 shield charges + 25% chance of evasion.", "es_desc": "3 cargas de escudo + 25% de probabilidad de evasión."},
    "titanium_plate": {"en_name": "Titanium Plate", "es_name": "Placa de Titanio", "en_desc": "Immunity to Knights and Pawns.", "es_desc": "Inmunidad a Caballos y Peones."},
    "holy_water": {"en_name": "Holy Water", "es_name": "Agua Bendita", "en_desc": "The piece gains 1 shield charge.", "es_desc": "La pieza obtiene 1 carga de escudo."},
    "reflective_coat": {"en_name": "Reflective Coat", "es_name": "Abrigo Reflectante", "en_desc": "The piece cannot be captured by Rooks.", "es_desc": "La pieza no puede ser capturada por Torres."},
    "silk_robe": {"en_name": "Silk Robe", "es_name": "Túnica de Seda", "en_desc": "15% chance to evade a capture.", "es_desc": "15% de probabilidad de evadir una captura."},
    "fire_resistance": {"en_name": "Fire Resistance", "es_name": "Resistencia al Fuego", "en_desc": "The piece cannot be captured by Queens.", "es_desc": "La pieza no puede ser capturada por Reinas."},
    "absorb_rune": {"en_name": "Absorb Rune", "es_name": "Runa de Absorción", "en_desc": "When this piece is captured: +50 gold.", "es_desc": "Cuando esta pieza es capturada: +50 de oro."},
    "last_stand": {"en_name": "Last Stand", "es_name": "Última Batalla", "en_desc": "With 1 shield charge remaining: 60% chance of evasion.", "es_desc": "Con 1 carga de escudo restante: 60% de probabilidad de evasión."},
    "reinforced_armor": {"en_name": "Reinforced Armor", "es_name": "Armadura Reforzada", "en_desc": "The Rook cannot be captured by Bishops.", "es_desc": "La Torre no puede ser capturada por Alfiles."},
    "mirror_armor": {"en_name": "Mirror Armor", "es_name": "Armadura Espejo", "en_desc": "50% chance of evasion, but -1 to movement range.", "es_desc": "50% de probabilidad de evasión, pero -1 al rango de movimiento."},
    "gold_ore": {"en_name": "Gold Nugget", "es_name": "Pepita de Oro", "en_desc": "+50 gold for winning the round.", "es_desc": "+50 de oro por ganar la ronda."},
    "gem_collector": {"en_name": "Gem Collector", "es_name": "Coleccionista de Gemas", "en_desc": "+20 gold for capturing a Bishop.", "es_desc": "+20 de oro por capturar un Alfil."},
    "royal_treasury": {"en_name": "Royal Treasury", "es_name": "Tesorería Real", "en_desc": "+300 gold for winning the round!", "es_desc": "¡+300 de oro por ganar la ronda!"},
    "double_loot": {"en_name": "Double Loot", "es_name": "Doble Botín", "en_desc": "Double gold for capturing a Queen.", "es_desc": "Doble de oro por capturar una Reina."},
    "bounty_hunter": {"en_name": "Bounty Hunter", "es_name": "Cazarrecompensas", "en_desc": "+30 gold for capturing a Rook.", "es_desc": "+30 de oro por capturar una Torre."},
    "iron_will": {"en_name": "Iron Will", "es_name": "Voluntad de Hierro", "en_desc": "10% chance to receive a random item after a capture.", "es_desc": "10% de probabilidad de recibir un objeto aleatorio después de una captura."},
    "second_chance": {"en_name": "Second Chance", "es_name": "Segunda Oportunidad", "en_desc": "The Pawn can promote to any piece upon capture.", "es_desc": "El Peón puede coronar a cualquier pieza al capturar."},
    "cursed_gold": {"en_name": "Cursed Gold", "es_name": "Oro Maldito", "en_desc": "+200 gold for winning, -10 gold for each move without a capture.", "es_desc": "+200 de oro por ganar, -10 de oro por cada movimiento sin captura."},
    "scroll_of_greed": {"en_name": "Scroll of Greed", "es_name": "Pergamino de Avaricia", "en_desc": "x3 gold for capturing major pieces (Rook/Queen).", "es_desc": "x3 de oro por capturar piezas mayores (Torre/Reina)."},
    "experience_orb": {"en_name": "Experience Orb", "es_name": "Orbe de Experiencia", "en_desc": "The next item in the shop costs -20 gold.", "es_desc": "El siguiente objeto en la tienda cuesta -20 de oro."},
    "merchants_ring": {"en_name": "Merchant's Ring", "es_name": "Anillo de Comerciante", "en_desc": "-15% to the cost of all items in the shop.", "es_desc": "-15% al costo de todos los objetos en la tienda."},
    "kings_signet": {"en_name": "King's Signet", "es_name": "Sello del Rey", "en_desc": "Each of your pieces on the board gives +5 gold per turn.", "es_desc": "Cada una de tus piezas en el tablero da +5 de oro por turno."}
}

with open(input_file, 'r', encoding='utf-8') as f:
    untranslated = json.load(f)

result = {}
for key, val in untranslated.items():
    t = translations.get(key, {})
    result[key] = {
        "name": {
            "ru": val.get("ru_name", ""),
            "en": t.get("en_name", ""),
            "es": t.get("es_name", "")
        },
        "description": {
            "ru": val.get("ru_desc", ""),
            "en": t.get("en_desc", ""),
            "es": t.get("es_desc", "")
        }
    }

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("Translation completed successfully!")
