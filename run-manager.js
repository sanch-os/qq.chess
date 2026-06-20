/* ============================================
   RunManager — Roguelike run loop
   ============================================ */

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

        // Give player 2 random starting items
        this.playerItems = getRandomItems(2);
        this.startingItemsGiven = true;
    }

    // --- Round Management ---
    getCurrentEncounter() {
        if (this.currentRound >= this.encounters.length) return null;
        return this.encounters[this.currentRound];
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

        // Gold from items
        if (capturer && capturer.color === 'white') {
            const stats = capturer.getStats();
            if (stats.goldPerCapture > 0) {
                this.gold += stats.goldPerCapture;
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

        if (this.currentRound >= this.totalRounds) {
            this.state = 'victory';
        } else {
            this.state = 'shop';
        }
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
    equipItemToPiece(itemIndex, piece) {
        if (itemIndex < 0 || itemIndex >= this.playerItems.length) return false;
        const item = this.playerItems[itemIndex];

        // Check allowed pieces
        if (!item.allowedPieces.includes('all') && !item.allowedPieces.includes(piece.type)) {
            return false;
        }

        const slot = piece.getEmptySlot();
        if (slot === -1) return false;

        piece.setItem(slot, { ...item });
        this.playerItems.splice(itemIndex, 1);
        return true;
    }

    unequipItemFromPiece(piece, slot) {
        const item = piece.removeItem(slot);
        if (!item) return false;
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
