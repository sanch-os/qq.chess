<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chess Roguelike — Редактор</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0a0a0f;
            --panel-bg: rgba(25, 25, 35, 0.95);
            --border-color: rgba(124, 111, 247, 0.2);
            --accent-color: #7c6ff7;
            --accent-hover: #9d93fa;
            --text-main: #f0f0f5;
            --text-dim: #a0a0b0;
            --danger: #f75565;
            
            --common-color: #9a95b0;
            --rare-color: #4488ff;
            --epic-color: #9d93fa;
            --legendary-color: #f0c048;
        }

        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        /* Sidebar */
        .sidebar {
            width: 300px;
            background: var(--panel-bg);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            z-index: 10;
        }
        
        .tabs {
            display: flex;
            border-bottom: 1px solid var(--border-color);
        }
        .tab-btn {
            flex: 1;
            padding: 15px 10px;
            background: none;
            border: none;
            color: var(--text-dim);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .tab-btn:hover { color: var(--text-main); }
        .tab-btn.active {
            color: var(--accent-color);
            border-bottom: 2px solid var(--accent-color);
        }

        .list-container {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        }
        
        .list-item {
            padding: 10px 15px;
            background: rgba(255,255,255,0.05);
            border-radius: 6px;
            margin-bottom: 8px;
            cursor: pointer;
            border-left: 4px solid transparent;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .list-item:hover { background: rgba(255,255,255,0.1); }
        .list-item.active {
            background: rgba(124, 111, 247, 0.1);
            border-left-color: var(--accent-color);
        }
        
        .list-item.rarity-common { border-left-color: var(--common-color); }
        .list-item.rarity-rare { border-left-color: var(--rare-color); }
        .list-item.rarity-epic { border-left-color: var(--epic-color); }
        .list-item.rarity-legendary { border-left-color: var(--legendary-color); }

        .sidebar-actions {
            padding: 15px;
            border-top: 1px solid var(--border-color);
            display: flex;
            gap: 10px;
        }

        /* Main Editor */
        .main-editor {
            flex: 1;
            padding: 30px;
            overflow-y: auto;
            position: relative;
        }
        
        .header-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }

        .form-section {
            background: rgba(255,255,255,0.02);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .form-section h3 {
            margin-top: 0;
            margin-bottom: 20px;
            color: var(--accent-hover);
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 10px;
        }

        /* Forms */
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: var(--text-dim);
            font-size: 0.9em;
        }
        input[type="text"], input[type="number"], select, textarea {
            width: 100%;
            background: rgba(0,0,0,0.3);
            border: 1px solid var(--border-color);
            color: white;
            padding: 10px;
            border-radius: 4px;
            font-family: 'Inter', sans-serif;
        }
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: var(--accent-color);
        }
        
        .form-row {
            display: flex;
            gap: 15px;
        }
        .form-row .form-group {
            flex: 1;
        }

        /* Checkboxes */
        .checkbox-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
        }
        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        /* Direction Grids */
        .direction-grid {
            display: grid;
            grid-template-columns: repeat(3, 40px);
            grid-template-rows: repeat(3, 40px);
            gap: 5px;
            margin-bottom: 15px;
        }
        .knight-grid {
            display: grid;
            grid-template-columns: repeat(5, 30px);
            grid-template-rows: repeat(5, 30px);
            gap: 5px;
            margin-bottom: 15px;
        }
        .grid-cell {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            user-select: none;
        }
        .grid-cell:hover { background: rgba(255,255,255,0.15); }
        .grid-cell.active {
            background: var(--accent-color);
            border-color: var(--accent-hover);
        }
        .grid-cell.center {
            background: rgba(255,255,255,0.2);
            cursor: default;
        }

        /* Modifier reference keys — clickable in sidebar */
        .ref-key {
            color: var(--accent-hover);
            padding: 2px 6px;
            font-family: monospace;
            font-size: 0.82em;
            cursor: pointer;
            border-radius: 4px;
            transition: background 0.15s;
            user-select: none;
            white-space: nowrap;
        }
        .ref-key:hover { background: rgba(157,147,250,0.2); }

        /* Buttons */
        button {
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid var(--border-color);
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
        }
        button:hover { background: rgba(255,255,255,0.2); }
        button.primary {
            background: var(--accent-color);
            border-color: var(--accent-color);
        }
        button.primary:hover { background: var(--accent-hover); }
        button.danger {
            background: rgba(247, 85, 101, 0.2);
            border-color: var(--danger);
            color: var(--danger);
        }
        button.danger:hover { background: rgba(247, 85, 101, 0.4); }

        /* Status Toast */
        #status-toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--accent-color);
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        }
        #status-toast.visible {
            transform: translateY(0);
            opacity: 1;
        }

        .hidden { display: none !important; }
        
        /* Modifiers list dynamically added */
        .modifier-row {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
            align-items: center;
        }
        .modifier-row input { flex: 1; }
        
        /* Enemy Items List */
        .enemy-item-row {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
            align-items: center;
            background: rgba(0,0,0,0.3);
            padding: 10px;
            border-radius: 4px;
        }
    </style>
</head>
<body>

    <div class="sidebar">
        <div class="tabs">
            <button class="tab-btn active" id="tab-items" onclick="switchTab('items')">Предметы</button>
            <button class="tab-btn" id="tab-maps" onclick="switchTab('maps')">Раунды</button>
            <button class="tab-btn" id="tab-ref" onclick="switchTab('ref')">📖 Справка</button>
        </div>
        
        <div class="list-container" id="sidebar-list">
            <!-- Populated by JS -->
        </div>

        <!-- Reference panel (hidden by default) -->
        <div id="sidebar-ref" class="list-container hidden" style="font-size:0.8em; line-height:1.6;">
            <div style="padding:6px 2px;">
                <div style="color:var(--accent-hover); font-weight:700; margin-bottom:8px; font-size:1em;">📋 Все модификаторы</div>
                <p style="color:var(--text-dim); font-size:0.88em; margin:0 0 10px;">Нажми на ключ — скопирует в буфер.</p>

                <div style="color:#f0c048; font-weight:700; margin:8px 0 4px;">🌍 Общие (все фигуры)</div>
                <table style="width:100%; border-collapse:collapse;">
                    <tr><td class="ref-key" onclick="copyKey('shield')">shield</td><td>Заряды щита (int)</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('dodgeChance')">dodgeChance</td><td>Шанс уклонения 0–0.95</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('immuneToPawns')">immuneToPawns</td><td>Нельзя взять пешкой</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('immuneToKnights')">immuneToKnights</td><td>Нельзя взять конём</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('immuneToRooks')">immuneToRooks</td><td>Нельзя взять ладьёй</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('immuneToBishops')">immuneToBishops</td><td>Нельзя взять слоном</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('immuneToQueens')">immuneToQueens</td><td>Нельзя взять ферзём</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('immuneToAll')">immuneToAll</td><td>Абсолютная неуязвимость</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('goldPerCapture')">goldPerCapture</td><td>+N золота за взятие</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('goldOnWin')">goldOnWin</td><td>+N золота за победу в раунде</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('goldOnQueenCapture')">goldOnQueenCapture</td><td>+N при взятии ферзя</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('goldOnKnightCapture')">goldOnKnightCapture</td><td>+N при взятии коня</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('goldOnRookCapture')">goldOnRookCapture</td><td>+N при взятии ладьи</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('goldOnBishopCapture')">goldOnBishopCapture</td><td>+N при взятии слона</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('goldOnPawnCapture')">goldOnPawnCapture</td><td>+N при взятии пешки</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('goldOnLongCapture')">goldOnLongCapture</td><td>+N при взятии с дист. ≥3</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('goldOnCaptured')">goldOnCaptured</td><td>+N когда ЭТУ фигуру берут</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('shieldOnHeavyCapture')">shieldOnHeavyCapture</td><td>+N щитов при взятии ладьи/ферзя</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('lifesteal')">lifesteal</td><td>+1 щит за любое взятие</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('venomChance')">venomChance</td><td>Шанс 0–1 заморозить жертву</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('canJump')">canJump</td><td>Перепрыгивает через союзников</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('pierceOne')">pierceOne</td><td>Проходит сквозь 1 фигуру</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('moveAnywhere')">moveAnywhere</td><td>Ходит на любую клетку (телепорт)</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('canStepAnyDirection')">canStepAnyDirection</td><td>Шаг в любую из 8 сторон</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('extraStep')">extraStep</td><td>Прыжок на N клеток в любую сторону</td></tr>
                </table>

                <div style="color:#f0c048; font-weight:700; margin:10px 0 4px;">♙ Пешка</div>
                <table style="width:100%; border-collapse:collapse;">
                    <tr><td class="ref-key" onclick="copyKey('pawnCanRetreat')">pawnCanRetreat</td><td>Ход назад на 1</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('pawnCaptureRange')">pawnCaptureRange</td><td>Дальность взятия по диаг. (int)</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('pawnCanCaptureForward')">pawnCanCaptureForward</td><td>Взятие прямо вперёд</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('pawnCanCaptureBackward')">pawnCanCaptureBackward</td><td>Взятие назад по диагонали</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('earlyPromotion')">earlyPromotion</td><td>Превращение на 6-м ряду</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('pawnAlwaysDouble')">pawnAlwaysDouble</td><td>Всегда может ходить на 2</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('pawnExtraForward')">pawnExtraForward</td><td>Ходит на 1+N клеток вперёд</td></tr>
                </table>

                <div style="color:#f0c048; font-weight:700; margin:10px 0 4px;">♖♗♛ Скользящие</div>
                <table style="width:100%; border-collapse:collapse;">
                    <tr><td class="ref-key" onclick="copyKey('extraRange')">extraRange</td><td>+N к дальности хода</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('extraCaptureRange')">extraCaptureRange</td><td>+N к дальности взятия</td></tr>
                </table>

                <div style="color:#f0c048; font-weight:700; margin:10px 0 4px;">♔ Король</div>
                <table style="width:100%; border-collapse:collapse;">
                    <tr><td class="ref-key" onclick="copyKey('moveAsQueen')">moveAsQueen</td><td>Ходит как ферзь</td></tr>
                    <tr><td class="ref-key" onclick="copyKey('extraKingMove')">extraKingMove</td><td>Ходит на 1+N клеток (мини-ферзь)</td></tr>
                </table>

                <div style="color:#f0c048; font-weight:700; margin:10px 0 4px;">📐 Доп. массивы</div>
                <div style="color:var(--text-dim); font-size:0.88em; line-height:1.5; padding:2px 0;">
                    <strong style="color:var(--text-main);">extraDirections</strong> — шаги на 1 клетку [[dr,dc],…]<br>
                    <strong style="color:var(--text-main);">extraKnightOffsets</strong> — прыжки коня [[dr,dc],…]<br>
                    Настраиваются через сетки в редакторе.
                </div>

                <div style="color:#f0c048; font-weight:700; margin:10px 0 4px;">💡 Подсказки</div>
                <div style="color:var(--text-dim); font-size:0.88em; line-height:1.5;">
                    • ID: строчные + подчёркивание<br>
                    • Числа и булевы (true/false) — авто<br>
                    • allowedPieces: ["all"] → для всех<br>
                    • Экспорт → вставь в items-db.js
                </div>
            </div>
        </div>

        <div class="sidebar-actions" id="sidebar-actions">
            <button class="primary" style="flex:1" id="btn-create-new">➕ Создать</button>
        </div>
    </div>

    <div class="main-editor">
        <div class="header-actions">
            <h2 id="editor-title">Редактор</h2>
            <div style="display:flex; gap:10px;">
                <button onclick="exportData()">📥 Экспорт JSON</button>
                <button onclick="importData()">📤 Импорт JSON</button>
                <button class="primary" onclick="saveCurrentItem()">💾 Сохранить</button>
                <button class="danger" onclick="deleteCurrentItem()" id="btn-delete">🗑 Удалить</button>
            </div>
        </div>

        <!-- ==================== ITEM EDITOR ==================== -->
        <div id="editor-items" class="editor-view">

            <!-- TEMPLATES PANEL -->
            <div class="form-section" style="border-color: rgba(240,192,72,0.35); background: rgba(240,192,72,0.04);">
                <h3 style="color:#f0c048;">⚡ Шаблоны предметов</h3>
                <p style="font-size:0.85em; color:var(--text-dim); margin-top:-12px; margin-bottom:14px;">
                    Выбери фигуру — появятся готовые пресеты. Нажми шаблон чтобы заполнить форму.
                </p>
                <div class="form-row" style="align-items:flex-start; gap:12px; flex-wrap:wrap;">
                    <div style="flex:0 0 auto;">
                        <label style="display:block; margin-bottom:6px; color:var(--text-dim); font-size:0.9em;">Фигура</label>
                        <select id="tpl-piece-select" onchange="renderTemplates()" style="min-width:130px;">
                            <option value="pawn">♟ Пешка</option>
                            <option value="rook">♜ Ладья</option>
                            <option value="bishop">♝ Слон</option>
                            <option value="queen">♛ Ферзь</option>
                            <option value="knight">♞ Конь</option>
                            <option value="king">♚ Король</option>
                            <option value="all">🌍 Любая</option>
                        </select>
                    </div>
                    <div id="tpl-buttons" style="flex:1; display:flex; flex-wrap:wrap; gap:8px; align-content:flex-start;">
                        <!-- Populated by JS -->
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3>Основные настройки</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>ID (unique, snake_case)</label>
                        <input type="text" id="item-id" placeholder="например: flame_sword">
                    </div>
                    <div class="form-group">
                        <label>Название</label>
                        <input type="text" id="item-name" placeholder="Огненный меч">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group" style="flex: 0 0 80px;">
                        <label>Иконка</label>
                        <input type="text" id="item-icon" placeholder="⚔️" style="text-align:center; font-size:1.5em;">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label>Описание</label>
                        <textarea id="item-desc" rows="2" placeholder="Описание эффекта..."></textarea>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Редкость</label>
                        <select id="item-rarity">
                            <option value="common">Обычный (Common)</option>
                            <option value="rare">Редкий (Rare)</option>
                            <option value="epic">Эпический (Epic)</option>
                            <option value="legendary">Легендарный (Legendary)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Категория</label>
                        <select id="item-category">
                            <option value="offense">Атака (Offense)</option>
                            <option value="defense">Защита (Defense)</option>
                            <option value="movement">Движение (Movement)</option>
                            <option value="utility">Утилиты (Utility)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Стоимость (Золото)</label>
                        <input type="number" id="item-cost" value="50">
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3>Кому доступно</h3>
                <div class="checkbox-grid" id="item-allowed-pieces">
                    <label class="checkbox-item"><input type="checkbox" value="all"> Все</label>
                    <label class="checkbox-item"><input type="checkbox" value="king"> Король</label>
                    <label class="checkbox-item"><input type="checkbox" value="queen"> Ферзь</label>
                    <label class="checkbox-item"><input type="checkbox" value="rook"> Ладья</label>
                    <label class="checkbox-item"><input type="checkbox" value="bishop"> Слон</label>
                    <label class="checkbox-item"><input type="checkbox" value="knight"> Конь</label>
                    <label class="checkbox-item"><input type="checkbox" value="pawn"> Пешка</label>
                </div>
            </div>

            <div class="form-section">
                <h3>Статические модификаторы (modifiers)</h3>
                <div id="modifiers-container">
                    <!-- Dynamic inputs -->
                </div>
                <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap; align-items:center;">
                    <button onclick="addModifierField()">+ Добавить параметр</button>
                    <button onclick="toggleEffectsRef()" id="btn-toggle-effects" style="background:rgba(124,111,247,0.15); border-color:var(--accent-color); color:var(--accent-hover);">
                        📋 Все эффекты из игры
                    </button>
                </div>

                <!-- Collapsible: all items from ITEMS_DB -->
                <div id="effects-ref-panel" class="hidden" style="margin-top:14px; border-top:1px solid var(--border-color); padding-top:12px;">
                    <!-- Search & filters -->
                    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px; align-items:center;">
                        <input type="text" id="effects-search" placeholder="🔍 Поиск по названию..."
                            oninput="renderEffectsRef(this.value, document.getElementById('effects-filter-piece').value, document.getElementById('effects-filter-cat').value)"
                            style="flex:1; min-width:120px; padding:6px 10px; background:rgba(255,255,255,0.07); border:1px solid var(--border-color); border-radius:6px; color:var(--text-main); font-size:0.85em;">
                        <select id="effects-filter-piece"
                            onchange="renderEffectsRef(document.getElementById('effects-search').value, this.value, document.getElementById('effects-filter-cat').value)"
                            style="padding:6px 8px; background:rgba(255,255,255,0.07); border:1px solid var(--border-color); border-radius:6px; color:var(--text-main); font-size:0.82em;">
                            <option value="all">🌍 Все фигуры</option>
                            <option value="pawn">♙ Пешка</option>
                            <option value="rook">♖ Ладья</option>
                            <option value="bishop">♗ Слон</option>
                            <option value="queen">♛ Ферзь</option>
                            <option value="knight">♘ Конь</option>
                            <option value="king">♚ Король</option>
                        </select>
                        <select id="effects-filter-cat"
                            onchange="renderEffectsRef(document.getElementById('effects-search').value, document.getElementById('effects-filter-piece').value, this.value)"
                            style="padding:6px 8px; background:rgba(255,255,255,0.07); border:1px solid var(--border-color); border-radius:6px; color:var(--text-main); font-size:0.82em;">
                            <option value="">Все категории</option>
                            <option value="offense">⚔️ Атака</option>
                            <option value="defense">🛡 Защита</option>
                            <option value="movement">🏃 Движение</option>
                            <option value="utility">🔮 Утилиты</option>
                        </select>
                        <span id="effects-ref-count" style="font-size:0.78em; color:var(--text-dim); white-space:nowrap;"></span>
                    </div>
                    <p style="font-size:0.78em; color:var(--text-dim); margin:0 0 10px;">Нажми на предмет — его модификаторы вставятся в форму выше.</p>
                    <div id="effects-ref-list" style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px; max-height:340px; overflow-y:auto; padding-right:2px; scrollbar-width:thin;">
                        <!-- Populated by JS -->
                    </div>
                </div>
            </div>

            <div class="form-row">
                <div class="form-section" style="flex:1">
                    <h3>Доп. направления (соседние клетки)</h3>
                    <p style="font-size:0.8em; color:var(--text-dim); margin-top:-10px;">Кликните по клеткам, куда фигура сможет ходить</p>
                    
                    <div class="form-group" style="margin-bottom:12px;">
                        <label>Фигура для предпросмотра</label>
                        <select id="dir-piece-select" onchange="updateDirGridCenter()" style="width:auto;">
                            <option value="♟" data-piece="pawn">♟ Пешка</option>
                            <option value="♜" data-piece="rook">♜ Ладья</option>
                            <option value="♝" data-piece="bishop">♝ Слон</option>
                            <option value="♛" data-piece="queen">♛ Ферзь</option>
                            <option value="♞" data-piece="knight">♞ Конь</option>
                            <option value="♚" data-piece="king">♚ Король</option>
                        </select>
                    </div>

                    <div class="direction-grid" id="dir-grid">
                        <div class="grid-cell" data-dr="-1" data-dc="-1"></div>
                        <div class="grid-cell" data-dr="-1" data-dc="0"></div>
                        <div class="grid-cell" data-dr="-1" data-dc="1"></div>
                        <div class="grid-cell" data-dr="0" data-dc="-1"></div>
                        <div class="grid-cell center" id="dir-grid-center">♟</div>
                        <div class="grid-cell" data-dr="0" data-dc="1"></div>
                        <div class="grid-cell" data-dr="1" data-dc="-1"></div>
                        <div class="grid-cell" data-dr="1" data-dc="0"></div>
                        <div class="grid-cell" data-dr="1" data-dc="1"></div>
                    </div>

                    <p style="font-size:0.75em; color:var(--text-dim); margin-top:4px;">
                        ⬆ = к противнику | ⬇ = назад
                    </p>
                </div>

                <div class="form-section" style="flex:1">
                    <h3>Доп. прыжки коня</h3>
                    <p style="font-size:0.8em; color:var(--text-dim); margin-top:-10px;">Дополнительные прыжки буквой Г (или длиннее)</p>
                    <div class="knight-grid" id="knight-grid">
                        <!-- Generated by JS (5x5 grid) -->
                    </div>
                </div>
            </div>
        </div>

        <!-- ==================== MAP EDITOR ==================== -->
        <div id="editor-maps" class="editor-view hidden">
            <div class="form-section">
                <h3>Настройки раунда</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>ID</label>
                        <input type="text" id="map-id" placeholder="round_1">
                    </div>
                    <div class="form-group">
                        <label>Название</label>
                        <input type="text" id="map-name" placeholder="Охрана ворот">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Описание</label>
                    <textarea id="map-desc" rows="2"></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Сложность (1-5)</label>
                        <input type="number" id="map-diff" min="1" max="5" value="1">
                    </div>
                    <div class="form-group">
                        <label>Глубина ИИ</label>
                        <input type="number" id="map-ai" min="1" max="5" value="2">
                    </div>
                    <div class="form-group">
                        <label>Награда (золото)</label>
                        <input type="number" id="map-gold" value="60">
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3>Босс</h3>
                <label style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                    <input type="checkbox" id="map-is-boss"> Это раунд с боссом
                </label>
                <div id="boss-fields" class="hidden">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Имя босса</label>
                            <input type="text" id="map-boss-name">
                        </div>
                        <div class="form-group">
                            <label>Описание босса</label>
                            <input type="text" id="map-boss-desc">
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3>Снаряжение врагов</h3>
                <p style="font-size:0.8em; color:var(--text-dim); margin-top:-10px;">Враг использует стандартную расстановку шахмат. Укажите, кому дать предметы.</p>
                <div id="enemy-items-container">
                    <!-- Dynamic inputs -->
                </div>
                <button onclick="addEnemyItemField()" style="margin-top:10px;">+ Добавить предмет врагу</button>
            </div>
        </div>

    </div>

    <div id="status-toast">Сохранено</div>

    <script src="items-db.js"></script>
    <script src="editor.js"></script>
</body>
</html>
