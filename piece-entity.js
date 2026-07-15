/* ============================================================================
   PieceEntity — qq.chess piece with item slots (refactored)
   ============================================================================
   A chess piece plus up to MAX_ITEM_SLOTS equipped items. Items contribute
   `modifiers` (numeric stats that scale with stacked copies, booleans that
   simply flip on) which getStats() aggregates into one flat stats object
   consumed by ChessEngine's move generators and attack detection, and by
   ChessAI's evaluation via getItemValue().

   SHIELD MODEL (read this before touching setItem/removeItem):
   `shield` is the piece's CURRENT absorbable-hit charge count. It is NOT
   simply "whatever the equipped items say" — it can also grow at runtime
   from combat effects (lifesteal, shieldOnHeavyCapture, written directly by
   ChessEngine after a capture). Equipping/unequipping an item must only
   apply the DELTA the item contributes, never overwrite the whole value —
   otherwise combat-earned charges get wiped out (or, worse, a spent shield
   gets silently refilled by an unrelated inventory action). See
   _recomputeShield() for the exact mechanism.
   ========================================================================= */

/** Number of equippable item slots per piece. */
const MAX_ITEM_SLOTS = 3;
/** Upper bound for any probability-like stat (dodge, venom, ...). Leaves a
 *  non-zero chance of the "opposite" outcome so these abilities are strong,
 *  not literally unbeatable, even when fully stacked. */
const MAX_PROBABILITY = 0.95;

class PieceEntity {
    /**
     * @param {string} type - 'king'|'queen'|'rook'|'bishop'|'knight'|'pawn'
     * @param {'white'|'black'} color
     * @param {number} [id] - Stable identity across promotion/clone; a new
     *        id is minted from the shared counter if omitted.
     */
    constructor(type, color, id) {
        this.id = id !== undefined ? id : PieceEntity._nextId++;
        this.type = type;
        /** @type {string} Original type at creation; never changes across promotion. */
        this.baseType = type;
        this.color = color;
        /** @type {Array<Object|null>} Equipped items, one per slot. */
        this.items = new Array(MAX_ITEM_SLOTS).fill(null);
        /** @type {number} CURRENT shield charges — see module doc above. */
        this.shield = 0;
        /** @type {number} Shield charges attributable to equipped items,
         *  tracked separately so setItem/removeItem can apply just the
         *  delta instead of overwriting combat-earned charges. */
        this._itemShieldMax = 0;
        this.moveCount = 0;
        this.captureCount = 0;
        /** @type {number} Turns remaining frozen (venom effect); 0 = active. */
        this.frozen = 0;
        this.alive = true; // Serialized by app.js; not currently read by game logic.

        /** @type {Object|null} Cached getStats() result; see _invalidateStats(). */
        this._statsCache = null;
        this._statsDirty = true;
    }

    /**
     * Copies this piece for search/legality clones. Items are shared by
     * reference (they are treated as immutable data templates once
     * equipped — nothing in this codebase mutates an item object in
     * place), so the stats cache is safely carried over: same items ⇒
     * same aggregated stats, no need to recompute on the clone's first
     * getStats() call.
     * @returns {PieceEntity}
     */
    clone() {
        const p = new PieceEntity(this.type, this.color, this.id);
        p.baseType = this.baseType;
        p.items = this.items.slice();
        p.shield = this.shield;
        p._itemShieldMax = this._itemShieldMax;
        p.moveCount = this.moveCount;
        p.captureCount = this.captureCount;
        p.frozen = this.frozen;
        p.alive = this.alive;
        p._statsCache = this._statsCache; // safe: identical items ⇒ identical stats
        p._statsDirty = this._statsDirty;
        return p;
    }

    /* ======================================================================
       Item management
       ==================================================================== */

    /** @param {number} slot @returns {Object|null} */
    getItem(slot) { return this.items[slot]; }

    /**
     * Equips an item into a slot (overwriting whatever was there) and
     * updates derived state (stats cache, shield delta).
     * @param {number} slot
     * @param {Object} item
     */
    setItem(slot, item) {
        this.items[slot] = item;
        this._invalidateStats();
        this._recomputeShield();
    }

    /**
     * Clears a slot and returns whatever was equipped there.
     * @param {number} slot
     * @returns {Object|null}
     */
    removeItem(slot) {
        const item = this.items[slot];
        this.items[slot] = null;
        this._invalidateStats();
        this._recomputeShield();
        return item;
    }

    /** @returns {Object[]} Equipped items, empty slots omitted. */
    getItems() { return this.items.filter(Boolean); }

    /** @returns {number} Index of the first empty slot, or -1 if full. */
    getEmptySlot() { return this.items.indexOf(null); }

    /** @param {string} itemId @returns {boolean} */
    hasItemId(itemId) { return this.items.some(i => i && i.id === itemId); }

    /** @param {string} tag @returns {boolean} True if any equipped item carries `tag`. */
    hasItemTag(tag) {
        return this.items.some(i => i && i.tags && i.tags.includes(tag));
    }

    /** Marks the aggregated-stats cache stale; next getStats() recomputes it. */
    _invalidateStats() {
        this._statsDirty = true;
    }

    /**
     * Applies exactly the shield DELTA an inventory change contributes.
     *
     * Why a delta and not a plain overwrite: `shield` also accumulates at
     * runtime from combat (lifesteal, shieldOnHeavyCapture — both add
     * directly to `piece.shield` in ChessEngine after a capture). If this
     * method simply set `this.shield = stats.shield`, EVERY unrelated
     * inventory action would clobber that combat-earned bonus back down to
     * the items' base value — and, symmetrically, re-equipping after a
     * shield charge was already spent in battle would silently refill it
     * for free. Tracking `_itemShieldMax` (the portion of `shield`
     * attributable to items) lets us add/remove only what actually changed.
     */
    _recomputeShield() {
        const oldMax = this._itemShieldMax || 0;
        const stats = this.getStats(); // recomputed via the now-dirty cache
        const newMax = stats.shield || 0;
        this.shield = Math.max(0, this.shield + (newMax - oldMax));
        this._itemShieldMax = newMax;
    }

    /* ======================================================================
       Computed stats from equipped items
       ==================================================================== */

    /**
     * Aggregates every equipped item's modifiers into one flat stats
     * object consumed by ChessEngine's move generators / attack detection.
     *
     * Aggregation rules:
     *  - Numeric modifiers SCALE with the number of identical copies
     *    equipped (up to MAX_ITEM_SLOTS, since duplicates are legal).
     *  - Boolean modifiers simply turn a flag on if at least one copy is
     *    equipped (no stacking concept for an on/off ability).
     *  - `extraDirections` / `extraKnightOffsets` live on the item itself
     *    (not inside `modifiers`) and are concatenated once per copy.
     *  - `synergy` grants BONUS modifiers once a specific stacked count is
     *    reached; every threshold at or below the current count applies
     *    (so an item could define both a 2-copy and a 3-copy bonus, and a
     *    3-stack gets both) — see the Horseshoe item (3× ⇒ moveAnywhere).
     *
     * Result is CACHED: recomputation only happens after setItem/
     * removeItem mark the cache dirty. Callers get a defensive copy (top
     * level + the two mutable array fields) so nothing they do to the
     * returned object can corrupt the cache.
     *
     * @returns {Object} Flat stats object — see field comments below.
     */
    getStats() {
        if (!this._statsDirty && this._statsCache) {
            return this._cloneStats(this._statsCache);
        }

        const stats = {
            extraRange: 0,          // +N range for sliding moves
            extraCaptureRange: 0,   // +N range for sliding captures
            canJump: false,         // Jump over pieces
            pawnCanRetreat: false,  // Pawn moves backward
            pawnCaptureRange: 1,    // Pawn capture diagonal distance (default 1)
            earlyPromotion: false,  // Pawn promotes on rank 6
            moveAsQueen: false,     // Move like queen (for king)
            immuneToPawns: false,   // Can't be captured by pawns
            dodgeChance: 0,         // Chance to survive capture
            shield: 0,              // Shield charges granted by items (see _itemShieldMax)
            goldPerCapture: 0,      // Gold gained per capture
            goldOnWin: 0,           // Gold gained on round win
            extraDirections: [],    // Additional move directions [[dr,dc],...] (range 1)
            extraKnightOffsets: [], // Additional knight L-offsets
            moveAnywhere: false,    // Can teleport to any empty/enemy square (except friendly + enemy king)
            // --- Pawn specials ---
            pawnAlwaysDouble: false,       // Pawn can always push 2 squares (not just from start row)
            pawnExtraForward: 0,           // Pawn can move up to 1+N squares forward
            pawnCanCaptureForward: false,  // Pawn can capture directly forward
            pawnCanCaptureBackward: false, // Pawn can capture diagonally backward
            // --- Sliding specials ---
            pierceOne: false,           // Sliding piece can pass through exactly 1 blocking piece per ray
            canStepAnyDirection: false, // Piece can step 1 square in any direction
            extraStep: 0,               // Jump N squares in any direction (non-sliding)
            // --- Immunities ---
            immuneToKnights: false,
            immuneToRooks: false,
            immuneToBishops: false,
            immuneToQueens: false,
            immuneToAll: false,       // Can't be captured at all (absolute invulnerability)
            // --- King movement boost ---
            extraKingMove: 0,         // King can move N extra squares (like a short-range queen)
            // --- Economy bonuses ---
            goldOnQueenCapture: 0,
            goldOnKnightCapture: 0,
            goldOnRookCapture: 0,
            goldOnBishopCapture: 0,
            goldOnPawnCapture: 0,
            goldOnLongCapture: 0,     // Extra gold for captures at distance >= 3
            goldOnCaptured: 0,        // Gold owner earns when THIS piece is captured
            shieldOnHeavyCapture: 0,  // Gain shield charges when capturing rook/queen
            // --- Special effects ---
            venomChance: 0,           // Chance to freeze victim for 1 turn after capture
            lifesteal: false,         // Capturing heals 1 shield charge
        };

        // Count identical items (duplicates legally occupy multiple slots).
        const itemCounts = {};
        const uniqueItems = [];
        for (const item of this.items) {
            if (!item) continue;
            if (!itemCounts[item.id]) {
                itemCounts[item.id] = 0;
                uniqueItems.push(item);
            }
            itemCounts[item.id]++;
        }

        for (const item of uniqueItems) {
            const count = itemCounts[item.id];
            const mods = item.modifiers || {};

            for (const [key, value] of Object.entries(mods)) {
                // Arrays never belong inside `modifiers` (they live as
                // top-level item fields — see below); skip defensively in
                // case malformed item data nests them here anyway.
                if (key === 'extraDirections' || key === 'extraKnightOffsets') continue;
                if (typeof value === 'number') {
                    stats[key] = (stats[key] || 0) + (value * count);
                } else if (typeof value === 'boolean' && value) {
                    stats[key] = true;
                }
            }

            // extraDirections / extraKnightOffsets are top-level item
            // fields (not inside `modifiers`); each stacked copy repeats
            // its contribution.
            if (item.extraDirections) {
                for (let i = 0; i < count; i++) stats.extraDirections.push(...item.extraDirections);
            }
            if (item.extraKnightOffsets) {
                for (let i = 0; i < count; i++) stats.extraKnightOffsets.push(...item.extraKnightOffsets);
            }

            // Synergy: every stacked-count threshold AT OR BELOW the
            // current count contributes its bonus (thresholds are
            // cumulative, not "highest tier only" — e.g. a 2-copy bonus
            // AND a 3-copy bonus both apply once 3 are equipped).
            if (item.synergy) {
                for (let c = 2; c <= count; c++) {
                    const tier = item.synergy[c];
                    if (!tier) continue;
                    const synMods = tier.modifiers || {};
                    for (const [key, value] of Object.entries(synMods)) {
                        if (typeof value === 'number') {
                            stats[key] = (stats[key] || 0) + value;
                        } else if (typeof value === 'boolean' && value) {
                            stats[key] = true;
                        }
                    }
                }
            }
        }

        // Probability-like stats are capped below 1.0 so the "unlucky for
        // the attacker" outcome always remains possible, however heavily
        // the ability is stacked. Both dodge (survive being captured) and
        // venom (freeze on capture) use the same cap for consistency —
        // the old code only clamped dodgeChance, letting stacked venom
        // items exceed 1.0 and become a guaranteed effect.
        stats.dodgeChance = this._clampProbability(stats.dodgeChance);
        stats.venomChance = this._clampProbability(stats.venomChance);

        this._statsCache = stats;
        this._statsDirty = false;
        return this._cloneStats(stats);
    }

    /**
     * Clamps a probability-like stat into [0, MAX_PROBABILITY].
     * @param {number} p
     * @returns {number}
     */
    _clampProbability(p) {
        if (p > MAX_PROBABILITY) return MAX_PROBABILITY;
        if (p < 0) return 0;
        return p;
    }

    /**
     * Defensive shallow copy of a stats object, including fresh array
     * copies for the two mutable list fields — protects the cache from
     * accidental mutation by callers.
     * @param {Object} stats
     * @returns {Object}
     */
    _cloneStats(stats) {
        return {
            ...stats,
            extraDirections: stats.extraDirections.slice(),
            extraKnightOffsets: stats.extraKnightOffsets.slice(),
        };
    }

    /* ======================================================================
       Item value for AI evaluation
       ==================================================================== */

    /**
     * Rough centipawn-equivalent value of everything this piece has
     * equipped, added into ChessAI.evaluate()'s material score.
     *
     * Every field defined in getStats() is weighted here — the previous
     * version left roughly half of them at zero, most notably
     * `moveAnywhere` (an anywhere-but-the-king teleport, arguably the
     * single strongest ability obtainable) and `pawnCaptureRange`, so the
     * AI could neither prioritize acquiring nor defending against them.
     * Weights are hand-tuned heuristics, not a formal analysis — treat
     * them as a starting point for balancing, not gospel.
     *
     * @returns {number} Heuristic value in centipawns.
     */
    getItemValue() {
        let value = 0;
        for (const item of this.items) {
            if (!item) continue;
            const m = item.modifiers || {};

            // --- Movement / range ---
            value += (m.extraRange || 0) * 30;
            value += (m.extraCaptureRange || 0) * 25;
            value += (m.canJump ? 40 : 0);
            value += (m.moveAsQueen ? 150 : 0);
            value += (m.pierceOne ? 60 : 0);
            value += (m.canStepAnyDirection ? 45 : 0);
            value += (m.extraStep || 0) * 35;
            value += (m.extraKingMove || 0) * 20;
            value += (m.moveAnywhere ? 250 : 0); // strongest single ability in the game
            if (item.extraDirections) value += item.extraDirections.length * 20;
            if (item.extraKnightOffsets) value += item.extraKnightOffsets.length * 25;

            // --- Pawn specials ---
            // pawnCaptureRange defaults to 1 (no item); value only the bonus.
            value += Math.max(0, (m.pawnCaptureRange || 1) - 1) * 45;
            value += (m.pawnAlwaysDouble ? 20 : 0);
            value += (m.pawnExtraForward || 0) * 15;
            value += (m.pawnCanCaptureForward ? 25 : 0);
            value += (m.pawnCanCaptureBackward ? 25 : 0);
            value += (m.pawnCanRetreat ? 10 : 0);
            value += (m.earlyPromotion ? 50 : 0);

            // --- Defense ---
            value += (m.shield || 0) * 80;
            value += (m.dodgeChance || 0) * 100;
            value += (m.immuneToPawns ? 30 : 0);
            value += (m.immuneToKnights ? 35 : 0);
            value += (m.immuneToRooks ? 50 : 0);
            value += (m.immuneToBishops ? 35 : 0);
            value += (m.immuneToQueens ? 60 : 0);
            value += (m.immuneToAll ? 200 : 0);

            // --- Combat effects ---
            value += (m.venomChance || 0) * 60;
            value += (m.lifesteal ? 50 : 0);
            value += (m.shieldOnHeavyCapture || 0) * 40;

            // --- Economy (minor weight: affects run currency, not the
            //     board directly, but still makes the piece worth more
            //     to keep alive) ---
            value += (m.goldPerCapture || 0) * 1.5;
            value += (m.goldOnQueenCapture || 0) * 5;
            value += (m.goldOnRookCapture || 0) * 4;
            value += (m.goldOnBishopCapture || 0) * 3;
            value += (m.goldOnKnightCapture || 0) * 3;
            value += (m.goldOnPawnCapture || 0) * 1;
            value += (m.goldOnLongCapture || 0) * 2;
            value += (m.goldOnCaptured || 0) * 1;
            value += (m.goldOnWin || 0) * 1;
        }
        return value;
    }
}

/** @type {number} Monotonic id source for newly constructed pieces. */
PieceEntity._nextId = 1;
/** Resets the id counter (called at the start of a fresh game/round). */
PieceEntity.resetIdCounter = function () { PieceEntity._nextId = 1; };
