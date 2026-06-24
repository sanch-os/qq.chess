import re

items_path = r"C:\Users\sanyo\.gemini\antigravity\scratch\chess-game\items-db.js"
with open(items_path, "r", encoding="utf-8") as f:
    items_src = f.read()

# I will write a regex to find all `name: { ru: '...', en: '...', es: '...' }` and `description: { ru: '...', en: '...', es: '...' }`
# And then replace the `ru` part.
# Let's map by item ID.

item_ru_translations = {
    "boots_of_speed": { "name": "Сапоги Скорости", "description": "+1 к дальности хода (по прямой или диагонали)." },
    "wings_of_pegasus": { "name": "Крылья Пегаса", "description": "Позволяет фигуре прыгать через другие фигуры (как Конь)." },
    "pawn_rush": { "name": "Рывок Пешки", "description": "Пешка может бесконечно ходить на 2 клетки вперед." },
    "knight_charge": { "name": "Рывок Коня", "description": "Позволяет ходить буквой Г (3x1)." },
    "bishop_diagonals": { "name": "Путь Слона", "description": "Позволяет ограниченно ходить по диагонали." },
    "sword_of_fury": { "name": "Меч Ярости", "description": "+5 золота при взятии фигуры." },
    "assassin_dagger": { "name": "Кинжал Убийцы", "description": "После взятия вражеской фигуры дает дополнительный ход." },
    "sniper_bow": { "name": "Снайперский Лук", "description": "+2 к дальности. Может бить врагов без перемещения на их клетку." },
    "poisoned_blade": { "name": "Отравленный Клинок", "description": "Взятия накладывают дебафф на соседних врагов." },
    "holy_shield": { "name": "Святой Щит", "description": "Блокирует 1 атаку. (Щит ломается вместо смерти фигуры)." },
    "iron_armor": { "name": "Железная Броня", "description": "Фигура получает иммунитет к атакам пешек." },
    "king_guard": { "name": "Королевский Страж", "description": "Если Король под шахом, эта фигура может заблокировать удар." },
    "royal_tax": { "name": "Королевский Налог", "description": "+5 Золота каждый ход." },
    "star_map": { "name": "Звездная Карта", "description": "Позволяет фигуре ходить как Конь." },
    "soul_gem": { "name": "Камень Души", "description": "При взятии случайная мертвая дружественная фигура возрождается." },
    "demonic_pact": { "name": "Демонический Пакт", "description": "Золото x2, но вычитается 1 щит." },
    "angelic_halo": { "name": "Ангельский Нимб", "description": "Возрождает фигуру один раз после смерти." },
    "chaos_gem": { "name": "Камень Хаоса", "description": "Случайный эффект каждые 3 хода." },
    "infinity_stone": { "name": "Камень Бесконечности", "description": "Фигура может походить на любую клетку доски." },
    "omega_rune": { "name": "Омега Руна", "description": "+1 дальность, +1 щит, +10 золота за взятие." },
    "beta_tester_cap": { "name": "Шапка Бета-Тестера", "description": "Сила разработчика: Ход куда угодно, 10 щитов." }
}

for item_id, trans in item_ru_translations.items():
    # Replace name
    pattern_name = r"(" + item_id + r":\s*\{[\s\S]*?name:\s*\{\s*ru:\s*['\"])(.*?)(['\"],\s*en:)"
    items_src = re.sub(pattern_name, r"\g<1>" + trans["name"] + r"\g<3>", items_src)
    # Replace description
    pattern_desc = r"(" + item_id + r":\s*\{[\s\S]*?description:\s*\{\s*ru:\s*['\"])(.*?)(['\"],\s*en:)"
    items_src = re.sub(pattern_desc, r"\g<1>" + trans["description"] + r"\g<3>", items_src)

# Let's fix labels and categories!
#     movement: { ru: '...', en: '🏃 Movement', es: '🏃 Movimiento' }
items_src = re.sub(r"(movement:\s*\{\s*ru:\s*['\"])(.*?)(['\"],\s*en:)", r"\g<1>🏃 Движение\g<3>", items_src)
items_src = re.sub(r"(offense:\s*\{\s*ru:\s*['\"])(.*?)(['\"],\s*en:)", r"\g<1>⚔️ Атака\g<3>", items_src)
items_src = re.sub(r"(defense:\s*\{\s*ru:\s*['\"])(.*?)(['\"],\s*en:)", r"\g<1>🛡️ Защита\g<3>", items_src)
items_src = re.sub(r"(utility:\s*\{\s*ru:\s*['\"])(.*?)(['\"],\s*en:)", r"\g<1>⚙️ Полезное\g<3>", items_src)

# Rarities
items_src = re.sub(r"(common:\s*\{[\s\S]*?label:\s*\{\s*ru:\s*['\"])(.*?)(['\"],\s*en:)", r"\g<1>Обычный\g<3>", items_src)
items_src = re.sub(r"(rare:\s*\{[\s\S]*?label:\s*\{\s*ru:\s*['\"])(.*?)(['\"],\s*en:)", r"\g<1>Редкий\g<3>", items_src)
items_src = re.sub(r"(epic:\s*\{[\s\S]*?label:\s*\{\s*ru:\s*['\"])(.*?)(['\"],\s*en:)", r"\g<1>Эпический\g<3>", items_src)
items_src = re.sub(r"(legendary:\s*\{[\s\S]*?label:\s*\{\s*ru:\s*['\"])(.*?)(['\"],\s*en:)", r"\g<1>Легендарный\g<3>", items_src)

with open(items_path, "w", encoding="utf-8") as f:
    f.write(items_src)


# ENCOUNTERS!
enc_path = r"C:\Users\sanyo\.gemini\antigravity\scratch\chess-game\encounters.js"
with open(enc_path, "r", encoding="utf-8") as f:
    enc_src = f.read()

enc_ru_translations = {
    "round_1": { "name": "Одинокая Пешка" },
    "round_2": { "name": "Две Пешки" },
    "round_3_boss": { "name": "Явление Коня", "bossName": "Мертвый Конь", "message": "Конь готовится к прыжку!" },
    "round_4": { "name": "Стража Слона" },
    "boss1": { "name": "Ладья", "bossName": "Гигантская Ладья", "message": "Ладья готовится к удару!" },
    "level6": { "name": "Стена Пешек" },
    "level7": { "name": "Кавалерия" },
    "level8": { "name": "Королевская Стража" },
    "boss2": { "name": "Королева", "bossName": "Безумная Королева", "message": "Королева вступает в бой!" },
    "level10": { "name": "Элитные Силы" },
    "level11": { "name": "Теневые Ассасины" },
    "boss3": { "name": "Король", "bossName": "Оскверненный Король", "message": "Король стоит перед вами!" }
}

for enc_id, trans in enc_ru_translations.items():
    if "name" in trans:
        patt = r"(id:\s*['\"]" + enc_id + r"['\"][\s\S]*?name:\s*\{\s*ru:\s*['\"])(.*?)(['\"],\s*en:)"
        enc_src = re.sub(patt, r"\g<1>" + trans["name"] + r"\g<3>", enc_src)
    if "bossName" in trans:
        patt2 = r"(id:\s*['\"]" + enc_id + r"['\"][\s\S]*?bossName:\s*\{\s*ru:\s*['\"])(.*?)(['\"],\s*en:)"
        enc_src = re.sub(patt2, r"\g<1>" + trans["bossName"] + r"\g<3>", enc_src)
    if "message" in trans:
        patt3 = r"(id:\s*['\"]" + enc_id + r"['\"][\s\S]*?message:\s*\{\s*ru:\s*['\"])(.*?)(['\"],\s*en:)"
        enc_src = re.sub(patt3, r"\g<1>" + trans["message"] + r"\g<3>", enc_src)
    
with open(enc_path, "w", encoding="utf-8") as f:
    f.write(enc_src)
print("Encoding fixed!")
