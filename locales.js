/* ============================================================================
   locales.js — qq.chess translations (audited)
   ============================================================================
   AUDIT FINDING: cross-referencing every window.t('...') call in app.js/
   editor.js and every data-i18n="..." attribute in the HTML against what's
   actually defined here found FOUR keys used in the app but missing from
   ALL THREE languages (menu.friend, piece.inv.empty, game.player.black,
   game.player.opponent) — window.t() has nowhere to fall back to for these,
   so it returns the raw key string, which appears verbatim in the UI. Two
   of them (menu.friend, piece.inv.empty) have their intended Russian text
   sitting right in the HTML as the pre-i18n fallback content — used as the
   ru value here rather than guessed. All 109 pre-existing keys were
   already perfectly symmetric across ru/en/es (no gaps) before this pass.
   Also added gameover.text.repetition, needed by the chess-engine.js
   threefold-repetition detection added in an earlier pass of this audit —
   the UI had no text for it and would have fallen back to "insufficient
   material", mislabeling the actual draw reason.
   ========================================================================= */
window.i18n = {
    ru: {
        // Menu
        'menu.title': 'Шахматы',
        'menu.subtitle': 'Расставь фигуры. Обыграй машину.',
        'menu.run': 'Начать забег (Roguelike)',
        'menu.free': 'Свободная',
        'menu.mirror': 'Зеркальный бой',
        'menu.creative': 'Творческий',
        'menu.editor': 'Редактор',
        'menu.difficulty': 'Сложность ИИ',
        // FIX: was missing in all 3 languages — window.t() had no fallback
        // and returned the raw key "menu.friend" for this main-menu button.
        // Value taken from index.html's own pre-i18n fallback text.
        'menu.friend': 'Игра с другом',
        // Continue run button — shows current round number
        'menu.continue.round': 'Продолжить забег (Раунд {round})',

        'diff.very_easy': '🐣 Очень легко',
        'diff.easy': '🟢 Легко',
        'diff.normal': '🔵 Средне',
        'diff.hard': '🔴 Сложно',
        'diff.crazy': '🤪 Сумасшедший',

        'diff.desc.very_easy': '🐣 ИИ делает почти случайные ходы. Отличный старт для новичков!',
        'diff.desc.easy': '🟢 ИИ думает поверхностно. Легко учиться.',
        'diff.desc.normal': '🔵 Стандартный противник. Хорошо думает и неплохо играет.',
        'diff.desc.hard': '🔴 ИИ просчитывает на 4 хода вперёд. Серьёзный вызов.',
        'diff.desc.crazy': '🤪 ИИ специально делает ХУДШИЕ ходы. Играет в поддавки!',

        // Creative Modal
        'creative.title': 'Выберите формат Творческого режима',
        'creative.pvbot': '🤖 Игра против Бота',
        'creative.pvp': '👥 Игра друг против друга (PvP)',
        'creative.cancel': 'Отмена',

        // Setup Screen
        'setup.army': 'Ваша Армия',
        'setup.army.white': 'Белые — Ваша Армия',
        'setup.army.black': 'Чёрные — Ваша Армия',
        'setup.army.creative': 'Ваша Армия (Творческий)',
        'setup.army_hint': 'Фигуры для расстановки',
        'setup.stash': 'Сундук Предметов',
        'setup.stash_hint': 'Перетащите на ваши фигуры или кликните фигуру',
        'setup.pvp_black_turn': '♛ Второй игрок, расставляйте фигуры',
        'setup.pvp_black_hint': 'Разместите чёрные фигуры на верхних клетках, затем нажмите «Начать игру»',
        'setup.btn.standard': '♟ Стандарт',
        'setup.btn.clear': '✕ Очистить',
        'presets.title': 'Пресеты',
        'presets.save': '💾 Сохранить',
        'presets.hint': 'Сохранённые фигуры (тип + инвентарь). Сохранить или применить пресет можно в окне фигуры.',
        'presets.hint_piece': 'Сохраните тип и инвентарь этой фигуры или примените сохранённый пресет',
        'setup.btn.edit_black': 'Редактировать Черных',
        'setup.btn.edit_white': 'Редактировать Белых',
        'setup.warning': 'Разместите хотя бы одного короля!',
        'setup.btn.start': 'В БОЙ ⚔️',
        'setup.btn.back': 'Назад',

        // Game Screen
        'game.btn.undo': '↩ Отменить ход',
        'game.btn.surrender': 'Сдаться',
        'game.status.white_turn': '⚪ Ход Белых',
        'game.status.black_turn': '⚫ Ход Черных',
        'game.status.white_check': '⚪ Шах Белым!',
        'game.status.black_check': '⚫ Шах Черным!',
        'game.status.white_win': '⚪ Белые победили!',
        'game.status.black_win': '⚫ Черные победили',
        'game.status.draw': 'Ничья!',
        'game.status.thinking': 'ИИ думает...',
        'game.history': 'История ходов',
        // FIX: was missing in all 3 languages (app.js:1953 — opponent name
        // label, shown for PvP vs non-PvP respectively).
        'game.player.black': 'Чёрные',
        'game.player.opponent': 'Противник',

        // Shop Screen
        'shop.title': 'Торговец',
        'shop.subtitle': 'Усильте свою армию перед следующим боем!',
        'shop.items_title': 'Товары',
        'shop.stash': 'Ваш сундук (нажмите для продажи)',
        'shop.btn.continue': 'Продолжить забег ➡',
        'shop.msg.full': 'Сундук заполнен (99/99)!',
        'shop.msg.sell_for': 'Продать за {price} 🪙',
        'shop.msg.sell_confirm': 'Продать {name} за {price} 🪙?',

        // Game Over Modal
        'gameover.title.win': 'Победа!',
        'gameover.title.lose': 'Поражение',
        'gameover.title.draw': 'Ничья',
        'gameover.text.win': 'Шах и мат! Вы обыграли компьютер!',
        'gameover.text.lose': 'Шах и мат. Компьютер победил.',
        'gameover.text.stalemate': 'Пат!',
        'gameover.text.50move': 'Правило 50 ходов',
        'gameover.text.material': 'Недостаточно материала',
        // FIX: added for the chess-engine.js threefold-repetition draw
        // reason (introduced in an earlier pass of this audit) — without
        // this, showGameOverModalDefault() fell back to "insufficient
        // material", mislabeling the actual draw reason.
        'gameover.text.repetition': 'Ничья повторением позиции',
        'gameover.btn.shop': '🛒 В магазин',
        'gameover.btn.menu': '🏠 В меню',
        'gameover.btn.restart': '🔄 Заново',
        'gameover.run.win.title': 'Победа в забеге!',
        'gameover.run.win.text': 'Вы одолели всех врагов! Золото: {gold} 🪙',
        'gameover.round.win.title': 'Победа в раунде!',
        'gameover.round.win.text': 'за победу.\nИдём к торговцу...',
        'gameover.run.lose': 'Ваша армия разгромлена. Забег окончен.',
        'gameover.recruit': 'Вы захватили {count} фигур врага!',

        // Piece Inventory
        'piece.king': 'Король',
        'piece.queen': 'Ферзь',
        'piece.rook': 'Ладья',
        'piece.bishop': 'Слон',
        'piece.knight': 'Конь',
        'piece.pawn': 'Пешка',
        'piece.inv.subtitle.equipped': 'Экипированные предметы',
        'piece.inv.subtitle.slots': 'Слоты экипировки ({count}/3)',
        'piece.inv.slot': 'Слот',
        'piece.inv.empty_slot': 'Пусто',
        // FIX: was missing in all 3 languages (index.html:357 — "stash is
        // empty" message). Value taken from index.html's own pre-i18n
        // fallback text.
        'piece.inv.empty': 'Сундук пуст.',
        'piece.inv.click_equip': 'Кликните для экипировки',
        'piece.inv.not_allowed': 'Не подходит для',
        'piece.inv.no_slots': 'Нет слотов',
        'piece.inv.equip': 'Экипировать',
        'piece.inv.btn.remove': 'Убрать фигуру с доски',

        // Run Status
        'run.boss': 'БОСС',
        'run.round': 'Раунд',
        'run.creative_bot': 'Творческий vs Бот',
        'run.creative_pvp': 'Творческий PvP',
        'run.classic': 'Классика',

        // Language switcher
        'lang.title': 'Язык / Language',
        'lang.ru': '🇷🇺 Русский',
        'lang.en': '🇬🇧 English',
        'lang.es': '🇪🇸 Español',

        'surrender.title': 'Сдаться?',
        'surrender.text': 'Вы уверены? Это засчитается как поражение.',
        'surrender.confirm': 'Сдаться',
        'surrender.cancel': 'Отмена',
        'settings.title': 'Настройки',
        'settings.tutorial': 'Обучение',
        'settings.start_tutorial': 'Запустить обучение',
        'settings.close': 'Закрыть',

        // FIX: added while auditing index.html — a systematic scan (every
        // Cyrillic string inside a tag with no data-i18n attribute) found
        // 42 hits. Most of the Raid mode UI and the entire Friend Mode
        // lobby modal were never touched by applyLocalization() OR by any
        // window.t() call in app.js — they show this Russian text
        // regardless of the selected language. See index.html and app.js
        // for the corresponding fixes (app.js also gained
        // data-i18n-title support for tooltip attributes, which
        // data-i18n alone cannot reach since it only sets innerHTML).
        'game.player.you': 'Игрок',
        'menu.raid': 'Рейд',
        'menu.raid_stash': 'Схрон',
        'promotion.title': 'Превращение пешки',
        'test.drive_label': 'Тест-Драйв',
        'test.drive_hint': '(бесконечные ресурсы)',
        'piece.inv.hover_title': 'Инвентарь фигуры',
        'friend.create_room': 'Создать комнату',
        'friend.or': 'или',
        'friend.room_code_placeholder': 'Код комнаты',
        'friend.join_room_btn': 'Войти',
        'friend.your_code_text': 'Твой код комнаты — отправь другу:',
        'friend.waiting_text': 'Ожидание подключения друга...',
        'friend.ready_btn': 'Готов к расстановке!',
        'friend.waiting_second_player': 'Ждём второго игрока...',
        'friend.ready_count': '{count}/2 игроков готовы',
        'friend.you_play_as_white': 'Вы играете за Белых!',
        'friend.you_play_as_black': 'Вы играете за Чёрных!',
        'raid.faction.title': 'Выбор Фракции',
        'raid.faction.subtitle': 'Кем вы пойдёте в рейд?',
        'raid.faction.pmc.name': 'ЧВК',
        'raid.faction.pmc.desc': 'Элитный боец. Играете <strong>белыми</strong>. Снаряжение из вашего схрона.',
        'raid.faction.pmc.tag': 'PMC &#8226; Белые',
        'raid.faction.scav.name': 'Дикий',
        'raid.faction.scav.desc': 'Мародёр. Играете <strong>чёрными</strong>. Случайный набор фигур. Лутаете врагов.',
        'raid.faction.scav.tag': 'SCAV &#8226; Чёрные',
        'raid.stash.title': 'Схрон',
        'raid.stash.subtitle': 'Ваши трофеи из рейдов',
        'raid.stash.pieces_title': 'Запасные фигуры',
        'raid.stash.pieces_empty': 'Нет запасных фигур',
        'raid.stash.items_title': 'Предметы',
        'raid.stash.items_empty': 'Схрон пуст. Сыграйте рейд!',
        'raid.loot.title': 'Рейд завершён!',
        'raid.loot.subtitle': 'Выберите до 3 предметов для схрона',
        'raid.loot.confirm_btn': 'Забрать в схрон',
        'raid.loot.skip_btn': 'Выйти без лута',
    },

    en: {
        // Menu
        'menu.title': 'Chess',
        'menu.subtitle': 'Place your pieces. Beat the machine.',
        'menu.run': 'Start Run (Roguelike)',
        'menu.free': 'Free Play',
        'menu.mirror': 'Mirror Match',
        'menu.creative': 'Creative Mode',
        'menu.editor': 'Editor',
        'menu.difficulty': 'AI Difficulty',
        'menu.friend': 'Play with a Friend',
        'menu.continue.round': 'Continue Run (Round {round})',

        'diff.very_easy': '🐣 Very Easy',
        'diff.easy': '🟢 Easy',
        'diff.normal': '🔵 Normal',
        'diff.hard': '🔴 Hard',
        'diff.crazy': '🤪 Crazy',

        'diff.desc.very_easy': '🐣 AI makes almost random moves. Great for beginners!',
        'diff.desc.easy': '🟢 AI thinks shallowly. Easy to learn.',
        'diff.desc.normal': '🔵 Standard opponent. Thinks well and plays decently.',
        'diff.desc.hard': '🔴 AI calculates 4 moves ahead. A serious challenge.',
        'diff.desc.crazy': '🤪 AI deliberately makes the WORST moves. Plays to lose!',

        'creative.title': 'Select Creative Mode format',
        'creative.pvbot': '🤖 Play vs Bot',
        'creative.pvp': '👥 Play vs Friend (PvP)',
        'creative.cancel': 'Cancel',

        'setup.army': 'Your Army',
        'setup.army.white': 'White — Your Army',
        'setup.army.black': 'Black — Your Army',
        'setup.army.creative': 'Your Army (Creative)',
        'setup.army_hint': 'Pieces to place',
        'setup.stash': 'Item Stash',
        'setup.stash_hint': 'Drag onto your pieces or click a piece',
        'setup.pvp_black_turn': '♛ Second player, place your pieces',
        'setup.pvp_black_hint': 'Place the black pieces on the top squares, then press “Start game”',
        'setup.btn.standard': '♟ Standard',
        'setup.btn.clear': '✕ Clear',
        'presets.title': 'Presets',
        'presets.save': '💾 Save',
        'presets.hint': 'Saved pieces (type + inventory). Save or apply a preset from the piece window.',
        'presets.hint_piece': 'Save this piece\'s type and inventory, or apply a saved preset',
        'setup.btn.edit_black': 'Edit Black',
        'setup.btn.edit_white': 'Edit White',
        'setup.warning': 'Place at least one king!',
        'setup.btn.start': 'TO BATTLE ⚔️',
        'setup.btn.back': 'Back',

        'game.btn.undo': '↩ Undo move',
        'game.btn.surrender': 'Surrender',
        'game.status.white_turn': '⚪ White\'s Turn',
        'game.status.black_turn': '⚫ Black\'s Turn',
        'game.status.white_check': '⚪ Check to White!',
        'game.status.black_check': '⚫ Check to Black!',
        'game.status.white_win': '⚪ White Wins!',
        'game.status.black_win': '⚫ Black Wins',
        'game.status.draw': 'Draw!',
        'game.status.thinking': 'AI is thinking...',
        'game.history': 'Move History',
        'game.player.black': 'Black',
        'game.player.opponent': 'Opponent',

        'shop.title': 'Merchant',
        'shop.subtitle': 'Strengthen your army before the next battle!',
        'shop.items_title': 'Items',
        'shop.stash': 'Your stash (click to sell)',
        'shop.btn.continue': 'Continue Run ➡',
        'shop.msg.full': 'Stash is full (99/99)!',
        'shop.msg.sell_for': 'Sell for {price} 🪙',
        'shop.msg.sell_confirm': 'Sell {name} for {price} 🪙?',

        'gameover.title.win': 'Victory!',
        'gameover.title.lose': 'Defeat',
        'gameover.title.draw': 'Draw',
        'gameover.text.win': 'Checkmate! You beat the computer!',
        'gameover.text.lose': 'Checkmate. The computer won.',
        'gameover.text.stalemate': 'Stalemate!',
        'gameover.text.50move': '50-move rule',
        'gameover.text.material': 'Insufficient material',
        'gameover.text.repetition': 'Draw by repetition',
        'gameover.btn.shop': '🛒 To Shop',
        'gameover.btn.menu': '🏠 Main Menu',
        'gameover.btn.restart': '🔄 Restart',
        'gameover.run.win.title': 'Run Victory!',
        'gameover.run.win.text': 'You defeated all enemies! Gold: {gold} 🪙',
        'gameover.round.win.title': 'Round Won!',
        'gameover.round.win.text': 'for winning.\nGoing to the merchant...',
        'gameover.run.lose': 'Your army was destroyed. The run is over.',
        'gameover.recruit': 'You captured {count} enemy pieces!',

        'piece.king': 'King',
        'piece.queen': 'Queen',
        'piece.rook': 'Rook',
        'piece.bishop': 'Bishop',
        'piece.knight': 'Knight',
        'piece.pawn': 'Pawn',
        'piece.inv.subtitle.equipped': 'Equipped Items',
        'piece.inv.subtitle.slots': 'Equipment Slots ({count}/3)',
        'piece.inv.slot': 'Slot',
        'piece.inv.empty_slot': 'Empty',
        'piece.inv.empty': 'Stash is empty.',
        'piece.inv.click_equip': 'Click to equip',
        'piece.inv.not_allowed': 'Not allowed for',
        'piece.inv.no_slots': 'No slots available',
        'piece.inv.equip': 'Equip',
        'piece.inv.btn.remove': 'Remove piece from board',

        'run.boss': 'BOSS',
        'run.round': 'Round',
        'run.creative_bot': 'Creative vs Bot',
        'run.creative_pvp': 'Creative PvP',
        'run.classic': 'Classic',

        'lang.title': 'Language / Язык',
        'lang.ru': '🇷🇺 Russian',
        'lang.en': '🇬🇧 English',
        'lang.es': '🇪🇸 Spanish',

        'surrender.title': 'Surrender?',
        'surrender.text': 'Are you sure? This will count as a defeat.',
        'surrender.confirm': 'Surrender',
        'surrender.cancel': 'Cancel',
        'settings.title': 'Settings',
        'settings.tutorial': 'Tutorial',
        'settings.start_tutorial': 'Start Tutorial',
        'settings.close': 'Close',

        'game.player.you': 'Player',
        'menu.raid': 'Raid',
        'menu.raid_stash': 'Stash',
        'promotion.title': 'Pawn Promotion',
        'test.drive_label': 'Test Drive',
        'test.drive_hint': '(unlimited resources)',
        'piece.inv.hover_title': 'Piece Inventory',
        'friend.create_room': 'Create Room',
        'friend.or': 'or',
        'friend.room_code_placeholder': 'Room Code',
        'friend.join_room_btn': 'Join',
        'friend.your_code_text': 'Your room code — send it to your friend:',
        'friend.waiting_text': 'Waiting for friend to join...',
        'friend.ready_btn': 'Ready to Set Up!',
        'friend.waiting_second_player': 'Waiting for the other player...',
        'friend.ready_count': '{count}/2 players ready',
        'friend.you_play_as_white': 'You are playing White!',
        'friend.you_play_as_black': 'You are playing Black!',
        'raid.faction.title': 'Choose Your Faction',
        'raid.faction.subtitle': 'Who will you raid as?',
        'raid.faction.pmc.name': 'PMC',
        'raid.faction.pmc.desc': 'Elite operator. You play <strong>White</strong>. Gear comes from your stash.',
        'raid.faction.pmc.tag': 'PMC &#8226; White',
        'raid.faction.scav.name': 'Scav',
        'raid.faction.scav.desc': 'Scavenger. You play <strong>Black</strong>. Random loadout. Loot your enemies.',
        'raid.faction.scav.tag': 'SCAV &#8226; Black',
        'raid.stash.title': 'Stash',
        'raid.stash.subtitle': 'Your loot from past raids',
        'raid.stash.pieces_title': 'Spare Pieces',
        'raid.stash.pieces_empty': 'No spare pieces',
        'raid.stash.items_title': 'Items',
        'raid.stash.items_empty': 'Stash is empty. Play a raid!',
        'raid.loot.title': 'Raid Complete!',
        'raid.loot.subtitle': 'Choose up to 3 items for your stash',
        'raid.loot.confirm_btn': 'Take to Stash',
        'raid.loot.skip_btn': 'Leave Without Loot',
    },

    es: {
        // Menu
        'menu.title': 'Ajedrez',
        'menu.subtitle': 'Coloca tus piezas. Vence a la máquina.',
        'menu.run': 'Iniciar Carrera (Roguelike)',
        'menu.free': 'Juego Libre',
        'menu.mirror': 'Partida Espejo',
        'menu.creative': 'Modo Creativo',
        'menu.editor': 'Editor',
        'menu.difficulty': 'Dificultad de la IA',
        'menu.friend': 'Jugar con un Amigo',
        'menu.continue.round': 'Continuar Carrera (Ronda {round})',

        'diff.very_easy': '🐣 Muy Fácil',
        'diff.easy': '🟢 Fácil',
        'diff.normal': '🔵 Normal',
        'diff.hard': '🔴 Difícil',
        'diff.crazy': '🤪 Loco',

        'diff.desc.very_easy': '🐣 La IA hace movimientos casi aleatorios. ¡Genial para principiantes!',
        'diff.desc.easy': '🟢 La IA piensa superficialmente. Fácil de aprender.',
        'diff.desc.normal': '🔵 Oponente estándar. Piensa bien y juega decentemente.',
        'diff.desc.hard': '🔴 La IA calcula 4 movimientos por adelantado. Un desafío serio.',
        'diff.desc.crazy': '🤪 La IA hace deliberadamente los PEORES movimientos. ¡Juega a perder!',

        'creative.title': 'Selecciona el formato del Modo Creativo',
        'creative.pvbot': '🤖 Jugar contra Bot',
        'creative.pvp': '👥 Jugar contra Amigo (PvP)',
        'creative.cancel': 'Cancelar',

        'setup.army': 'Tu Ejército',
        'setup.army.white': 'Blancas — Tu Ejército',
        'setup.army.black': 'Negras — Tu Ejército',
        'setup.army.creative': 'Tu Ejército (Creativo)',
        'setup.army_hint': 'Piezas para colocar',
        'setup.stash': 'Alijo de Objetos',
        'setup.stash_hint': 'Arrastra a tus piezas o haz clic en una',
        'setup.pvp_black_turn': '♛ Segundo jugador, coloca tus piezas',
        'setup.pvp_black_hint': 'Coloca las piezas negras en las casillas superiores y pulsa «Iniciar partida»',
        'setup.btn.standard': '♟ Estándar',
        'setup.btn.clear': '✕ Borrar',
        'presets.title': 'Ajustes',
        'presets.save': '💾 Guardar',
        'presets.hint': 'Piezas guardadas (tipo + inventario). Guarda o aplica un preset desde la ventana de la pieza.',
        'presets.hint_piece': 'Guarda el tipo y el inventario de esta pieza, o aplica un preset guardado',
        'setup.btn.edit_black': 'Editar Negras',
        'setup.btn.edit_white': 'Editar Blancas',
        'setup.warning': '¡Coloca al menos un rey!',
        'setup.btn.start': 'A LA BATALLA ⚔️',
        'setup.btn.back': 'Volver',

        'game.btn.undo': '↩ Deshacer mov.',
        'game.btn.surrender': 'Rendirse',
        'game.status.white_turn': '⚪ Turno de Blancas',
        'game.status.black_turn': '⚫ Turno de Negras',
        'game.status.white_check': '⚪ ¡Jaque a Blancas!',
        'game.status.black_check': '⚫ ¡Jaque a Negras!',
        'game.status.white_win': '⚪ ¡Ganan las Blancas!',
        'game.status.black_win': '⚫ Ganan las Negras',
        'game.status.draw': '¡Empate!',
        'game.status.thinking': 'La IA está pensando...',
        'game.history': 'Historial',
        'game.player.black': 'Negras',
        'game.player.opponent': 'Oponente',

        'shop.title': 'Mercader',
        'shop.subtitle': '¡Refuerza tu ejército antes de la próxima batalla!',
        'shop.items_title': 'Objetos',
        'shop.stash': 'Tu alijo (clic para vender)',
        'shop.btn.continue': 'Continuar ➡',
        'shop.msg.full': '¡Alijo lleno (99/99)!',
        'shop.msg.sell_for': 'Vender por {price} 🪙',
        'shop.msg.sell_confirm': '¿Vender {name} por {price} 🪙?',

        'gameover.title.win': '¡Victoria!',
        'gameover.title.lose': 'Derrota',
        'gameover.title.draw': 'Empate',
        'gameover.text.win': '¡Jaque Mate! ¡Venciste a la computadora!',
        'gameover.text.lose': 'Jaque Mate. La computadora ganó.',
        'gameover.text.stalemate': '¡Ahogado!',
        'gameover.text.50move': 'Regla de 50 mov.',
        'gameover.text.material': 'Material insuficiente',
        'gameover.text.repetition': 'Tablas por repetición',
        'gameover.btn.shop': '🛒 A la Tienda',
        'gameover.btn.menu': '🏠 Menu Principal',
        'gameover.btn.restart': '🔄 Reiniciar',
        'gameover.run.win.title': '¡Victoria de la Carrera!',
        'gameover.run.win.text': '¡Derrotaste a todos los enemigos! Oro: {gold} 🪙',
        'gameover.round.win.title': '¡Ronda Ganada!',
        'gameover.round.win.text': 'por ganar.\nYendo al mercader...',
        'gameover.run.lose': 'Tu ejército fue destruido. La carrera ha terminado.',
        'gameover.recruit': '¡Capturaste {count} piezas enemigas!',

        'piece.king': 'Rey',
        'piece.queen': 'Reina',
        'piece.rook': 'Torre',
        'piece.bishop': 'Alfil',
        'piece.knight': 'Caballo',
        'piece.pawn': 'Peón',
        'piece.inv.subtitle.equipped': 'Objetos Equipados',
        'piece.inv.subtitle.slots': 'Ranuras ({count}/3)',
        'piece.inv.slot': 'Ranura',
        'piece.inv.empty_slot': 'Vacío',
        'piece.inv.empty': 'El alijo está vacío.',
        'piece.inv.click_equip': 'Clic para equipar',
        'piece.inv.not_allowed': 'No válido para',
        'piece.inv.no_slots': 'Sin ranuras',
        'piece.inv.equip': 'Equipar',
        'piece.inv.btn.remove': 'Quitar pieza del tablero',

        'run.boss': 'JEFE',
        'run.round': 'Ronda',
        'run.creative_bot': 'Creativo vs Bot',
        'run.creative_pvp': 'Creativo PvP',
        'run.classic': 'Clásico',

        'lang.title': 'Idioma / Language',
        'lang.ru': '🇷🇺 Ruso',
        'lang.en': '🇬🇧 Inglés',
        'lang.es': '🇪🇸 Español',

        'surrender.title': '¿Rendirse?',
        'surrender.text': '¿Estás seguro? Esto contará como derrota.',
        'surrender.confirm': 'Rendirse',
        'surrender.cancel': 'Cancelar',
        'settings.title': 'Ajustes',
        'settings.tutorial': 'Tutorial',
        'settings.start_tutorial': 'Iniciar Tutorial',
        'settings.close': 'Cerrar',

        'game.player.you': 'Jugador',
        'menu.raid': 'Asalto',
        'menu.raid_stash': 'Alijo',
        'promotion.title': 'Coronación de Peón',
        'test.drive_label': 'Prueba de Manejo',
        'test.drive_hint': '(recursos ilimitados)',
        'piece.inv.hover_title': 'Inventario de la Pieza',
        'friend.create_room': 'Crear Sala',
        'friend.or': 'o',
        'friend.room_code_placeholder': 'Código de Sala',
        'friend.join_room_btn': 'Entrar',
        'friend.your_code_text': 'Tu código de sala — envíaselo a tu amigo:',
        'friend.waiting_text': 'Esperando a que tu amigo se una...',
        'friend.ready_btn': '¡Listo para Configurar!',
        'friend.waiting_second_player': 'Esperando al otro jugador...',
        'friend.ready_count': '{count}/2 jugadores listos',
        'friend.you_play_as_white': '¡Juegas con Blancas!',
        'friend.you_play_as_black': '¡Juegas con Negras!',
        'raid.faction.title': 'Elige tu Facción',
        'raid.faction.subtitle': '¿Con quién harás el asalto?',
        'raid.faction.pmc.name': 'PMC',
        'raid.faction.pmc.desc': 'Operador de élite. Juegas con <strong>Blancas</strong>. El equipo viene de tu alijo.',
        'raid.faction.pmc.tag': 'PMC &#8226; Blancas',
        'raid.faction.scav.name': 'Scav',
        'raid.faction.scav.desc': 'Carroñero. Juegas con <strong>Negras</strong>. Equipo aleatorio. Saquea a tus enemigos.',
        'raid.faction.scav.tag': 'SCAV &#8226; Negras',
        'raid.stash.title': 'Alijo',
        'raid.stash.subtitle': 'Tu botín de asaltos anteriores',
        'raid.stash.pieces_title': 'Piezas de Repuesto',
        'raid.stash.pieces_empty': 'No hay piezas de repuesto',
        'raid.stash.items_title': 'Objetos',
        'raid.stash.items_empty': 'El alijo está vacío. ¡Juega un asalto!',
        'raid.loot.title': '¡Asalto Completado!',
        'raid.loot.subtitle': 'Elige hasta 3 objetos para tu alijo',
        'raid.loot.confirm_btn': 'Llevar al Alijo',
        'raid.loot.skip_btn': 'Salir sin Botín',
    }
};

window.t = function(key) {
    const lang = localStorage.getItem('chess_lang') || 'ru';
    return (window.i18n[lang] && window.i18n[lang][key]) ||
           (window.i18n['ru'] && window.i18n['ru'][key]) ||
           key;
};

window.t_obj = function(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    const lang = localStorage.getItem('chess_lang') || 'ru';
    return obj[lang] || obj['en'] || obj['ru'] || '';
};

window.t_item = function(item, field) {
    if (!item) return '';
    const lang = localStorage.getItem('chess_lang') || 'ru';

    // Support if field itself is a translated object { ru: "...", en: "..." }
    if (item[field] && typeof item[field] === 'object') {
        return item[field][lang] || item[field]['en'] || item[field]['ru'] || '';
    }

    return item[field] || '';
};
