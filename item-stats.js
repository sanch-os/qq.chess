<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="description" content="Шахматы с произвольной расстановкой фигур и ИИ-противником">
    <title>Шахматы — Свободная расстановка</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css?v=7">
    <!-- mobile-drag-drop polyfill removed: drag & drop now uses the Pointer Events API -->
    <script src="locales.js?v=3"></script>
</head>
<body>
    <!-- ===== MAIN MENU SCREEN ===== -->
    <div id="screen-menu" class="screen active">
        <div class="menu-bg-pieces" aria-hidden="true"></div>
        <!-- FIX: title was hardcoded English ("Settings") regardless of
             language; data-i18n-title (see app.js's applyLocalization())
             reuses the existing settings.title key. -->
        <button id="btn-settings" class="btn btn-icon-only" style="position: absolute; top: 20px; right: 20px; font-size: 1.5rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 50%; width: 45px; height: 45px; cursor: pointer; transition: all 0.2s;" data-i18n-title="settings.title" title="Settings">&#9881;&#65039;</button>
        <div class="menu-container">
            <h1 class="menu-title">
                <span class="title-icon">&#9818;</span>
                <span data-i18n="menu.title">Шахматы</span>
            </h1>
            <p class="menu-subtitle" data-i18n="menu.subtitle">Расставь фигуры. Обыграй машину.</p>
            
            <div class="language-selector" style="text-align:center; margin-bottom: 20px;">
                <label data-i18n="lang.title" style="display:block; margin-bottom:8px; font-size:0.85em; color:var(--text-muted);">Язык / Language</label>
                <div style="display:flex; justify-content:center; gap:8px;">
                    <button class="btn btn-outline btn-small lang-btn" data-lang="ru">&#127479;&#127482;</button>
                    <button class="btn btn-outline btn-small lang-btn" data-lang="en">&#127468;&#127463;</button>
                    <button class="btn btn-outline btn-small lang-btn" data-lang="es">&#127466;&#127480;</button>
                </div>
            </div>

            <div class="menu-buttons">
                <button id="btn-new-run" class="btn btn-primary btn-large" style="width:100%; margin-bottom:10px;">
                    <span class="btn-icon">&#127968;</span> <span data-i18n="menu.run">Начать забег (Roguelike)</span>
                </button>

                <!-- Continue-run button: hidden unless a valid run save
                     exists in localStorage (app.js's updateContinueRunButton
                     toggles it). The .continue-run-round span is filled by
                     JS via the menu.continue.round locale key. -->
                <button id="btn-continue-run" class="btn btn-large" style="width:100%; margin-bottom:10px; display:none; background: linear-gradient(135deg, rgba(72, 187, 120, 0.2), rgba(72, 187, 120, 0.1)); border-color: rgba(72, 187, 120, 0.4);">
                    <span class="btn-icon">&#9654;&#65039;</span> <span data-i18n="menu.continue">Продолжить забег</span> <span class="continue-run-round"></span>
                </button>

                <!-- RAID BUTTON -->
                <!-- FIX: "Рейд" had no data-i18n — permanently Russian
                     regardless of language selection (found via a
                     systematic scan of the whole file, see AUDIT_PROTOCOL.md). -->
                <button id="btn-raid" class="btn btn-large raid-btn" style="width:100%; margin-bottom:10px;">
                    <span class="btn-icon">&#127919;</span> <span data-i18n="menu.raid">Рейд</span>
                </button>

                <!-- FRIEND MODE BUTTON -->
                <button id="btn-friend-mode" class="btn btn-large" style="width:100%; margin-bottom:10px; background: linear-gradient(135deg, rgba(66, 153, 225, 0.2), rgba(66, 153, 225, 0.1)); border-color: rgba(66, 153, 225, 0.4);">
                    <span class="btn-icon">&#128101;</span> <span data-i18n="menu.friend">Игра с другом</span>
                </button>

                <div class="menu-buttons-row">
                    <button id="btn-mirror-match" class="btn btn-secondary">
                        <span class="btn-icon">&#129710;</span> <span data-i18n="menu.mirror">Зеркальный бой</span>
                    </button>
                    <button id="btn-creative" class="btn btn-secondary" style="background: linear-gradient(135deg, rgba(157,147,250,0.15), rgba(240,192,72,0.15)); border-color: rgba(157,147,250,0.4);">
                        <span class="btn-icon">&#127912;</span> <span data-i18n="menu.creative">Творческий</span>
                    </button>
                </div>
                <div style="display:flex; gap:10px;">
                    <a href="editor.html" target="_blank" class="btn btn-outline" style="text-decoration:none; flex:1; text-align:center;">
                        <span class="btn-icon">&#128736;</span> <span data-i18n="menu.editor">Редактор</span>
                    </a>
                    <!-- FIX: "Схрон" had no data-i18n — same gap as btn-raid above. -->
                    <button id="btn-raid-stash" class="btn btn-outline" style="flex:1;">
                        <span class="btn-icon">&#127890;</span> <span data-i18n="menu.raid_stash">Схрон</span>
                    </button>
                </div>
            </div>
            <div class="difficulty-selector">
                <label data-i18n="menu.difficulty">Сложность ИИ</label>
                <div class="difficulty-options">
                    <button class="diff-btn" data-mode="very_easy" data-i18n="diff.very_easy" title="ИИ делает случайные ходы">&#128036; Очень легко</button>
                    <button class="diff-btn" data-mode="easy"      data-i18n="diff.easy" title="ИИ думает поверхностно">&#129001; Легко</button>
                    <button class="diff-btn active" data-mode="normal" data-i18n="diff.normal" title="Стандартная сложность">&#128309; Средне</button>
                    <button class="diff-btn" data-mode="hard"     data-i18n="diff.hard" title="ИИ просчитывает глубже">&#128308; Сложно</button>
                    <button class="diff-btn diff-btn-crazy" data-mode="crazy" data-i18n="diff.crazy" title="ИИ специально делает худшие ходы">&#129322; Сумасшедший</button>
                </div>
                <p id="diff-description" class="diff-description" data-i18n="diff.desc.normal">Стандартный противник. Хорошо думает и неплохо играет.</p>
            </div>
        </div>
    </div>

    <!-- ===== SETUP SCREEN ===== -->
    <div id="screen-setup" class="screen">
        <div class="setup-layout">
            <!-- Inventory Panel -->
            <aside class="inventory-panel glass-panel">
                <h2 class="panel-title" data-i18n="setup.army">Ваша Армия</h2>
                <p class="panel-hint" data-i18n="setup.army_hint">Фигуры для расстановки</p>
                <div id="inventory" class="inventory-grid"></div>



                <!-- Test Mode Toggle (shown in raid setup or friend mode) -->
                <!-- FIX: this label's text had no data-i18n anywhere —
                     permanently Russian. Emoji kept outside the
                     translated span so it survives the innerHTML swap. -->
                <div id="test-toggle-wrap" style="display:none; margin-top:10px;">
                    <label class="raid-test-toggle-label">
                        <input type="checkbox" id="test-mode-toggle">
                        <span class="raid-test-toggle-track">
                            <span class="raid-test-toggle-thumb"></span>
                        </span>
                        <span class="raid-test-toggle-text">🧪 <span data-i18n="test.drive_label">Тест-Драйв</span> <small data-i18n="test.drive_hint">(бесконечные ресурсы)</small></span>
                    </label>
                </div>

                <div class="inventory-actions" style="margin-top:12px; flex-shrink:0;">
                    <div style="display:flex; gap:8px;">
                        <button id="btn-standard-setup" class="btn btn-small btn-accent" style="flex:1;" data-i18n="setup.btn.standard">
                            &#9823; Стандарт
                        </button>
                        <button id="btn-clear-board" class="btn btn-small btn-outline" style="flex:1;" data-i18n="setup.btn.clear">
                            &#10005; Очистить
                        </button>
                    </div>
                    <button id="btn-setup-black" class="btn btn-small btn-secondary" style="display:none; width:100%; margin-top:8px;" data-i18n="setup.btn.edit_black">
                        &#128260; Редактировать Черных
                    </button>
                </div>

                <!-- ===== Пресеты фигур (тип + инвентарь) ===== -->
                <div class="presets-panel" id="presets-panel">
                    <div class="presets-header">
                        <h2 class="panel-title" style="margin:0;" data-i18n="presets.title">Пресеты</h2>
                    </div>
                    <p class="panel-hint" data-i18n="presets.hint">Сохранённые фигуры (тип + инвентарь). Сохранить или применить пресет можно в окне фигуры.</p>
                    <div id="presets-list" class="presets-list"></div>
                </div>

                <!-- Stash floating panel — sits inside aside for horizontal mode, but stretches over board in vertical mode -->
                <div class="stash-floating-panel">
                    <h2 class="panel-title" data-i18n="setup.stash">Сундук Предметов</h2>
                    <p class="panel-hint" data-i18n="setup.stash_hint">Перетащите на ваши фигуры или кликните фигуру</p>
                    <div id="player-stash-setup" class="stash-grid"></div>
                </div>
            </aside>

            <!-- Board Area -->
            <main class="board-area">
                <div class="board-frame">
                    <div class="board-labels-top">
                        <span>a</span><span>b</span><span>c</span><span>d</span>
                        <span>e</span><span>f</span><span>g</span><span>h</span>
                    </div>
                    <div class="board-with-labels">
                        <div class="board-labels-left">
                            <span>8</span><span>7</span><span>6</span><span>5</span>
                            <span>4</span><span>3</span><span>2</span><span>1</span>
                        </div>
                        <div id="board-setup" class="chess-board"></div>
                        <div class="board-labels-right">
                            <span>8</span><span>7</span><span>6</span><span>5</span>
                            <span>4</span><span>3</span><span>2</span><span>1</span>
                        </div>
                    </div>
                    <div class="board-labels-bottom">
                        <span>a</span><span>b</span><span>c</span><span>d</span>
                        <span>e</span><span>f</span><span>g</span><span>h</span>
                    </div>
                </div>
                <div class="setup-controls">
                    <button id="btn-start-game" class="btn btn-primary btn-large" disabled>
                        <span class="btn-icon">&#9654;</span> <span data-i18n="setup.btn.start">Начать игру</span>
                    </button>
                    <button id="btn-back-menu" class="btn btn-outline btn-small" data-i18n="setup.btn.back">
                        &#8592; Назад в меню
                    </button>
                    <p id="setup-warning" class="warning-text" data-i18n="setup.warning">Необходимо разместить короля!</p>
                </div>
            </main>
        </div>
    </div>

    <!-- ===== SHOP SCREEN ===== -->
    <div id="screen-shop" class="screen">
        <div class="shop-layout glass-panel" style="width: 800px; max-width: 90vw; margin: 50px auto; padding: 30px;">
            <h1 class="shop-title" style="margin-top:0; color:var(--accent-color);" data-i18n="shop.title">Торговец</h1>
            <p class="shop-subtitle"><span data-i18n="shop.subtitle">Подготовьте свою армию перед следующим боем!</span> <strong id="shop-gold-display" class="gold-text">0</strong> &#129449;</p>
            
            <div class="shop-columns" style="display:flex; gap:30px; margin-top:20px;">
                <div class="shop-items-area" style="flex:2;">
                    <h3 style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">Товары</h3>
                    <div id="shop-items" class="shop-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:15px;"></div>
                </div>
                <div class="shop-stash-area" style="flex:1;">
                    <h3 style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;" data-i18n="shop.stash">Ваш сундук</h3>
                    <div id="shop-stash" class="stash-grid" style="display:flex; flex-wrap:wrap; gap:10px;"></div>
                </div>
            </div>

            <div class="shop-controls" style="margin-top:30px; text-align:right;">
                <button id="btn-leave-shop" class="btn btn-primary btn-large" data-i18n="shop.btn.continue">К следующему бою &#10140;</button>
            </div>
        </div>
    </div>

    <!-- ===== GAME SCREEN ===== -->
    <div id="screen-game" class="screen">
        <div class="game-layout">
            <!-- Left Info Panel -->
            <aside class="info-panel glass-panel">
                <div class="player-card opponent">
                    <div class="player-avatar">&#9818;</div>
                    <div class="player-info">
                        <!-- Note: this label is overwritten dynamically by
                             app.js (window.t('game.player.black'/'opponent'))
                             before the screen is ever shown — the static
                             text here is just placeholder markup, not a
                             localization gap. -->
                        <span class="player-name">Компьютер</span>
                        <span id="black-captured" class="captured-pieces"></span>
                    </div>
                    <div id="black-timer" class="player-timer"></div>
                </div>

                <div id="game-status" class="game-status">
                    <span class="status-dot"></span>
                    <span class="status-text">Ваш ход</span>
                </div>

                <div class="player-card player">
                    <div class="player-avatar">&#9814;</div>
                    <div class="player-info">
                        <!-- FIX: unlike the opponent label above, this one
                             was NEVER touched by app.js — no dynamic
                             update, no data-i18n. It permanently showed
                             the English word "Player" regardless of the
                             selected language, on every single game. -->
                        <span class="player-name" data-i18n="game.player.you">Player</span>
                        <div class="run-stats" style="font-size:0.85em; margin:5px 0;">
                            <span id="run-gold" class="gold-text" style="color:#f0c048; font-weight:bold;">0 &#129449;</span> | 
                            <span id="run-round" style="color:#a0a0b0;"></span>
                        </div>
                        <span id="white-captured" class="captured-pieces"></span>
                    </div>
                    <div id="white-timer" class="player-timer"></div>
                </div>

                <div class="game-actions">
                    <button id="btn-undo" class="btn btn-small btn-outline" data-i18n="game.btn.undo">&#8617; Отменить ход</button>
                    <button id="btn-resign" class="btn btn-small btn-danger" data-i18n="game.btn.surrender">&#127987; Сдаться</button>
                    <button id="btn-new-game-2" class="btn btn-small btn-accent" style="display:none;"></button>
                </div>
            </aside>

            <!-- Game Board -->
            <main class="board-area">
                <div class="board-frame">
                    <div class="board-labels-top">
                        <span>a</span><span>b</span><span>c</span><span>d</span>
                        <span>e</span><span>f</span><span>g</span><span>h</span>
                    </div>
                    <div class="board-with-labels">
                        <div class="board-labels-left">
                            <span>8</span><span>7</span><span>6</span><span>5</span>
                            <span>4</span><span>3</span><span>2</span><span>1</span>
                        </div>
                        <div id="board-game" class="chess-board"></div>
                        <div class="board-labels-right">
                            <span>8</span><span>7</span><span>6</span><span>5</span>
                            <span>4</span><span>3</span><span>2</span><span>1</span>
                        </div>
                    </div>
                    <div class="board-labels-bottom">
                        <span>a</span><span>b</span><span>c</span><span>d</span>
                        <span>e</span><span>f</span><span>g</span><span>h</span>
                    </div>
                </div>
            </main>

            <!-- Move History + In-Game Stash -->
            <aside class="history-panel glass-panel">
                <h2 class="panel-title" data-i18n="game.history">История ходов</h2>
                <div id="move-history" class="move-history"></div>

                <div class="ingame-stash-section" id="ingame-stash-section" style="display:none;">
                    <h3 class="panel-title" style="font-size:0.85rem; margin-top:14px; padding-top:12px; border-top:1px solid var(--glass-border);" data-i18n="setup.stash">&#127890; Сундук</h3>
                    <div id="ingame-stash" class="stash-grid" style="max-height:180px;"></div>
                </div>
            </aside>
        </div>
    </div>

    <!-- ===== GAME OVER MODAL ===== -->
    <div id="modal-gameover" class="modal-overlay">
        <div class="modal glass-panel">
            <div id="gameover-icon" class="modal-icon">&#9818;</div>
            <h2 id="gameover-title" class="modal-title"></h2>
            <p id="gameover-text" class="modal-text"></p>
            <div class="modal-buttons">
                <button id="btn-play-again" class="btn btn-primary"></button>
                <button id="btn-to-menu" class="btn btn-outline" data-i18n="gameover.btn.menu">В меню</button>
            </div>
        </div>
    </div>

    <!-- Surrender Confirm Modal -->
    <div id="modal-surrender" class="modal-overlay">
        <div class="modal glass-panel" style="max-width: 380px; text-align: center;">
            <div class="modal-icon" style="font-size: 2.5rem;">&#127987;&#65039;</div>
            <h2 class="modal-title" style="margin-bottom: 8px;" data-i18n="surrender.title">Сдаться?</h2>
            <p class="modal-text" data-i18n="surrender.text">Вы уверены? Это засчитается как поражение.</p>
            <div class="modal-buttons" style="margin-top: 20px;">
                <button id="btn-surrender-confirm" class="btn btn-danger">&#127987;&#65039; <span data-i18n="surrender.confirm">Сдаться</span></button>
                <button id="btn-surrender-cancel" class="btn btn-outline" data-i18n="surrender.cancel">Отмена</button>
            </div>
        </div>
    </div>

    <!-- ===== SETTINGS MODAL ===== -->
    <div id="modal-settings" class="modal-overlay">
        <div class="modal glass-panel" style="max-width: 400px; text-align: center;">
            <h2 class="modal-title" style="margin-bottom: 20px;" data-i18n="settings.title">Настройки</h2>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                    <span data-i18n="settings.tutorial" style="font-size: 1.1rem;">Обучение</span>
                    <label class="switch">
                        <input type="checkbox" id="setting-tutorial-toggle" checked>
                        <span class="slider round"></span>
                    </label>
                </div>
                <button id="btn-start-tutorial" data-i18n="settings.start_tutorial" style="width: 100%;">Запустить обучение</button>
            </div>

            <div class="modal-buttons">
                <button id="btn-settings-close" class="btn btn-primary" style="width: 100%;" data-i18n="settings.close">Закрыть</button>
            </div>
        </div>
    </div>

    <!-- Promotion Modal -->
    <div id="modal-promotion" class="modal-overlay">
        <div class="modal glass-panel promotion-modal">
            <!-- FIX: had no data-i18n — permanently Russian. -->
            <h2 class="modal-title" data-i18n="promotion.title">Превращение пешки</h2>
            <div id="promotion-choices" class="promotion-choices"></div>
        </div>
    </div>

    <!-- ===== PIECE INVENTORY MODAL ===== -->
    <div id="modal-piece-inv" class="modal-overlay">
        <div class="modal glass-panel piece-inv-modal">
            <!-- FIX: title attribute was hardcoded Russian; data-i18n-title
                 reuses the existing settings.close key ("Закрыть"/"Close"/"Cerrar"). -->
            <button id="piece-inv-close" class="piece-inv-close" data-i18n-title="settings.close" title="Закрыть">&times;</button>
            <div class="piece-inv-header">
                <span id="piece-inv-icon" class="piece-inv-icon">&#9812;</span>
                <div>
                    <h2 id="piece-inv-title" class="modal-title" style="margin:0;"></h2>
                    <span id="piece-inv-subtitle" class="piece-inv-subtitle"></span>
                </div>
            </div>

            <!-- Note: slot labels/"Пусто" below are placeholder markup,
                 immediately overwritten by renderPieceInventorySlots()
                 (app.js) using window.t('piece.inv.slot') /
                 window.t('piece.inv.empty_slot') — not a localization gap. -->
            <div class="piece-inv-slots" id="piece-inv-slots">
                <div class="piece-inv-slot" data-slot="0">
                    <div class="slot-label">Слот 1</div>
                    <div class="slot-content empty">Пусто</div>
                </div>
                <div class="piece-inv-slot" data-slot="1">
                    <div class="slot-label">Слот 2</div>
                    <div class="slot-content empty">Пусто</div>
                </div>
                <div class="piece-inv-slot" data-slot="2">
                    <div class="slot-label">Слот 3</div>
                    <div class="slot-content empty">Пусто</div>
                </div>
            </div>

            <div class="piece-inv-stash-section">
                <h3 class="piece-inv-stash-title" data-i18n="setup.stash">&#128230; Предметы в сундуке</h3>
                <div id="piece-inv-stash-list" class="piece-inv-stash-list"></div>
                <p id="piece-inv-stash-empty" class="piece-inv-empty-msg hidden" data-i18n="piece.inv.empty">Сундук пуст.</p>
            </div>

            <!-- ===== Пресеты фигуры: тип + инвентарь ===== -->
            <div class="piece-inv-preset-section" id="piece-inv-preset-section">
                <div class="presets-header" style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                    <h3 class="piece-inv-stash-title" style="margin:0;" data-i18n="presets.title">Пресеты</h3>
                    <button id="btn-save-preset" class="btn btn-small btn-accent" data-i18n="presets.save" title="Сохранить тип и инвентарь этой фигуры как пресет">&#128190; Сохранить</button>
                </div>
                <p class="panel-hint" data-i18n="presets.hint_piece">Сохраните тип и инвентарь этой фигуры или примените сохранённый пресет</p>
                <div id="piece-inv-presets-list" class="presets-list"></div>
            </div>

            <div class="piece-inv-actions">
                <button id="piece-inv-remove" class="btn btn-danger btn-small" data-i18n="piece.inv.btn.remove">&#128465; Убрать фигуру</button>
            </div>
        </div>
    </div>

    <!-- ===== CREATIVE MODE MODAL ===== -->
    <div id="modal-creative" class="modal-overlay">
        <div class="modal glass-panel" style="width:420px; max-width:90vw; text-align:center;">
            <div class="modal-icon" style="font-size:3.5rem;">&#127912;</div>
            <h2 class="modal-title" data-i18n="creative.title">Творческий режим</h2>
            <div class="modal-buttons" style="flex-direction:column; gap:12px; margin-top:20px;">
                <button id="btn-creative-pvbot" class="btn btn-primary btn-large" style="width:100%;" data-i18n="creative.pvbot">
                    &#129302; Против бота
                </button>
                <button id="btn-creative-pvp" class="btn btn-secondary btn-large" style="width:100%;" data-i18n="creative.pvp">
                    &#128101; Два игрока (офлайн)
                </button>
                <button id="btn-creative-cancel" class="btn btn-outline btn-small" style="margin-top:8px;" data-i18n="creative.cancel">
                    &#8592; Назад
                </button>
            </div>
        </div>
    </div>

    <!-- ===== RAID FACTION MODAL ===== -->
    <!-- FIX: this ENTIRE modal had zero data-i18n attributes — app.js only
         toggles its `.active` class, never touches any text inside it.
         Permanently Russian regardless of language, for the whole Raid
         mode faction-select flow. -->
    <div id="modal-raid" class="modal-overlay">
        <div class="modal glass-panel raid-faction-modal">
            <button class="piece-inv-close modal-close-x" id="btn-raid-modal-close">&times;</button>
            <div class="raid-modal-header">
                <div class="raid-modal-icon">&#127919;</div>
                <h2 class="modal-title" style="margin:8px 0 4px;" data-i18n="raid.faction.title">Выбор Фракции</h2>
                <p class="modal-text" style="margin:0; font-size:0.9rem; opacity:0.65;" data-i18n="raid.faction.subtitle">Кем вы пойдёте в рейд?</p>
            </div>
            <div class="raid-faction-cards">
                <button id="btn-raid-pmc" class="raid-faction-card pmc-card">
                    <div class="faction-badge">&#128737;&#65039;</div>
                    <div class="faction-name" data-i18n="raid.faction.pmc.name">ЧВК</div>
                    <div class="faction-desc" data-i18n="raid.faction.pmc.desc">Элитный боец. Играете <strong>белыми</strong>. Снаряжение из вашего схрона.</div>
                    <div class="faction-tag pmc-tag" data-i18n="raid.faction.pmc.tag">PMC &#8226; Белые</div>
                </button>
                <button id="btn-raid-scav" class="raid-faction-card scav-card">
                    <div class="faction-badge">&#128058;</div>
                    <div class="faction-name" data-i18n="raid.faction.scav.name">Дикий</div>
                    <div class="faction-desc" data-i18n="raid.faction.scav.desc">Мародёр. Играете <strong>чёрными</strong>. Случайный набор фигур. Лутаете врагов.</div>
                    <div class="faction-tag scav-tag" data-i18n="raid.faction.scav.tag">SCAV &#8226; Чёрные</div>
                </button>
            </div>
        </div>
    </div>

    <!-- ===== RAID STASH (TARKOV-STYLE) MODAL ===== -->
    <!-- FIX: same gap as the faction modal above — entirely untranslated. -->
    <div id="modal-raid-stash" class="modal-overlay">
        <div class="modal glass-panel raid-stash-modal">
            <button class="piece-inv-close modal-close-x" id="btn-raid-stash-close">&times;</button>
            <div class="raid-stash-header">
                <h2 class="modal-title" style="margin:0;">&#127890; <span data-i18n="raid.stash.title">Схрон</span></h2>
                <p style="margin:4px 0 0; font-size:0.85rem; opacity:0.6;" data-i18n="raid.stash.subtitle">Ваши трофеи из рейдов</p>
            </div>
            <div class="raid-stash-body">
                <!-- Left: Piece stash -->
                <div class="raid-stash-section">
                    <h3 class="raid-stash-section-title">&#9876;&#65039; <span data-i18n="raid.stash.pieces_title">Запасные фигуры</span></h3>
                    <div id="raid-stash-pieces" class="raid-piece-stash"></div>
                    <p id="raid-stash-pieces-empty" class="raid-stash-empty" data-i18n="raid.stash.pieces_empty">Нет запасных фигур</p>
                </div>
                <!-- Right: Item stash (Tarkov grid) -->
                <div class="raid-stash-section">
                    <h3 class="raid-stash-section-title">&#128230; <span data-i18n="raid.stash.items_title">Предметы</span></h3>
                    <div id="raid-stash-items" class="raid-item-grid"></div>
                    <p id="raid-stash-items-empty" class="raid-stash-empty" data-i18n="raid.stash.items_empty">Схрон пуст. Сыграйте рейд!</p>
                </div>
            </div>
        </div>
    </div>

    <!-- ===== RAID LOOT MODAL (post-game) ===== -->
    <!-- FIX: same gap — entirely untranslated. The confirm button keeps its
         live item-count <span> outside the translated text (see comment
         inline) so the count-update code in app.js needs no changes. -->
    <div id="modal-raid-loot" class="modal-overlay">
        <div class="modal glass-panel raid-loot-modal">
            <div class="raid-loot-header">
                <div style="font-size:3rem; line-height:1;">&#127942;</div>
                <h2 class="modal-title" data-i18n="raid.loot.title">Рейд завершён!</h2>
                <p class="modal-text" style="opacity:0.7; margin:0 0 4px;" data-i18n="raid.loot.subtitle">Выберите до 3 предметов для схрона</p>
            </div>
            <div id="raid-loot-grid" class="raid-loot-grid"></div>
            <div class="raid-loot-actions">
                <button id="btn-raid-loot-confirm" class="btn btn-primary btn-large">
                    &#128230; <span data-i18n="raid.loot.confirm_btn">Забрать в схрон</span> (<span id="raid-loot-count">0</span>/3)
                </button>
                <button id="btn-raid-loot-skip" class="btn btn-outline" data-i18n="raid.loot.skip_btn">
                    Выйти без лута
                </button>
            </div>
        </div>
    </div>

    <!-- ===== MODAL: FRIEND LOBBY ===== -->
    <!-- FIX: this ENTIRE modal had zero data-i18n attributes, and even the
         JS-side dynamic text (app.js's _showCoinResultPanel and the
         ready-button click handler) hardcoded Russian strings directly
         instead of going through window.t() — permanently Russian
         regardless of language, for the whole Friend Mode lobby flow.
         The placeholder attribute uses data-i18n-placeholder, since
         data-i18n alone (innerHTML-based) can't reach an <input>'s
         placeholder text. -->
    <div id="modal-friend-lobby" class="modal-overlay" style="display:none;">
        <div class="modal-box glass-panel" style="max-width:380px; text-align:center;">
            <h2 style="margin-bottom:16px;">&#128101; <span data-i18n="menu.friend">Игра с другом</span></h2>
            <div id="friend-lobby-status" style="min-height:40px; margin-bottom:16px; color:var(--text-muted); font-size:0.9em;"></div>

            <div id="friend-lobby-main">
                <button id="btn-create-room" class="btn btn-primary" style="width:100%; margin-bottom:10px;">
                    &#127981; <span data-i18n="friend.create_room">Создать комнату</span>
                </button>
                <div style="margin-bottom:10px; color:var(--text-muted); font-size:0.85em;">— <span data-i18n="friend.or">или</span> —</div>
                <div style="display:flex; gap:8px;">
                    <input id="join-room-code-input" class="form-input" data-i18n-placeholder="friend.room_code_placeholder" placeholder="Код комнаты" style="flex:1; text-transform:uppercase; letter-spacing:2px; font-size:1.1em; text-align:center; padding:10px; background:rgba(255,255,255,0.07); border:1px solid var(--glass-border); border-radius:8px; color:var(--text-primary); outline:none;" maxlength="5">
                    <button id="btn-join-room-submit" class="btn btn-secondary" data-i18n="friend.join_room_btn">Войти</button>
                </div>
            </div>

            <div id="friend-room-created" style="display:none; margin-top:16px;">
                <p style="color:var(--text-muted); font-size:0.85em; margin-bottom:8px;" data-i18n="friend.your_code_text">Твой код комнаты — отправь другу:</p>
                <div id="room-code-display" style="font-size:2.5em; font-weight:bold; letter-spacing:8px; color:var(--accent-gold); margin-bottom:12px;"></div>
                <p id="room-waiting-text" style="color:var(--text-muted); font-size:0.85em;">⏳ <span data-i18n="friend.waiting_text">Ожидание подключения друга...</span></p>
            </div>

            <!-- Coin flip result + ready-up panel (shown after animation) -->
            <div id="friend-coin-result" style="display:none; text-align:center; padding:10px 0;">
                <div id="coin-result-icon" style="font-size:3rem; margin-bottom:8px;"></div>
                <p id="coin-result-text" style="font-size:1.3em; font-weight:bold; margin-bottom:4px;"></p>
                <p id="coin-ready-count" style="color:var(--text-muted); font-size:0.85em; margin-bottom:16px;">0/2 игроков готовы</p>
                <button id="btn-lobby-ready" class="btn btn-primary" style="width:100%; font-size:1.1em;">
                    🎯 <span data-i18n="friend.ready_btn">Готов к расстановке!</span>
                </button>
            </div>

            <button id="btn-friend-lobby-back" class="btn btn-outline" style="width:100%; margin-top:20px;">← <span data-i18n="setup.btn.back">Назад</span></button>
        </div>
    </div>

    <!-- Piece inventory hover tooltip (shown when dragging item over piece) -->
    <!-- FIX: header text had no data-i18n — permanently Russian. -->
    <div id="piece-inv-hover-tooltip" class="piece-inv-hover-tooltip" style="display:none;">
        <div class="piht-header" data-i18n="piece.inv.hover_title">Инвентарь фигуры</div>
        <div class="piht-slots"></div>
        <div class="piht-count"></div>
    </div>

    <script src="piece-entity.js?v=3"></script>
    <script src="items-db.js?v=4"></script>
    <script src="encounters.js?v=3"></script>
    <script src="run-manager.js?v=4"></script>
    <script src="chess-engine.js?v=4"></script>
    <script src="chess-ai.js?v=3"></script>
    <script src="item-stats.js?v=3"></script>
    <script src="pieces-svg.js?v=3"></script>
    <script src="extraction-manager.js?v=2"></script>
    <script src="app.js?v=12"></script>
    <script src="tutorial.js?v=1"></script>
    <!-- Firebase Multiplayer -->
    <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js"></script>
    <script src="multiplayer.js?v=3"></script>
<script defer src="https://static.cloudflareinsights.com/beacon.min.js/v4513226cdae34746b4dedf0b4dfa099e1781791509496" integrity="sha512-ZE9pZaUXND66v380QUtch/5sE9tPFh2zg45pR2PB0CVkCtOREv2AJKkSidISWkysEuQ0EH8faUU5du78bx87UQ==" data-cf-beacon='{"version":"2024.11.0","token":"f0f03d0605bf45f1a3b17cf7d5e6861f","server_timing":{"name":{"cfCacheStatus":true,"cfEdge":true,"cfExtPri":true,"cfL4":true,"cfOrigin":true,"cfSpeedBrain":true},"location_startswith":null}}' crossorigin="anonymous"></script>
</body>
</html>
