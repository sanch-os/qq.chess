/* ============================================
   RunManager — Roguelike run loop
   ============================================ */

const STASH_LIMIT = 99; // Max items in player stash

class RunManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.active = false;
        this.gold = 80;
        this.currentRound = 0;
        this.encounters = getEncounters();
        this.totalRounds = this.encounters.length;
        this.playerItems = [];        // Items in player's stash (not equipped)
        this.bonusPieces = {};        // Extra pieces recruited from surviving enemies
        this.roundResults = [];       // History of round outcomes
        this.state = 'idle';          // idle | setup | playing | shop | victory | defeat
        this.capturesThisRound = 0;
        this.startingItemsGiven = false;
    }

    // --- Start New Run ---
    startRun() {
        this.reset();
        this.active = true;
        this.state = 'starting_items';

        // Generate a fresh run sequence: random boss every 3rd round
        this._generateRunSequence();

        // Give player 12 random starting items
        this.playerItems = getRandomItems(12);
        this.startingItemsGiven = true;
    }

    // Build a procedural sequence of encounters for this run.
    // Every 3rd slot (index 2, 5, 8...) is a random boss.
    // Other slots are random non-boss encounters.
    _generateRunSequence() {
        const allEncounters = getEncounters();
        const bossPool    = allEncounters.filter(e => e.isBoss);
        const normalPool  = allEncounters.filter(e => !e.isBoss);

        // Shuffle helpers
        const shuffle = arr => arr.slice().sort(() => Math.random() - 0.5);

        const shuffledBosses  = shuffle(bossPool);
        const shuffledNormals = shuffle(normalPool);

        // Always use 9 rounds (3 cycles of 3) — tweak as needed
        const TOTAL_ROUNDS = 9;
        this.encounters = [];
        let bossIdx  = 0;
        let normalIdx = 0;

        for (let i = 0; i < TOTAL_ROUNDS; i++) {
            if ((i + 1) % 3 === 0) {
                // Boss slot — pick random boss (loop if exhausted)
                const boss = shuffledBosses[bossIdx % shuffledBosses.length];
                bossIdx++;
                this.encounters.push({ ...boss });
            } else {
                // Normal slot — pick random normal (loop if exhausted)
                const normal = shuffledNormals[normalIdx % shuffledNormals.length];
                normalIdx++;
                // Scale difficulty slightly with progress
                const scale = Math.floor(i / 3);
                this.encounters.push({
                    ...normal,
                    aiDepth: Math.min(4, (normal.aiDepth || 2) + scale),
                    goldReward: (normal.goldReward || 60) + scale * 15,
                });
            }
        }

        this.totalRounds = this.encounters.length;
    }

    // --- Round Management ---
    getCurrentEncounter() {
        if (this.currentRound < this.encounters.length) {
            return this.encounters[this.currentRound];
        }
        
        // Endless Mode: Loop encounters and scale them up
        const loop = Math.floor(this.currentRound / this.encounters.length);
        const baseIndex = this.currentRound % this.encounters.length;
        const baseEncounter = this.encounters[baseIndex];
        
        // Generate random extra items for enemy based on loop
        const extraItems = [];
        const itemIds = Object.keys(ITEMS_DB);
        const pieceTypes = ['pawn', 'knight', 'bishop', 'rook', 'queen'];
        
        for (let i = 0; i < loop * 2; i++) {
            const randomItemId = itemIds[Math.floor(Math.random() * itemIds.length)];
            const randomPiece = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
            extraItems.push({ pieceType: randomPiece, pieceIndex: Math.floor(Math.random() * 2), itemId: randomItemId });
        }
        
        return {
            ...baseEncounter,
            name: `${baseEncounter.name} (Loop ${loop + 1})`,
            aiDepth: Math.min(4, baseEncounter.aiDepth + Math.floor(loop / 2)),
            goldReward: baseEncounter.goldReward + (loop * 30),
            enemyItems: [...baseEncounter.enemyItems, ...extraItems],
        };
    }

    startRound(engine) {
        const encounter = this.getCurrentEncounter();
        if (!encounter) return null;

        this.state = 'playing';
        this.capturesThisRound = 0;

        // Setup AI depth
        // (AI depth set externally by app.js)

        // Equip enemy items
        this._equipEnemyItems(engine, encounter);

        return encounter;
    }

    _equipEnemyItems(engine, encounter) {
        if (!encounter.enemyItems || encounter.enemyItems.length === 0) return;

        for (const itemDef of encounter.enemyItems) {
            const item = getItemById(itemDef.itemId);
            if (!item) continue;

            // Find the matching piece on the board
            let matchCount = 0;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const piece = engine.board[r][c];
                    if (piece && piece.color === 'black' && piece.type === itemDef.pieceType) {
                        if (matchCount === (itemDef.pieceIndex || 0)) {
                            const slot = piece.getEmptySlot();
                            if (slot !== -1) {
                                piece.setItem(slot, { ...item });
                            }
                            matchCount = -999; // done
                            break;
                        }
                        matchCount++;
                    }
                }
                if (matchCount === -999) break;
            }
        }
    }

    // --- Capture Tracking ---
    onCapture(capturer, victim) {
        this.capturesThisRound++;

        // Gold from items and looting
        if (capturer && capturer.color === 'white') {
            const stats = capturer.getStats();
            if (stats.goldPerCapture > 0) {
                this.gold += stats.goldPerCapture;
            }

            // Loot items from the killed enemy piece
            if (victim && victim.color === 'black' && victim instanceof PieceEntity) {
                victim.getItems().forEach(item => {
                    if (item && this.playerItems.length < STASH_LIMIT) {
                        this.playerItems.push({ ...item });
                    }
                });
            }
        }
    }

    // --- Round End ---
    onRoundWin() {
        const encounter = this.getCurrentEncounter();
        if (!encounter) return;

        // Base gold reward
        this.gold += encounter.goldReward;

        // Gold from items (goldOnWin across all player pieces)
        // This will be computed by app.js which has access to the board

        this.roundResults.push({ round: this.currentRound, result: 'win' });
        this.currentRound++;

        // Endless mode: always go to shop after win, never victory.
        this.state = 'shop';
    }

    // Collect all items from player pieces back to stash (called after round win)
    collectItemsFromBoard(engine) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = engine.board[r][c];
                if (piece && piece.color === 'white' && piece instanceof PieceEntity) {
                    piece.getItems().forEach(item => {
                        if (item && this.playerItems.length < STASH_LIMIT) {
                            this.playerItems.push({ ...item });
                        }
                    });
                    piece.items = [null, null, null];
                    piece.shield = 0;
                }
            }
        }
    }

    // Loot a single item from a captured enemy piece
    lootItem(item) {
        if (item && this.playerItems.length < STASH_LIMIT) {
            this.playerItems.push({ ...item });
            return true;
        }
        return false;
    }

    // Recruit surviving enemy piece to player's army
    recruitPiece(type) {
        if (type === 'king' || type === 'pawn') return; // Don't recruit enemy kings or pawns (pawns might be too weak/useless to recruit, or maybe we do?)
        // Let's recruit pawns too, why not?
        if (type === 'king') return;
        this.bonusPieces[type] = (this.bonusPieces[type] || 0) + 1;
    }

    onRoundLose() {
        this.roundResults.push({ round: this.currentRound, result: 'lose' });
        this.state = 'defeat';
    }

    // --- Gold on Win from items ---
    computeGoldOnWin(engine) {
        let bonus = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = engine.board[r][c];
                if (piece && piece.color === 'white' && piece.getStats) {
                    bonus += piece.getStats().goldOnWin || 0;
                }
            }
        }
        return bonus;
    }

    // --- Shop ---
    getShopItems(count = 4) {
        return getShopItems(count, this.gold);
    }

    buyItem(item) {
        if (this.gold < item.cost) return false;
        if (this.playerItems.length >= STASH_LIMIT) return 'full'; // stash full
        this.gold -= item.cost;
        this.playerItems.push({ ...item });
        return true;
    }

    sellItem(index) {
        if (index < 0 || index >= this.playerItems.length) return false;
        const item = this.playerItems[index];
        this.gold += Math.floor(item.cost * 0.5);
        this.playerItems.splice(index, 1);
        return true;
    }

    // --- Item Equipment ---
    equipItemToPiece(itemIndex, piece, keepInStash = false) {
        if (itemIndex < 0 || itemIndex >= this.playerItems.length) return false;
        const item = this.playerItems[itemIndex];

        // Check allowed pieces
        if (!item.allowedPieces.includes('all') && !item.allowedPieces.includes(piece.type)) {
            return false;
        }

        const slot = piece.getEmptySlot();
        if (slot === -1) return false;

        piece.setItem(slot, { ...item });
        if (!keepInStash) {
            this.playerItems.splice(itemIndex, 1);
        }
        return true;
    }

    unequipItemFromPiece(piece, slot, destroyOnUnequip = false) {
        const item = piece.removeItem(slot);
        if (!item) return false;
        
        if (destroyOnUnequip) {
            return true; // Just remove it from piece, don't put back in stash
        }

        if (this.playerItems.length >= STASH_LIMIT) {
            // Stash full — re-equip the item and return false
            piece.setItem(slot, item);
            return 'full';
        }
        this.playerItems.push(item);
        return true;
    }

    finishShopping() {
        this.state = 'setup'; // Go to next round setup
    }

    // --- State Queries ---
    isRunActive() { return this.active; }
    isPlaying() { return this.state === 'playing'; }
    isShop() { return this.state === 'shop'; }
    isVictory() { return this.state === 'victory'; }
    isDefeat() { return this.state === 'defeat'; }

    getRoundInfo() {
        return {
            current: this.currentRound + 1,
            total: this.totalRounds,
            encounter: this.getCurrentEncounter(),
        };
    }
}
