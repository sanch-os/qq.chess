/* ============================================================================
   RunManager — qq.chess roguelike run loop (refactored)
   ============================================================================
   Owns the meta-game state that lives ABOVE a single chess match: gold,
   the player's item stash, which encounter/round is current, and the
   shop between rounds. The board/rules themselves belong to ChessEngine;
   this class never touches move legality.
   ========================================================================= */

/** Max items the player's stash can hold. */
const STASH_LIMIT = 99;

class RunManager {
    constructor() {
        this.reset();
    }

    /** Resets all run state to a fresh, inactive run. */
    reset() {
        this.active = false;
        this.gold = 80;
        this.currentRound = 0;
        this.encounters = getEncounters();
        this.totalRounds = this.encounters.length;
        /** @type {Array<Object>} Items in the player's stash (not equipped). */
        this.playerItems = [];
        /** @type {Object<string,number>} Extra pieces recruited from surviving enemies. */
        this.bonusPieces = {};
        /** @type {Array<{round:number, result:'win'|'lose'}>} */
        this.roundResults = [];
        /** @type {'idle'|'starting_items'|'setup'|'playing'|'shop'|'victory'|'defeat'} */
        this.state = 'idle';
        this.capturesThisRound = 0;
        this.startingItemsGiven = false;
        /** Memoized Endless-mode encounter — see getCurrentEncounter(). */
        this._endlessCache = null; // { round, encounter }
    }

    /* ======================================================================
       Run lifecycle
       ==================================================================== */

    /** Starts a brand-new run: fresh state, sequence, and starting items. */
    startRun() {
        this.reset();
        this.active = true;
        this.state = 'starting_items';

        this._generateRunSequence();

        // Give player 12 random starting items.
        this.playerItems = getRandomItems(12);
        this.startingItemsGiven = true;
    }

    /** Builds this run's encounter sequence from encounters.js. */
    _generateRunSequence() {
        const allEncounters = getEncounters();
        this.encounters = allEncounters.map(e => ({ ...e }));
        this.totalRounds = this.encounters.length;
        this._endlessCache = null;
    }

    /* ======================================================================
       Round management
       ==================================================================== */

    /**
     * Returns the encounter for the current round.
     *
     * Endless Mode (currentRound >= encounters.length): loops the base
     * sequence with scaled difficulty/reward and a random extra-items
     * bonus for the enemy.
     *
     * FIX: the random extra-items bonus used to be regenerated via
     * Math.random() on EVERY call — and this getter is called multiple
     * times per round (startRound() → _equipEnemyItems(), then again from
     * app.js for UI text), so two calls in the same round could return
     * different `enemyItems`. Nothing currently reads `enemyItems` after
     * the first (equipping) call, so this wasn't causing a visible bug —
     * but a getter whose result silently changes between calls with no
     * state change in between is a trap for the next caller. The result
     * is now memoized per `currentRound`, so repeated calls in the same
     * round are stable, and only advancing to a new round regenerates it.
     * @returns {Object} The encounter to play (or display) right now.
     */
    getCurrentEncounter() {
        if (this.currentRound < this.encounters.length) {
            return this.encounters[this.currentRound];
        }

        // Endless Mode: return the memoized encounter for this round if we
        // already generated one (keeps repeated calls idempotent).
        if (this._endlessCache && this._endlessCache.round === this.currentRound) {
            return this._endlessCache.encounter;
        }

        const loop = Math.floor(this.currentRound / this.encounters.length);
        const baseIndex = this.currentRound % this.encounters.length;
        const baseEncounter = this.encounters[baseIndex];

        // Generate random extra items for the enemy, scaled by loop count.
        const extraItems = [];
        const itemIds = Object.keys(ITEMS_DB);
        const pieceTypes = ['pawn', 'knight', 'bishop', 'rook', 'queen'];
        for (let i = 0; i < loop * 2; i++) {
            const randomItemId = itemIds[Math.floor(Math.random() * itemIds.length)];
            const randomPiece = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
            extraItems.push({ pieceType: randomPiece, pieceIndex: Math.floor(Math.random() * 2), itemId: randomItemId });
        }

        const encounter = {
            ...baseEncounter,
            name: `${baseEncounter.name} (Loop ${loop + 1})`,
            aiDepth: Math.min(4, baseEncounter.aiDepth + Math.floor(loop / 2)),
            goldReward: baseEncounter.goldReward + (loop * 30),
            enemyItems: [...(baseEncounter.enemyItems || []), ...extraItems],
        };

        this._endlessCache = { round: this.currentRound, encounter };
        return encounter;
    }

    /**
     * Begins the current round: sets state to 'playing' and equips the
     * enemy's item loadout onto the board.
     * @param {ChessEngine} engine
     * @returns {Object|null} The encounter that was started, or null if
     *          there is none (should not normally happen).
     */
    startRound(engine) {
        const encounter = this.getCurrentEncounter();
        if (!encounter) return null;

        this.state = 'playing';
        this.capturesThisRound = 0;

        this._equipEnemyItems(engine, encounter);

        return encounter;
    }

    /**
     * Equips each `encounter.enemyItems` entry onto the matching black
     * piece on the board (by type + positional index among same-type
     * pieces), and tags boss pieces.
     * @param {ChessEngine} engine
     * @param {Object} encounter
     */
    _equipEnemyItems(engine, encounter) {
        if (!encounter.enemyItems || encounter.enemyItems.length === 0) return;

        for (const itemDef of encounter.enemyItems) {
            const item = getItemById(itemDef.itemId);
            if (!item) continue;

            // Find the matching piece on the board.
            let matchCount = 0;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const piece = engine.board[r][c];
                    if (piece && piece.color === 'black' && piece.type === itemDef.pieceType) {
                        if (matchCount === (itemDef.pieceIndex || 0)) {
                            const slot = piece.getEmptySlot();
                            if (slot !== -1) {
                                // FIX: getItemById() returns the raw ITEMS_DB
                                // template (by design — it does not clone).
                                // `{ ...item }` alone only copies the top
                                // level, leaving `modifiers` aliased to the
                                // PERMANENT, session-wide catalog entry — any
                                // future in-place mutation of an equipped
                                // item's modifiers would corrupt that item
                                // for every piece, every game, for the rest
                                // of the session. Deep-cloning `modifiers`
                                // here matches the same fix already applied
                                // to every other equip path in this codebase.
                                piece.setItem(slot, { ...item, modifiers: { ...(item.modifiers || {}) } });
                            }
                            if (itemDef.isBossPiece) {
                                piece.isBoss = true;
                                piece.bossName = encounter.bossName;
                                piece.bossDescription = encounter.bossDescription;
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

    /* ======================================================================
       Capture tracking
       ==================================================================== */

    /**
     * Per-capture hook: gold-per-capture and enemy-item looting.
     *
     * NOT CURRENTLY CALLED ANYWHERE in this codebase (verified — grepping
     * every file finds zero call sites). The actual, working capture-time
     * economy runs through `engine.goldEarned` (populated inside
     * ChessEngine.executeMoveAndUpdate, which handles the FULL set of
     * gold-on-capture item fields — goldOnQueenCapture, goldOnRookCapture,
     * etc., not just goldPerCapture) plus a direct `runManager.lootItem()`
     * call in app.js's executePlayerMove. This method only reproduces the
     * `goldPerCapture` slice of that, incompletely.
     *
     * Left in place for API compatibility, but do NOT wire this up as an
     * additional capture hook without first removing the equivalent logic
     * from app.js/chess-engine.js — calling both would double-count gold
     * and double-loot items from the same capture.
     * @param {PieceEntity} capturer
     * @param {PieceEntity} victim
     */
    onCapture(capturer, victim) {
        this.capturesThisRound++;

        if (capturer && capturer.color === 'white') {
            const stats = capturer.getStats();
            if (stats.goldPerCapture > 0) {
                this.gold += stats.goldPerCapture;
            }

            if (victim && victim.color === 'black' && victim instanceof PieceEntity) {
                victim.getItems().forEach(item => {
                    if (item && this.playerItems.length < STASH_LIMIT) {
                        this.playerItems.push({ ...item });
                    }
                });
            }
        }
    }

    /* ======================================================================
       Round end
       ==================================================================== */

    /** Awards the round's gold reward, records the win, and moves to the shop. */
    onRoundWin() {
        const encounter = this.getCurrentEncounter();
        if (!encounter) return;

        this.gold += encounter.goldReward;
        // goldOnWin (per-piece item bonus) is computed separately by
        // app.js via computeGoldOnWin(), which has access to the live board.

        this.roundResults.push({ round: this.currentRound, result: 'win' });
        this.currentRound++;
        this._endlessCache = null; // new round -> Endless Mode must regenerate

        // Endless mode: always go to shop after a win, never a hard "victory".
        this.state = 'shop';
    }

    /**
     * Collects every item off every white piece on the board back into the
     * stash (called after a round win, before the shop). Directly zeroes
     * `items`/`shield` rather than looping `removeItem()` per slot — safe
     * here because this only ever runs between rounds, before any combat
     * on the fresh board has happened, so there is no accumulated combat
     * shield to preserve (see PieceEntity's shield-delta model).
     * @param {ChessEngine} engine
     */
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

    /**
     * Loots a single item (e.g. from a piece captured this move) into the stash.
     * @param {Object} item
     * @returns {boolean} True if it fit (stash wasn't full).
     */
    lootItem(item) {
        if (item && this.playerItems.length < STASH_LIMIT) {
            this.playerItems.push({ ...item });
            return true;
        }
        return false;
    }

    /**
     * Recruits a surviving enemy piece TYPE as a bonus piece for future
     * setups (kings are never recruitable).
     * @param {string} type
     */
    recruitPiece(type) {
        if (type === 'king') return;
        this.bonusPieces[type] = (this.bonusPieces[type] || 0) + 1;
    }

    /** Records a round loss and moves to the defeat state. */
    onRoundLose() {
        this.roundResults.push({ round: this.currentRound, result: 'lose' });
        this.state = 'defeat';
    }

    /**
     * Sums the `goldOnWin` item stat across every white piece on the board.
     * @param {ChessEngine} engine
     * @returns {number}
     */
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

    /* ======================================================================
       Shop
       ==================================================================== */

    /**
     * @param {number} [count=4]
     * @returns {Array<Object>} Shop offers (delegates to items-db.js's getShopItems).
     */
    getShopItems(count = 4) {
        return getShopItems(count, this.gold);
    }

    /**
     * Buys an item into the stash if gold and space allow.
     * @param {Object} item
     * @returns {boolean|'full'} true on success, 'full' if the stash has no
     *          room, false if the player can't afford it.
     */
    buyItem(item) {
        if (this.gold < item.cost) return false;
        if (this.playerItems.length >= STASH_LIMIT) return 'full';
        this.gold -= item.cost;
        this.playerItems.push({ ...item });
        return true;
    }

    /**
     * Sells a stashed item for half its cost (rounded down).
     * @param {number} index
     * @returns {boolean} True on success.
     */
    sellItem(index) {
        if (index < 0 || index >= this.playerItems.length) return false;
        const item = this.playerItems[index];
        this.gold += Math.floor(item.cost * 0.5);
        this.playerItems.splice(index, 1);
        return true;
    }

    /* ======================================================================
       Item equipment
       ==================================================================== */

    /**
     * Equips a stashed item onto a piece.
     * @param {number} itemIndex - Index into this.playerItems.
     * @param {PieceEntity} piece
     * @param {boolean} [keepInStash=false] - If true, the item stays in the
     *        stash as well as being equipped (used for preview/creative flows).
     * @returns {boolean} True on success.
     */
    equipItemToPiece(itemIndex, piece, keepInStash = false) {
        if (itemIndex < 0 || itemIndex >= this.playerItems.length) return false;
        const item = this.playerItems[itemIndex];

        if (!item.allowedPieces.includes('all') && !item.allowedPieces.includes(piece.type)) {
            return false;
        }

        const slot = piece.getEmptySlot();
        if (slot === -1) return false;

        // FIX: deep-clone `modifiers` — with keepInStash=true the original
        // stays in this.playerItems, so a shallow `{ ...item }` would leave
        // the equipped copy and the still-stashed copy sharing the same
        // modifiers object. Not currently exercised (every call site in
        // this codebase passes keepInStash=false), but a real trap for any
        // future caller that does pass true.
        piece.setItem(slot, { ...item, modifiers: { ...(item.modifiers || {}) } });
        if (!keepInStash) {
            this.playerItems.splice(itemIndex, 1);
        }
        return true;
    }

    /**
     * Unequips an item from a piece back into the stash.
     * @param {PieceEntity} piece
     * @param {number} slot
     * @param {boolean} [destroyOnUnequip=false] - If true, discard the item
     *        entirely instead of returning it to the stash.
     * @returns {boolean|'full'} true on success, 'full' if the stash is full
     *          (the item is re-equipped in that case, so nothing is lost).
     */
    unequipItemFromPiece(piece, slot, destroyOnUnequip = false) {
        const item = piece.removeItem(slot);
        if (!item) return false;

        if (destroyOnUnequip) {
            return true;
        }

        if (this.playerItems.length >= STASH_LIMIT) {
            // Stash full — re-equip the SAME item object we just removed.
            // PieceEntity's shield-delta model (see piece-entity.js) makes
            // this remove-then-immediately-reapply a clean no-op on shield.
            piece.setItem(slot, item);
            return 'full';
        }
        this.playerItems.push(item);
        return true;
    }

    /** Advances from the shop back to setting up the next round. */
    finishShopping() {
        this.state = 'setup';
    }

    /* ======================================================================
       State queries
       ==================================================================== */

    isRunActive() { return this.active; }
    isPlaying() { return this.state === 'playing'; }
    isShop() { return this.state === 'shop'; }
    isVictory() { return this.state === 'victory'; }
    isDefeat() { return this.state === 'defeat'; }

    /**
     * @returns {{current:number, total:number, encounter:Object}} Human-
     *          facing round info (1-indexed current round).
     */
    getRoundInfo() {
        return {
            current: this.currentRound + 1,
            total: this.totalRounds,
            encounter: this.getCurrentEncounter(),
        };
    }
}
