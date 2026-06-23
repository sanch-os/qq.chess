/* ============================================
   Chess App — UI & Game Flow
   ============================================ */

(function () {
    'use strict';

    // --- State ---
    let engine = new ChessEngine();
    let ai = new ChessAI(3);
    let runManager = new RunManager();
    let isRoguelikeMode = false;
    let isCreativeMode = false;
    let isPvP = false;
    let isBlackSetup = false; // true when black player is placing pieces in PvP

    let currentScreen = 'menu';
    let selectedCell = null;
    let legalMovesForSelected = [];
    let lastMove = null;
    let isAIThinking = false;
    let capturedPieces = { white: [], black: [] };
    let draggedPiece = null;
    let draggedItem = null; // { itemIndex: number }
    let dragGhost = null;

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
        buildBoard(boardSetup, 'setup');
        buildBoard(boardGame, 'game');
        bindEvents();
        populateMenuBackground();
        showScreen('menu');
    }

    // --- Screen Management ---
    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        if (screens[name]) screens[name].classList.add('active');
        currentScreen = name;
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
                    if (r >= 6) cell.classList.add('setup-zone');
                    cell.addEventListener('click', onSetupCellClick);
                    cell.addEventListener('dragover', onSetupDragOver);
                    cell.addEventListener('drop', onSetupDrop);
                    cell.addEventListener('dragleave', onSetupDragLeave);
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
                pieceEl.textContent = engine.getSymbol(piece);

                // Item badge: count equipped items (non-null slots)
                if (piece instanceof PieceEntity) {
                    const equippedItems = piece.getItems();
                    if (equippedItems.length > 0) {
                        const badge = document.createElement('div');
                        badge.className = 'item-badge';
                        badge.textContent = equippedItems.length;
                        // Color by rarity of first item
                        const rarityColors = { common: '#9a95b0', rare: '#4488ff', epic: '#9d93fa', legendary: '#f0c048' };
                        badge.style.borderColor = rarityColors[equippedItems[0].rarity] || '#9a95b0';
                        pieceEl.appendChild(badge);
                    }
                }

                if (container === boardSetup && piece.color === 'white') {
                    pieceEl.setAttribute('draggable', 'true');
                    pieceEl.addEventListener('dragstart', onBoardPieceDragStart);
                    // Fix: add dragend on the piece element so ghost is removed even when drop fails
                    pieceEl.addEventListener('dragend', onDragEnd);
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
                // If clicking the currently selected piece, open its inventory
                if (selectedCell.row === r && selectedCell.col === c) {
                    openPieceInventory(r, c);
                    deselectPiece();
                    return;
                }
                selectPiece(r, c);
                return;
            }
            deselectPiece();
            
            // If clicked an enemy piece while not a move target, open its inventory
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
        inventory.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = `inventory-item ${item.remaining <= 0 ? 'used' : ''}`;
            el.textContent = PIECE_SYMBOLS.white[item.type];
            el.setAttribute('draggable', item.remaining > 0 ? 'true' : 'false');
            el.dataset.type = item.type;
            el.dataset.index = index;

            if (item.total > 1) {
                const count = document.createElement('span');
                count.className = 'item-count';
                count.textContent = `×${item.remaining}`;
                el.appendChild(count);
            }

            el.addEventListener('dragstart', onInventoryDragStart);
            el.addEventListener('dragend', onDragEnd);
            inventoryEl.appendChild(el);
        });
    }

    function renderStashSetup() {
        if (!playerStashSetupEl) return;
        playerStashSetupEl.innerHTML = '';
        // runManager.playerItems is the stash (items not yet equipped)
        runManager.playerItems.forEach((item, idx) => {
            if (!item) return;
            const el = document.createElement('div');
            el.className = `stash-item rarity-${item.rarity || 'common'}`;
            el.innerHTML = `<div class="item-icon">${item.icon || '📦'}</div>
                            <div class="item-tooltip"><strong>${item.name}</strong><br>${item.description}</div>`;
            el.setAttribute('draggable', 'true');
            el.dataset.itemIndex = idx;
            el.addEventListener('dragstart', onStashDragStart);
            el.addEventListener('dragend', onDragEnd);
            playerStashSetupEl.appendChild(el);
        });
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
            const el = document.createElement('div');
            el.className = `stash-item rarity-${item.rarity || 'common'}`;
            el.title = `${item.name}\n${item.description}`;
            el.innerHTML = `<div class="item-icon">${item.icon || '📦'}</div>
                            <div class="item-tooltip"><strong>${item.name}</strong><br>${item.description}</div>`;
            container.appendChild(el);
        });
    }

    // --- Drag & Drop ---
    function onInventoryDragStart(e) {
        const el = e.target.closest('.inventory-item');
        if (!el) return;
        const type = el.dataset.type;
        const idx = parseInt(el.dataset.index);
        const invItem = inventory[idx];
        if (!invItem || invItem.remaining <= 0) {
            e.preventDefault();
            return;
        }
        draggedPiece = { source: 'inventory', type, index: idx };
        draggedItem = null;
        createDragGhost(PIECE_SYMBOLS.white[type]);
        el.classList.add('dragging');
        e.dataTransfer.setData('text/plain', '');
        e.dataTransfer.setDragImage(new Image(), 0, 0);
    }

    function onStashDragStart(e) {
        const el = e.target.closest('.stash-item');
        if (!el) return;
        const idx = parseInt(el.dataset.itemIndex);
        const item = runManager.playerItems[idx];
        if (!item) { e.preventDefault(); return; }

        draggedItem = { itemIndex: idx };
        draggedPiece = null;
        createDragGhost(item.icon || '📦');
        el.classList.add('dragging');
        e.dataTransfer.setData('text/plain', '');
        e.dataTransfer.setDragImage(new Image(), 0, 0);
    }

    function onBoardPieceDragStart(e) {
        const cell = e.target.closest('.cell');
        if (!cell) return;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const piece = engine.getPiece(row, col);

        const setupColor = isBlackSetup ? 'black' : 'white';
        if (!piece || piece.color !== setupColor) {
            e.preventDefault();
            return;
        }

        draggedPiece = { source: 'board', row, col, type: piece.type };
        draggedItem = null;
        createDragGhost(engine.getSymbol(piece));
        cell.classList.add('dragging');
        e.dataTransfer.setData('text/plain', '');
        e.dataTransfer.setDragImage(new Image(), 0, 0);
    }

    function onDragEnd(e) {
        // Remove dragging class from inventory and stash items
        e.target.closest('.inventory-item')?.classList.remove('dragging');
        e.target.closest('.stash-item')?.classList.remove('dragging');
        // Also clear dragging class from any board cells
        document.querySelectorAll('.cell.dragging').forEach(c => c.classList.remove('dragging'));
        removeDragGhost();
        draggedPiece = null;
        draggedItem = null;
    }

    function onSetupDragOver(e) {
        e.preventDefault();
        const cell = e.target.closest('.cell');
        if (!cell) return;
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const piece = engine.getPiece(r, c);

        cell.classList.remove('drop-valid', 'drop-invalid');

        if (draggedItem !== null) {
            // Equipping item onto piece
            const setupColor = isBlackSetup ? 'black' : 'white';
            if (piece && piece.color === setupColor && piece instanceof PieceEntity) {
                if (piece.getEmptySlot() !== -1) cell.classList.add('drop-valid');
                else cell.classList.add('drop-invalid');
            }
        } else if (draggedPiece) {
            const validZone = isBlackSetup ? (r <= 1) : (r >= 6);
            if (validZone && !piece) cell.classList.add('drop-valid');
            else if (!validZone) cell.classList.add('drop-invalid');
        }
    }

    function onSetupDragLeave(e) {
        const cell = e.target.closest('.cell');
        if (cell) cell.classList.remove('drop-valid', 'drop-invalid');
    }

    function onSetupDrop(e) {
        e.preventDefault();
        const cell = e.target.closest('.cell');
        if (!cell) return;
        cell.classList.remove('drop-valid', 'drop-invalid');

        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const piece = engine.getPiece(r, c);

        if (draggedItem !== null) {
            // Equip item to piece
            const setupColor = isBlackSetup ? 'black' : 'white';
            if (piece && piece.color === setupColor && piece instanceof PieceEntity) {
                runManager.equipItemToPiece(draggedItem.itemIndex, piece);
                renderStashSetup();
                renderBoard(boardSetup);
            }
        } else if (draggedPiece) {
            const validZone = isBlackSetup ? (r <= 1) : (r >= 6);
            if (!validZone) return;
            if (piece) return;

            const setupColor = isBlackSetup ? 'black' : 'white';
            if (draggedPiece.source === 'inventory') {
                const invItem = inventory[draggedPiece.index];
                if (!invItem || invItem.remaining <= 0) return;
                engine.board[r][c] = new PieceEntity(draggedPiece.type, setupColor);
                invItem.remaining--;
            } else if (draggedPiece.source === 'board') {
                const p = engine.board[draggedPiece.row][draggedPiece.col];
                engine.board[draggedPiece.row][draggedPiece.col] = null;
                engine.board[r][c] = p;
            }

            renderBoard(boardSetup);
            renderInventory();
            updateStartButton();
        }

        // Ensure any dragging indicators are cleared
        document.querySelectorAll('.cell.dragging').forEach(c => c.classList.remove('dragging'));

        removeDragGhost();
        draggedPiece = null;
        draggedItem = null;
    }

    function onSetupCellClick(e) {
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

    function createDragGhost(symbol) {
        removeDragGhost();
        dragGhost = document.createElement('div');
        dragGhost.className = 'drag-ghost';
        dragGhost.textContent = symbol;
        dragGhost.style.pointerEvents = 'none';
        document.body.appendChild(dragGhost);
        document.addEventListener('dragover', moveDragGhost);
    }

    function moveDragGhost(e) {
        if (dragGhost) {
            dragGhost.style.left = (e.clientX - 24) + 'px';
            dragGhost.style.top = (e.clientY - 24) + 'px';
        }
    }

    function removeDragGhost() {
        if (dragGhost) {
            dragGhost.remove();
            dragGhost = null;
        }
        document.removeEventListener('dragover', moveDragGhost);
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
            el.innerHTML = `
                <div class="item-icon">${item.icon || '📦'}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-cost">${item.cost} 🪙</div>
                <div class="item-tooltip">${item.description}</div>
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
                    el.title = 'Сундук заполнен (99/99)!';
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
            el.innerHTML = `
                <div class="item-icon">${item.icon || '📦'}</div>
                <div class="item-tooltip">Продать за ${sellPrice} 🪙<br>${item.description}</div>
            `;
            el.addEventListener('click', () => {
                if (confirm(`Продать ${item.name} за ${sellPrice} 🪙?`)) {
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
            el.innerHTML = `
                <div class="item-icon">${item.icon || '📦'}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-cost">${item.cost} 🪙</div>
                <div class="item-tooltip">${item.description}</div>
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
            el.innerHTML = `
                <div class="item-icon">${item.icon || '📦'}</div>
                <div class="item-tooltip">Продать за ${sellPrice} 🪙<br>${item.description}</div>
            `;
            el.addEventListener('click', () => {
                if (confirm(`Продать ${item.name} за ${sellPrice} 🪙?`)) {
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
        document.getElementById('btn-new-run').addEventListener('click', () => {
            isRoguelikeMode = true;
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

        document.getElementById('btn-new-game').addEventListener('click', () => {
            isRoguelikeMode = false;
            isCreativeMode = false;
            isPvP = false;
            isBlackSetup = false;
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

        const DIFF_DESCRIPTIONS = {
            very_easy: '🐣 ИИ делает почти случайные ходы. Отличный старт для новичков!',
            easy:      '🟢 ИИ думает поверхностно. Легко учиться.',
            normal:    '🔵 Стандартный противник. Хорошо думает и неплохо играет.',
            hard:      '🔴 ИИ просчитывает на 4 хода вперёд. Серьёзный вызов.',
            crazy:     '🤪 ИИ специально делает ХУДШИЕ ходы. Играет в поддавки!',
        };

        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedDifficulty = btn.dataset.mode;
                ai.setMode(selectedDifficulty);
                const descEl = document.getElementById('diff-description');
                if (descEl) descEl.textContent = DIFF_DESCRIPTIONS[selectedDifficulty] || '';
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
                }
            });
        }

        document.getElementById('btn-start-game').addEventListener('click', () => {
            startGameFromSetup();
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

        document.getElementById('btn-resign').addEventListener('click', () => {
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
                resetInventory();
                renderBoard(boardSetup);
                updateStartButton();
                showScreen('setup');
            }
        });

        document.getElementById('btn-to-menu').addEventListener('click', () => {
            modalGameover.classList.remove('active');
            showScreen('menu');
        });
    }

    // --- Creative Mode ---
    function startCreativeMode(pvp) {
        isRoguelikeMode = false;
        isCreativeMode = true;
        isPvP = pvp;
        isBlackSetup = false;

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
        if (panelTitle) panelTitle.textContent = isPvP ? 'Белые — Ваша Армия' : 'Ваша Армия (Творческий)';

        // Show black setup toggle in creative mode
        const btnSetupBlack = document.getElementById('btn-setup-black');
        if (btnSetupBlack) {
            btnSetupBlack.style.display = '';
            btnSetupBlack.innerHTML = '🔄 Редактировать Черных';
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
        if (panelTitle) panelTitle.textContent = 'Чёрные — Ваша Армия';

        const btnSetupBlack = document.getElementById('btn-setup-black');
        if (btnSetupBlack) {
            btnSetupBlack.style.display = '';
            btnSetupBlack.innerHTML = '🔄 Редактировать Белых';
        }

        lastMove = null; // Clear any leftover highlights
        renderBoard(boardSetup);
        renderInventory();
        renderStashSetup();
        updateStartButton();
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
        // Ensure drag ghost is removed
        removeDragGhost();
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
            if (encounter.isBoss) {
                document.getElementById('run-round').textContent = `⚔️ БОСС ${roundNum}/${totalRounds}: ${encounter.bossName || encounter.name}`;
            } else {
                document.getElementById('run-round').textContent = `Раунд ${roundNum}/${totalRounds}: ${encounter.name}`;
            }
            document.getElementById('btn-undo').style.display = 'none';

        } else if (isCreativeMode && isPvP) {
            // PvP: black already placed, don't setup standard
            document.getElementById('run-gold').textContent = '';
            document.getElementById('run-round').textContent = 'Творческий PvP';
            document.getElementById('btn-undo').style.display = 'none';
        } else if (isCreativeMode) {
            engine.setupBlackStandard();
            document.getElementById('run-gold').textContent = '';
            document.getElementById('run-round').textContent = 'Творческий vs Бот';
            document.getElementById('btn-undo').style.display = 'block';
        } else {
            engine.setupBlackStandard();
            document.getElementById('run-gold').textContent = '';
            document.getElementById('run-round').textContent = 'Классика';
            document.getElementById('btn-undo').style.display = 'block';
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
        king: 'Король', queen: 'Ферзь', rook: 'Ладья',
        bishop: 'Слон', knight: 'Конь', pawn: 'Пешка'
    };

    function openPieceInventory(row, col) {
        const piece = engine.getPiece(row, col);
        if (!piece || !(piece instanceof PieceEntity)) return;

        pieceInvTarget = { row, col };
        const isReadOnly = currentScreen === 'game';

        // Header
        document.getElementById('piece-inv-icon').textContent = PIECE_SYMBOLS[piece.color]?.[piece.type] || '♟';
        document.getElementById('piece-inv-title').textContent = PIECE_NAMES[piece.type] || piece.type;
        document.getElementById('piece-inv-subtitle').textContent = isReadOnly ? 'Экипированные предметы' : `Слоты экипировки (${piece.getItems().length}/3)`;

        renderPieceInventorySlots(piece, isReadOnly);
        renderPieceInventoryStash(piece, isReadOnly);

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
                    <div class="slot-label">Слот ${i + 1}</div>
                    <div class="slot-item-icon">${item.icon || '📦'}</div>
                    <div class="slot-item-name">${item.name}</div>
                    ${!isReadOnly ? '<button class="slot-unequip" title="Снять">✕</button>' : ''}
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
                    <div class="slot-label">Слот ${i + 1}</div>
                    <div class="slot-content empty">Пусто</div>
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

        const stashItems = runManager.playerItems;
        const hasEmptySlot = piece.getEmptySlot() !== -1;

        if (!stashItems || stashItems.length === 0) {
            emptyMsg.classList.remove('hidden');
            return;
        }
        emptyMsg.classList.add('hidden');

        stashItems.forEach((item, idx) => {
            if (!item) return;

            // Check if item is compatible with this piece
            const allowed = item.allowedPieces || ['all'];
            const isAllowed = allowed.includes('all') || allowed.includes(piece.type);
            const canEquip = isAllowed && hasEmptySlot;

            const el = document.createElement('div');
            el.className = `piece-inv-stash-item rarity-${item.rarity || 'common'}`;
            if (!canEquip) el.classList.add('disabled');
            el.title = canEquip ? `Экипировать: ${item.description}` :
                       !isAllowed ? `Не подходит для ${PIECE_NAMES[piece.type]}` :
                       'Все слоты заняты';

            el.innerHTML = `
                <div class="stash-item-icon-wrap">${item.icon || '📦'}</div>
                <div class="stash-item-info" style="font-size:0.7em; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; padding:0 2px;">${item.name}</div>
                <div class="item-tooltip"><strong>${item.name}</strong><br>${item.description}<br><em style="color:#9d93fa;">${canEquip ? 'Кликните для экипировки' : (!isAllowed ? 'Не подходит' : 'Нет слотов')}</em></div>
            `;

            if (canEquip) {
                el.addEventListener('click', () => {
                    equipItemFromStash(idx);
                });
            }

            listEl.appendChild(el);
        });
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
        document.getElementById('piece-inv-subtitle').textContent = `Слоты экипировки (${piece.getItems().length}/3)`;
        renderPieceInventorySlots(piece);
        renderPieceInventoryStash(piece);
    }

    function unequipItemFromSlot(slotIndex) {
        if (!pieceInvTarget) return;
        const piece = engine.getPiece(pieceInvTarget.row, pieceInvTarget.col);
        if (!piece || !(piece instanceof PieceEntity)) return;

        const item = piece.removeItem(slotIndex);
        if (item) {
            runManager.playerItems.push(item);
        }

        document.getElementById('piece-inv-subtitle').textContent = `Слоты экипировки (${piece.getItems().length}/3)`;
        renderPieceInventorySlots(piece);
        renderPieceInventoryStash(piece);
    }

    function removePieceFromInventory() {
        if (!pieceInvTarget) return;
        const { row, col } = pieceInvTarget;
        const piece = engine.getPiece(row, col);
        if (!piece) return;

        // Return all items to stash
        if (piece instanceof PieceEntity) {
            piece.getItems().forEach(item => {
                runManager.playerItems.push(item);
            });
            piece.items = [null, null, null];
            piece.shield = 0;
        }

        // Return piece to inventory
        engine.removePiece(row, col);
        const invItem = inventory.find(i => i.type === piece.type);
        if (invItem) invItem.remaining++;

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
                selectPiece(r, c);
                return;
            }
            deselectPiece();
            return;
        }

        if (piece && piece.color === currentColor) {
            selectPiece(r, c);
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
            if (engine.gameResult === 'draw') statusText.textContent = 'Ничья!';
            else if (isPvP) {
                statusText.textContent = engine.gameResult === 'white' ? 'Победа Белых!' : 'Победа Чёрных!';
            }
            else if (engine.gameResult === 'white') statusText.textContent = 'Победа!';
            else statusText.textContent = 'Поражение';
        } else if (isAIThinking) {
            gameStatusEl.classList.add('thinking');
            statusText.textContent = 'ИИ думает...';
        } else if (engine.isInCheck(engine.currentTurn)) {
            gameStatusEl.classList.add('check');
            if (isPvP) {
                statusText.textContent = engine.currentTurn === 'white' ? 'Шах! Ход Белых' : 'Шах! Ход Чёрных';
            } else {
                statusText.textContent = engine.currentTurn === 'white' ? 'Шах! Ваш ход' : 'Шах!';
            }
        } else {
            if (isPvP) {
                statusText.textContent = engine.currentTurn === 'white' ? 'Ход Белых' : 'Ход Чёрных';
            } else {
                statusText.textContent = engine.currentTurn === 'white' ? 'Ваш ход' : 'Ход компьютера';
            }
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
        if (isRoguelikeMode && engine.gameResult === 'white') {
            // Capture values BEFORE onRoundWin() increments currentRound
            const goldBonus = runManager.computeGoldOnWin(engine);
            const roundGold = runManager.getCurrentEncounter()?.goldReward || 0;

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

            const recruitText = recruitedCount > 0 ? `\nВы захватили ${recruitedCount} фигур врага!` : '';

            if (runManager.state === 'victory') {
                showGameOverModal('🏆 Победа в забеге!', `Вы одолели всех врагов! Золото: ${runManager.gold} 🪙${recruitText}`, false);
            } else {
                showGameOverModal('⚔️ Победа в раунде!', `+${roundGold} 🪙 за победу.${recruitText}\nИдём к торговцу...`, true);
            }
        } else if (isRoguelikeMode && engine.gameResult === 'black') {
            runManager.onRoundLose();
            showGameOverModal('💀 Поражение', 'Ваша армия разгромлена. Забег окончен.', false);
        } else {
            showGameOverModalDefault();
        }
    }

    function showGameOverModal(title, text, isShopTransition) {
        const icon = document.getElementById('gameover-icon');
        const titleEl = document.getElementById('gameover-title');
        const textEl = document.getElementById('gameover-text');
        const btnPlayAgain = document.getElementById('btn-play-again');

        icon.textContent = isShopTransition ? '🪙' : (engine.gameResult === 'white' ? '🏆' : '💀');
        titleEl.textContent = title;
        textEl.textContent = text;
        btnPlayAgain.textContent = isShopTransition ? '🛒 В магазин' : '🏠 В меню';

        // Replace button to clear old listeners
        const newBtn = btnPlayAgain.cloneNode(true);
        btnPlayAgain.replaceWith(newBtn);
        newBtn.addEventListener('click', () => {
            modalGameover.classList.remove('active');
            if (isShopTransition) {
                openShop();
            } else {
                showScreen('menu');
            }
        });

        setTimeout(() => modalGameover.classList.add('active'), 500);
    }

    function showGameOverModalDefault() {
        const icon = document.getElementById('gameover-icon');
        const title = document.getElementById('gameover-title');
        const text = document.getElementById('gameover-text');

        if (engine.gameResult === 'white') {
            icon.textContent = '🏆'; title.textContent = 'Победа!';
            text.textContent = 'Шах и мат! Вы обыграли компьютер!';
        } else if (engine.gameResult === 'black') {
            icon.textContent = '😔'; title.textContent = 'Поражение';
            text.textContent = 'Шах и мат. Компьютер победил.';
        } else {
            icon.textContent = '🤝'; title.textContent = 'Ничья';
            text.textContent = engine.gameResultReason === 'stalemate' ? 'Пат!' :
                engine.gameResultReason === '50-move rule' ? 'Правило 50 ходов' : 'Недостаточно материала';
        }

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
    init();
})();
