/* ============================================================================
   Chess Engine — qq.chess core (refactored)
   ============================================================================
   Item-aware chess engine for the roguelike layer (PieceEntity + items).

   Architectural invariants enforced by this module:
   1. SINGLE SOURCE OF TRUTH for movement patterns: attack detection reuses
      the move generator (via `forAttack` mode) for any piece that carries
      items, so item-modified pieces give check / deny castling correctly.
   2. NO EARLY RETURNS in executeMove(): shield / dodge / en-passant paths
      all fall through the same post-move pipeline (promotion, castling
      rights, en-passant target, half-move clock, king cache).
   3. EXACT UNDO: every real move stores a snapshot (rights, ep, clocks,
      entity references, frozen/venom/shield deltas) so undoLastMove()
      restores the engine byte-for-byte, including roguelike state.
   4. DETERMINISTIC SIMULATION: shield absorption is deterministic and is
      therefore modelled in simulation (legality checks & AI search).
      Dodge is random and only ever fires on real (non-simulated) moves.

   Public API is backward-compatible with app.js / chess-ai.js / editor.js.
   ========================================================================= */

/** Unicode glyphs for rendering pieces (UI helper, not used by game logic). */
const PIECE_SYMBOLS = {
    white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
    black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
};

/** Board geometry constants — avoid magic numbers scattered in logic. */
const BOARD_SIZE = 8;
const MAX_RAY = BOARD_SIZE - 1;          // longest possible sliding ray on 8×8
const KING_START_COL = 4;                // file "e"
const ROOK_QS_COL = 0;                   // file "a" (queenside rook)
const ROOK_KS_COL = 7;                   // file "h" (kingside rook)

/** Direction sets reused across generators and attack scans. */
const DIRS_DIAGONAL = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const DIRS_STRAIGHT = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIRS_ALL_8 = [...DIRS_DIAGONAL, ...DIRS_STRAIGHT];
const KNIGHT_OFFSETS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const PROMOTION_TYPES = ['queen', 'rook', 'bishop', 'knight'];

/**
 * Core chess engine with roguelike item support.
 *
 * Board representation: 8×8 array of (PieceEntity | null), row 0 = rank 8
 * (black's back rank), row 7 = rank 1 (white's back rank).
 */
class ChessEngine {
    constructor() {
        this.reset();
    }

    /* ======================================================================
       Lifecycle / state
       ==================================================================== */

    /**
     * Resets the engine to an empty board and pristine game state.
     * Called by the constructor and by app.js between rounds.
     */
    reset() {
        /** @type {(PieceEntity|null)[][]} 8×8 board matrix. */
        this.board = this.createEmptyBoard();
        /** @type {'white'|'black'} Side to move. */
        this.currentTurn = 'white';
        /** @type {Array<Object>} Real-move history with undo snapshots. */
        this.moveHistory = [];
        /** Castling availability flags per FIDE (king/rook not yet moved). */
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        /** @type {{row:number,col:number}|null} Square capturable en passant. */
        this.enPassantTarget = null;
        /** Half-moves since last pawn move / capture (50-move rule ×2). */
        this.halfMoveClock = 0;
        /** Full move counter, incremented after black's move. */
        this.fullMoveNumber = 1;
        this.gameOver = false;
        /** @type {'white'|'black'|'draw'|null} */
        this.gameResult = null;
        this.gameResultReason = '';
        /** @type {Array<{attacker:PieceEntity, victim:PieceEntity}>} */
        this.captureLog = [];
        /** Gold accumulated from item effects; drained by run-manager. */
        this.goldEarned = { white: 0, black: 0 };
        /**
         * King position cache — refreshed on every king relocation and
         * validated on read, so it can never return a stale square.
         * @type {{white:?{row:number,col:number}, black:?{row:number,col:number}}}
         */
        this._kingPos = { white: null, black: null };
        /**
         * Threefold-repetition bookkeeping. `_positionKeys` mirrors
         * moveHistory (one key per real move, plus the initial position);
         * `_positionCounts` maps key → occurrences.
         */
        this._positionKeys = [];
        this._positionCounts = new Map();
    }

    /**
     * @returns {(null)[][]} Fresh 8×8 matrix filled with null.
     */
    createEmptyBoard() {
        const board = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            board[r] = new Array(BOARD_SIZE).fill(null);
        }
        return board;
    }

    /**
     * Deep-enough copy for legality checks and AI search.
     *
     * NOTE: clones intentionally do NOT copy moveHistory, captureLog,
     * goldEarned or repetition counters — they are search scratchpads,
     * not replayable games. Never call executeMoveAndUpdate on a clone
     * expecting undo support.
     *
     * @returns {ChessEngine} Independent engine copy.
     */
    clone() {
        const engine = new ChessEngine();
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const p = this.board[r][c];
                if (p && p.clone) {
                    engine.board[r][c] = p.clone();
                } else if (p) {
                    // Defensive path for plain {type,color} objects (tests, editor).
                    engine.board[r][c] = { type: p.type, color: p.color };
                }
            }
        }
        engine.currentTurn = this.currentTurn;
        engine.castlingRights = {
            white: { ...this.castlingRights.white },
            black: { ...this.castlingRights.black }
        };
        engine.enPassantTarget = this.enPassantTarget ? { ...this.enPassantTarget } : null;
        engine.halfMoveClock = this.halfMoveClock;
        engine.fullMoveNumber = this.fullMoveNumber;
        engine.gameOver = this.gameOver;
        engine.gameResult = this.gameResult;
        engine.gameResultReason = this.gameResultReason;
        engine._kingPos = {
            white: this._kingPos.white ? { ...this._kingPos.white } : null,
            black: this._kingPos.black ? { ...this._kingPos.black } : null
        };
        return engine;
    }

    /* ======================================================================
       Board setup
       ==================================================================== */

    /** Sets up the standard initial position for both sides. */
    setupStandard() {
        this.reset();
        PieceEntity.resetIdCounter();
        const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        for (let c = 0; c < BOARD_SIZE; c++) {
            this.board[0][c] = new PieceEntity(backRank[c], 'black');
            this.board[1][c] = new PieceEntity('pawn', 'black');
            this.board[6][c] = new PieceEntity('pawn', 'white');
            this.board[7][c] = new PieceEntity(backRank[c], 'white');
        }
    }

    /** Fills only black's two starting ranks (roguelike enemy setup). */
    setupBlackStandard() {
        const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        for (let c = 0; c < BOARD_SIZE; c++) {
            this.board[0][c] = new PieceEntity(backRank[c], 'black');
            this.board[1][c] = new PieceEntity('pawn', 'black');
        }
    }

    /**
     * Mirrors white's army (rows 4-7) onto black's half, cloning item
     * loadouts slot-by-slot. Used for "mirror match" encounters.
     */
    setupBlackMirror() {
        // Clear black's half first.
        for (let r = 0; r < BOARD_SIZE / 2; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                this.board[r][c] = null;
            }
        }
        for (let r = BOARD_SIZE / 2; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const whitePiece = this.board[r][c];
                if (whitePiece && whitePiece.color === 'white') {
                    const blackPiece = new PieceEntity(whitePiece.type, 'black');
                    // setItem() recomputes shields via _recomputeShield(),
                    // so mirrored pieces get correct defensive stats.
                    whitePiece.items.forEach((item, index) => {
                        if (item) {
                            blackPiece.setItem(index, { ...item, modifiers: { ...(item.modifiers || {}) } });
                        }
                    });
                    this.board[BOARD_SIZE - 1 - r][c] = blackPiece;
                }
            }
        }
    }

    /**
     * Creates and places a fresh piece.
     * @param {number} row @param {number} col
     * @param {string} type - 'pawn'|'knight'|'bishop'|'rook'|'queen'|'king'
     * @param {'white'|'black'} color
     * @returns {PieceEntity} The created piece.
     */
    placePiece(row, col, type, color) {
        this.board[row][col] = new PieceEntity(type, color);
        if (type === 'king') this._kingPos[color] = { row, col };
        return this.board[row][col];
    }

    /**
     * Places an EXISTING piece entity on a square (save-game restore path).
     * FIX: app.js:1856 called this method while it did not exist — loading
     * a saved run crashed with TypeError. Now a first-class API.
     * @param {number} row @param {number} col
     * @param {PieceEntity|null} piece - Entity to place (null clears square).
     * @returns {PieceEntity|null} The placed piece.
     */
    setPiece(row, col, piece) {
        this.board[row][col] = piece || null;
        if (piece && piece.type === 'king') {
            this._kingPos[piece.color] = { row, col };
        }
        return this.board[row][col];
    }

    /**
     * Removes and returns whatever occupies a square.
     * @param {number} row @param {number} col
     * @returns {PieceEntity|null}
     */
    removePiece(row, col) {
        const piece = this.board[row][col];
        this.board[row][col] = null;
        return piece;
    }

    /**
     * Safe square accessor.
     * @param {number} row @param {number} col
     * @returns {PieceEntity|null} null both for empty squares AND
     *          out-of-bounds coordinates (consistent sentinel — the old
     *          version returned undefined off-board, which broke `=== null`
     *          comparisons in callers).
     */
    getPiece(row, col) {
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null;
        return this.board[row][col];
    }

    /** @returns {boolean} True if coordinates lie on the board. */
    _inBounds(row, col) {
        return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
    }

    /* ======================================================================
       Move generation (item-aware)
       ====================================================================
       All generators accept an optional `opts` object:
         opts.forAttack — "attack map" mode used by isSquareAttacked():
           • pawn diagonals are emitted even onto EMPTY squares
             (a pawn attacks a square regardless of occupancy);
           • pawn pushes are suppressed (pushes never capture);
           • castling generation is suppressed (castling never attacks a
             square AND this breaks the king-vs-king recursion:
             castling → isSquareAttacked → enemy king moves → castling → …);
           • en passant is suppressed (attacks a pawn, never a king square);
           • moveAnywhere is suppressed (it explicitly cannot capture a
             king, therefore it never delivers check nor denies castling).
       ==================================================================== */

    /**
     * Generates pseudo-legal moves for every piece of a color.
     * @param {'white'|'black'} color
     * @param {{forAttack?:boolean}} [opts]
     * @returns {Array<Object>} Move objects {from,to,capture?,...}.
     */
    generateAllMoves(color, opts) {
        const moves = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === color) {
                    moves.push(...this.generatePieceMoves(r, c, opts));
                }
            }
        }
        return moves;
    }

    /**
     * Fully legal moves (pseudo-legal minus self-check leavers).
     * @param {'white'|'black'} color
     * @returns {Array<Object>}
     */
    generateLegalMoves(color) {
        return this.generateAllMoves(color).filter(move => this.isLegalMove(move));
    }

    /**
     * Pseudo-legal moves for a single piece, item modifiers applied.
     * @param {number} row @param {number} col
     * @param {{forAttack?:boolean}} [opts]
     * @returns {Array<Object>}
     */
    generatePieceMoves(row, col, opts) {
        const piece = this.board[row][col];
        if (!piece) return [];

        // FROZEN ENFORCEMENT (venom item): a frozen piece cannot move — and,
        // consequently, cannot capture, so it does not attack any square.
        // The old engine stored `frozen` but never checked it anywhere.
        if (piece.frozen > 0) return [];

        const forAttack = !!(opts && opts.forAttack);
        // Compute stats ONCE and thread them through every generator below
        // (getStats() builds a ~40-field object; the old code recomputed it
        // inside generateKingMoves and per-victim in the immunity filter).
        const stats = piece.getStats ? piece.getStats() : {};

        let effectiveType = piece.type;
        // Crown item: king moves (and attacks) with queen range while
        // keeping king identity for castling / check purposes.
        if (piece.type === 'king' && stats.moveAsQueen) {
            effectiveType = 'queen_king';
        }

        let moves = [];
        switch (effectiveType) {
            case 'pawn':
                moves = this.generatePawnMoves(row, col, piece.color, stats, opts);
                break;
            case 'knight':
                moves = this.generateKnightMoves(row, col, piece.color, stats);
                break;
            case 'bishop':
                moves = this.generateSlidingMoves(row, col, piece.color, DIRS_DIAGONAL, stats);
                break;
            case 'rook':
                moves = this.generateSlidingMoves(row, col, piece.color, DIRS_STRAIGHT, stats);
                break;
            case 'queen':
                moves = this.generateSlidingMoves(row, col, piece.color, DIRS_ALL_8, stats);
                break;
            case 'queen_king':
                moves = this.generateSlidingMoves(row, col, piece.color, DIRS_ALL_8, stats);
                if (!forAttack) {
                    moves.push(...this._generateCastlingMoves(row, col, piece.color));
                }
                break;
            case 'king':
                moves = this.generateKingMoves(row, col, piece.color, stats, opts);
                break;
            default:
                return [];
        }

        // O(1) target-square dedup for the additive item moves below —
        // replaces the old O(n²) `moves.some(...)` scans.
        const targetSet = new Set(moves.map(m => m.to.row * BOARD_SIZE + m.to.col));
        const pushUnique = (move) => {
            const key = move.to.row * BOARD_SIZE + move.to.col;
            if (targetSet.has(key)) return;
            targetSet.add(key);
            moves.push(move);
        };

        // Item: extra single-step directions (e.g. Compass on a bishop).
        if (stats.extraDirections && stats.extraDirections.length > 0) {
            for (const [dr, dc] of stats.extraDirections) {
                const nr = row + dr, nc = col + dc;
                if (!this._inBounds(nr, nc)) continue;
                const target = this.board[nr][nc];
                if (!target || target.color !== piece.color) {
                    pushUnique({ from: { row, col }, to: { row: nr, col: nc }, capture: !!target });
                }
            }
        }

        // Item: extra knight-like jump offsets (e.g. Long Legs 3+2 pattern).
        if (stats.extraKnightOffsets && stats.extraKnightOffsets.length > 0) {
            for (const [dr, dc] of stats.extraKnightOffsets) {
                const nr = row + dr, nc = col + dc;
                if (!this._inBounds(nr, nc)) continue;
                const target = this.board[nr][nc];
                if (!target || target.color !== piece.color) {
                    pushUnique({ from: { row, col }, to: { row: nr, col: nc }, capture: !!target });
                }
            }
        }

        // Item: single step in any of the 8 directions.
        if (stats.canStepAnyDirection) {
            for (const [dr, dc] of DIRS_ALL_8) {
                const nr = row + dr, nc = col + dc;
                if (!this._inBounds(nr, nc)) continue;
                const target = this.board[nr][nc];
                if (!target || target.color !== piece.color) {
                    pushUnique({ from: { row, col }, to: { row: nr, col: nc }, capture: !!target });
                }
            }
        }

        // Item: jump exactly N squares in any direction (ranged hop).
        if (stats.extraStep > 0) {
            for (const [dr, dc] of DIRS_ALL_8) {
                const nr = row + dr * stats.extraStep, nc = col + dc * stats.extraStep;
                if (!this._inBounds(nr, nc)) continue;
                const target = this.board[nr][nc];
                if (!target || target.color !== piece.color) {
                    pushUnique({ from: { row, col }, to: { row: nr, col: nc }, capture: !!target });
                }
            }
        }

        // Immunity filter: drop captures the victim's items forbid.
        // Runs in forAttack mode too — an "attack" the attacker can never
        // resolve into a capture is not a threat (e.g. immuneToAll king
        // can never actually be in check from that attacker).
        moves = moves.filter(m => this._captureAllowedByImmunities(piece, m));

        // Item: Beta Tester Cap — teleport to any square except friendly
        // pieces and the enemy KING (kings are never captured directly,
        // which is also why this power is excluded from attack maps).
        if (stats.moveAnywhere && !forAttack) {
            for (let nr = 0; nr < BOARD_SIZE; nr++) {
                for (let nc = 0; nc < BOARD_SIZE; nc++) {
                    if (nr === row && nc === col) continue;
                    const target = this.board[nr][nc];
                    if (target && target.color === piece.color) continue;
                    if (target && target.type === 'king') continue;
                    pushUnique({
                        from: { row, col },
                        to: { row: nr, col: nc },
                        capture: !!target,
                        anywhereMove: true // UI marker
                    });
                }
            }
        }

        return moves;
    }

    /**
     * Shared immunity gate for move filtering AND attack detection.
     * @param {PieceEntity} attacker
     * @param {Object} move - Candidate move.
     * @returns {boolean} True if the move survives victim immunities.
     */
    _captureAllowedByImmunities(attacker, move) {
        if (!move.capture) return true;
        if (move.enPassant) return true; // ep victim handled at execution
        const victim = this.board[move.to.row][move.to.col];
        if (!victim) return true; // forAttack probe onto an empty square
        const victimStats = victim.getStats ? victim.getStats() : {};

        if (victimStats.immuneToAll) return false;
        if (victimStats.immuneToPawns && attacker.type === 'pawn') return false;
        if (victimStats.immuneToKnights && attacker.type === 'knight') return false;
        if (victimStats.immuneToRooks && attacker.type === 'rook') return false;
        if (victimStats.immuneToBishops && attacker.type === 'bishop') return false;
        if (victimStats.immuneToQueens && attacker.type === 'queen') return false;
        return true;
    }

    /**
     * Pawn moves: pushes, captures, en passant, promotion + item variants.
     * @param {number} row @param {number} col
     * @param {'white'|'black'} color
     * @param {Object} stats - Precomputed item stats.
     * @param {{forAttack?:boolean}} [opts]
     * @returns {Array<Object>}
     */
    generatePawnMoves(row, col, color, stats, opts) {
        const moves = [];
        const forAttack = !!(opts && opts.forAttack);
        // White pawns move toward row 0, black toward row 7.
        const dir = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;

        // Early Promotion item shifts the promotion boundary 2 ranks closer.
        let promoRow = color === 'white' ? 0 : BOARD_SIZE - 1;
        if (stats.earlyPromotion) {
            promoRow = color === 'white' ? 2 : 5;
        }
        // "Past the boundary" test that works for both colors.
        const isPromoRank = (r) =>
            r === promoRow ||
            (stats.earlyPromotion && (color === 'white' ? r <= promoRow : r >= promoRow));

        /** Emits either 4 promotion variants or one plain move. */
        const pushMaybePromo = (to, extra) => {
            if (isPromoRank(to.row)) {
                for (const pt of PROMOTION_TYPES) {
                    moves.push({ from: { row, col }, to, promotion: pt, ...(extra || {}) });
                }
            } else {
                moves.push({ from: { row, col }, to, ...(extra || {}) });
            }
        };

        const r1 = row + dir;

        // --- Pushes (never capture ⇒ irrelevant for attack maps) ---
        if (!forAttack) {
            if (r1 >= 0 && r1 < BOARD_SIZE && !this.board[r1][col]) {
                pushMaybePromo({ row: r1, col });

                // Standard double push from the start row.
                if (row === startRow) {
                    const r2 = row + dir * 2;
                    if (!this.board[r2][col]) {
                        moves.push({ from: { row, col }, to: { row: r2, col }, doublePush: true });
                    }
                }
            }

            // Item: extended forward reach (1 + pawnExtraForward squares).
            if (stats.pawnExtraForward > 0) {
                for (let dist = 2; dist <= 1 + stats.pawnExtraForward; dist++) {
                    const fr = row + dir * dist;
                    if (fr < 0 || fr >= BOARD_SIZE) break;
                    // Every intermediate square must be empty.
                    let clear = true;
                    for (let d = 1; d < dist; d++) {
                        if (this.board[row + dir * d][col]) { clear = false; break; }
                    }
                    if (!clear || this.board[fr][col]) break;
                    if (!moves.some(m => m.to.row === fr && m.to.col === col)) {
                        pushMaybePromo({ row: fr, col });
                    }
                }
            }

            // Item: pawn may retreat one square (no capture backward-straight).
            if (stats.pawnCanRetreat) {
                const br = row - dir;
                if (br >= 0 && br < BOARD_SIZE && !this.board[br][col]) {
                    moves.push({ from: { row, col }, to: { row: br, col } });
                }
            }

            // Item: double push from ANY rank. Emits doublePush so the move
            // creates an en-passant target, same as a start-row double push.
            if (stats.pawnAlwaysDouble) {
                const r2 = row + dir * 2;
                if (r2 >= 0 && r2 < BOARD_SIZE && !this.board[r2][col] && !this.board[r1][col]) {
                    if (!moves.some(m => m.to.row === r2 && m.to.col === col)) {
                        moves.push({ from: { row, col }, to: { row: r2, col }, doublePush: true });
                    }
                }
            }
        }

        // --- Diagonal captures (item: extended capture range) ---
        // In forAttack mode diagonals are emitted even onto empty squares:
        // a pawn attacks the square whether or not something stands there
        // (this is what makes castling-through-pawn-attack detection work).
        const captureRange = stats.pawnCaptureRange || 1;
        for (const dc of [-1, 1]) {
            for (let dist = 1; dist <= captureRange; dist++) {
                const cr = row + dir * dist;
                const cc = col + dc * dist;
                if (!this._inBounds(cr, cc)) continue;

                // Ranged captures (dist > 1) need a clear diagonal path.
                if (dist > 1) {
                    let pathClear = true;
                    for (let d = 1; d < dist; d++) {
                        if (this.board[row + dir * d][col + dc * d]) { pathClear = false; break; }
                    }
                    if (!pathClear) continue;
                }

                const target = this.board[cr][cc];
                if (target && target.color !== color) {
                    pushMaybePromo({ row: cr, col: cc }, { capture: true });
                } else if (forAttack && !target) {
                    moves.push({ from: { row, col }, to: { row: cr, col: cc }, capture: true, attackProbe: true });
                }
            }
        }

        // --- En passant (always range 1; never relevant to attack maps) ---
        if (!forAttack && this.enPassantTarget && r1 >= 0 && r1 < BOARD_SIZE) {
            for (const dc of [-1, 1]) {
                const nc = col + dc;
                if (this.enPassantTarget.row === r1 && this.enPassantTarget.col === nc) {
                    moves.push({ from: { row, col }, to: { row: r1, col: nc }, enPassant: true, capture: true });
                }
            }
        }

        // --- Item: capture straight ahead ---
        if (stats.pawnCanCaptureForward && r1 >= 0 && r1 < BOARD_SIZE) {
            const target = this.board[r1][col];
            if (target && target.color !== color) {
                if (!moves.some(m => m.to.row === r1 && m.to.col === col && m.capture)) {
                    pushMaybePromo({ row: r1, col }, { capture: true });
                }
            } else if (forAttack && !target) {
                moves.push({ from: { row, col }, to: { row: r1, col }, capture: true, attackProbe: true });
            }
        }

        // --- Item: capture diagonally backward ---
        if (stats.pawnCanCaptureBackward) {
            const br = row - dir;
            for (const dc of [-1, 1]) {
                const bc = col + dc;
                if (!this._inBounds(br, bc)) continue;
                const target = this.board[br][bc];
                if (target && target.color !== color) {
                    moves.push({ from: { row, col }, to: { row: br, col: bc }, capture: true });
                } else if (forAttack && !target) {
                    moves.push({ from: { row, col }, to: { row: br, col: bc }, capture: true, attackProbe: true });
                }
            }
        }

        return moves;
    }

    /**
     * Knight moves (fixed L-offsets; item offsets are added by the caller).
     * @param {number} row @param {number} col
     * @param {'white'|'black'} color
     * @param {Object} stats - Unused here, kept for signature symmetry.
     * @returns {Array<Object>}
     */
    generateKnightMoves(row, col, color, stats) {
        const moves = [];
        for (const [dr, dc] of KNIGHT_OFFSETS) {
            const nr = row + dr, nc = col + dc;
            if (!this._inBounds(nr, nc)) continue;
            const target = this.board[nr][nc];
            if (!target || target.color !== color) {
                moves.push({ from: { row, col }, to: { row: nr, col: nc }, capture: !!target });
            }
        }
        return moves;
    }

    /**
     * Sliding moves along rays with item modifiers.
     *
     * Range model (FIX — extraRange / extraCaptureRange were declared in
     * PieceEntity and sold as items but silently ignored by the engine):
     *   moveCap    = clamp(MAX_RAY + extraRange, 1, ∞)
     *   captureCap = clamp(moveCap + extraCaptureRange, 1, ∞)
     * On an 8×8 board MAX_RAY is already 7, so positive bonuses are
     * mathematically inert — but PENALTIES (Mirror Armor: extraRange −1)
     * now genuinely shorten the ray, and captures may reach past moveCap
     * when extraCaptureRange compensates. Design-debt flag: rebalance the
     * +N range items in items-db.js (see audit notes).
     *
     * Other modifiers:
     *   canJump   — hop over FRIENDLY blockers, ray continues behind them;
     *   pierceOne — pass through exactly one blocker (either color) per ray.
     *
     * @param {number} row @param {number} col
     * @param {'white'|'black'} color
     * @param {number[][]} directions - Ray unit vectors.
     * @param {Object} stats - Precomputed item stats.
     * @returns {Array<Object>}
     */
    generateSlidingMoves(row, col, color, directions, stats) {
        const moves = [];
        const canJump = !!(stats && stats.canJump);
        const pierceOne = !!(stats && stats.pierceOne);
        const moveCap = Math.max(1, MAX_RAY + ((stats && stats.extraRange) || 0));
        const captureCap = Math.max(1, moveCap + ((stats && stats.extraCaptureRange) || 0));
        const rayLimit = Math.max(moveCap, captureCap);

        for (const [dr, dc] of directions) {
            let nr = row + dr, nc = col + dc;
            let dist = 1;
            let piercedOne = false;

            while (this._inBounds(nr, nc) && dist <= rayLimit) {
                const target = this.board[nr][nc];
                if (!target) {
                    if (dist <= moveCap) {
                        moves.push({ from: { row, col }, to: { row: nr, col: nc } });
                    }
                } else {
                    if (target.color !== color && dist <= captureCap) {
                        moves.push({ from: { row, col }, to: { row: nr, col: nc }, capture: true });
                    }
                    if (canJump && target.color === color) {
                        // Hop over the friendly piece; ray keeps going.
                        nr += dr; nc += dc; dist++;
                        continue;
                    }
                    if (pierceOne && !piercedOne) {
                        // Phase through exactly one blocker of either color.
                        piercedOne = true;
                        nr += dr; nc += dc; dist++;
                        continue;
                    }
                    break; // ray blocked
                }
                nr += dr; nc += dc; dist++;
            }
        }
        return moves;
    }

    /**
     * King moves: 8 base steps, item range extension, castling.
     * @param {number} row @param {number} col
     * @param {'white'|'black'} color
     * @param {Object} [statsIn] - Precomputed stats (recomputed if absent).
     * @param {{forAttack?:boolean}} [opts]
     * @returns {Array<Object>}
     */
    generateKingMoves(row, col, color, statsIn, opts) {
        const piece = this.board[row][col];
        const stats = statsIn || (piece && piece.getStats ? piece.getStats() : {});
        const forAttack = !!(opts && opts.forAttack);
        const moves = [];

        for (const [dr, dc] of DIRS_ALL_8) {
            const nr = row + dr, nc = col + dc;
            if (!this._inBounds(nr, nc)) continue;
            const target = this.board[nr][nc];
            if (!target || target.color !== color) {
                moves.push({ from: { row, col }, to: { row: nr, col: nc }, capture: !!target });
            }
        }

        // Item: extended king stride (short-range queen up to 1+N squares).
        const extraKingMove = stats.extraKingMove || 0;
        if (extraKingMove > 0) {
            for (const [dr, dc] of DIRS_ALL_8) {
                for (let dist = 2; dist <= 1 + extraKingMove; dist++) {
                    const nr = row + dr * dist, nc = col + dc * dist;
                    if (!this._inBounds(nr, nc)) break;
                    // Path must be clear up to the destination.
                    let clear = true;
                    for (let d = 1; d < dist; d++) {
                        if (this.board[row + dr * d][col + dc * d]) { clear = false; break; }
                    }
                    if (!clear) break;
                    const target = this.board[nr][nc];
                    if (!target || target.color !== color) {
                        if (!moves.some(m => m.to.row === nr && m.to.col === nc)) {
                            moves.push({ from: { row, col }, to: { row: nr, col: nc }, capture: !!target });
                        }
                        if (target) break; // capture ends the stride
                    } else break;
                }
            }
        }

        // Castling never appears in attack maps (see forAttack contract).
        if (!forAttack) {
            moves.push(...this._generateCastlingMoves(row, col, color));
        }
        return moves;
    }

    /**
     * Castling generation per FIDE: rights intact, rook in place, path
     * empty, and king's start / transit / destination squares unattacked.
     * Attack tests are item-aware via the refactored isSquareAttacked().
     * @param {number} row @param {number} col
     * @param {'white'|'black'} color
     * @returns {Array<Object>}
     */
    _generateCastlingMoves(row, col, color) {
        const moves = [];
        const rights = this.castlingRights[color];
        const kingRow = color === 'white' ? 7 : 0;
        if (row !== kingRow || col !== KING_START_COL) return moves;
        const opp = color === 'white' ? 'black' : 'white';

        if (rights.kingSide) {
            const rook = this.board[kingRow][ROOK_KS_COL];
            if (rook && rook.type === 'rook' && rook.color === color &&
                !this.board[kingRow][5] && !this.board[kingRow][6] &&
                !this.isSquareAttacked(kingRow, 4, opp) &&
                !this.isSquareAttacked(kingRow, 5, opp) &&
                !this.isSquareAttacked(kingRow, 6, opp)) {
                moves.push({ from: { row, col }, to: { row: kingRow, col: 6 }, castling: 'kingSide' });
            }
        }
        if (rights.queenSide) {
            const rook = this.board[kingRow][ROOK_QS_COL];
            if (rook && rook.type === 'rook' && rook.color === color &&
                !this.board[kingRow][1] && !this.board[kingRow][2] && !this.board[kingRow][3] &&
                !this.isSquareAttacked(kingRow, 4, opp) &&
                !this.isSquareAttacked(kingRow, 3, opp) &&
                !this.isSquareAttacked(kingRow, 2, opp)) {
                moves.push({ from: { row, col }, to: { row: kingRow, col: 2 }, castling: 'queenSide' });
            }
        }
        return moves;
    }

    /* ======================================================================
       Attack detection (item-aware, two-pass hybrid)
       ==================================================================== */

    /**
     * Is `(row,col)` attacked by any piece of `byColor`?
     *
     * Two-pass hybrid (FIX for the central engine defect — the old scanner
     * only knew vanilla patterns, so item-modified pieces delivered
     * "invisible" checks and castling passed through attacked squares,
     * while range PENALTIES caused false-positive checks):
     *
     *   Pass 1 (fast): classic reverse scans (pawn diagonals, knight
     *   offsets, king ring, sliding rays) — but a positive hit only counts
     *   for pieces WITHOUT items and not frozen. Pieces with items may have
     *   altered patterns in either direction, so they are deferred to
     *   pass 2. Any piece still BLOCKS rays regardless of items (canJump /
     *   pierceOne modify the mover, never the blocker).
     *
     *   Pass 2 (exact): for every non-frozen enemy piece that carries at
     *   least one item, generate its moves in forAttack mode and test
     *   whether any lands on the square. forAttack suppresses castling
     *   (recursion guard), pushes, en passant and moveAnywhere — see the
     *   contract above generateAllMoves().
     *
     * Immunities of the CURRENT occupant of the square are respected in
     * both passes: an attacker that can never legally capture the occupant
     * does not "attack" it (an immuneToAll king is therefore never in
     * check from such pieces — matching item semantics).
     *
     * @param {number} row @param {number} col
     * @param {'white'|'black'} byColor - Attacking side.
     * @returns {boolean}
     */
    isSquareAttacked(row, col, byColor) {
        const occupant = this.board[row] ? this.board[row][col] : null;
        /** A pass-1 candidate counts only if plain-patterned and able to act. */
        const vanillaCounts = (p) => {
            if (p.frozen > 0) return false;
            if (p.getItems && p.getItems().length > 0) return false; // defer to pass 2
            if (occupant && !this._captureAllowedByImmunities(p, { capture: true, to: { row, col } })) return false;
            return true;
        };

        // -- Pass 1a: pawns (reverse diagonal from the target square) --
        const pawnDir = byColor === 'white' ? 1 : -1;
        for (const dc of [-1, 1]) {
            const pr = row + pawnDir, pc = col + dc;
            if (this._inBounds(pr, pc)) {
                const p = this.board[pr][pc];
                if (p && p.type === 'pawn' && p.color === byColor && vanillaCounts(p)) return true;
            }
        }

        // -- Pass 1b: knights --
        for (const [dr, dc] of KNIGHT_OFFSETS) {
            const nr = row + dr, nc = col + dc;
            if (this._inBounds(nr, nc)) {
                const p = this.board[nr][nc];
                if (p && p.type === 'knight' && p.color === byColor && vanillaCounts(p)) return true;
            }
        }

        // -- Pass 1c: enemy king ring --
        for (const [dr, dc] of DIRS_ALL_8) {
            const nr = row + dr, nc = col + dc;
            if (this._inBounds(nr, nc)) {
                const p = this.board[nr][nc];
                if (p && p.type === 'king' && p.color === byColor && vanillaCounts(p)) return true;
            }
        }

        // -- Pass 1d: sliding rays (queen / rook / bishop) --
        for (const [dr, dc] of DIRS_ALL_8) {
            let nr = row + dr, nc = col + dc;
            while (this._inBounds(nr, nc)) {
                const p = this.board[nr][nc];
                if (p) {
                    if (p.color === byColor && vanillaCounts(p)) {
                        const isDiag = dr !== 0 && dc !== 0;
                        const isStraight = dr === 0 || dc === 0;
                        if (p.type === 'queen') return true;
                        if (p.type === 'bishop' && isDiag) return true;
                        if (p.type === 'rook' && isStraight) return true;
                    }
                    break; // any piece blocks the ray for pass 1
                }
                nr += dr; nc += dc;
            }
        }

        // -- Pass 2: exact generative check for item-carrying pieces --
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const p = this.board[r][c];
                if (!p || p.color !== byColor) continue;
                if (!p.getItems || p.getItems().length === 0) continue; // covered by pass 1
                if (p.frozen > 0) continue;
                const attacks = this.generatePieceMoves(r, c, { forAttack: true });
                if (attacks.some(m => m.to.row === row && m.to.col === col)) return true;
            }
        }

        return false;
    }

    /**
     * @param {'white'|'black'} color
     * @returns {boolean} True if `color`'s king is currently attacked.
     */
    isInCheck(color) {
        const king = this.findKing(color);
        if (!king) return false;
        const opp = color === 'white' ? 'black' : 'white';
        return this.isSquareAttacked(king.row, king.col, opp);
    }

    /* ======================================================================
       Move validation & execution
       ==================================================================== */

    /**
     * A pseudo-legal move is legal iff it does not leave the mover's own
     * king in check. Simulated on a clone so the live board never mutates.
     * Shield absorption is deterministic and IS simulated (the resulting
     * position after a shield-swap is what legality must be judged on).
     * @param {Object} move
     * @returns {boolean}
     */
    isLegalMove(move) {
        const piece = this.board[move.from.row][move.from.col];
        if (!piece) return false;
        const color = piece.color;
        const clone = this.clone();
        clone.executeMove(move, true);
        return !clone.isInCheck(color);
    }

    /**
     * Legal moves for one square (UI highlight path).
     * @param {number} row @param {number} col
     * @returns {Array<Object>}
     */
    getLegalMovesForPiece(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        return this.generatePieceMoves(row, col).filter(m => this.isLegalMove(m));
    }

    /**
     * Validated user-facing move entry point.
     * @param {number} fromRow @param {number} fromCol
     * @param {number} toRow @param {number} toCol
     * @param {string} [promotionType] - Piece to promote to (default queen).
     * @returns {{move:Object,captured:?PieceEntity,notation:string}|null}
     *          null if the move is illegal or out of turn.
     */
    /**
     * @param {?{dodged:boolean, venom:boolean}} [forcedOutcomes] - NETWORK
     *        SYNC: when replaying a move received from the authoritative
     *        (moving) client, pass the RNG outcomes it already rolled.
     *        Dodge/venom are random; without this, each client would roll
     *        its own dice and the boards would silently diverge the first
     *        time a dodge fired on one side only. `null`/omitted = roll
     *        locally (normal local play).
     */
    makeMove(fromRow, fromCol, toRow, toCol, promotionType, forcedOutcomes) {
        const piece = this.board[fromRow][fromCol];
        if (!piece || piece.color !== this.currentTurn) return null;

        const legalMoves = this.getLegalMovesForPiece(fromRow, fromCol);
        const wanted = promotionType || 'queen';
        const move = legalMoves.find(m =>
            m.to.row === toRow && m.to.col === toCol &&
            (!m.promotion || m.promotion === wanted)
        );
        if (!move) return null;

        if (forcedOutcomes) move._forcedOutcomes = forcedOutcomes;
        return this.executeMoveAndUpdate(move);
    }

    /**
     * Executes a REAL move: board mutation, roguelike item effects,
     * history snapshot, turn switch, freeze upkeep, repetition tracking,
     * end-of-game evaluation, SAN notation.
     *
     * Order matters and fixes two old bugs:
     *  • notation is produced AFTER checkGameEnd(), so '#' can actually
     *    appear on mating moves (previously gameOver was still false);
     *  • venom is applied to `move._survivor` (shield/dodge survivor),
     *    which the old `if (captured)` guard made unreachable.
     *
     * @param {Object} move - A move object from the generators.
     * @returns {{move:Object,captured:?PieceEntity,notation:string}}
     */
    executeMoveAndUpdate(move) {
        // Record the starting position once, so threefold counting includes it.
        if (this._positionKeys.length === 0) this._recordPosition();

        // SAN disambiguation must be computed BEFORE the board changes.
        const disamb = this._computeDisambiguation(move);

        // Snapshot state for exact undo (the old history stored
        // prevCastling/prevEnPassant as hardcoded nulls — dead fields).
        const snapshot = {
            castling: {
                white: { ...this.castlingRights.white },
                black: { ...this.castlingRights.black }
            },
            enPassant: this.enPassantTarget ? { ...this.enPassantTarget } : null,
            halfMoveClock: this.halfMoveClock,
            fullMoveNumber: this.fullMoveNumber,
            movedPieceRef: this.board[move.from.row][move.from.col],
            frozenDecremented: [],   // pieces whose freeze ticked this turn
            venomVictim: null        // piece frozen by venom this move
        };

        const captured = this.executeMove(move, false);
        const movedPiece = this.board[move.to.row][move.to.col];

        // --- Per-piece statistics ---
        if (movedPiece && movedPiece.moveCount !== undefined) {
            movedPiece.moveCount++;
            if (captured) movedPiece.captureCount++;
        }

        // --- Item effects on capture / capture attempt ---
        if (movedPiece && movedPiece.getStats) {
            const attackerStats = movedPiece.getStats();

            if (captured) {
                let bonusGold = attackerStats.goldPerCapture || 0;
                const capturedType = captured.type;
                if (capturedType === 'queen')  bonusGold += attackerStats.goldOnQueenCapture  || 0;
                if (capturedType === 'knight') bonusGold += attackerStats.goldOnKnightCapture || 0;
                if (capturedType === 'rook')   bonusGold += attackerStats.goldOnRookCapture   || 0;
                if (capturedType === 'bishop') bonusGold += attackerStats.goldOnBishopCapture || 0;
                if (capturedType === 'pawn')   bonusGold += attackerStats.goldOnPawnCapture   || 0;

                // Long-range capture bonus: Chebyshev distance ≥ 3.
                if (attackerStats.goldOnLongCapture > 0) {
                    const dist = Math.max(
                        Math.abs(move.to.row - move.from.row),
                        Math.abs(move.to.col - move.from.col)
                    );
                    if (dist >= 3) bonusGold += attackerStats.goldOnLongCapture;
                }

                if (attackerStats.shieldOnHeavyCapture > 0 &&
                    (capturedType === 'rook' || capturedType === 'queen')) {
                    movedPiece.shield = (movedPiece.shield || 0) + attackerStats.shieldOnHeavyCapture;
                }
                if (attackerStats.lifesteal) {
                    movedPiece.shield = (movedPiece.shield || 0) + 1;
                }
                if (bonusGold > 0) {
                    if (!this.goldEarned) this.goldEarned = { white: 0, black: 0 };
                    this.goldEarned[movedPiece.color] = (this.goldEarned[movedPiece.color] || 0) + bonusGold;
                }
            }

            // Venom: if the victim SURVIVED (shield / dodge), it may be
            // frozen for one turn. move._survivor is set by executeMove.
            // NETWORK SYNC: with forced outcomes, replay the authoritative
            // client's venom roll instead of rolling locally. The
            // `move._survivor` gate stays in both branches — venom can
            // never target a piece that isn't on the board here, even if
            // a malformed/stale payload claims venom fired.
            const foVenom = move._forcedOutcomes;
            const venomFires = foVenom !== undefined
                ? !!foVenom.venom
                : (attackerStats.venomChance > 0 && Math.random() < attackerStats.venomChance);
            if (move._survivor && venomFires) {
                move._survivor.frozen = (move._survivor.frozen || 0) + 1;
                snapshot.venomVictim = move._survivor;
            }
        }

        this.moveHistory.push({ move, captured, notation: '', prev: snapshot });

        if (captured) {
            this.captureLog.push({ attacker: movedPiece, victim: captured });
        }

        // --- Turn switch & clocks ---
        const moverColor = this.currentTurn;
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        if (this.currentTurn === 'white') this.fullMoveNumber++;

        // Freeze upkeep: a frozen piece skips its OWNER's turn; the counter
        // ticks down once that turn has been played out.
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const p = this.board[r][c];
                if (p && p.color === moverColor && p.frozen > 0) {
                    p.frozen--;
                    snapshot.frozenDecremented.push(p);
                }
            }
        }

        // --- Repetition tracking, then endgame evaluation ---
        this._recordPosition();
        this.checkGameEnd();

        // Notation last, so check ('+') and mate ('#') flags are accurate.
        const notation = this.getMoveNotation(move, captured, disamb);
        this.moveHistory[this.moveHistory.length - 1].notation = notation;

        // `outcomes` = the RNG results of THIS execution, in plain-data
        // form. The friend-mode sender transmits exactly this object so
        // the receiver can replay the move deterministically (see
        // makeMove's forcedOutcomes). Safe for Firebase: booleans only.
        return {
            move, captured, notation,
            outcomes: {
                dodged: !!move._dodged,
                venom: !!snapshot.venomVictim
            }
        };
    }

    /**
     * Low-level board mutation. Handles shield / dodge survival, en
     * passant (including SHIELDED ep victims — previously ep silently
     * bypassed all defensive items), promotion, castling rook transfer,
     * castling-rights & en-passant bookkeeping, half-move clock.
     *
     * Unified flow: the attacker ALWAYS lands on `to`. The only thing
     * survival changes is what remains behind:
     *   normal capture → `from` empties, victim leaves the board;
     *   shield / dodge → victim swaps onto `from` (move._survivor set);
     *   ep survival    → victim stays on its own square, `from` empties.
     * Because there is no early return, promotion / rights / clocks are
     * processed on EVERY path (the old code left pawns stranded on the
     * last rank and kings with live castling rights after a swap).
     *
     * @param {Object} move
     * @param {boolean} simulate - True in legality checks / AI search:
     *        deterministic effects (incl. shield) still apply; the RANDOM
     *        dodge roll and venom/economy side effects do not.
     * @returns {PieceEntity|null} The captured piece, or null if nothing
     *          died (empty square, shield, dodge).
     */
    executeMove(move, simulate) {
        const { from, to } = move;
        const piece = this.board[from.row][from.col];
        let captured = this.board[to.row][to.col];
        /** Piece that survived a capture attempt (if any). */
        let survivor = null;
        /** Where the survivor ends up: 'from' (swap) or 'stay' (ep). */
        let survivorMode = null;

        // --- Direct-capture survival: dodge (random, real moves only),
        //     then shield (deterministic, simulated too) ---
        if (captured && captured.getStats) {
            const victimStats = captured.getStats();
            // NETWORK SYNC: if the move carries forced outcomes (replayed
            // from the authoritative client), use ITS dodge result instead
            // of rolling locally — otherwise two clients roll independently
            // and desync. Shield below stays untouched: it's deterministic,
            // so both clients compute it identically on their own.
            const fo = move._forcedOutcomes;
            const dodged = fo !== undefined
                ? !!fo.dodged
                : (!simulate && victimStats.dodgeChance > 0 && Math.random() < victimStats.dodgeChance);
            if (dodged) {
                move._dodged = true;
                survivor = captured;
                survivorMode = 'from';
                captured = null;
            } else if (captured.shield > 0) {
                captured.shield--;
                move._shielded = true;
                survivor = captured;
                survivorMode = 'from';
                captured = null;
            }
        }

        // --- En passant: resolve the real victim on (from.row, to.col) ---
        if (move.enPassant && !survivor) {
            const epVictim = this.board[from.row][to.col];
            captured = epVictim || null;
            if (captured && captured.getStats) {
                const vStats = captured.getStats();
                // NETWORK SYNC: same forced-outcome rule as the direct-
                // capture dodge above (see comment there).
                const foEp = move._forcedOutcomes;
                const dodgedEp = foEp !== undefined
                    ? !!foEp.dodged
                    : (!simulate && vStats.dodgeChance > 0 && Math.random() < vStats.dodgeChance);
                if (dodgedEp) {
                    move._dodged = true;
                    survivor = captured;
                    survivorMode = 'stay';
                    captured = null;
                } else if (captured.shield > 0) {
                    captured.shield--;
                    move._shielded = true;
                    survivor = captured;
                    survivorMode = 'stay';
                    captured = null;
                }
            }
            if (captured) this.board[from.row][to.col] = null; // pawn actually dies
        }

        // Expose the survivor for venom processing in executeMoveAndUpdate.
        move._survivor = survivor || null;

        // --- Unified placement: attacker → to; from ← survivor|null ---
        this.board[to.row][to.col] = piece;
        this.board[from.row][from.col] = (survivorMode === 'from') ? survivor : null;

        // King position cache — BOTH relocated pieces may be kings.
        if (piece.type === 'king') {
            this._kingPos[piece.color] = { row: to.row, col: to.col };
        }
        if (survivorMode === 'from' && survivor.type === 'king') {
            this._kingPos[survivor.color] = { row: from.row, col: from.col };
        }

        // --- Promotion (also fires after a shield-swap landing — pawns can
        //     no longer get stranded on the last rank) ---
        let effectivePromotion = move.promotion;
        if (!effectivePromotion && piece.type === 'pawn') {
            const lastRank = piece.color === 'white' ? 0 : BOARD_SIZE - 1;
            if (to.row === lastRank) effectivePromotion = 'queen'; // defensive auto-queen
        }
        if (effectivePromotion && piece.type === 'pawn') {
            const promoted = new PieceEntity(effectivePromotion, piece.color, piece.id);
            if (piece.items) {
                promoted.items = piece.items.slice(); // inventory carries over
                promoted.shield = piece.shield;
            }
            promoted.moveCount = piece.moveCount || 0;
            promoted.captureCount = piece.captureCount || 0;
            promoted.frozen = piece.frozen || 0;
            this.board[to.row][to.col] = promoted;
        }

        // --- Castling: relocate the rook alongside the king ---
        if (move.castling) {
            const rookRow = to.row;
            if (move.castling === 'kingSide') {
                this.board[rookRow][5] = this.board[rookRow][ROOK_KS_COL];
                this.board[rookRow][ROOK_KS_COL] = null;
            } else {
                this.board[rookRow][3] = this.board[rookRow][ROOK_QS_COL];
                this.board[rookRow][ROOK_QS_COL] = null;
            }
        }

        // --- Deterministic bookkeeping (applies in simulation too, so AI
        //     search sees correct castling / ep / clock state at depth) ---
        if (piece.type === 'king') {
            this.castlingRights[piece.color].kingSide = false;
            this.castlingRights[piece.color].queenSide = false;
        }
        if (piece.type === 'rook') {
            const homeRow = piece.color === 'white' ? 7 : 0;
            if (from.row === homeRow && from.col === ROOK_QS_COL) this.castlingRights[piece.color].queenSide = false;
            if (from.row === homeRow && from.col === ROOK_KS_COL) this.castlingRights[piece.color].kingSide = false;
        }
        if (captured && captured.type === 'rook') {
            const capturedColor = captured.color;
            const homeRow = capturedColor === 'white' ? 7 : 0;
            const capSquareRow = move.enPassant ? from.row : to.row;
            const capSquareCol = to.col;
            if (capSquareRow === homeRow && capSquareCol === ROOK_QS_COL) this.castlingRights[capturedColor].queenSide = false;
            if (capSquareRow === homeRow && capSquareCol === ROOK_KS_COL) this.castlingRights[capturedColor].kingSide = false;
        }

        // En passant window: only a fresh double push opens one.
        this.enPassantTarget = move.doublePush
            ? { row: (from.row + to.row) / 2, col: to.col }
            : null;

        // 50-move clock. A consumed shield / dodge counts as irreversible
        // progress (defensive resources were spent), so it resets the clock.
        if (piece.type === 'pawn' || captured || move._shielded || move._dodged) {
            this.halfMoveClock = 0;
        } else {
            this.halfMoveClock++;
        }

        return captured;
    }

    /**
     * Undoes the last 1–2 real moves (2 when available — mirrors the UI
     * contract of "take back my move AND the AI's reply"; app.js relies
     * on this semantics).
     *
     * Exact restore via history snapshots (the old implementation
     * corrupted the board on shield/dodge swaps, never restored spent
     * shields, half-move clocks, counters, gold or capture logs).
     * @returns {boolean} False if there was nothing to undo.
     */
    undoLastMove() {
        if (this.moveHistory.length === 0) return false;
        const undoCount = this.moveHistory.length >= 2 ? 2 : 1;
        for (let i = 0; i < undoCount; i++) {
            this._undoSingleMove();
        }
        this.gameOver = false;
        this.gameResult = null;
        this.gameResultReason = '';
        this.checkGameEnd(); // re-evaluate (may legitimately re-end the game)
        return true;
    }

    /** Reverts exactly one half-move using its stored snapshot. */
    _undoSingleMove() {
        const last = this.moveHistory.pop();
        if (!last) return;
        const { move, captured, prev } = last;
        const { from, to } = move;

        // Original entity reference (pre-promotion pawn included) goes
        // straight back to `from` — items, id and shield intact.
        const original = prev.movedPieceRef;

        // Undo promotion counters were incremented on the PROMOTED copy;
        // sync them back onto the original before restoring.
        const onBoard = this.board[to.row][to.col];
        if (onBoard && onBoard.id === original.id && onBoard !== original) {
            original.moveCount = onBoard.moveCount;
            original.captureCount = onBoard.captureCount;
            original.shield = onBoard.shield;
            original.frozen = onBoard.frozen;
        }

        // Roll back per-piece stats bumped in executeMoveAndUpdate.
        if (original.moveCount !== undefined) {
            original.moveCount = Math.max(0, original.moveCount - 1);
            if (captured) original.captureCount = Math.max(0, original.captureCount - 1);
        }

        // Restore board geometry.
        this.board[from.row][from.col] = original;
        if (move._shielded || move._dodged) {
            const survivor = move._survivor;
            if (survivor) {
                if (move.enPassant) {
                    // ep survivor never moved; it is already on its square.
                    this.board[to.row][to.col] = null;
                } else {
                    // Swap back: survivor was relocated onto `from`,
                    // which `original` just reclaimed — survivor returns to `to`.
                    this.board[to.row][to.col] = survivor;
                }
                if (move._shielded) survivor.shield = (survivor.shield || 0) + 1; // refund spent shield
                if (survivor.type === 'king') {
                    this._kingPos[survivor.color] = move.enPassant
                        ? { row: from.row, col: to.col }
                        : { row: to.row, col: to.col };
                }
            } else {
                this.board[to.row][to.col] = null;
            }
        } else if (move.enPassant) {
            this.board[to.row][to.col] = null;
            this.board[from.row][to.col] = captured; // pawn resurrects beside attacker
        } else {
            this.board[to.row][to.col] = captured || null;
        }

        // Un-castle the rook.
        if (move.castling) {
            const rookRow = to.row;
            if (move.castling === 'kingSide') {
                this.board[rookRow][ROOK_KS_COL] = this.board[rookRow][5];
                this.board[rookRow][5] = null;
            } else {
                this.board[rookRow][ROOK_QS_COL] = this.board[rookRow][3];
                this.board[rookRow][3] = null;
            }
        }

        // King cache for the mover.
        if (original.type === 'king') {
            this._kingPos[original.color] = { row: from.row, col: from.col };
        }

        // Undo roguelike side effects recorded in the snapshot.
        for (const p of prev.frozenDecremented) p.frozen++;
        if (prev.venomVictim) prev.venomVictim.frozen = Math.max(0, prev.venomVictim.frozen - 1);
        if (captured) this.captureLog.pop();

        // Restore scalar state exactly (no more heuristic recomputes).
        this.castlingRights = {
            white: { ...prev.castling.white },
            black: { ...prev.castling.black }
        };
        this.enPassantTarget = prev.enPassant ? { ...prev.enPassant } : null;
        this.halfMoveClock = prev.halfMoveClock;
        this.fullMoveNumber = prev.fullMoveNumber;
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';

        // Repetition bookkeeping: drop the position this move created.
        const key = this._positionKeys.pop();
        if (key !== undefined) {
            const n = this._positionCounts.get(key) || 0;
            if (n <= 1) this._positionCounts.delete(key);
            else this._positionCounts.set(key, n - 1);
        }
    }

    /**
     * Heuristic full recompute of castling rights from board + history.
     * Retained as a public compatibility/repair helper (editor & save
     * restore); normal undo no longer needs it thanks to snapshots.
     */
    recomputeCastlingRights() {
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        const wk = this.board[7][KING_START_COL];
        if (!wk || wk.type !== 'king' || wk.color !== 'white') {
            this.castlingRights.white.kingSide = false;
            this.castlingRights.white.queenSide = false;
        }
        const bk = this.board[0][KING_START_COL];
        if (!bk || bk.type !== 'king' || bk.color !== 'black') {
            this.castlingRights.black.kingSide = false;
            this.castlingRights.black.queenSide = false;
        }
        if (!this.board[7][ROOK_KS_COL] || this.board[7][ROOK_KS_COL].type !== 'rook' || this.board[7][ROOK_KS_COL].color !== 'white') this.castlingRights.white.kingSide = false;
        if (!this.board[7][ROOK_QS_COL] || this.board[7][ROOK_QS_COL].type !== 'rook' || this.board[7][ROOK_QS_COL].color !== 'white') this.castlingRights.white.queenSide = false;
        if (!this.board[0][ROOK_KS_COL] || this.board[0][ROOK_KS_COL].type !== 'rook' || this.board[0][ROOK_KS_COL].color !== 'black') this.castlingRights.black.kingSide = false;
        if (!this.board[0][ROOK_QS_COL] || this.board[0][ROOK_QS_COL].type !== 'rook' || this.board[0][ROOK_QS_COL].color !== 'black') this.castlingRights.black.queenSide = false;

        for (const entry of this.moveHistory) {
            const m = entry.move;
            if (m.from.row === 7 && m.from.col === KING_START_COL) { this.castlingRights.white.kingSide = false; this.castlingRights.white.queenSide = false; }
            if (m.from.row === 0 && m.from.col === KING_START_COL) { this.castlingRights.black.kingSide = false; this.castlingRights.black.queenSide = false; }
            if (m.from.row === 7 && m.from.col === ROOK_KS_COL) this.castlingRights.white.kingSide = false;
            if (m.from.row === 7 && m.from.col === ROOK_QS_COL) this.castlingRights.white.queenSide = false;
            if (m.from.row === 0 && m.from.col === ROOK_KS_COL) this.castlingRights.black.kingSide = false;
            if (m.from.row === 0 && m.from.col === ROOK_QS_COL) this.castlingRights.black.queenSide = false;
        }
    }

    /** Rebuilds enPassantTarget from the last history entry (repair helper). */
    recomputeEnPassant() {
        this.enPassantTarget = null;
        if (this.moveHistory.length > 0) {
            const last = this.moveHistory[this.moveHistory.length - 1];
            if (last.move.doublePush) {
                this.enPassantTarget = {
                    row: (last.move.from.row + last.move.to.row) / 2,
                    col: last.move.to.col
                };
            }
        }
    }

    /* ======================================================================
       Check / endgame
       ==================================================================== */

    /**
     * Locates a king, using the write-through cache and validating it on
     * read (self-healing: a stale entry triggers a full rescan).
     * @param {'white'|'black'} color
     * @returns {{row:number,col:number}|null}
     */
    findKing(color) {
        const cached = this._kingPos && this._kingPos[color];
        if (cached) {
            const p = this.board[cached.row][cached.col];
            if (p && p.type === 'king' && p.color === color) return cached;
        }
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const p = this.board[r][c];
                if (p && p.type === 'king' && p.color === color) {
                    if (this._kingPos) this._kingPos[color] = { row: r, col: c };
                    return { row: r, col: c };
                }
            }
        }
        return null;
    }

    /**
     * Evaluates whether the game has ended for the side to move:
     * checkmate / stalemate (no legal moves), 50-move rule, threefold
     * repetition (NEW — previously not implemented at all), and
     * insufficient material. Sets gameOver / gameResult / gameResultReason.
     */
    checkGameEnd() {
        const legalMoves = this.generateLegalMoves(this.currentTurn);
        if (legalMoves.length === 0) {
            this.gameOver = true;
            if (this.isInCheck(this.currentTurn)) {
                this.gameResult = this.currentTurn === 'white' ? 'black' : 'white';
                this.gameResultReason = 'checkmate';
            } else {
                this.gameResult = 'draw';
                this.gameResultReason = 'stalemate';
            }
            return;
        }
        if (this.halfMoveClock >= 100) {
            this.gameOver = true;
            this.gameResult = 'draw';
            this.gameResultReason = '50-move rule';
            return;
        }
        const currentKey = this._positionKeys.length > 0
            ? this._positionKeys[this._positionKeys.length - 1]
            : null;
        if (currentKey && (this._positionCounts.get(currentKey) || 0) >= 3) {
            this.gameOver = true;
            this.gameResult = 'draw';
            this.gameResultReason = 'threefold repetition';
            return;
        }
        if (this.isInsufficientMaterial()) {
            this.gameOver = true;
            this.gameResult = 'draw';
            this.gameResultReason = 'insufficient material';
        }
    }

    /**
     * K vs K, K vs K+B, K vs K+N — BUT never a draw while any piece
     * carries items (a lone knight with a teleport hat can still mate;
     * declaring a draw would rob the roguelike layer).
     * @returns {boolean}
     */
    isInsufficientMaterial() {
        const minor = { white: [], black: [] };
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const p = this.board[r][c];
                if (!p) continue;
                if (p.getItems && p.getItems().length > 0) return false; // items ⇒ anything is possible
                if (p.type !== 'king') minor[p.color].push(p.type);
            }
        }
        const w = minor.white, b = minor.black;
        if (w.length === 0 && b.length === 0) return true;
        if (w.length === 0 && b.length === 1 && (b[0] === 'bishop' || b[0] === 'knight')) return true;
        if (b.length === 0 && w.length === 1 && (w[0] === 'bishop' || w[0] === 'knight')) return true;
        return false;
    }

    /**
     * Serializes the current position for repetition detection.
     * Includes shield & frozen per piece (a shielded piece is materially
     * different), side to move, castling rights and the ep square —
     * matching the FIDE definition of "same position" plus item state.
     * @returns {string}
     */
    _positionKey() {
        const parts = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const p = this.board[r][c];
                parts.push(p ? `${p.color[0]}${p.type[0]}${p.type === 'knight' ? 'n' : ''}${p.shield || 0}${p.frozen || 0}` : '.');
            }
        }
        parts.push(this.currentTurn[0]);
        const cr = this.castlingRights;
        parts.push(`${+cr.white.kingSide}${+cr.white.queenSide}${+cr.black.kingSide}${+cr.black.queenSide}`);
        parts.push(this.enPassantTarget ? `${this.enPassantTarget.row}${this.enPassantTarget.col}` : '-');
        return parts.join('');
    }

    /** Records the current position into the repetition counters. */
    _recordPosition() {
        const key = this._positionKey();
        this._positionKeys.push(key);
        this._positionCounts.set(key, (this._positionCounts.get(key) || 0) + 1);
    }

    /* ======================================================================
       Notation
       ==================================================================== */

    /**
     * Computes the SAN disambiguation fragment ("b", "1", "b1") for a move,
     * by checking whether other same-type pieces can legally reach the
     * same square. Must run BEFORE the move executes.
     * @param {Object} move
     * @returns {string} Empty string when no disambiguation is needed.
     */
    _computeDisambiguation(move) {
        const piece = this.board[move.from.row][move.from.col];
        if (!piece || piece.type === 'pawn' || piece.type === 'king') return '';
        const files = 'abcdefgh';
        const ranks = '87654321';

        const rivals = this.generateLegalMoves(piece.color).filter(m => {
            if (m.to.row !== move.to.row || m.to.col !== move.to.col) return false;
            if (m.from.row === move.from.row && m.from.col === move.from.col) return false;
            const other = this.board[m.from.row][m.from.col];
            return other && other.type === piece.type;
        });
        if (rivals.length === 0) return '';

        const sameFile = rivals.some(m => m.from.col === move.from.col);
        const sameRank = rivals.some(m => m.from.row === move.from.row);
        if (!sameFile) return files[move.from.col];
        if (!sameRank) return ranks[move.from.row];
        return files[move.from.col] + ranks[move.from.row];
    }

    /**
     * Builds (extended) SAN for an already-executed move.
     * Call AFTER checkGameEnd() so '#'/'+' are correct — the old engine
     * produced notation before endgame evaluation and could never emit '#'.
     * @param {Object} move
     * @param {PieceEntity|null} captured
     * @param {string} [disamb] - Precomputed disambiguation fragment.
     * @returns {string} e.g. "Nbd2", "exd6", "O-O", "e8=Q#", "Qxh7🛡"
     */
    getMoveNotation(move, captured, disamb) {
        const piece = this.board[move.to.row][move.to.col];
        const files = 'abcdefgh';
        const ranks = '87654321';

        if (move.castling === 'kingSide') return this._appendCheckMarks('O-O', piece);
        if (move.castling === 'queenSide') return this._appendCheckMarks('O-O-O', piece);

        const pieceLetters = { king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: '' };
        const actualType = move.promotion ? 'pawn' : (piece ? piece.type : 'pawn');

        let notation = pieceLetters[actualType] || '';
        notation += disamb || '';

        if (captured || move.enPassant) {
            if (actualType === 'pawn') notation += files[move.from.col];
            notation += 'x';
        }
        notation += files[move.to.col] + ranks[move.to.row];
        if (move.promotion) notation += '=' + pieceLetters[move.promotion];

        // Roguelike flavor markers.
        if (move._shielded) notation += '🛡';
        if (move._dodged) notation += '💨';

        return this._appendCheckMarks(notation, piece);
    }

    /** Appends '#' (mate) or '+' (check) based on post-move game state. */
    _appendCheckMarks(notation, piece) {
        if (!piece) return notation;
        const opp = piece.color === 'white' ? 'black' : 'white';
        if (this.gameOver && this.gameResultReason === 'checkmate') return notation + '#';
        if (this.isInCheck(opp)) return notation + '+';
        return notation;
    }

    /* ======================================================================
       Utility
       ==================================================================== */

    /**
     * @param {PieceEntity|null} piece
     * @returns {string} Unicode glyph or '' / '?' fallback.
     */
    getSymbol(piece) {
        if (!piece) return '';
        return PIECE_SYMBOLS[piece.color]?.[piece.type] || '?';
    }

    /** @param {'white'|'black'} color @returns {boolean} */
    hasKing(color) { return this.findKing(color) !== null; }

    /**
     * @param {'white'|'black'} color
     * @returns {boolean} True if any piece of that color remains.
     */
    hasAnyPiece(color) {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const p = this.board[r][c];
                if (p && p.color === color) return true;
            }
        }
        return false;
    }

    /**
     * @param {'white'|'black'} color
     * @returns {number} Piece count for the color.
     */
    countPieces(color) {
        let count = 0;
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const p = this.board[r][c];
                if (p && p.color === color) count++;
            }
        }
        return count;
    }
}
