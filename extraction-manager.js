/* ============================================
   Extraction Manager — Global Stash & Loot Logic
   Handles the "Scav" and "PMC" game modes.
   ============================================ */

const EXTRACTION_STASH_KEY = 'chess_extraction_stash';

// Standard piece count per type for white (the "base loadout")
const BASE_LOADOUT = { king: 1, queen: 1, rook: 2, bishop: 2, knight: 2, pawn: 8 };

const ExtractionManager = {

    /* ─── Stash Load / Save ─────────────────────────────────── */

    load() {
        try {
            const raw = localStorage.getItem(EXTRACTION_STASH_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return this._defaultStash();
    },

    save(stash) {
        try {
            localStorage.setItem(EXTRACTION_STASH_KEY, JSON.stringify(stash));
        } catch (e) {}
    },

    _defaultStash() {
        return {
            // Extra pieces beyond the base 16 (farmed via Scav)
            extraPieces: [],   // [{ id: string, type: string, items: [itemId|null, ...] }]
            // Items not equipped on any piece
            items: [],         // [itemId, ...]
        };
    },

    getStash() {
        if (!this._cache) this._cache = this.load();
        return this._cache;
    },

    _saveCache() {
        if (this._cache) this.save(this._cache);
    },

    /* ─── Items ─────────────────────────────────────────────── */

    addItem(itemId) {
        const stash = this.getStash();
        stash.items.push(itemId);
        this._saveCache();
    },

    addItems(itemIds) {
        const stash = this.getStash();
        itemIds.forEach(id => id && stash.items.push(id));
        this._saveCache();
    },

    removeItemAt(index) {
        const stash = this.getStash();
        if (index < 0 || index >= stash.items.length) return null;
        const [removed] = stash.items.splice(index, 1);
        this._saveCache();
        return removed;
    },

    /* ─── Extra Pieces ──────────────────────────────────────── */

    addExtraPiece(type, equippedItemIds = []) {
        const stash = this.getStash();
        const id = `extra_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        stash.extraPieces.push({ id, type, items: equippedItemIds });
        this._saveCache();
        return id;
    },

    removeExtraPiece(id) {
        const stash = this.getStash();
        const idx = stash.extraPieces.findIndex(p => p.id === id);
        if (idx === -1) return null;
        const [removed] = stash.extraPieces.splice(idx, 1);
        this._saveCache();
        // Return the items the piece had equipped, back to the stash items list
        if (removed.items.length) this.addItems(removed.items.filter(Boolean));
        return removed;
    },

    /* ─── Scav Mode: Generate Random Loadout ────────────────── */

    generateScavLoadout() {
        // 1 King + random 7-11 other pieces, no items (earned in the raid)
        const types = ['queen', 'rook', 'rook', 'bishop', 'bishop', 'knight', 'knight',
                       'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'];
        // Shuffle
        for (let i = types.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [types[i], types[j]] = [types[j], types[i]];
        }
        const count = 7 + Math.floor(Math.random() * 5); // 7–11 extra pieces
        const pieces = [{ type: 'king', items: [] }];
        for (let i = 0; i < count && i < types.length; i++) {
            pieces.push({ type: types[i], items: [] });
        }
        return pieces; // [{ type, items }]
    },

    /* ─── Scav Mode: Commit raid backpack to stash ──────────── */
    // Called after win / draw / stalemate in Scav mode
    commitRaid(raidBackpack = []) {
        // raidBackpack: array of item IDs looted during the raid
        this.addItems(raidBackpack);
    },

    /* ─── PMC Mode: Build Loadout from Stash ────────────────── */
    // Returns full piece list available for PMC: base + extra from stash
    buildPMCLoadout() {
        const stash = this.getStash();
        const pieces = [];

        // Base pieces — always available, no stash cost
        Object.entries(BASE_LOADOUT).forEach(([type, count]) => {
            for (let i = 0; i < count; i++) {
                pieces.push({ type, items: [], isBase: true });
            }
        });

        // Extra pieces from stash
        stash.extraPieces.forEach(ep => {
            pieces.push({ type: ep.type, items: ep.items.slice(), isBase: false, stashId: ep.id });
        });

        return pieces;
    },

    /* ─── PMC Mode: Apply loot rules after PvP match ────────── */
    // winner: 'white' | 'black' — which side won
    // board: ChessEngine instance (to read what pieces/items were on the board)
    // loserIsLocal: bool — true if the local player lost
    // Returns { lootPool: [...items], extraPiecesLost: [...type] }
    computeLootPool(loserSideColor, engine) {
        const lootPool = []; // All items on loser's dead and alive pieces

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = engine.board[r][c];
                if (p && p.color === loserSideColor && p instanceof PieceEntity) {
                    p.getItems().forEach(item => {
                        if (item) lootPool.push({ itemId: item.id, piece: p.type });
                    });
                }
            }
        }

        // Also add items from captured pieces (stored in engine.captureLog if available)
        // captureLog contains { attacker, victim, round }
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

    // Called after winner picks items (max 3). Remaining go back to loser's stash.
    applyPMCResult(winnerPickedItemIds = [], loserRemainingItemIds = [], loserExtraPiecesOnBoard = []) {
        const stash = this.getStash();

        // Return remaining items to stash
        loserRemainingItemIds.forEach(id => {
            if (id) stash.items.push(id);
        });

        // Extra pieces (beyond base) that were on board disappear — don't add back
        // Base pieces always return implicitly (they never leave the stash permanently)

        this._saveCache();
    },

    /* ─── Utility ───────────────────────────────────────────── */
    getItemCount() {
        return this.getStash().items.length;
    },

    getExtraPieceCount() {
        return this.getStash().extraPieces.length;
    },

    // Clear cache (call on page load or after a full run reset)
    invalidateCache() {
        this._cache = null;
    },
};
