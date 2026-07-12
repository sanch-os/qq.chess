/* ============================================
   Chess App — UI & Game Flow
   ============================================ */

(function () {
    'use strict';

    // NOTE: The old `mobile-drag-drop` polyfill (native HTML5 DnD shim for touch)
    // has been removed. Drag & drop is now built directly on the Pointer Events
    // API (see the "Drag & Drop" section), which handles mouse + touch uniformly;
    // the polyfill would otherwise fight the pointer gesture on touch devices.

    // --- State ---
    let engine = new ChessEngine();
    let ai = new ChessAI(3);
    let runManager = new RunManager();
    let isRoguelikeMode = false;
    let isCreativeMode = false;
    let isPvP = false;
    let isMirrorMode = false;
    let isBlackSetup = false; // true when black player is placing pieces in PvP
    let isRaidMode = false;   // Raid (extraction) mode
    let isRaidSetupMode = false; // Raid setup phase before choosing faction
    let isRaidTestMode = false;  // Test-Drive: infinite resources in raid setup
    let isRaidScav = false;   // true = playing as Scav (black)
    let raidLootSelected = [];



    let currentScreen = 'menu';
    let selectedCell = null;
    let legalMovesForSelected = [];
    let lastMove = null;
    let isAIThinking = false;
    let capturedPieces = { white: [], black: [] };
    let draggedPiece = null;
    let draggedItem = null; // { itemIndex: number }
    let dragGhost = null;

    // --- Centralized drag session (fix for drag race / stale-dragend bug) ---
    // Lifecycle: idle -> preparing -> dragging -> dropping/cancelled -> cleanup -> idle
    // There is only ever ONE active session; each has a unique monotonic id so a
    // late/stale `dragend` from a previous gesture cannot clobber the current one.
    let dragSessionSeq = 0;        // monotonically increasing counter
    let activeDragSessionId = null; // id of the session currently in progress
    let dragPhase = 'idle';

    // --- Localization ---
    function applyLocalization() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = window.t(key);
            if (translation) {
                el.innerHTML = translation;
            }
        });
    }

    function changeLanguage(lang) {
        localStorage.setItem('chess_lang', lang);
        document.querySelectorAll('.lang-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.lang === lang);
        });
        applyLocalization();
        if (currentScreen === 'setup') {
            renderInventory();
            renderStashSetup();
        }
        if (currentScreen === 'shop') openShop();
        if (currentScreen === 'game') {
            updateGameStatus();
            renderMoveHistory();
            renderIngameStash();
        }
    }

    // Generated shop items for current shop visit
    let currentShopItems = [];
    let selectedDifficulty = 'normal'; // very_easy | easy | normal | hard | crazy

    // Inventory for setup (Classic)
    const STANDARD_INVENTORY = [
        { type: 'king', count: 1 },
        { type: 'queen', count: 1 },
        { type: 'rook', count: 2 },
        { type: 'bishop', count: 2 },
        { type: 'knight', count: 2 },
        { type: 'pawn', count: 8 },
    ];
    const CREATIVE_INVENTORY = [
        { type: 'king', count: 99 },
        { type: 'queen', count: 99 },
        { type: 'rook', count: 99 },
        { type: 'bishop', count: 99 },
        { type: 'knight', count: 99 },
        { type: 'pawn', count: 99 },
    ];
    let inventory = [];

    // --- DOM Elements ---
    const screens = {
        menu: document.getElementById('screen-menu'),
        setup: document.getElementById('screen-setup'),
        game: document.getElementById('screen-game'),
        shop: document.getElementById('screen-shop'),
    };
    const boardSetup = document.getElementById('board-setup');
    const boardGame = document.getElementById('board-game');
    const inventoryEl = document.getElementById('inventory');
    const playerStashSetupEl = document.getElementById('player-stash-setup');
    const moveHistoryEl = document.getElementById('move-history');
    const gameStatusEl = document.getElementById('game-status');
    const modalGameover = document.getElementById('modal-gameover');
    const modalPromotion = document.getElementById('modal-promotion');
    const promotionChoices = document.getElementById('promotion-choices');

    // Piece inventory modal
    const modalPieceInv = document.getElementById('modal-piece-inv');
    let pieceInvTarget = null; // { row, col } of piece being inspected

    // --- Initialize ---
    function init() {
        const savedLang = localStorage.getItem('chess_lang') || 'ru';
        changeLanguage(savedLang);

        buildBoard(boardSetup, 'setup');
        buildBoard(boardGame, 'game');
        bindEvents();
        populateMenuBackground();
        showScreen('menu');

        // Global safety nets: guarantee any in-flight pointer drag is torn down
        // (listeners + ghost + state) on every alternative termination path, so
        // no event leaks and no orphan ghost can survive a lost gesture.
        window.addEventListener('blur', () => cancelPointerDrag());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) cancelPointerDrag();
        });
        // Belt-and-suspenders: kill any native browser drag globally.
        document.addEventListener('dragstart', (e) => e.preventDefault());
    }

    // --- Screen Management ---
    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        if (screens[name]) screens[name].classList.add('active');
        currentScreen = name;
        // Toggle body class for CSS modal positioning
        document.body.classList.toggle('setup-screen-active', name === 'setup');

        if (window.Tutorial && window.Tutorial.onScreenChange) {
            window.Tutorial.onScreenChange(name);
        }
        // Обновляем список пресетов при входе на экран расстановки
        if (name === 'setup') {
            renderPresetsList();
            
            // Toggle vertical layout for Raid mode
            const setupLayout = document.querySelector('.setup-layout');
            const startBtn = document.getElementById('btn-start-game');
            const testToggleWrap = document.getElementById('raid-test-toggle-wrap');
            const testToggleCheck = document.getElementById('raid-test-mode-toggle');
            const stashFloatingPanel = document.querySelector('.stash-floating-panel');

            if (setupLayout) {
                const boardWithLabels = document.querySelector('.board-with-labels');

                // --- UNIFIED SETUP LAYOUT ---
                // Every mode now uses the raid-style vertical layout with the
                // floating "Item Stash" panel that overlaps the unused board area.
                // Only mode-specific chrome (test-drive toggle, stash contents,
                // start-button label, second-player shift) differs per mode.
                setupLayout.classList.add('setup-vertical-layout');

                // Move the stash panel over the board so its absolute positioning
                // lines up with the board (raid reference behaviour, now shared).
                if (stashFloatingPanel && boardWithLabels && stashFloatingPanel.parentElement !== boardWithLabels) {
                    boardWithLabels.appendChild(stashFloatingPanel);
                }

                // Test-Drive toggle: raid setup only.
                if (typeof isRaidSetupMode !== 'undefined' && isRaidSetupMode) {
                    if (testToggleWrap) testToggleWrap.style.display = '';
                } else {
                    if (testToggleWrap) testToggleWrap.style.display = 'none';
                    if (testToggleCheck) testToggleCheck.checked = false;
                    isRaidTestMode = false;
                }

                // The floating stash is only meaningful for modes that use items
                // (raid, roguelike, creative / PvP). Mirror & classic have no item
                // system, so the panel stays hidden (board top rows show through).
                const usesItems = (typeof isRaidSetupMode !== 'undefined' && isRaidSetupMode)
                    || isRoguelikeMode || isCreativeMode;
                if (stashFloatingPanel) stashFloatingPanel.style.display = usesItems ? 'flex' : 'none';

                // Start-button label: raid keeps its custom "⚔️ В БОЙ" (set on entry);
                // all other modes use the standard start label.
                if (!(typeof isRaidSetupMode !== 'undefined' && isRaidSetupMode) && startBtn && window.t) {
                    startBtn.innerHTML = '<span class="btn-icon">▶</span> <span>' + window.t('setup.btn.start') + '</span>';
                }

                // "Edit Black" button: only visible in Creative mode (PvP or PvE).
                // Explicitly hide it for all other modes so state doesn't leak.
                const btnSetupBlack = document.getElementById('btn-setup-black');
                if (btnSetupBlack) {
                    btnSetupBlack.style.display = isCreativeMode ? '' : 'none';
                }

                // Keep the stash header + off-board placement in sync with the
                // active side (creative PvP second player, black editing, etc.).
                updateSetupPanelPlacement();
            }
        }
    }

    // --- Unified setup: floating stash header + placement ---
    // Updates the floating stash panel title/hint to reflect the side that is
    // currently being placed, and shifts the panel OFF the board while the
    // second (black) player is placing pieces so their zone (top rows) is free.
    function updateStashPanelHeader() {
        const panel = document.querySelector('.stash-floating-panel');
        if (!panel) return;
        const title = panel.querySelector('.panel-title');
        const hint = panel.querySelector('.panel-hint');
        const tt = (k, fallback) => (window.t && window.t(k)) || fallback;
        if (isCreativeMode && isPvP && isBlackSetup) {
            // Second player prompt (creative PvP).
            if (title) title.textContent = tt('setup.pvp_black_turn', '♛ Второй игрок, расставляйте фигуры');
            if (hint) hint.textContent = tt('setup.pvp_black_hint', 'Разместите чёрные фигуры на верхних клетках, затем нажмите «Начать игру»');
        } else {
            if (title) title.textContent = tt('setup.stash', 'Сундук Предметов');
            if (hint) hint.textContent = tt('setup.stash_hint', 'Перетащите на ваши фигуры или кликните фигуру');
        }
    }

    function updateSetupPanelPlacement() {
        const setupLayout = document.querySelector('.setup-layout');
        if (!setupLayout) return;
        // When placing BLACK (top rows are the placement zone), the floating
        // stash would cover that zone — shift it off the board via CSS.
        setupLayout.classList.toggle('setup-black-phase', !!isBlackSetup);
        updateStashPanelHeader();
    }


    // --- Build Board ---
    function buildBoard(container, mode) {
        container.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                cell.className = `cell ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
                cell.dataset.row = r;
                cell.dataset.col = c;

                if (mode === 'setup') {
                    const isZone = isBlackSetup ? r <= 1 : r >= 6;
                    if (isZone) {
                        cell.classList.add('setup-zone');
                    } else {
                        cell.classList.add('fog-zone');
                    }
                    cell.addEventListener('click', onSetupCellClick);
                    // Drop targets are hit-tested via elementFromPoint during the
                    // pointer drag (see updateDragHover / performSetupDropOnCell),
                    // so no native dragover/drop/dragleave listeners are needed.
                } else {
                    cell.addEventListener('click', (e) => onGameCellClick(e));
                }

                // Right click / Long press to inspect piece
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    const row = parseInt(cell.dataset.row);
                    const col = parseInt(cell.dataset.col);
                    const p = engine.getPiece(row, col);
                    if (p) openPieceInventory(row, col);
                });

                container.appendChild(cell);

            }
        }
        if (mode === 'setup') container.classList.add('setup-mode');
    }

    // --- Render Board ---
    function renderBoard(container) {
        const cells = container.querySelectorAll('.cell');
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            const piece = engine.getPiece(r, c);

            // Reset ALL transient classes (including dark/light base to prevent stuck colors)
            cell.className = `cell ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
            if (container === boardSetup && r >= 6) cell.classList.add('setup-zone');
            const existingPiece = cell.querySelector('.piece');
            if (existingPiece) existingPiece.remove();

            if (piece) {
                cell.classList.add('has-piece');
                const pieceEl = document.createElement('span');
                pieceEl.className = 'piece';
                if (piece.isBoss) pieceEl.classList.add('piece-boss');
                // Use SVG if available, otherwise fall back to unicode symbol
                const svgContent = getPieceSVG(piece.color, piece.type);
                if (svgContent && svgContent.startsWith('<svg')) {
                    pieceEl.innerHTML = svgContent;
                } else {
                    pieceEl.textContent = svgContent || engine.getSymbol(piece);
                }

                // Item badge: count equipped items (non-null slots)
                if (piece instanceof PieceEntity) {
                    const equippedItems = piece.getItems();
                    if (equippedItems.length > 0) {
                        const badge = document.createElement('div');
                        badge.className = 'piece-item-badge';
                        badge.textContent = equippedItems.length;
                        // Color by rarity of first item
                        const rarityColors = { common: '#9a95b0', rare: '#4488ff', epic: '#9d93fa', legendary: '#f0c048' };
                        badge.style.borderColor = rarityColors[equippedItems[0].rarity] || '#9a95b0';
                        pieceEl.appendChild(badge);
                    }
                    
                    // Future hats container
                    const hatsContainer = document.createElement('div');
                    hatsContainer.className = 'piece-hats';
                    pieceEl.appendChild(hatsContainer);
                }

                if (container === boardSetup) {
                    const setupColor = isBlackSetup ? 'black' : 'white';
                    if (piece.color === setupColor) {
                        // Pointer-drag source: resolve live piece state at grab time.
                        attachDragSource(pieceEl, () => {
                            const p = engine.getPiece(r, c);
                            if (!p || p.color !== setupColor) return null;
                            return {
                                payload: { kind: 'piece', piece: { source: 'board', row: r, col: c, type: p.type } },
                                symbol: engine.getSymbol(p),
                            };
                        });
                    }
                }

                cell.appendChild(pieceEl);
            }

            if (lastMove) {
                if ((r === lastMove.from.row && c === lastMove.from.col) ||
                    (r === lastMove.to.row && c === lastMove.to.col)) {
                    cell.classList.add('last-move');
                }
            }
        });

        if (selectedCell && container === boardGame) {
            const selCell = getCell(container, selectedCell.row, selectedCell.col);
            if (selCell) selCell.classList.add('selected');

            legalMovesForSelected.forEach(m => {
                const targetCell = getCell(container, m.to.row, m.to.col);
                if (targetCell) {
                    if (m.anywhereMove) {
                        targetCell.classList.add('anywhere-target');
                        if (m.capture) targetCell.classList.add('anywhere-capture');
                    } else if (m.capture) {
                        targetCell.classList.add('capture-target');
                    } else {
                        targetCell.classList.add('move-target');
                    }
                }
            });
        }

        if (container === boardGame) {
            for (const color of ['white', 'black']) {
                if (engine.isInCheck(color)) {
                    const king = engine.findKing(color);
                    if (king) {
                        const kingCell = getCell(container, king.row, king.col);
                        if (kingCell) kingCell.classList.add('in-check');
                    }
                }
            }
        }
    }

    // onGameCellClick is defined below near game logic (line ~1516)

    function getCell(container, row, col) {
        return container.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    }

    function resetInventory(creative = false) {
        const source = creative ? CREATIVE_INVENTORY : STANDARD_INVENTORY;
        inventory = source.map(item => {
            // Apply recruited pieces in roguelike mode
            const extra = (!creative && isRoguelikeMode && runManager.bonusPieces[item.type]) ? runManager.bonusPieces[item.type] : 0;
            return {
                type: item.type,
                remaining: item.count + extra,
                total: item.count + extra
            };
        });
        renderInventory();
    }

    function renderInventory() {
        inventoryEl.innerHTML = '';
        // Test-Drive overrides: behave like creative (infinite)
        const isInfinite = isCreativeMode || isRaidTestMode;
        inventory.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = `inventory-item ${(!isInfinite && item.remaining <= 0) ? 'used' : ''}`;
            el.textContent = PIECE_SYMBOLS.white[item.type];
            el.dataset.type = item.type;
            el.dataset.index = index;

            if (item.total > 1 || isInfinite) {
                const count = document.createElement('span');
                count.className = 'item-count';
                count.textContent = isInfinite ? '∞' : `×${item.remaining}`;
                el.appendChild(count);
            }

            // Pointer-drag source (piece from inventory).
            attachDragSource(el, (node) => {
                const type = node.dataset.type;
                const idx = parseInt(node.dataset.index);
                const invItem = inventory[idx];
                const inf = isCreativeMode || (typeof isRaidTestMode !== 'undefined' && isRaidTestMode);
                if (!invItem || (!inf && invItem.remaining <= 0)) return null;
                return {
                    payload: { kind: 'piece', piece: { source: 'inventory', type, index: idx } },
                    symbol: PIECE_SYMBOLS.white[type],
                };
            });
            inventoryEl.appendChild(el);
        });
    }

    function renderStashSetup() {
        if (!playerStashSetupEl) return;
        playerStashSetupEl.innerHTML = '';

        // Test-Drive works exactly like creative for items
        const infiniteItems = isCreativeMode || isRaidTestMode;

        if (infiniteItems) {
            // In creative / test mode — show ALL items from catalog, infinite supply
            Object.values(ITEMS_DB).forEach((item) => {
                const tName = window.t_item(item, 'name');
                const tDesc = window.t_item(item, 'description');
                const el = document.createElement('div');
                el.className = `stash-item rarity-${item.rarity || 'common'}`;
                el.innerHTML = `<div class="item-icon">${item.icon || '📦'}</div>
                                <div class="item-badge" style="background:rgba(80,0,200,0.85); right:0; top:0;">∞</div>
                                <div class="item-tooltip"><strong>${tName}</strong><br>${tDesc}</div>`;
                el.dataset.itemId = item.id;
                // Pointer-drag source (item from catalog, infinite supply).
                attachDragSource(el, (node) => {
                    const cat = ITEMS_DB[node.dataset.itemId];
                    if (!cat) return null;
                    return { payload: { kind: 'item', item: { itemId: node.dataset.itemId } }, symbol: cat.icon || '📦' };
                });
                playerStashSetupEl.appendChild(el);
            });
        } else {
            // Normal mode — show player's stash
            runManager.playerItems.forEach((item, idx) => {
                if (!item) return;
                const tName = window.t_item(item, 'name');
                const tDesc = window.t_item(item, 'description');
                const el = document.createElement('div');
                el.className = `stash-item rarity-${item.rarity || 'common'}`;
                el.innerHTML = `<div class="item-icon">${item.icon || '📦'}</div>
                                <div class="item-tooltip"><strong>${tName}</strong><br>${tDesc}</div>`;
                el.dataset.itemIndex = idx;
                // Pointer-drag source (item from the player's stash).
                attachDragSource(el, (node) => {
                    const i = parseInt(node.dataset.itemIndex);
                    const it = runManager.playerItems[i];
                    if (!it) return null;
                    return { payload: { kind: 'item', item: { itemIndex: i } }, symbol: it.icon || '📦' };
                });
                playerStashSetupEl.appendChild(el);
            });
        }
    }

    function renderIngameStash() {
        const section = document.getElementById('ingame-stash-section');
        const container = document.getElementById('ingame-stash');
        if (!container || !runManager) return;

        const items = runManager.playerItems.filter(Boolean);
        if (items.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }

        if (section) section.style.display = '';
        container.innerHTML = '';
        items.forEach((item, idx) => {
            const tName = window.t_item(item, 'name');
            const tDesc = window.t_item(item, 'description');
            const el = document.createElement('div');
            el.className = `stash-item rarity-${item.rarity || 'common'}`;
            el.title = `${tName}\n${tDesc}`;
            el.innerHTML = `<div class="item-icon">${item.icon || '📦'}</div>
                            <div class="item-tooltip"><strong>${tName}</strong><br>${tDesc}</div>`;
            container.appendChild(el);
        });
    }

    // ================================================================
    //  Drag & Drop  —  Pointer Events implementation
    //  Single code path for mouse + touch (pointerdown/move/up/cancel).
    //  Native HTML5 drag (draggable/dragstart/drop) is NOT used; a
    //  phantom browser drag is explicitly suppressed via preventDefault
    //  on 'dragstart'. A ghost clone follows the pointer via CSS
    //  transform (never left/top); the original element stays in place
    //  until the drop is confirmed.
    // ================================================================

    const DRAG_THRESHOLD = 6; // px the pointer must travel before a drag begins

    // Active pointer-drag descriptor (null when idle):
    //   { pointerId, startX, startY, started, payload, symbol, sourceEl }
    let pointerDrag = null;
    let _hoverCell = null;        // setup cell currently highlighted during drag
    let _dragJustEnded = false;   // swallow the click synthesized right after a drag

    // Wire a DOM element up as a drag source. `resolve(el)` returns
    //   { payload, symbol }  when a drag may start, or null otherwise.
    //   payload = { kind:'piece', piece:{...} }  OR  { kind:'item', item:{...} }
    function attachDragSource(el, resolve) {
        el.addEventListener('pointerdown', (e) => onSourcePointerDown(e, el, resolve));
        // Kill the browser's built-in element/image drag ("phantom" drag).
        el.addEventListener('dragstart', (e) => e.preventDefault());
    }

    function onSourcePointerDown(e, el, resolve) {
        // Primary button only (mouse); touch/pen report button 0.
        if (e.button !== undefined && e.button > 0) return;
        const resolved = resolve(el);
        if (!resolved) return;

        // Force-teardown anything still lingering, then arm a pending drag.
        cancelPointerDrag();
        _ghostX = e.clientX;
        _ghostY = e.clientY;
        pointerDrag = {
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            started: false,
            payload: resolved.payload,
            symbol: resolved.symbol,
            sourceEl: el,
        };
        // Listen on window so move/up are still received once the pointer
        // leaves the small source element (fixes "drag stops working").
        window.addEventListener('pointermove', onPointerDragMove);
        window.addEventListener('pointerup', onPointerDragUp);
        window.addEventListener('pointercancel', onPointerDragCancel);
    }

    function onPointerDragMove(e) {
        if (!pointerDrag || e.pointerId !== pointerDrag.pointerId) return;

        if (!pointerDrag.started) {
            const dx = e.clientX - pointerDrag.startX;
            const dy = e.clientY - pointerDrag.startY;
            if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return; // still a potential tap
            beginActiveDrag();
        }

        moveGhost(e.clientX, e.clientY);
        updateDragHover(e.clientX, e.clientY);
    }

    // Promote the armed pending drag into a live drag once past the threshold.
    function beginActiveDrag() {
        pointerDrag.started = true;
        beginDragSession(pointerDrag.sourceEl); // opens the centralized session
        const p = pointerDrag.payload;
        if (p.kind === 'item') {
            draggedItem = p.item;
            draggedPiece = null;
        } else {
            draggedPiece = p.piece;
            draggedItem = null;
        }
        createDragGhost(pointerDrag.symbol);
        pointerDrag.sourceEl.classList.add('dragging');
    }

    function onPointerDragUp(e) {
        if (!pointerDrag || e.pointerId !== pointerDrag.pointerId) return;
        const wasStarted = pointerDrag.started;

        if (wasStarted) {
            const cell = cellFromPoint(e.clientX, e.clientY);
            if (cell) performSetupDropOnCell(cell); // valid cell => move; else no-op => returns
            // Suppress the click that the browser synthesizes after a drag so it
            // does not immediately re-open the piece inventory modal.
            _dragJustEnded = true;
            setTimeout(() => { _dragJustEnded = false; }, 0);
        }

        teardownPointerListeners();
        pointerDrag = null;
        cleanupDrag('pointerup'); // idempotent teardown of ghost + state + highlights
    }

    function onPointerDragCancel(e) {
        if (!pointerDrag || e.pointerId !== pointerDrag.pointerId) return;
        cancelPointerDrag();
    }

    // Abort any pending/active pointer drag and detach the window listeners.
    function cancelPointerDrag() {
        teardownPointerListeners();
        pointerDrag = null;
        cleanupDrag('cancel');
    }

    function teardownPointerListeners() {
        window.removeEventListener('pointermove', onPointerDragMove);
        window.removeEventListener('pointerup', onPointerDragUp);
        window.removeEventListener('pointercancel', onPointerDragCancel);
    }

    // Resolve the setup-board cell under a viewport point. The ghost is
    // pointer-events:none so elementFromPoint never returns it.
    function cellFromPoint(x, y) {
        const el = document.elementFromPoint(x, y);
        if (!el) return null;
        const cell = el.closest('.cell');
        if (!cell || !boardSetup.contains(cell)) return null;
        return cell;
    }

    // Track hover during drag: clear the previous cell's highlight, highlight
    // the new one. Runs highlight/tooltip logic only when the cell changes.
    function updateDragHover(x, y) {
        const cell = cellFromPoint(x, y);
        if (cell === _hoverCell) return;
        if (_hoverCell) _hoverCell.classList.remove('drop-valid', 'drop-invalid');
        _hoverCell = cell;
        if (!cell) { hidePieceInvTooltip(); return; }
        updateDragHighlight(cell);
    }

    // Compute + apply the drop highlight (and equip tooltip) for a single cell.
    // Called while dragging whenever the hovered cell changes.
    function updateDragHighlight(cell) {
        if (!cell) return;
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const piece = engine.getPiece(r, c);

        cell.classList.remove('drop-valid', 'drop-invalid');

        if (draggedItem !== null) {
            // Equipping item onto piece
            const setupColor = isBlackSetup ? 'black' : 'white';
            if (piece && piece.color === setupColor && piece instanceof PieceEntity) {
                let draggedItemData = null;
                if (draggedItem.itemId) {
                    draggedItemData = ITEMS_DB[draggedItem.itemId];
                } else if (draggedItem.itemIndex !== undefined) {
                    draggedItemData = runManager.playerItems[draggedItem.itemIndex];
                }

                let isAllowed = true;
                if (draggedItemData && draggedItemData.allowedPieces) {
                    if (!draggedItemData.allowedPieces.includes('all') && !draggedItemData.allowedPieces.includes(piece.type)) {
                        isAllowed = false;
                    }
                }

                const hasSlot = piece.getEmptySlot() !== -1;
                const canEquip = hasSlot && isAllowed;
                
                let reason = '';
                if (!isAllowed) reason = 'not_allowed';
                else if (!hasSlot) reason = 'full';

                if (canEquip) cell.classList.add('drop-valid');
                else cell.classList.add('drop-invalid');
                
                // Show piece inventory tooltip
                showPieceInvTooltip(piece, cell, canEquip, reason);
            } else {
                hidePieceInvTooltip();
            }
        } else if (draggedPiece) {
            const validZone = isBlackSetup ? (r <= 1) : (r >= 6);
            if (validZone) cell.classList.add('drop-valid');
            else cell.classList.add('drop-invalid');
            hidePieceInvTooltip();
        }
    }

    // Apply the drop onto a specific setup cell. Called from pointerup.
    // Teardown of the ghost / drag state / highlights is done by the caller
    // (onPointerDragUp -> cleanupDrag), so this only mutates the board model.
    // On a non-droppable target it simply returns early -> the piece stays put.
    function performSetupDropOnCell(cell) {
        if (!cell) return;
        cell.classList.remove('drop-valid', 'drop-invalid');

        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const piece = engine.getPiece(r, c);

        const isInfinite = isCreativeMode || (typeof isRaidTestMode !== 'undefined' && isRaidTestMode);

        if (draggedItem !== null) {
            // Equip item to piece
            const setupColor = isBlackSetup ? 'black' : 'white';
            if (piece && piece.color === setupColor && piece instanceof PieceEntity) {
                if (isInfinite && draggedItem.itemId) {
                    // Creative/Test-Drive mode: clone fresh item from catalog, bypass stash
                    const catalogItem = ITEMS_DB[draggedItem.itemId];
                    if (catalogItem) {
                        if (!catalogItem.allowedPieces.includes('all') && !catalogItem.allowedPieces.includes(piece.type)) {
                            // not allowed for this piece type — skip
                        } else {
                            const slot = piece.getEmptySlot();
                            if (slot !== -1) {
                                piece.setItem(slot, { ...catalogItem, modifiers: { ...catalogItem.modifiers } });
                            }
                        }
                    }
                } else {
                    runManager.equipItemToPiece(draggedItem.itemIndex, piece, false);
                }
                renderStashSetup();
                renderBoard(boardSetup);
            }
        } else if (draggedPiece) {
            const validZone = isBlackSetup ? (r <= 1) : (r >= 6);
            if (!validZone) return;
            const setupColor = isBlackSetup ? 'black' : 'white';

            // If dropping from board onto the EXACT SAME cell, do nothing
            if (draggedPiece.source === 'board' && draggedPiece.row === r && draggedPiece.col === c) return;

            // Handle swapping: if a piece already exists, return it to inventory
            if (piece) {
                if (piece.color !== setupColor) return;
                
                // Return items to stash
                if (piece instanceof PieceEntity && !isInfinite) {
                    piece.getItems().forEach(item => {
                        runManager.playerItems.push(item);
                    });
                }
                
                // Return piece to inventory
                if (!isInfinite) {
                    const invItem = inventory.find(i => i.type === piece.type);
                    if (invItem) invItem.remaining++;
                }
                engine.removePiece(r, c);
            }

            if (draggedPiece.source === 'inventory') {
                const invItem = inventory[draggedPiece.index];
                if (!invItem || (!isInfinite && invItem.remaining <= 0)) {
                    // Not enough pieces, but wait: if we swapped, maybe we just freed it up!
                    if (!isInfinite && invItem.remaining <= 0) return;
                }
                engine.board[r][c] = new PieceEntity(draggedPiece.type, setupColor);
                if (!isInfinite) invItem.remaining--;
            } else if (draggedPiece.source === 'board') {
                const p = engine.board[draggedPiece.row][draggedPiece.col];
                engine.board[draggedPiece.row][draggedPiece.col] = null;
                engine.board[r][c] = p;
            }

            renderBoard(boardSetup);
            renderInventory();
            updateStartButton();
        }
    }

    function onSetupCellClick(e) {
        // Ignore the click the browser synthesizes right after a pointer drag,
        // otherwise a drag that ends on a piece would immediately open its modal.
        if (_dragJustEnded) return;
        const cell = e.target.closest('.cell');
        if (!cell) return;
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const piece = engine.getPiece(r, c);

        const setupColor = isBlackSetup ? 'black' : 'white';
        const validZone = isBlackSetup ? (r <= 1) : (r >= 6);

        if (piece && piece.color === setupColor && validZone) {
            openPieceInventory(r, c);
        }
    }

    // --- Centralized drag-session lifecycle -------------------------------
    // Force-end any lingering session and open a brand-new one, stamping the
    // source element with the new session id. Guarantees a single active
    // session so a stale/late gesture can never clobber the current one.
    function beginDragSession(sourceEl) {
        cleanupDrag('new-drag');            // preparing: kill anything still lingering
        activeDragSessionId = ++dragSessionSeq;
        dragPhase = 'dragging';
        if (sourceEl) sourceEl._dragSid = activeDragSessionId;
        return activeDragSessionId;
    }

    // Single idempotent teardown. Safe to call any number of times and from any
    // termination path (drop, dragend, pointercancel, blur, visibilitychange,
    // screen change). Never throws.
    function cleanupDrag(/* reason */) {
        dragPhase = 'cleanup';
        removeDragGhost();
        hidePieceInvTooltip();
        _tooltipKey = null;
        // Clear ALL transient drag classes wherever they may have stuck.
        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
        document.querySelectorAll('.cell.drop-valid, .cell.drop-invalid')
            .forEach(el => el.classList.remove('drop-valid', 'drop-invalid'));
        _hoverCell = null;
        draggedPiece = null;
        draggedItem = null;
        activeDragSessionId = null;
        dragPhase = 'idle';
    }

    // Build the ghost clone that trails the pointer. It is a lightweight preview
    // element (never the source itself), positioned exclusively via CSS
    // transform and made pointer-events:none so it never blocks hit-testing.
    function createDragGhost(symbol) {
        removeDragGhost();
        dragGhost = document.createElement('div');
        dragGhost.className = 'drag-ghost';
        dragGhost.textContent = symbol;   // separate preview: never mutates the source asset
        dragGhost.style.pointerEvents = 'none';
        // Position at the current pointer immediately (no flash at 0,0).
        dragGhost.style.transform = `translate(${_ghostX - 24}px, ${_ghostY - 24}px)`;
        document.body.appendChild(dragGhost);
    }

    // rAF-throttled: at most ONE transform update per animation frame regardless
    // of how many pointermove events fire — keeps the drag at 60 FPS.
    let _ghostRaf = 0;
    let _ghostX = 0, _ghostY = 0;
    function moveGhost(x, y) {
        _ghostX = x; _ghostY = y;
        if (_ghostRaf) return;
        _ghostRaf = requestAnimationFrame(() => {
            _ghostRaf = 0;
            if (dragGhost) {
                dragGhost.style.transform = `translate(${_ghostX - 24}px, ${_ghostY - 24}px)`;
            }
        });
    }

    function removeDragGhost() {
        if (_ghostRaf) { cancelAnimationFrame(_ghostRaf); _ghostRaf = 0; }
        if (dragGhost) {
            dragGhost.remove();
            dragGhost = null;
        }
    }

    // --- Task 4: Piece Inventory Hover Tooltip ---
    const _piht = document.getElementById('piece-inv-hover-tooltip');
    const _pihtSlots = _piht?.querySelector('.piht-slots');
    const _pihtCount = _piht?.querySelector('.piht-count');
    let _tooltipKey = null; // signature of the currently-shown tooltip (FPS guard)

    function showPieceInvTooltip(piece, cell, canEquip, reason) {
        if (!_piht || !_pihtSlots || !_pihtCount) return;

        const items = piece.items || [null, null, null];
        const slotCount = items.length;
        const occupied = items.filter(Boolean).length;
        const empty = slotCount - occupied;

        // FPS fix: `dragover` fires many times per second over the same cell.
        // Rebuilding the slot DOM and forcing synchronous layout on every tick is
        // layout thrashing. Skip when nothing that affects the tooltip changed.
        const key = `${cell.dataset.row},${cell.dataset.col}|${canEquip ? 1 : 0}|${reason || ''}|${occupied}/${slotCount}`;
        if (key === _tooltipKey && _piht.style.display === 'block') return;
        _tooltipKey = key;

        _pihtSlots.innerHTML = '';
        items.forEach((item, idx) => {
            const slotEl = document.createElement('div');
            if (item) {
                slotEl.className = 'piht-slot occupied';
                slotEl.textContent = item.icon || '📦';
                slotEl.title = window.t_item ? (window.t_item(item, 'name') || item.id) : (item.id || '');
            } else if (!canEquip) {
                slotEl.className = 'piht-slot full-slot';
                slotEl.textContent = '✕';
                if (reason === 'not_allowed') slotEl.style.color = 'var(--danger)';
            } else if (idx === occupied) {
                // This is the next slot that will be filled
                slotEl.className = 'piht-slot will-fill';
                slotEl.textContent = '+';
            } else {
                slotEl.className = 'piht-slot empty';
                slotEl.textContent = '';
            }
            _pihtSlots.appendChild(slotEl);
        });

        const usedText = `${occupied}/${slotCount}`;
        if (canEquip) {
            _pihtCount.textContent = `Слотов: ${usedText} — свободно`;
            _pihtCount.className = 'piht-count can-equip';
        } else if (reason === 'not_allowed') {
            _pihtCount.textContent = `Предмет не подходит`;
            _pihtCount.className = 'piht-count full';
        } else {
            _pihtCount.textContent = `Слотов: ${usedText} — полный`;
            _pihtCount.className = 'piht-count full';
        }

        // --- Smart positioning: prefer above, flip below if there's no room ---
        const rect = cell.getBoundingClientRect();
        _piht.style.display = 'block';

        // We need the tooltip height — force a quick layout pass
        const th = _piht.offsetHeight;
        const tw = _piht.offsetWidth;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const MARGIN = 8;        // gap from cell edge
        const FINGER_PAD = 18;   // extra gap below so a finger doesn't cover the text

        // Horizontal: center over the cell, clamped inside viewport
        let left = rect.left + rect.width / 2 - tw / 2;
        if (left < MARGIN) left = MARGIN;
        if (left + tw > vw - MARGIN) left = vw - tw - MARGIN;

        // Vertical: above by default, flip below when not enough room
        const spaceAbove = rect.top;
        const fitsAbove = spaceAbove - th - MARGIN > 0;

        let top;
        if (fitsAbove) {
            top = rect.top - th - MARGIN;
            _piht.style.transformOrigin = 'bottom center';
        } else {
            // Not enough space above → show below with finger clearance
            top = rect.bottom + FINGER_PAD;
            // If it also overflows the bottom, clamp
            if (top + th > vh - MARGIN) top = vh - th - MARGIN;
            _piht.style.transformOrigin = 'top center';
        }

        _piht.style.left = left + 'px';
        _piht.style.top  = top  + 'px';
    }

    function hidePieceInvTooltip() {
        if (_piht) _piht.style.display = 'none';
        _tooltipKey = null;
    }


    function updateStartButton() {
        const btn = document.getElementById('btn-start-game');
        const warning = document.getElementById('setup-warning');
        let canStart = false;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = engine.getPiece(r, c);
                if (p && p.color === 'white' && p.type === 'king') canStart = true;
            }
        }
        btn.disabled = !canStart;
        warning.classList.toggle('visible', !canStart);
    }

    // --- Shop ---
    function openShop() {
        // Generate fresh shop items — 9 slots (only once per shop visit, not on buy/sell refresh)
        if (currentShopItems.length === 0 || currentShopItems.every(i => i === null)) {
            currentShopItems = getShopItems(9, runManager.gold);
        }

        document.getElementById('shop-gold-display').textContent = runManager.gold;

        const itemsGrid = document.getElementById('shop-items');
        itemsGrid.innerHTML = '';
        currentShopItems.forEach((item, index) => {
            if (!item) return;
            const el = document.createElement('div');
            el.className = `shop-item rarity-${item.rarity || 'common'}`;
            el.dataset.shopIndex = index;
            const tName = window.t_item(item, 'name');
            const tDesc = window.t_item(item, 'description');
            const _wr = ItemStats.format(item.id);
            const _wrBadge = _wr !== '\u2014' ? `<span class="item-winrate">${_wr}</span>` : '';
            el.innerHTML = `
                <div class="item-icon">${item.icon || '📦'}</div>
                <div class="item-name">${tName}${_wrBadge}</div>
                <div class="item-cost">${item.cost} 🪙</div>
                <div class="item-tooltip">${tDesc}</div>
            `;
            el.addEventListener('click', () => {
                if (runManager.gold < item.cost) {
                    el.style.animation = 'shake 0.3s';
                    setTimeout(() => el.style.animation = '', 300);
                    return;
                }
                const result = runManager.buyItem(item);
                if (result === 'full') {
                    el.style.border = '2px solid #ff5555';
                    el.title = window.t('shop.msg.full');
                    setTimeout(() => { el.style.border = ''; el.title = ''; }, 1500);
                    return;
                }
                currentShopItems[index] = null;
                refreshShop(); // refresh display without re-rolling
            });

            itemsGrid.appendChild(el);
        });

        const stashGrid = document.getElementById('shop-stash');
        stashGrid.innerHTML = '';
        runManager.playerItems.forEach((item, index) => {
            if (!item) return;
            const el = document.createElement('div');
            el.className = `stash-item rarity-${item.rarity || 'common'}`;
            const sellPrice = Math.floor(item.cost / 2);
            const tName = window.t_item(item, 'name');
            const tDesc = window.t_item(item, 'description');
            el.innerHTML = `
                <div class="item-icon">${item.icon || '📦'}</div>
                <div class="item-tooltip">${window.t('shop.msg.sell_for').replace('{price}', sellPrice)}<br>${tDesc}</div>
            `;
            el.addEventListener('click', () => {
                const msg = window.t('shop.msg.sell_confirm').replace('{name}', tName).replace('{price}', sellPrice);
                if (confirm(msg)) {
                    runManager.sellItem(index);
                    refreshShop();
                }
            });
            stashGrid.appendChild(el);
        });

        showScreen('shop');
    }

    // Refresh shop UI without re-rolling items
    function refreshShop() {
        document.getElementById('shop-gold-display').textContent = runManager.gold;

        const itemsGrid = document.getElementById('shop-items');
        itemsGrid.innerHTML = '';
        currentShopItems.forEach((item, index) => {
            if (!item) return;
            const el = document.createElement('div');
            el.className = `shop-item rarity-${item.rarity || 'common'}`;
            el.dataset.shopIndex = index;
            const tName = window.t_item(item, 'name');
            const tDesc = window.t_item(item, 'description');
            const _wr = ItemStats.format(item.id);
            const _wrBadge = _wr !== '\u2014' ? `<span class="item-winrate">${_wr}</span>` : '';
            el.innerHTML = `
                <div class="item-icon">${item.icon || '📦'}</div>
                <div class="item-name">${tName}${_wrBadge}</div>
                <div class="item-cost">${item.cost} 🪙</div>
                <div class="item-tooltip">${tDesc}</div>
            `;
            el.addEventListener('click', () => {
                if (runManager.gold < item.cost) {
                    el.style.animation = 'shake 0.3s';
                    setTimeout(() => el.style.animation = '', 300);
                    return;
                }
                runManager.gold -= item.cost;
                runManager.playerItems.push({ ...item });
                currentShopItems[index] = null;
                refreshShop();
            });
            itemsGrid.appendChild(el);
        });

        const stashGrid = document.getElementById('shop-stash');
        stashGrid.innerHTML = '';
        runManager.playerItems.forEach((item, index) => {
            if (!item) return;
            const el = document.createElement('div');
            el.className = `stash-item rarity-${item.rarity || 'common'}`;
            const sellPrice = Math.floor(item.cost / 2);
            const tName = window.t_item(item, 'name');
            const tDesc = window.t_item(item, 'description');
            el.innerHTML = `
                <div class="item-icon">${item.icon || '📦'}</div>
                <div class="item-tooltip">${window.t('shop.msg.sell_for').replace('{price}', sellPrice)}<br>${tDesc}</div>
            `;
            el.addEventListener('click', () => {
                const msg = window.t('shop.msg.sell_confirm').replace('{name}', tName).replace('{price}', sellPrice);
                if (confirm(msg)) {
                    runManager.sellItem(index);
                    refreshShop();
                }
            });
            stashGrid.appendChild(el);
        });
    }

    // --- Populate Menu Background ---
    function populateMenuBackground() {
        const bg = document.querySelector('.menu-bg-pieces');
        if (!bg) return;
        const pieces = '♔♕♖♗♘♙♚♛♜♝♞♟';
        let html = '';
        for (let i = 0; i < 30; i++) {
            const piece = pieces[Math.floor(Math.random() * pieces.length)];
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const size = 40 + Math.random() * 80;
            const rotation = Math.random() * 360;
            html += `<span style="position:absolute;left:${x}%;top:${y}%;font-size:${size}px;transform:rotate(${rotation}deg)">${piece}</span>`;
        }
        bg.innerHTML = html;
    }

    // --- Event Bindings ---
    function bindEvents() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                changeLanguage(btn.dataset.lang);
            });
        });

        document.getElementById('btn-new-run').addEventListener('click', () => {
            isRoguelikeMode = true;
            // Reset cross-mode flags so a leftover PvP/raid state can't affect
            // roguelike setup (placement zone / unified panel shift).
            isCreativeMode = false;
            isPvP = false;
            isMirrorMode = false;
            isBlackSetup = false;
            isRaidMode = false;
            isRaidSetupMode = false;
            runManager.startRun();
            engine.reset();
            resetInventory();
            renderBoard(boardSetup);
            renderStashSetup();
            updateStartButton();
            showScreen('setup');
            // Ensure any leftover overlay classes are cleared
            clearSetupOverlay();
        });

        document.getElementById('btn-mirror-match').addEventListener('click', () => {
            isRoguelikeMode = false;
            isCreativeMode = false;
            isPvP = false;
            isMirrorMode = true;
            isBlackSetup = false;
            isRaidMode = false;
            isRaidSetupMode = false;
            engine.reset();
            resetInventory();
            runManager.playerItems = [];
            renderBoard(boardSetup);
            renderStashSetup();
            if (playerStashSetupEl) playerStashSetupEl.style.display = 'none';
            updateStartButton();
            showScreen('setup');
            clearSetupOverlay();
        });

        // Creative mode
        document.getElementById('btn-creative').addEventListener('click', () => {
            document.getElementById('modal-creative').classList.add('active');
        });

        document.getElementById('btn-creative-cancel').addEventListener('click', () => {
            document.getElementById('modal-creative').classList.remove('active');
        });

        document.getElementById('btn-creative-pvbot').addEventListener('click', () => {
            document.getElementById('modal-creative').classList.remove('active');
            startCreativeMode(false);
        });

        document.getElementById('btn-creative-pvp').addEventListener('click', () => {
            document.getElementById('modal-creative').classList.remove('active');
            startCreativeMode(true);
        });


        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedDifficulty = btn.dataset.mode;
                ai.setMode(selectedDifficulty);
                const descEl = document.getElementById('diff-description');
                if (descEl) descEl.textContent = window.t('diff.desc.' + selectedDifficulty) || '';
            });
        });

        document.getElementById('btn-standard-setup').addEventListener('click', () => {
            clearSetupPieces();
            const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
            const color = isBlackSetup ? 'black' : 'white';
            const pawnRow = isBlackSetup ? 1 : 6;
            const backRow = isBlackSetup ? 0 : 7;
            for (let c = 0; c < 8; c++) {
                engine.board[backRow][c] = new PieceEntity(backRank[c], color);
                engine.board[pawnRow][c] = new PieceEntity('pawn', color);
            }
            inventory.forEach(item => item.remaining = 0);
            renderBoard(boardSetup);
            renderInventory();
            updateStartButton();
        });

        document.getElementById('btn-clear-board').addEventListener('click', () => {
            clearSetupPieces();
        });

        const btnSetupBlack = document.getElementById('btn-setup-black');
        if (btnSetupBlack) {
            btnSetupBlack.addEventListener('click', () => {
                if (isBlackSetup) {
                    // Switch to White
                    isBlackSetup = false;
                    resetInventory(true);
                    
                    // Update setup-zone
                    boardSetup.querySelectorAll('.cell').forEach(cell => {
                        const r = parseInt(cell.dataset.row);
                        cell.classList.remove('setup-zone');
                        if (r >= 6) cell.classList.add('setup-zone');
                    });
                    
                    const panelTitle = document.querySelector('.inventory-panel .panel-title');
                    if (panelTitle) panelTitle.textContent = 'Ваша Армия (Белые)';
                    btnSetupBlack.innerHTML = '🔄 Редактировать Черных';
                    
                    renderBoard(boardSetup);
                    renderInventory();
                    updateStartButton();
                    updateSetupPanelPlacement();
                } else {
                    // Switch to Black
                    isBlackSetup = true;
                    resetInventory(true);
                    
                    // Update setup-zone
                    boardSetup.querySelectorAll('.cell').forEach(cell => {
                        const r = parseInt(cell.dataset.row);
                        cell.classList.remove('setup-zone');
                        if (r <= 1) cell.classList.add('setup-zone');
                    });
                    
                    const panelTitle = document.querySelector('.inventory-panel .panel-title');
                    if (panelTitle) panelTitle.textContent = 'Чёрные — Ваша Армия';
                    btnSetupBlack.innerHTML = '🔄 Редактировать Белых';
                    
                    renderBoard(boardSetup);
                    renderInventory();
                    updateStartButton();
                    updateSetupPanelPlacement();
                }
            });
        }

        document.getElementById('btn-start-game').addEventListener('click', () => {
            if (isRaidSetupMode) {
                if (!engine.hasKing('white')) return; // Require king placement
                document.getElementById('modal-raid').classList.add('active');
            } else {
                startGameFromSetup();
            }
        });

        document.getElementById('btn-back-menu').addEventListener('click', () => {
            showScreen('menu');
        });

        document.getElementById('btn-leave-shop').addEventListener('click', () => {
            // Preserve stash items before resetting engine
            const savedItems = [...runManager.playerItems];
            // Clear enemy pieces from board before setup
            engine.reset();
            // Restore stash items after reset
            runManager.playerItems = savedItems;
            resetInventory();
            renderBoard(boardSetup);
            renderStashSetup();
            clearSetupOverlay();
            updateStartButton();
            showScreen('setup');
        });

        document.getElementById('btn-undo').addEventListener('click', () => {
            if (isAIThinking || engine.moveHistory.length === 0) return;
            if (isRoguelikeMode) return;
            engine.undoLastMove();
            recalcCapturedPieces();
            lastMove = null;
            if (engine.moveHistory.length > 0) {
                const last = engine.moveHistory[engine.moveHistory.length - 1];
                lastMove = { from: last.move.from, to: last.move.to };
            }
            deselectPiece();
            renderBoard(boardGame);
            updateMoveHistory();
            updateGameStatus();
            updateCapturedPieces();
        });

        // Surrender: show confirm modal first
        const modalSurrender = document.getElementById('modal-surrender');
        document.getElementById('btn-resign').addEventListener('click', () => {
            if (engine.gameOver) return;
            modalSurrender.classList.add('active');
        });
        document.getElementById('btn-surrender-cancel').addEventListener('click', () => {
            modalSurrender.classList.remove('active');
        });
        // NOTE: btn-surrender-confirm handler is below (the one with gameOver guard)

        // Settings Modal
        const modalSettings = document.getElementById('modal-settings');
        document.getElementById('btn-settings').addEventListener('click', () => {
            modalSettings.classList.add('active');
        });
        document.getElementById('btn-settings-close').addEventListener('click', () => {
            modalSettings.classList.remove('active');
        });
        
        let tutorialEnabled = true;
        const tutToggle = document.getElementById('setting-tutorial-toggle');
        // Initialize based on saved preference (or default true)
        const savedTutState = localStorage.getItem('chess_tut_enabled');
        if (savedTutState !== null) {
            tutorialEnabled = savedTutState === '1';
            tutToggle.checked = tutorialEnabled;
        }

        tutToggle.addEventListener('change', (e) => {
            tutorialEnabled = e.target.checked;
            localStorage.setItem('chess_tut_enabled', tutorialEnabled ? '1' : '0');
        });

        // Add manual start tutorial button listener
        document.getElementById('btn-start-tutorial').addEventListener('click', () => {
            modalSettings.classList.remove('active');
            if (window.Tutorial) {
                window.Tutorial.reset();
                window.Tutorial.start();
            }
        });

        // Close on backdrop click
        modalSurrender.addEventListener('click', (e) => {
            if (e.target === modalSurrender) modalSurrender.classList.remove('active');
        });

        document.getElementById('btn-surrender-confirm').addEventListener('click', () => {
            modalSurrender.classList.remove('active');
            if (engine.gameOver) return;
            engine.gameOver = true;
            engine.gameResult = 'black';
            engine.gameResultReason = 'resign';
            updateGameStatus();
            handleGameOver();
        });

        document.getElementById('btn-new-game-2').addEventListener('click', () => {
            modalGameover.classList.remove('active');
            showScreen('menu');
        });

        document.getElementById('btn-play-again').addEventListener('click', () => {
            modalGameover.classList.remove('active');
            if (isRoguelikeMode) {
                showScreen('menu');
            } else {
                engine.reset();
                resetInventory(isCreativeMode); // keep creative flag
                renderBoard(boardSetup);
                updateStartButton();
                showScreen('setup');
            }
        });

        document.getElementById('btn-to-menu').addEventListener('click', () => {
            modalGameover.classList.remove('active');
            showScreen('menu');
        });

        // --- Пресеты расстановок ---
        const btnSavePreset = document.getElementById('btn-save-preset');
        if (btnSavePreset) {
            btnSavePreset.addEventListener('click', onSavePresetClick);
        }
    }

    // --- Creative Mode ---
    function startCreativeMode(pvp) {
        isRoguelikeMode = false;
        isCreativeMode = true;
        isPvP = pvp;
        isBlackSetup = false;
        isMirrorMode = false;
        isRaidMode = false;
        isRaidSetupMode = false;

        engine.reset();
        resetInventory(true); // creative inventory

        // Load ALL items into stash (free)
        runManager.playerItems = Object.values(ITEMS_DB).map(item => ({ ...item }));

        lastMove = null; // Clear leftover highlights
        renderBoard(boardSetup);
        renderStashSetup();
        if (playerStashSetupEl) playerStashSetupEl.style.display = '';

        // Update panel title
        const panelTitle = document.querySelector('.inventory-panel .panel-title');
        if (panelTitle) panelTitle.textContent = isPvP ? window.t('setup.army.white') : window.t('setup.army.creative');

        // Show black setup toggle in creative mode
        const btnSetupBlack = document.getElementById('btn-setup-black');
        if (btnSetupBlack) {
            btnSetupBlack.style.display = '';
            btnSetupBlack.innerHTML = '🔄 ' + window.t('setup.btn.edit_black');
        }

        updateStartButton();
        showScreen('setup');
        clearSetupOverlay();
    }

    function startBlackSetup() {
        // Clear black side, keep white as placed
        isBlackSetup = true;

        // Remove any black pieces left from reset
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = engine.getPiece(r, c);
                if (p && p.color === 'black') engine.removePiece(r, c);
            }
        }

        // Reset inventory for black
        resetInventory(true);

        // Give black player a fresh set of all items too
        runManager.playerItems = Object.values(ITEMS_DB).map(item => ({ ...item }));

        // Update setup-zone: rows 0-1 for black
        boardSetup.querySelectorAll('.cell').forEach(cell => {
            const r = parseInt(cell.dataset.row);
            cell.classList.remove('setup-zone');
            if (r <= 1) cell.classList.add('setup-zone');
        });

        const panelTitle = document.querySelector('.inventory-panel .panel-title');
        if (panelTitle) panelTitle.textContent = window.t('setup.army.black');

        const btnSetupBlack = document.getElementById('btn-setup-black');
        if (btnSetupBlack) {
            btnSetupBlack.style.display = '';
            btnSetupBlack.innerHTML = '🔄 ' + window.t('setup.btn.edit_white');
        }

        lastMove = null; // Clear any leftover highlights
        renderBoard(boardSetup);
        renderInventory();
        renderStashSetup();
        updateStartButton();
        // Second player (black) now placing — shift the floating stash off the
        // board and show the "second player, place your pieces" prompt.
        updateSetupPanelPlacement();
    }

    // --- Helpers ---
    function clearSetupPieces() {
        const color = isBlackSetup ? 'black' : 'white';
        const startRow = isBlackSetup ? 0 : 6;
        const endRow = isBlackSetup ? 1 : 7;
        for (let r = startRow; r <= endRow; r++) {
            for (let c = 0; c < 8; c++) {
                const p = engine.getPiece(r, c);
                if (p && p.color === color && p instanceof PieceEntity) {
                    // Return items to stash
                    p.getItems().forEach(item => runManager.playerItems.push(item));
                    p.items = [null, null, null];
                    p.shield = 0;
                }
                engine.removePiece(r, c);
            }
        }
        resetInventory(isBlackSetup);
        renderStashSetup();
        lastMove = null;
        renderBoard(boardSetup);
        updateStartButton();
    }

    // Helper to clear residual overlay classes after showing the setup screen
    function clearSetupOverlay() {
        // Remove any lingering drop‑valid/invalid or dragging classes from cells
        document.querySelectorAll('.cell.drop-valid, .cell.drop-invalid, .cell.dragging, .cell.setup-zone').forEach(el => {
            el.classList.remove('drop-valid', 'drop-invalid', 'dragging', 'setup-zone');
        });
        // Ensure any in-flight pointer drag is fully torn down on screen change
        // (removes window listeners + ghost + state).
        cancelPointerDrag();
    }

    function startGameFromSetup() {
        if (!engine.hasKing(isBlackSetup ? 'black' : 'white')) return;

        // PvP Creative: after white setup, go to black setup
        if (isCreativeMode && isPvP && !isBlackSetup) {
            startBlackSetup();
            return;
        }

        if (isRoguelikeMode) {
            engine.setupBlackStandard();
            runManager.startRound(engine);
            const encounter = runManager.getCurrentEncounter();
            ai.setDepth(encounter.aiDepth || 2);
            document.getElementById('run-gold').textContent = `${runManager.gold} 🪙`;
            const roundNum = runManager.currentRound + 1;
            const totalRounds = runManager.encounters.length;
            const opponentNameEl = document.querySelector('.player-card.opponent .player-name');
            const opponentAvatarEl = document.querySelector('.player-card.opponent .player-avatar');

            if (encounter.isBoss) {
                const bName = window.t_item(encounter, 'bossName') || window.t_item(encounter, 'name');
                document.getElementById('run-round').textContent = `💀 ${window.t('run.boss')} ${roundNum}/${totalRounds}: ${bName}`;
                if (opponentNameEl) {
                    opponentNameEl.textContent = bName;
                    opponentNameEl.style.color = 'var(--danger)';
                    opponentNameEl.style.textShadow = '0 0 5px var(--danger)';
                }
                if (opponentAvatarEl) {
                    opponentAvatarEl.textContent = '💀';
                    opponentAvatarEl.style.color = 'var(--danger)';
                    opponentAvatarEl.style.textShadow = '0 0 8px var(--danger)';
                }
            } else {
                const eName = window.t_item(encounter, 'name');
                document.getElementById('run-round').textContent = `${window.t('run.round')} ${roundNum}/${totalRounds}: ${eName}`;
                if (opponentNameEl) {
                    opponentNameEl.textContent = eName;
                    opponentNameEl.style.color = '';
                    opponentNameEl.style.textShadow = '';
                }
                if (opponentAvatarEl) {
                    opponentAvatarEl.textContent = '♚';
                    opponentAvatarEl.style.color = '';
                    opponentAvatarEl.style.textShadow = '';
                }
            }
            document.getElementById('btn-undo').style.display = 'none';

        } else if (isCreativeMode && isPvP) {
            // PvP: black already placed, don't setup standard
            document.getElementById('run-gold').textContent = '';
            document.getElementById('run-round').textContent = window.t('run.creative_pvp');
            document.getElementById('btn-undo').style.display = 'none';
        } else if (isCreativeMode) {
            // Творческий режим против бота.
            // БАГ (исправлено): раньше здесь ВСЕГДА вызывался engine.setupBlackStandard(),
            // который затирал вручную расставленную армию чёрных вместе с её инвентарём.
            // Теперь стандартная армия ставится только если игрок сам не расставлял чёрных.
            if (!engine.hasAnyPiece('black')) {
                engine.setupBlackStandard();
            }
            document.getElementById('run-gold').textContent = '';
            document.getElementById('run-round').textContent = window.t('run.creative_bot');
            document.getElementById('btn-undo').style.display = 'block';
        } else if (isRaidMode) {
            _placeScavBotPieces();
            document.getElementById('run-gold').textContent = '';
            document.getElementById('run-round').textContent = 'Рейд (ЧВК)';
            document.getElementById('btn-undo').style.display = 'none'; // No undo in raids!
        } else if (isMirrorMode) {
            engine.setupBlackMirror();
            document.getElementById('run-gold').textContent = '';
            document.getElementById('run-round').textContent = window.t('menu.mirror');
            document.getElementById('btn-undo').style.display = 'block';
        } else {
            engine.setupBlackStandard();
            document.getElementById('run-gold').textContent = '';
            document.getElementById('run-round').textContent = window.t('run.classic');
            document.getElementById('btn-undo').style.display = 'block';
        }

        // Reset opponent panel to default for non-roguelike modes
        if (!isRoguelikeMode) {
            const opponentNameEl = document.querySelector('.player-card.opponent .player-name');
            const opponentAvatarEl = document.querySelector('.player-card.opponent .player-avatar');
            if (opponentNameEl) {
                opponentNameEl.textContent = isPvP ? window.t('game.player.black') : window.t('game.player.opponent');
                opponentNameEl.style.color = '';
                opponentNameEl.style.textShadow = '';
            }
            if (opponentAvatarEl) {
                opponentAvatarEl.textContent = '♚';
                opponentAvatarEl.style.color = '';
                opponentAvatarEl.style.textShadow = '';
            }
        }

        // Castling rights
        engine.castlingRights = {
            white: { kingSide: false, queenSide: false },
            black: { kingSide: true, queenSide: true }
        };
        const wk = engine.getPiece(7, 4);
        if (wk && wk.type === 'king' && wk.color === 'white') {
            if (engine.getPiece(7, 7)?.type === 'rook') engine.castlingRights.white.kingSide = true;
            if (engine.getPiece(7, 0)?.type === 'rook') engine.castlingRights.white.queenSide = true;
        }

        engine.currentTurn = 'white';
        engine.moveHistory = [];
        engine.enPassantTarget = null;
        engine.halfMoveClock = 0;
        engine.fullMoveNumber = 1;
        engine.gameOver = false;
        engine.gameResult = null;
        engine.gameResultReason = '';
        if (engine.captureLog) engine.captureLog = [];

        capturedPieces = { white: [], black: [] };
        lastMove = null;
        selectedCell = null;
        legalMovesForSelected = [];

        // Fully reset game board cells (clears in-check, last-move, etc. from previous game)
        boardGame.querySelectorAll('.cell').forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            cell.className = `cell ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
        });

        renderBoard(boardGame);
        updateMoveHistory();
        updateGameStatus();
        updateCapturedPieces();
        showScreen('game');
        renderIngameStash();
    }

    // --- Piece Inventory Modal ---

    const PIECE_NAMES = {
        king: window.t('piece.king') || 'Король', 
        queen: window.t('piece.queen') || 'Ферзь', 
        rook: window.t('piece.rook') || 'Ладья',
        bishop: window.t('piece.bishop') || 'Слон', 
        knight: window.t('piece.knight') || 'Конь', 
        pawn: window.t('piece.pawn') || 'Пешка'
    };

    function openPieceInventory(row, col) {
        const piece = engine.getPiece(row, col);
        if (!piece || !(piece instanceof PieceEntity)) return;

        pieceInvTarget = { row, col };
        const isReadOnly = currentScreen === 'game';

        // Header
        document.getElementById('piece-inv-icon').textContent = PIECE_SYMBOLS[piece.color]?.[piece.type] || '♟';
        if (piece.isBoss) {
            document.getElementById('piece-inv-title').textContent = piece.bossName || window.t('piece.' + piece.type);
            document.getElementById('piece-inv-title').style.color = 'var(--danger)';
            document.getElementById('piece-inv-subtitle').textContent = piece.bossDescription || 'Boss';
            document.getElementById('piece-inv-subtitle').style.color = 'var(--gold)';
        } else {
            document.getElementById('piece-inv-title').textContent = window.t('piece.' + piece.type) || piece.type;
            document.getElementById('piece-inv-title').style.color = '';
            document.getElementById('piece-inv-subtitle').textContent = isReadOnly ? window.t('piece.inv.subtitle.equipped') : window.t('piece.inv.subtitle.slots').replace('{count}', piece.getItems().length);
            document.getElementById('piece-inv-subtitle').style.color = '';
        }

        renderPieceInventorySlots(piece, isReadOnly);
        renderPieceInventoryStash(piece, isReadOnly);

        // Пресеты (тип + инвентарь фигуры): доступны только при редактировании
        // расстановки, но не в режиме просмотра во время игры.
        const presetSection = document.getElementById('piece-inv-preset-section');
        if (presetSection) presetSection.style.display = isReadOnly ? 'none' : '';
        if (!isReadOnly) renderPiecePresetList();

        // Bind remove button (hide in read-only)
        const removeBtn = document.getElementById('piece-inv-remove');
        if (isReadOnly) {
            removeBtn.style.display = 'none';
        } else {
            removeBtn.style.display = '';
            const newRemoveBtn = removeBtn.cloneNode(true);
            removeBtn.replaceWith(newRemoveBtn);
            newRemoveBtn.addEventListener('click', () => {
                removePieceFromInventory();
            });
        }

        // Bind close button
        const closeBtn = document.getElementById('piece-inv-close');
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.replaceWith(newCloseBtn);
        newCloseBtn.addEventListener('click', closePieceInventory);

        modalPieceInv.classList.add('active');
    }

    function closePieceInventory() {
        modalPieceInv.classList.remove('active');
        pieceInvTarget = null;
        if (currentScreen === 'setup') {
            renderBoard(boardSetup);
            renderStashSetup();
        } else {
            renderBoard(boardGame);
        }
    }

    function renderPieceInventorySlots(piece, isReadOnly) {
        const slotsContainer = document.getElementById('piece-inv-slots');
        const slotEls = slotsContainer.querySelectorAll('.piece-inv-slot');

        slotEls.forEach((slotEl, i) => {
            const item = piece.getItem(i);
            slotEl.className = 'piece-inv-slot';

            if (item) {
                slotEl.classList.add('filled', `rarity-${item.rarity || 'common'}`);
                slotEl.innerHTML = `
                    <div class="slot-label">${window.t('piece.inv.slot')} ${i + 1}</div>
                    <div class="slot-item-icon">${item.icon || '📦'}</div>
                    <div class="slot-item-name">${window.t_item(item, 'name')}</div>
                    <div class="slot-item-desc" style="font-size:0.7em; color:var(--text-muted); text-align:center; margin-top:2px; line-height:1.2;">${window.t_item(item, 'description')}</div>
                    ${!isReadOnly ? '<button class="slot-unequip" title="×">✕</button>' : ''}
                `;
                if (!isReadOnly) {
                    const unequipBtn = slotEl.querySelector('.slot-unequip');
                    unequipBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        unequipItemFromSlot(i);
                    });
                }
            } else {
                slotEl.innerHTML = `
                    <div class="slot-label">${window.t('piece.inv.slot')} ${i + 1}</div>
                    <div class="slot-content empty">${window.t('piece.inv.empty_slot')}</div>
                `;
            }
        });
    }

    function renderPieceInventoryStash(piece, isReadOnly) {
        const stashSection = document.getElementById('piece-inv-stash-section');
        if (isReadOnly) {
            if (stashSection) stashSection.style.display = 'none';
            return;
        }
        if (stashSection) stashSection.style.display = '';

        const listEl = document.getElementById('piece-inv-stash-list');
        const emptyMsg = document.getElementById('piece-inv-stash-empty');
        listEl.innerHTML = '';

        const hasEmptySlot = piece.getEmptySlot() !== -1;

        // In creative or test-drive mode — show full catalog; else show player stash
        const isCatalogMode = isCreativeMode || isRaidTestMode;
        const sourceItems = isCatalogMode
            ? Object.values(ITEMS_DB).map((item) => ({ item, idx: item.id }))
            : runManager.playerItems.map((item, idx) => ({ item, idx }));

        const visibleItems = sourceItems.filter(x => x.item);

        if (visibleItems.length === 0) {
            emptyMsg.classList.remove('hidden');
            return;
        }
        emptyMsg.classList.add('hidden');

        visibleItems.forEach(({ item, idx }) => {
            const allowed = item.allowedPieces || ['all'];
            const isAllowed = allowed.includes('all') || allowed.includes(piece.type);
            const canEquip = isAllowed && hasEmptySlot;

            const el = document.createElement('div');
            el.className = `piece-inv-stash-item rarity-${item.rarity || 'common'}`;
            if (!canEquip) el.classList.add('disabled');
            el.title = canEquip ? window.t('piece.inv.equip') + `: ${window.t_item(item, 'description')}` :
                       !isAllowed ? window.t('piece.inv.not_allowed') + ` ${window.t('piece.' + piece.type)}` :
                       window.t('piece.inv.no_slots');

            const tName = window.t_item(item, 'name');
            const tDesc = window.t_item(item, 'description');
            const infBadge = isCatalogMode ? `<span style="color:#a78bfa;font-size:0.75em;"> ∞</span>` : '';

            el.innerHTML = `
                <div class="stash-item-icon-wrap">${item.icon || '📦'}</div>
                <div class="stash-item-info" style="font-size:0.7em; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; padding:0 2px;">${tName}${infBadge}</div>
                <div class="item-tooltip"><strong>${tName}</strong><br>${tDesc}<br><em style="color:#9d93fa;">${canEquip ? window.t('piece.inv.click_equip') : (!isAllowed ? window.t('piece.inv.not_allowed') : window.t('piece.inv.no_slots'))}</em></div>
            `;

            if (canEquip) {
                el.addEventListener('click', () => {
                    isCatalogMode ? equipItemFromCatalog(item.id) : equipItemFromStash(idx);
                });
            }

            listEl.appendChild(el);
        });
    }

    // Equip item from catalog (creative mode - clone fresh)
    function equipItemFromCatalog(itemId) {
        if (!pieceInvTarget) return;
        const piece = engine.getPiece(pieceInvTarget.row, pieceInvTarget.col);
        if (!piece || !(piece instanceof PieceEntity)) return;

        const slot = piece.getEmptySlot();
        if (slot === -1) return;

        const catalogItem = ITEMS_DB[itemId];
        if (!catalogItem) return;

        piece.setItem(slot, { ...catalogItem, modifiers: { ...catalogItem.modifiers } });

        document.getElementById('piece-inv-subtitle').textContent = window.t('piece.inv.subtitle.slots').replace('{count}', piece.getItems().length);
        renderPieceInventorySlots(piece);
        renderPieceInventoryStash(piece);
    }

    function equipItemFromStash(stashIndex) {
        if (!pieceInvTarget) return;
        const piece = engine.getPiece(pieceInvTarget.row, pieceInvTarget.col);
        if (!piece || !(piece instanceof PieceEntity)) return;

        const slot = piece.getEmptySlot();
        if (slot === -1) return;

        const item = runManager.playerItems[stashIndex];
        if (!item) return;

        // Equip
        piece.setItem(slot, item);
        runManager.playerItems.splice(stashIndex, 1);

        // Re-render
        document.getElementById('piece-inv-subtitle').textContent = window.t('piece.inv.subtitle.slots').replace('{count}', piece.getItems().length);
        renderPieceInventorySlots(piece);
        renderPieceInventoryStash(piece);
    }

    function unequipItemFromSlot(slotIndex) {
        if (!pieceInvTarget) return;
        const piece = engine.getPiece(pieceInvTarget.row, pieceInvTarget.col);
        if (!piece || !(piece instanceof PieceEntity)) return;

        const item = piece.removeItem(slotIndex);
        if (item && !isCreativeMode) {
            // Only return to stash in non-creative mode
            runManager.playerItems.push(item);
        }

        document.getElementById('piece-inv-subtitle').textContent = window.t('piece.inv.subtitle.slots').replace('{count}', piece.getItems().length);
        renderPieceInventorySlots(piece);
        renderPieceInventoryStash(piece);
    }

    function removePieceFromInventory() {
        if (!pieceInvTarget) return;
        const { row, col } = pieceInvTarget;
        const piece = engine.getPiece(row, col);
        if (!piece) return;

        // Return items to stash only in normal mode
        if (piece instanceof PieceEntity && !isCreativeMode) {
            piece.getItems().forEach(item => {
                runManager.playerItems.push(item);
            });
        }
        if (piece instanceof PieceEntity) {
            piece.items = [null, null, null];
            piece.shield = 0;
        }

        // Return piece to inventory
        engine.removePiece(row, col);
        if (!isCreativeMode) {
            const invItem = inventory.find(i => i.type === piece.type);
            if (invItem) invItem.remaining++;
        }

        closePieceInventory();
        renderInventory();
        updateStartButton();
    }

    // --- Gameplay ---
    function onGameCellClick(e) {
        if (isAIThinking || engine.gameOver) return;
        const currentColor = engine.currentTurn;

        // In PvP both colors can click; in PvBot only white
        if (!isPvP && currentColor !== 'white') return;

        const cell = e.target.closest('.cell');
        if (!cell) return;
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const piece = engine.getPiece(r, c);

        if (selectedCell) {
            const move = legalMovesForSelected.find(m => m.to.row === r && m.to.col === c);
            if (move) {
                if (move.promotion) {
                    showPromotionModal(selectedCell.row, selectedCell.col, r, c);
                    return;
                }
                executePlayerMove(selectedCell.row, selectedCell.col, r, c);
                return;
            }
            if (piece && piece.color === currentColor) {
                // Click same selected piece => open inventory
                if (selectedCell.row === r && selectedCell.col === c) {
                    openPieceInventory(r, c);
                    deselectPiece();
                    return;
                }
                selectPiece(r, c);
                return;
            }
            deselectPiece();
            // Click enemy piece that is not a move target => open its info
            if (piece && piece.color !== currentColor) {
                openPieceInventory(r, c);
            }
            return;
        }

        if (piece) {
            if (piece.color === currentColor) {
                selectPiece(r, c);
            } else {
                openPieceInventory(r, c);
            }
        }
    }

    function selectPiece(row, col) {
        selectedCell = { row, col };
        legalMovesForSelected = engine.getLegalMovesForPiece(row, col);
        // Deduplicate promotions
        const seen = new Set();
        legalMovesForSelected = legalMovesForSelected.filter(m => {
            const key = `${m.to.row},${m.to.col}`;
            if (m.promotion) {
                if (seen.has(key)) return false;
                seen.add(key);
            }
            return true;
        });
        renderBoard(boardGame);
    }

    function deselectPiece() {
        selectedCell = null;
        legalMovesForSelected = [];
        renderBoard(boardGame);
    }

    function executePlayerMove(fromR, fromC, toR, toC, promotionType) {
        const result = engine.makeMove(fromR, fromC, toR, toC, promotionType);
        if (!result) return;

        lastMove = { from: result.move.from, to: result.move.to };

        if (result.captured) {
            capturedPieces.white.push(result.captured);

            // Loot enemy items in roguelike mode
            if (isRoguelikeMode && result.captured.color === 'black' && result.captured instanceof PieceEntity) {
                result.captured.getItems().forEach(item => {
                    if (item) runManager.lootItem(item);
                });
                renderIngameStash(); // Update stash UI immediately
            }
        }

        // Pick up gold earned by items (computed in engine.executeMoveAndUpdate)
        if (isRoguelikeMode && engine.goldEarned) {
            const earned = engine.goldEarned['white'] || 0;
            if (earned > 0) {
                runManager.gold += earned + 5; // item bonuses + base 5 per capture
                engine.goldEarned['white'] = 0;
                document.getElementById('run-gold').textContent = `${runManager.gold} 🪙`;
            } else if (result.captured) {
                runManager.gold += 5; // base gold even without item bonuses
                document.getElementById('run-gold').textContent = `${runManager.gold} 🪙`;
            }
        }

        deselectPiece();
        renderBoard(boardGame);
        updateMoveHistory();
        updateGameStatus();
        updateCapturedPieces();
        animateLastMove(boardGame);

        if (engine.gameOver) {
            handleGameOver();
            return;
        }

        // In PvP, no AI — just update status for next player
        if (isPvP) {
            updateGameStatus();
            return;
        }

        setTimeout(() => doAIMove(), 300);
    }

    function showPromotionModal(fromR, fromC, toR, toC) {
        promotionChoices.innerHTML = '';
        ['queen', 'rook', 'bishop', 'knight'].forEach(type => {
            const btn = document.createElement('button');
            btn.className = 'promotion-choice';
            btn.textContent = PIECE_SYMBOLS.white[type];
            btn.addEventListener('click', () => {
                modalPromotion.classList.remove('active');
                executePlayerMove(fromR, fromC, toR, toC, type);
            });
            promotionChoices.appendChild(btn);
        });
        modalPromotion.classList.add('active');
    }

    function doAIMove() {
        if (engine.gameOver || engine.currentTurn !== 'black') return;

        isAIThinking = true;
        updateGameStatus();
        showThinkingOverlay();

        setTimeout(() => {
            const bestMove = ai.getBestMove(engine);

            if (!bestMove) {
                isAIThinking = false;
                hideThinkingOverlay();
                return;
            }

            const result = engine.executeMoveAndUpdate(bestMove);
            lastMove = { from: bestMove.from, to: bestMove.to };

            if (result.captured) {
                capturedPieces.black.push(result.captured);
            }

            isAIThinking = false;
            hideThinkingOverlay();

            renderBoard(boardGame);
            updateMoveHistory();
            updateGameStatus();
            updateCapturedPieces();
            animateLastMove(boardGame);

            if (engine.gameOver) {
                handleGameOver();
            }
        }, 100);
    }

    function showThinkingOverlay() {
        const existing = boardGame.querySelector('.thinking-overlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.className = 'thinking-overlay';
        overlay.innerHTML = '<div class="thinking-spinner"></div>';
        boardGame.appendChild(overlay);
    }

    function hideThinkingOverlay() {
        const overlay = boardGame.querySelector('.thinking-overlay');
        if (overlay) overlay.remove();
    }

    function animateLastMove(container) {
        if (!lastMove) return;
        const cell = getCell(container, lastMove.to.row, lastMove.to.col);
        if (cell) {
            const piece = cell.querySelector('.piece');
            if (piece) {
                piece.classList.add('moving');
                setTimeout(() => piece.classList.remove('moving'), 300);
            }
        }
    }

    // --- UI Updates ---
    function updateMoveHistory() {
        moveHistoryEl.innerHTML = '';
        const history = engine.moveHistory;

        for (let i = 0; i < history.length; i += 2) {
            const moveNum = Math.floor(i / 2) + 1;
            const row = document.createElement('div');
            row.className = 'move-row';
            if (i >= history.length - 2) row.classList.add('latest');

            const numEl = document.createElement('span');
            numEl.className = 'move-number';
            numEl.textContent = moveNum + '.';
            row.appendChild(numEl);

            const whiteEl = document.createElement('span');
            whiteEl.className = 'move-white';
            whiteEl.textContent = history[i].notation;
            row.appendChild(whiteEl);

            if (i + 1 < history.length) {
                const blackEl = document.createElement('span');
                blackEl.className = 'move-black';
                blackEl.textContent = history[i + 1].notation;
                row.appendChild(blackEl);
            }

            moveHistoryEl.appendChild(row);
        }

        moveHistoryEl.scrollTop = moveHistoryEl.scrollHeight;
    }

    function updateGameStatus() {
        const statusText = gameStatusEl.querySelector('.status-text');
        gameStatusEl.classList.remove('thinking', 'check', 'gameover');

        if (engine.gameOver) {
            gameStatusEl.classList.add('gameover');
            if (engine.gameResult === 'draw') statusText.textContent = window.t('game.status.draw');
            else if (engine.gameResult === 'white') statusText.textContent = window.t('game.status.white_win');
            else statusText.textContent = window.t('game.status.black_win');
        } else if (isAIThinking) {
            gameStatusEl.classList.add('thinking');
            statusText.textContent = window.t('game.status.thinking');
        } else if (engine.isInCheck(engine.currentTurn)) {
            gameStatusEl.classList.add('check');
            statusText.textContent = engine.currentTurn === 'white' ? window.t('game.status.white_check') : window.t('game.status.black_check');
        } else {
            statusText.textContent = engine.currentTurn === 'white' ? window.t('game.status.white_turn') : window.t('game.status.black_turn');
        }

        document.querySelector('.player-card.player')?.classList.toggle('active-turn', engine.currentTurn === 'white' && !engine.gameOver);
        document.querySelector('.player-card.opponent')?.classList.toggle('active-turn', engine.currentTurn === 'black' && !engine.gameOver);
    }

    function updateCapturedPieces() {
        const whiteCapEl = document.getElementById('white-captured');
        const blackCapEl = document.getElementById('black-captured');
        if (whiteCapEl) whiteCapEl.textContent = capturedPieces.white.map(p => engine.getSymbol(p)).join('');
        if (blackCapEl) blackCapEl.textContent = capturedPieces.black.map(p => engine.getSymbol(p)).join('');
    }

    function handleGameOver() {
        // Raid mode intercept
        if (isRaidMode) { _handleRaidGameOver(); return; }

        if (isRoguelikeMode && engine.gameResult === 'white') {
            // Capture values BEFORE onRoundWin() increments currentRound
            const goldBonus = runManager.computeGoldOnWin(engine);
            const roundGold = runManager.getCurrentEncounter()?.goldReward || 0;

            // --- Collect item IDs equipped on white pieces for winrate tracking ---
            const equippedIds = [];
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const p = engine.board[r][c];
                    if (p && p.color === 'white' && p instanceof PieceEntity) {
                        p.getItems().forEach(it => { if (it) equippedIds.push(it.id); });
                    }
                }
            }
            ItemStats.recordWin(equippedIds);

            // Return all equipped items from player pieces back to stash
            runManager.collectItemsFromBoard(engine);

            // Recruit surviving enemy pieces
            let recruitedCount = 0;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const p = engine.board[r][c];
                    if (p && p.color === 'black' && p.type !== 'king') {
                        runManager.recruitPiece(p.type);
                        recruitedCount++;
                    }
                }
            }

            runManager.onRoundWin();
            runManager.gold += goldBonus;

            // Reset currentShopItems so next shop visit has fresh items
            currentShopItems = [];

            const recruitText = recruitedCount > 0 ? `\n` + window.t('gameover.recruit').replace('{count}', recruitedCount) : '';

            if (runManager.state === 'victory') {
                const text = window.t('gameover.run.win.text').replace('{gold}', runManager.gold) + recruitText;
                showGameOverModal('🏆 ' + window.t('gameover.run.win.title'), text, false);
            } else {
                const text = `+${roundGold} 🪙 ` + window.t('gameover.round.win.text') + recruitText;
                showGameOverModal('⚔️ ' + window.t('gameover.round.win.title'), text, true);
            }
        } else if (isRoguelikeMode && engine.gameResult === 'black') {
            // --- Record loss for all equipped items ---
            const equippedIds = [];
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const p = engine.board[r][c];
                    if (p && p.color === 'white' && p instanceof PieceEntity) {
                        p.getItems().forEach(it => { if (it) equippedIds.push(it.id); });
                    }
                }
            }
            ItemStats.recordLoss(equippedIds);

            runManager.onRoundLose();
            showGameOverModal('💀 ' + window.t('gameover.title.lose'), window.t('gameover.run.lose'), false);
        } else {
            showGameOverModalDefault();
        }
    }

    function showGameOverModal(title, text, isShopTransition) {
        const icon = document.getElementById('gameover-icon');
        const titleEl = document.getElementById('gameover-title');
        const textEl = document.getElementById('gameover-text');
        const btnPlayAgain = document.getElementById('btn-play-again');
        const btnToMenu = document.getElementById('btn-to-menu');

        icon.textContent = isShopTransition ? '🪙' : (engine.gameResult === 'white' ? '🏆' : '💀');
        titleEl.textContent = title;
        textEl.textContent = text;
        
        btnPlayAgain.textContent = isShopTransition ? window.t('gameover.btn.shop') : window.t('gameover.btn.restart');

        // Replace button to clear old listeners
        const newBtn = btnPlayAgain.cloneNode(true);
        btnPlayAgain.replaceWith(newBtn);
        newBtn.addEventListener('click', () => {
            modalGameover.classList.remove('active');
            if (isShopTransition) {
                openShop();
            } else {
                document.getElementById('btn-new-run').click();
            }
        });
        
        // Setup menu button
        const newMenuBtn = btnToMenu.cloneNode(true);
        btnToMenu.replaceWith(newMenuBtn);
        newMenuBtn.addEventListener('click', () => {
            modalGameover.classList.remove('active');
            showScreen('menu');
        });

        setTimeout(() => modalGameover.classList.add('active'), 500);
    }

    function showGameOverModalDefault() {
        const icon = document.getElementById('gameover-icon');
        const title = document.getElementById('gameover-title');
        const text = document.getElementById('gameover-text');
        const btnPlayAgain = document.getElementById('btn-play-again');
        const btnToMenu = document.getElementById('btn-to-menu');

        if (engine.gameResult === 'white') {
            icon.textContent = '🏆'; title.textContent = window.t('gameover.title.win');
            text.textContent = window.t('gameover.text.win');
        } else if (engine.gameResult === 'black') {
            icon.textContent = '💀'; title.textContent = window.t('gameover.title.lose');
            text.textContent = window.t('gameover.text.lose');
        } else {
            icon.textContent = '🤝'; title.textContent = window.t('gameover.title.draw');
            text.textContent = engine.gameResultReason === 'stalemate' ? window.t('gameover.text.stalemate') :
                engine.gameResultReason === '50-move rule' ? window.t('gameover.text.50move') : window.t('gameover.text.material');
        }

        btnPlayAgain.textContent = window.t('gameover.btn.restart');

        const newBtn = btnPlayAgain.cloneNode(true);
        btnPlayAgain.replaceWith(newBtn);
        newBtn.addEventListener('click', () => {
            modalGameover.classList.remove('active');
            if (isCreativeMode) {
                document.getElementById('btn-creative').click();
            } else if (isMirrorMode) {
                document.getElementById('btn-mirror-match').click();
            } else if (isPvP) {
                // Restart PvP by going back to menu
                showScreen('menu');
            } else {
                showScreen('menu');
            }
        });

        const newMenuBtn = btnToMenu.cloneNode(true);
        btnToMenu.replaceWith(newMenuBtn);
        newMenuBtn.addEventListener('click', () => {
            modalGameover.classList.remove('active');
            showScreen('menu');
        });

        setTimeout(() => modalGameover.classList.add('active'), 500);
    }

    function recalcCapturedPieces() {
        capturedPieces = { white: [], black: [] };
        for (const entry of engine.moveHistory) {
            if (entry.captured) {
                const moverColor = entry.captured.color === 'white' ? 'black' : 'white';
                capturedPieces[moverColor].push(entry.captured);
            }
        }
    }

    // --- Start ---
    /* ============================================
       Система пресетов расстановок
       Сохранение/загрузка позиций фигур, их типов,
       сторон, щитов и инвентаря в localStorage.
       ============================================ */

    const PRESETS_STORAGE_KEY = 'qqChess.presets';

    // --- Работа с localStorage (с обработкой ошибок) ---

    function loadPresets() {
        try {
            const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Не удалось прочитать пресеты из localStorage:', e);
            return [];
        }
    }

    function savePresets(presets) {
        try {
            localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
            return true;
        } catch (e) {
            console.error('Не удалось сохранить пресеты в localStorage:', e);
            // Частая причина — переполнение квоты хранилища
            const msg = (e && e.name === 'QuotaExceededError')
                ? 'Недостаточно места в хранилище браузера. Удалите часть пресетов.'
                : 'Не удалось сохранить пресет (ошибка хранилища браузера).';
            alert(msg);
            return false;
        }
    }

    // --- Сериализация / применение пресета одной фигуры ---

    // Пресет хранит ТОЛЬКО тип фигуры и её инвентарь
    // (набор предметов/способностей/характеристик), но НЕ позицию
    // и НЕ всю доску. Характеристики фигуры полностью определяются
    // её типом и предметами (см. PieceEntity.getStats()), поэтому
    // достаточно сохранить type + baseType + items (+ производный shield).
    function serializePiecePreset(piece) {
        if (!piece) return null;
        // Инвентарь: сохраняем предметы по слотам вместе с модификаторами.
        const items = (piece.items || []).map(item =>
            item ? { ...item, modifiers: { ...(item.modifiers || {}) } } : null
        );
        return {
            version: 2,
            type: piece.type,
            baseType: piece.baseType || piece.type,
            shield: piece.shield || 0,
            items: items
        };
    }

    // Применяем пресет к конкретной фигуре: задаём её тип и инвентарь.
    // Доска и позиции фигур при этом не трогаются.
    function applyPiecePreset(piece, data) {
        if (!piece || !(piece instanceof PieceEntity) || !data) return false;
        // Пресет обязан содержать инвентарь. Старый формат (вся доска,
        // data.pieces[]) больше не поддерживается.
        if (!Array.isArray(data.items)) return false;

        // Тип фигуры
        if (data.type) {
            piece.type = data.type;
            piece.baseType = data.baseType || data.type;
        }

        // Инвентарь: полностью пересобираем слоты
        piece.items = [null, null, null];
        for (let slot = 0; slot < data.items.length && slot < 3; slot++) {
            const item = data.items[slot];
            if (item) {
                piece.setItem(slot, { ...item, modifiers: { ...(item.modifiers || {}) } });
            }
        }
        piece._recomputeShield();
        return true;
    }

    // --- Обработчики UI ---

    // Сохранение пресета вызывается из окна инвентаря фигуры и
    // сохраняет тип + инвентарь текущей открытой фигуры.
    function onSavePresetClick() {
        if (!pieceInvTarget) {
            alert('Откройте фигуру (кликните по ней на доске), чтобы сохранить её как пресет.');
            return;
        }
        const piece = engine.getPiece(pieceInvTarget.row, pieceInvTarget.col);
        if (!piece || !(piece instanceof PieceEntity)) return;

        const name = (prompt('Название пресета:') || '').trim();
        if (!name) return; // отмена или пустое имя

        const presets = loadPresets();
        const now = new Date().toISOString();
        const data = serializePiecePreset(piece);

        // Проверка на существующее название с подтверждением перезаписи
        const existingIndex = presets.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
        if (existingIndex !== -1) {
            if (!confirm(`Пресет «${name}» уже существует. Перезаписать?`)) return;
            presets[existingIndex].data = data;
            presets[existingIndex].updatedAt = now;
        } else {
            presets.push({
                id: 'preset_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
                name: name,
                createdAt: now,
                updatedAt: now,
                data: data
            });
        }

        if (savePresets(presets)) {
            renderPresetsList();
            renderPiecePresetList();
        }
    }

    // Применяем пресет к фигуре, открытой в окне инвентаря.
    function applyPresetToCurrentPiece(id) {
        if (!pieceInvTarget) return;
        const piece = engine.getPiece(pieceInvTarget.row, pieceInvTarget.col);
        if (!piece || !(piece instanceof PieceEntity)) return;

        const presets = loadPresets();
        const preset = presets.find(p => p.id === id);
        if (!preset) return;

        if (applyPiecePreset(piece, preset.data)) {
            // Обновляем шапку и содержимое окна под новый тип/инвентарь
            document.getElementById('piece-inv-icon').textContent = PIECE_SYMBOLS[piece.color]?.[piece.type] || '♟';
            document.getElementById('piece-inv-title').textContent = window.t('piece.' + piece.type) || piece.type;
            document.getElementById('piece-inv-subtitle').textContent = window.t('piece.inv.subtitle.slots').replace('{count}', piece.getItems().length);
            renderPieceInventorySlots(piece);
            renderPieceInventoryStash(piece);
            updateStartButton();
        } else {
            alert('Не удалось применить пресет: повреждённые или устаревшие данные.');
        }
    }

    function renamePresetById(id) {
        const presets = loadPresets();
        const preset = presets.find(p => p.id === id);
        if (!preset) return;

        const newName = (prompt('Новое название пресета:', preset.name) || '').trim();
        if (!newName || newName === preset.name) return;

        // Проверка на конфликт имён
        const conflict = presets.find(p => p.id !== id && p.name.toLowerCase() === newName.toLowerCase());
        if (conflict) {
            alert(`Пресет с названием «${newName}» уже существует.`);
            return;
        }

        preset.name = newName;
        preset.updatedAt = new Date().toISOString();
        if (savePresets(presets)) {
            renderPresetsList();
            renderPiecePresetList();
        }
    }

    function deletePresetById(id) {
        const presets = loadPresets();
        const preset = presets.find(p => p.id === id);
        if (!preset) return;
        if (!confirm(`Удалить пресет «${preset.name}»?`)) return;

        const filtered = presets.filter(p => p.id !== id);
        if (savePresets(filtered)) {
            renderPresetsList();
            renderPiecePresetList();
        }
    }

    function formatPresetDate(iso) {
        try {
            const d = new Date(iso);
            return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    }

    // Собираем DOM-элемент одного пресета.
    // showApply=true — добавляет кнопку «Применить» (используется в окне фигуры,
    // где есть конкретная фигура-цель).
    function buildPresetItem(preset, showApply) {
        const item = document.createElement('div');
        item.className = 'preset-item';

        const info = document.createElement('div');
        info.style.cssText = 'flex:1; min-width:0;';
        const nameEl = document.createElement('div');
        nameEl.className = 'preset-name';
        nameEl.textContent = preset.name;
        nameEl.title = preset.name;
        const dateEl = document.createElement('div');
        dateEl.className = 'preset-date';
        dateEl.textContent = formatPresetDate(preset.updatedAt || preset.createdAt);
        info.appendChild(nameEl);
        info.appendChild(dateEl);

        const actions = document.createElement('div');
        actions.className = 'preset-actions';

        if (showApply) {
            const btnApply = document.createElement('button');
            btnApply.className = 'preset-btn';
            btnApply.textContent = '📥';
            btnApply.title = 'Применить к этой фигуре';
            btnApply.addEventListener('click', () => applyPresetToCurrentPiece(preset.id));
            actions.appendChild(btnApply);
        }

        const btnRename = document.createElement('button');
        btnRename.className = 'preset-btn';
        btnRename.textContent = '✏️';
        btnRename.title = 'Переименовать';
        btnRename.addEventListener('click', () => renamePresetById(preset.id));

        const btnDelete = document.createElement('button');
        btnDelete.className = 'preset-btn preset-btn-danger';
        btnDelete.textContent = '🗑️';
        btnDelete.title = 'Удалить';
        btnDelete.addEventListener('click', () => deletePresetById(preset.id));

        actions.appendChild(btnRename);
        actions.appendChild(btnDelete);

        item.appendChild(info);
        item.appendChild(actions);
        return item;
    }

    // Список пресетов в боковой панели расстановки — только управление
    // (переименование/удаление). Применять пресет можно из окна фигуры,
    // так как для применения нужна конкретная фигура-цель.
    function renderPresetsList() {
        const listEl = document.getElementById('presets-list');
        if (!listEl) return;

        const presets = loadPresets();
        listEl.innerHTML = '';

        if (presets.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'presets-empty';
            empty.textContent = 'Нет сохранённых пресетов';
            listEl.appendChild(empty);
            return;
        }

        presets
            .slice()
            .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
            .forEach(preset => listEl.appendChild(buildPresetItem(preset, false)));
    }

    // Список пресетов внутри окна инвентаря фигуры — с кнопкой «Применить».
    function renderPiecePresetList() {
        const listEl = document.getElementById('piece-inv-presets-list');
        if (!listEl) return;

        const presets = loadPresets();
        listEl.innerHTML = '';

        if (presets.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'presets-empty';
            empty.textContent = 'Нет сохранённых пресетов';
            listEl.appendChild(empty);
            return;
        }

        presets
            .slice()
            .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
            .forEach(preset => listEl.appendChild(buildPresetItem(preset, true)));
    }

    /* ============================================
       RAID (EXTRACTION) MODE
       ============================================ */

    function bindRaidEvents() {

        // Open faction modal -> changed to open setup instead
        document.getElementById('btn-raid')?.addEventListener('click', () => {
            isRaidMode = true;
            isRaidSetupMode = true;
            isRoguelikeMode = false;
            isCreativeMode  = false;
            isPvP           = false;
            isMirrorMode    = false;
            isBlackSetup    = false;
            raidLootSelected = [];

            engine.reset();
            runManager.playerItems = [];
            resetInventory(false);
            renderBoard(boardSetup);
            renderStashSetup();
            clearSetupOverlay();

            const startBtn = document.getElementById('btn-start-game');
            if (startBtn) {
                startBtn.innerHTML = '<span class="btn-icon">⚔️</span> <span>В БОЙ</span>';
            }

            document.querySelector('.setup-layout')?.classList.add('setup-vertical-layout');
            showScreen('setup');
            updateStartButton();
        });

        document.getElementById('btn-raid-modal-close')?.addEventListener('click', () => {
            document.getElementById('modal-raid').classList.remove('active');
        });

        // Faction buttons
        document.getElementById('btn-raid-pmc')?.addEventListener('click', () => {
            document.getElementById('modal-raid').classList.remove('active');
            isRaidSetupMode = false;
            isRaidScav = false;
            startGameFromSetup(); // start with the setup they just made
        });
        document.getElementById('btn-raid-scav')?.addEventListener('click', () => {
            document.getElementById('modal-raid').classList.remove('active');
            isRaidSetupMode = false;
            startScavRaid(); // bypass setup, generate random
        });

        // --- Task 1: Test-Drive toggle ---
        document.getElementById('raid-test-mode-toggle')?.addEventListener('change', (e) => {
            isRaidTestMode = e.target.checked;
            // Re-render so stash and inventory reflect infinite mode
            renderInventory();
            renderStashSetup();
            // Visual feedback on the wrapper
            const wrap = document.getElementById('raid-test-toggle-wrap');
            if (wrap) wrap.classList.toggle('raid-test-mode-active', isRaidTestMode);
        });


        document.getElementById('btn-raid-stash')?.addEventListener('click', () => {
            renderRaidStash();
            document.getElementById('modal-raid-stash').classList.add('active');
        });
        document.getElementById('btn-raid-stash-close')?.addEventListener('click', () => {
            document.getElementById('modal-raid-stash').classList.remove('active');
        });

        // Loot confirm / skip
        document.getElementById('btn-raid-loot-confirm')?.addEventListener('click', confirmRaidLoot);
        document.getElementById('btn-raid-loot-skip')?.addEventListener('click', () => {
            document.getElementById('modal-raid-loot').classList.remove('active');
            showScreen('menu');
        });
    }

    // ── Start a Scav raid (Bypasses setup) ─────────────────────────────────
    function startScavRaid() {
        isRaidScav = true;
        engine.reset();
        runManager.playerItems = [];
        
        _placeScavPlayerPieces();  // random black pieces, top half
        _placePMCBotPieces();      // white PMC bot in bottom half

        // Start the game manually without startGameFromSetup (since we skipped the normal flow)
        engine.currentTurn = 'white';
        engine.moveHistory = [];
        engine.gameOver = false;
        engine.gameResult = null;
        engine.gameResultReason = '';
        lastMove = null;
        capturedPieces = { white: [], black: [] };

        showScreen('game');
        renderBoard(boardGame);
        updateGameStatus();
        renderMoveHistory();
        renderIngameStash();

        // White bot moves first
        setTimeout(() => {
            if (!engine.gameOver) {
                ai.makeMove(engine, 'white');
                renderBoard(boardGame);
                updateGameStatus();
                renderMoveHistory();
            }
        }, 400);
    }

    function _pieceTypes(counts) {
        const out = [];
        for (const [type, n] of Object.entries(counts)) {
            for (let i = 0; i < n; i++) out.push(type);
        }
        return out;
    }

    function _placeRandomInRows(types, color, rowStart, rowEnd) {
        // collect free cells in the row range
        const cells = [];
        for (let r = rowStart; r <= rowEnd; r++)
            for (let c = 0; c < 8; c++)
                if (!engine.board[r][c]) cells.push([r, c]);
        // shuffle
        for (let i = cells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cells[i], cells[j]] = [cells[j], cells[i]];
        }
        const shuffled = _pieceTypes(types);
        for (let i = 0; i < shuffled.length && i < cells.length; i++) {
            const [r, c] = cells[i];
            engine.board[r][c] = new PieceEntity(shuffled[i], color);
        }
    }

    // Scav player: random black pieces in rows 0-3
    function _placeScavPlayerPieces() {
        const scavTypes = { king: 1, queen: 0, rook: 1, bishop: 1, knight: 1, pawn: 4 };
        // shuffle a bit
        const extraPool = ['queen','rook','bishop','knight','pawn'];
        const extraCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < extraCount; i++) {
            const t = extraPool[Math.floor(Math.random() * extraPool.length)];
            scavTypes[t] = (scavTypes[t] || 0) + 1;
        }
        _placeRandomInRows(scavTypes, 'black', 0, 3);
    }

    // PMC bot (white) in rows 4-7 (behind scav player)
    function _placePMCBotPieces() {
        _placeRandomInRows({ king: 1, queen: 1, rook: 2, bishop: 1, knight: 2, pawn: 5 }, 'white', 4, 7);
    }

    // PMC player (white): standard setup in rows 6-7
    function _placePMCPlayerPieces() {
        const backRank = ['rook','knight','bishop','queen','king','bishop','knight','rook'];
        for (let c = 0; c < 8; c++) {
            engine.board[7][c] = new PieceEntity(backRank[c], 'white');
            engine.board[6][c] = new PieceEntity('pawn', 'white');
        }
    }

    // Scav bot (black): random pieces in rows 0-3
    function _placeScavBotPieces() {
        _placeRandomInRows({ king: 1, rook: 1, bishop: 1, knight: 1, pawn: 5 }, 'black', 0, 3);
    }

    // ── Intercept: handled by inline check in handleGameOver above
    function _handleRaidGameOver() {
        const result = engine.gameResult;
        // PMC (white) wins = white, Scav (black) wins = black
        const playerWon = isRaidScav ? (result === 'black') : (result === 'white');

        if (playerWon) {
            _showRaidLootScreen();
        } else {
            // Loss — show simple game over
            const icon  = document.getElementById('gameover-icon');
            const title = document.getElementById('gameover-title');
            const text  = document.getElementById('gameover-text');
            const btnAgain = document.getElementById('btn-play-again');
            const btnMenu  = document.getElementById('btn-to-menu');
            if (icon)  icon.textContent  = '💀';
            if (title) title.textContent = isRaidScav ? 'Дикий убит' : 'ЧВК разбит';
            if (text)  text.textContent  = 'Вы потеряли рейд. Схрон не пострадал.';
            if (btnAgain) {
                btnAgain.textContent = 'Ещё раз';
                const nb = btnAgain.cloneNode(true);
                btnAgain.replaceWith(nb);
                nb.addEventListener('click', () => {
                    modalGameover.classList.remove('active');
                    document.getElementById('btn-raid').click();
                });
            }
            if (btnMenu) {
                const nm = btnMenu.cloneNode(true);
                btnMenu.replaceWith(nm);
                nm.addEventListener('click', () => { modalGameover.classList.remove('active'); showScreen('menu'); });
            }
            setTimeout(() => modalGameover.classList.add('active'), 500);
        }
    }

    // ── Loot screen ───────────────────────────────────────────
    function _showRaidLootScreen() {
        raidLootSelected = [];
        const allIds = Object.keys(ITEMS_DB);
        // Generate 5 random items weighted slightly toward better rarities
        const lootPool = [];
        for (let i = 0; i < 5; i++) {
            lootPool.push(allIds[Math.floor(Math.random() * allIds.length)]);
        }

        const grid = document.getElementById('raid-loot-grid');
        if (!grid) return;
        grid.innerHTML = '';

        lootPool.forEach(itemId => {
            const item = ITEMS_DB[itemId];
            if (!item) return;
            const name = window.t_item ? window.t_item(item, 'name') : (item.name?.ru || itemId);
            const el   = document.createElement('div');
            el.className = `raid-loot-item rarity-${item.rarity || 'common'}`;
            el.dataset.itemId = itemId;
            el.innerHTML = `
                <div class="item-icon">${item.icon || '📦'}</div>
                <div class="item-name">${name}</div>
            `;
            el.addEventListener('click', () => {
                const idx = raidLootSelected.indexOf(itemId);
                if (idx > -1) {
                    raidLootSelected.splice(idx, 1);
                    el.classList.remove('selected');
                } else if (raidLootSelected.length < 3) {
                    raidLootSelected.push(itemId);
                    el.classList.add('selected');
                }
                const countEl = document.getElementById('raid-loot-count');
                if (countEl) countEl.textContent = raidLootSelected.length;
            });
            grid.appendChild(el);
        });

        document.getElementById('raid-loot-count').textContent = '0';
        document.getElementById('modal-raid-loot').classList.add('active');
    }

    function confirmRaidLoot() {
        if (typeof ExtractionManager !== 'undefined' && raidLootSelected.length > 0) {
            ExtractionManager.addItems(raidLootSelected);
        }
        document.getElementById('modal-raid-loot').classList.remove('active');
        showScreen('menu');
    }

    // ── Stash viewer (Tarkov grid) ────────────────────────────
    function renderRaidStash() {
        const GRID_COLS = 6;
        const GRID_CELLS = GRID_COLS * 4; // 24 cells

        const stash = typeof ExtractionManager !== 'undefined'
            ? ExtractionManager.getStash()
            : { items: [], extraPieces: [] };

        // --- Piece stash ---
        const piecesEl     = document.getElementById('raid-stash-pieces');
        const piecesEmpty  = document.getElementById('raid-stash-pieces-empty');
        if (piecesEl) {
            piecesEl.innerHTML = '';
            if (stash.extraPieces.length === 0) {
                piecesEmpty && (piecesEmpty.style.display = '');
            } else {
                piecesEmpty && (piecesEmpty.style.display = 'none');
                stash.extraPieces.forEach(p => {
                    const chip = document.createElement('div');
                    chip.className = 'raid-piece-chip';
                    const sym = (typeof PIECE_SYMBOLS !== 'undefined' && PIECE_SYMBOLS.white?.[p.type]) || '♟';
                    chip.innerHTML = `<span class="piece-icon">${sym}</span> ${p.type}`;
                    piecesEl.appendChild(chip);
                });
            }
        }

        // --- Item grid (Tarkov-style) ---
        const gridEl    = document.getElementById('raid-stash-items');
        const itemEmpty = document.getElementById('raid-stash-items-empty');
        if (gridEl) {
            gridEl.innerHTML = '';
            if (stash.items.length === 0) {
                itemEmpty && (itemEmpty.style.display = '');
            } else {
                itemEmpty && (itemEmpty.style.display = 'none');
                // Fill grid cells
                for (let i = 0; i < GRID_CELLS; i++) {
                    const cell = document.createElement('div');
                    const itemId = stash.items[i];
                    if (itemId && ITEMS_DB[itemId]) {
                        const item = ITEMS_DB[itemId];
                        const name = window.t_item ? window.t_item(item, 'name') : (item.name?.ru || itemId);
                        const desc = window.t_item ? window.t_item(item, 'description') : (item.description?.ru || '');
                        cell.className = 'raid-grid-cell has-item';
                        cell.dataset.rarity = item.rarity || 'common';
                        cell.innerHTML = `
                            ${item.icon || '📦'}
                            <span class="item-rarity-dot"></span>
                            <div class="raid-grid-tooltip">
                                <strong>${name}</strong><br>
                                <span style="opacity:0.7; font-size:0.75em;">${desc}</span>
                            </div>
                        `;
                    } else {
                        cell.className = 'raid-grid-cell';
                    }
                    gridEl.appendChild(cell);
                }
            }
        }
    }

    init();
    bindRaidEvents();
})();

