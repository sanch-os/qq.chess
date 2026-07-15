/* ============================================================================
   Extraction Manager — qq.chess global stash & loot logic (audited)
   ============================================================================
   Handles the "Scav" and "PMC" game modes' persistent, cross-raid stash.

   AUDIT FINDING: cross-referencing every method here against every caller
   in the rest of the codebase found that only addItems() and getStash()
   are actually used. Everything else below — generateScavLoadout(),
   buildPMCLoadout(), commitRaid(), computeLootPool(), applyPMCResult(),
   addExtraPiece(), removeExtraPiece(), getExtraPieceCount() — is called
   NOWHERE. The raid feature that actually shipped (see app.js's
   _handleRaidGameOver / _showRaidLootScreen) uses a simpler, separate,
   ad-hoc mechanism: 5 random items straight from ITEMS_DB, banked via a
   direct addItems() call. This file's more elaborate "loser's loot pool,
   winner picks up to 3, permanent extra recruits" design appears to be
   fully written but never wired into the shipped game loop.
   This is not a reason to delete it (it's clearly intentional, unfinished
   work, not accidental cruft) — but it IS a reason to fix its internal
   bugs now rather than have a future integrator rediscover them, and to
   flag clearly that "unused" here means "not yet wired up", not "safe to
   assume broken code doesn't matter".
   ========================================================================= */

const EXTRACTION_STASH_KEY = 'chess_extraction_stash';

/** Standard piece count per type for white (the "base loadout"). */
const BASE_LOADOUT = { king: 1, queen: 1, rook: 2, bishop: 2, knight: 2, pawn: 8 };

const ExtractionManager = {

    /* ─── Stash Load / Save ─────────────────────────────────── */

    /**
     * Loads the persistent stash from localStorage.
     *
     * FIX: previously trusted the parsed JSON verbatim — a corrupted or
     * hand-edited blob that parses successfully but has the wrong SHAPE
     * (e.g. `items` not an array) would pass this check and then throw a
     * TypeError the moment any mutating method (addItem, removeExtraPiece,
     * ...) tried to use it. Validating the shape here and falling back to
     * _defaultStash() mirrors the same fix already applied to
     * encounters.js's getEncounters() for the same class of risk.
     * @returns {{extraPieces:Array, items:Array}}
     */
    load() {
        try {
            const raw = localStorage.getItem(EXTRACTION_STASH_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (this._isValidStash(parsed)) return parsed;
            }
        } catch (e) {
            // Malformed JSON — fall through to the default stash.
        }
        return this._defaultStash();
    },

    /**
     * Minimal shape check for a loaded stash.
     * @param {*} s
     * @returns {boolean}
     */
    _isValidStash(s) {
        return !!s && typeof s === 'object'
            && Array.isArray(s.extraPieces)
            && Array.isArray(s.items);
    },

    /**
     * @param {{extraPieces:Array, items:Array}} stash
     */
    save(stash) {
        try {
            localStorage.setItem(EXTRACTION_STASH_KEY, JSON.stringify(stash));
        } catch (e) {
            // Storage full/disabled — stash simply won't persist this session.
        }
    },

    /** @returns {{extraPieces:Array, items:Array}} A fresh, empty stash. */
    _defaultStash() {
        return {
            // Extra pieces beyond the base 16 (farmed via Scav).
            extraPieces: [],   // [{ id: string, type: string, items: [itemId|null, ...] }]
            // Items not equipped on any piece. Stored as bare item-id
            // strings (not full item objects) — these are always looked
            // up fresh from ITEMS_DB when actually equipped, since nothing
            // here rolls per-instance item stats.
            items: [],         // [itemId, ...]
        };
    },

    /** @returns {{extraPieces:Array, items:Array}} The cached stash (loads once). */
    getStash() {
        if (!this._cache) this._cache = this.load();
        return this._cache;
    },

    /** Persists the current in-memory cache, if one has been loaded. */
    _saveCache() {
        if (this._cache) this.save(this._cache);
    },

    /* ─── Items ─────────────────────────────────────────────── */

    /** @param {string} itemId */
    addItem(itemId) {
        const stash = this.getStash();
        stash.items.push(itemId);
        this._saveCache();
    },

    /** @param {Array<string|null>} itemIds */
    addItems(itemIds) {
        const stash = this.getStash();
        itemIds.forEach(id => id && stash.items.push(id));
        this._saveCache();
    },

    /**
     * @param {number} index
     * @returns {string|null} The removed item id, or null if out of range.
     */
    removeItemAt(index) {
        const stash = this.getStash();
        if (index < 0 || index >= stash.items.length) return null;
        const [removed] = stash.items.splice(index, 1);
        this._saveCache();
        return removed;
    },

    /* ─── Extra Pieces ──────────────────────────────────────── */

    /**
     * Adds a permanently-recruited extra piece to the stash.
     * @param {string} type
     * @param {Array<string|null>} [equippedItemIds]
     * @returns {string} The new piece's stash id.
     */
    addExtraPiece(type, equippedItemIds = []) {
        const stash = this.getStash();
        const id = `extra_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        stash.extraPieces.push({ id, type, items: equippedItemIds });
        this._saveCache();
        return id;
    },

    /**
     * Removes an extra piece from the stash, returning its equipped items
     * (if any) to the loose-items list.
     * @param {string} id
     * @returns {Object|null} The removed piece record, or null if not found.
     */
    removeExtraPiece(id) {
        const stash = this.getStash();
        const idx = stash.extraPieces.findIndex(p => p.id === id);
        if (idx === -1) return null;
        const [removed] = stash.extraPieces.splice(idx, 1);
        this._saveCache();
        if (removed.items.length) this.addItems(removed.items.filter(Boolean));
        return removed;
    },

    /* ─── Scav Mode: Generate Random Loadout ────────────────── */

    /**
     * NOT CURRENTLY CALLED ANYWHERE — see the file-level audit note.
     * Generates a random Scav loadout: 1 king + 7-11 other pieces, no items
     * (items are meant to be earned during the raid itself).
     * @returns {Array<{type:string, items:Array}>}
     */
    generateScavLoadout() {
        const types = ['queen', 'rook', 'rook', 'bishop', 'bishop', 'knight', 'knight',
                       'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'];
        for (let i = types.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [types[i], types[j]] = [types[j], types[i]];
        }
        const count = 7 + Math.floor(Math.random() * 5); // 7–11 extra pieces
        const pieces = [{ type: 'king', items: [] }];
        for (let i = 0; i < count && i < types.length; i++) {
            pieces.push({ type: types[i], items: [] });
        }
        return pieces;
    },

    /**
     * NOT CURRENTLY CALLED ANYWHERE — see the file-level audit note.
     * Commits loot gathered during a Scav raid to the persistent stash.
     * @param {Array<string|null>} [raidBackpack] Item ids looted this raid.
     */
    commitRaid(raidBackpack = []) {
        this.addItems(raidBackpack);
    },

    /* ─── PMC Mode: Build Loadout from Stash ────────────────── */

    /**
     * NOT CURRENTLY CALLED ANYWHERE — see the file-level audit note.
     * Returns the full piece list available for a PMC run: the always-free
     * base loadout plus whatever extra pieces have been recruited.
     * @returns {Array<{type:string, items:Array, isBase:boolean, stashId?:string}>}
     */
    buildPMCLoadout() {
        const stash = this.getStash();
        const pieces = [];

        Object.entries(BASE_LOADOUT).forEach(([type, count]) => {
            for (let i = 0; i < count; i++) {
                pieces.push({ type, items: [], isBase: true });
            }
        });

        stash.extraPieces.forEach(ep => {
            pieces.push({ type: ep.type, items: ep.items.slice(), isBase: false, stashId: ep.id });
        });

        return pieces;
    },

    /* ─── PMC Mode: Apply loot rules after PvP match ────────── */

    /**
     * NOT CURRENTLY CALLED ANYWHERE — see the file-level audit note.
     * Builds the pool of items available for a PMC winner to loot from the
     * losing side's pieces — both still on the board and already captured.
     * @param {'white'|'black'} loserSideColor
     * @param {ChessEngine} engine
     * @returns {Array<{itemId:string, piece:string}>}
     */
    computeLootPool(loserSideColor, engine) {
        const lootPool = [];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = engine.getPiece(r, c);
                if (p && p.color === loserSideColor && p instanceof PieceEntity) {
                    p.getItems().forEach(item => {
                        if (item) lootPool.push({ itemId: item.id, piece: p.type });
                    });
                }
            }
        }

        if (engine.captureLog) {
            engine.captureLog.forEach(log => {
                if (log.victim && log.victim.color === loserSideColor) {
                    if (log.victim.getItems) {
                        log.victim.getItems().forEach(item => {
                            if (item) lootPool.push({ itemId: item.id, piece: log.victim.type });
                        });
                    }
                }
            });
        }

        return lootPool; // winner picks up to 3 from this pool
    },

    /**
     * NOT CURRENTLY CALLED ANYWHERE — see the file-level audit note.
     * Applies the outcome of a PMC match: the winner's chosen loot and the
     * loser's unclaimed remainder both return to the (single, local)
     * persistent stash.
     *
     * FIX: `winnerPickedItemIds` was accepted as a parameter but never
     * used anywhere in the function body — the winner's chosen loot would
     * never actually have been added to the stash if this had been wired
     * up as written. Both item lists are now applied.
     *
     * @param {Array<string|null>} [winnerPickedItemIds] Up to 3 items the winner chose.
     * @param {Array<string|null>} [loserRemainingItemIds] Unclaimed loot returning to stash.
     * @param {Array<string>} [loserExtraPiecesOnBoard] Unused — extra pieces
     *        that were on the board simply disappear on a loss; base
     *        pieces always remain available regardless.
     */
    applyPMCResult(winnerPickedItemIds = [], loserRemainingItemIds = [], loserExtraPiecesOnBoard = []) {
        const stash = this.getStash();

        // FIX: previously missing entirely.
        winnerPickedItemIds.forEach(id => {
            if (id) stash.items.push(id);
        });

        loserRemainingItemIds.forEach(id => {
            if (id) stash.items.push(id);
        });

        // Extra pieces (beyond base) that were on board disappear — don't add back.
        // Base pieces always return implicitly (they never leave the stash permanently).

        this._saveCache();
    },

    /* ─── Utility ───────────────────────────────────────────── */

    /** @returns {number} Count of loose (unequipped) items in the stash. */
    getItemCount() {
        return this.getStash().items.length;
    },

    /** @returns {number} Count of permanently-recruited extra pieces. */
    getExtraPieceCount() {
        return this.getStash().extraPieces.length;
    },

    /** Clears the in-memory cache (call on page load or after a full run reset). */
    invalidateCache() {
        this._cache = null;
    },
};
