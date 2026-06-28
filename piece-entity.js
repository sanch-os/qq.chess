/* ============================================
   PieceEntity — Chess piece with item slots
   ============================================ */

class PieceEntity {
    constructor(type, color, id) {
        this.id = id !== undefined ? id : PieceEntity._nextId++;
        this.type = type;       // 'king','queen','rook','bishop','knight','pawn'
        this.baseType = type;   // Never changes (for transforms)
        this.color = color;     // 'white' | 'black'
        this.items = [null, null, null]; // 3 item slots
        this.shield = 0;        // Current shield points
        this.moveCount = 0;
        this.captureCount = 0;
        this.frozen = 0;        // Turns frozen (skip move)
        this.alive = true;
    }

    clone() {
        const p = new PieceEntity(this.type, this.color, this.id);
        p.baseType = this.baseType;
        p.items = this.items.slice(); // shallow copy — items don't mutate during AI search
        p.shield = this.shield;
        p.moveCount = this.moveCount;
        p.captureCount = this.captureCount;
        p.frozen = this.frozen;
        p.alive = this.alive;
        return p;
    }

    // --- Item Management ---

    getItem(slot) { return this.items[slot]; }

    setItem(slot, item) {
        this.items[slot] = item;
        this._recomputeShield();
    }

    removeItem(slot) {
        const item = this.items[slot];
        this.items[slot] = null;
        this._recomputeShield();
        return item;
    }

    getItems() { return this.items.filter(Boolean); }

    getEmptySlot() { return this.items.indexOf(null); }

    hasItemId(itemId) { return this.items.some(i => i && i.id === itemId); }

    hasItemTag(tag) {
        return this.items.some(i => i && i.tags && i.tags.includes(tag));
    }

    _recomputeShield() {
        const stats = this.getStats();
        this.shield = stats.shield || 0;
    }

    // --- Computed Stats from Items ---
    // Aggregate all modifiers from equipped items into a single stats object

    getStats() {
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
            shield: 0,             // Number of captures survived
            goldPerCapture: 0,     // Gold gained per capture
            goldOnWin: 0,          // Gold gained on round win
            extraDirections: [],   // Additional move directions [[dr,dc],...] (range 1)
            extraKnightOffsets: [],// Additional knight L-offsets
            moveAnywhere: false,   // Can teleport to any empty/enemy square (except friendly + enemy king)
            // --- Pawn specials ---
            pawnAlwaysDouble: false,   // Pawn can always push 2 squares (not just from start row)
            pawnExtraForward: 0,        // Pawn can move up to 1+N squares forward
            pawnCanCaptureForward: false, // Pawn can capture directly forward
            pawnCanCaptureBackward: false, // Pawn can capture diagonally backward
            // --- Sliding specials ---
            pierceOne: false,          // Sliding piece can pass through exactly 1 blocking piece per ray
            canStepAnyDirection: false, // Piece can step 1 square in any direction
            extraStep: 0,              // Jump N squares in any direction (non-sliding)
            // --- Immunities ---
            immuneToKnights: false,    // Can't be captured by knights
            immuneToRooks: false,      // Can't be captured by rooks
            immuneToBishops: false,    // Can't be captured by bishops
            immuneToQueens: false,     // Can't be captured by queens
            immuneToAll: false,        // Can't be captured at all (absolute invulnerability)
            // --- King movement boost ---
            extraKingMove: 0,          // King can move N extra squares (like a short-range queen)
            // --- Economy bonuses ---
            goldOnQueenCapture: 0,     // Extra gold when capturing a queen
            goldOnKnightCapture: 0,    // Extra gold when capturing a knight
            goldOnRookCapture: 0,      // Extra gold when capturing a rook
            goldOnBishopCapture: 0,    // Extra gold when capturing a bishop
            goldOnPawnCapture: 0,      // Extra gold when capturing a pawn
            goldOnLongCapture: 0,      // Extra gold for captures at distance >= 3
            goldOnCaptured: 0,         // Gold owner earns when THIS piece is captured
            shieldOnHeavyCapture: 0,   // Gain shield charges when capturing rook/queen
            // --- Special effects ---
            venomChance: 0,            // Chance to freeze victim for 1 turn after capture
            lifesteal: false,          // Capturing heals 1 shield charge
        };

        // Count identical items
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
            
            // Apply base modifiers (numeric values scale with count, booleans apply if count > 0)
            for (const [key, value] of Object.entries(mods)) {
                if (key === 'extraDirections' || key === 'extraKnightOffsets') continue;
                if (typeof value === 'number') {
                    stats[key] = (stats[key] || 0) + (value * count);
                } else if (typeof value === 'boolean' && value) {
                    stats[key] = true;
                }
            }
            
            // Apply extra directions/offsets (repeated `count` times so they don't break, though redundant for arrays, it's fine)
            if (item.extraDirections) {
                for (let i = 0; i < count; i++) stats.extraDirections.push(...item.extraDirections);
            }
            if (item.extraKnightOffsets) {
                for (let i = 0; i < count; i++) stats.extraKnightOffsets.push(...item.extraKnightOffsets);
            }

            // Apply Synergy bonuses (if defined for this specific count or lower)
            if (item.synergy) {
                for (let c = 2; c <= count; c++) {
                    if (item.synergy[c]) {
                        const synMods = item.synergy[c].modifiers || {};
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
        }

        // Clamp dodgeChance to max 0.95
        if (stats.dodgeChance > 0.95) stats.dodgeChance = 0.95;

        return stats;
    }

    // --- Item value for AI evaluation ---
    getItemValue() {
        let value = 0;
        for (const item of this.items) {
            if (!item) continue;
            const m = item.modifiers || {};
            value += (m.extraRange || 0) * 30;
            value += (m.extraCaptureRange || 0) * 25;
            value += (m.canJump ? 40 : 0);
            value += (m.shield || 0) * 80;
            value += (m.moveAsQueen ? 150 : 0);
            value += (m.immuneToPawns ? 30 : 0);
            value += (m.dodgeChance || 0) * 100;
            value += (m.earlyPromotion ? 50 : 0);
            if (item.extraDirections) value += item.extraDirections.length * 20;
            if (item.extraKnightOffsets) value += item.extraKnightOffsets.length * 25;
            value += (m.immuneToKnights ? 35 : 0);
            value += (m.immuneToRooks ? 50 : 0);
            value += (m.immuneToBishops ? 35 : 0);
            value += (m.immuneToQueens ? 60 : 0);
            value += (m.immuneToAll ? 200 : 0);
            value += (m.extraKingMove || 0) * 20;
            value += (m.venomChance || 0) * 60;
            value += (m.lifesteal ? 50 : 0);
            value += (m.goldOnQueenCapture || 0) * 5;
            value += (m.goldOnRookCapture || 0) * 4;
        }
        return value;
    }
}

PieceEntity._nextId = 1;
PieceEntity.resetIdCounter = function() { PieceEntity._nextId = 1; };
