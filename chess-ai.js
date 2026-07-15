/* ============================================================================
   Chess AI — qq.chess opponent (refactored)
   ============================================================================
   Minimax with alpha-beta pruning, quiescence search, and item-aware static
   evaluation (piece values + PST + PieceEntity.getItemValue()).

   NEGAMAX SIGN CONVENTION used throughout minimax()/quiescence(): every
   recursive call is evaluated from the perspective of the side about to
   move at that node, and the caller negates the child's result to convert
   it back to ITS own perspective (`score = -recurse(...)`). This is why
   evaluate(engine, color) must be (approximately) antisymmetric: a good
   position for white is an equally bad position for black.

   SIMULATION CONTRACT with ChessEngine.executeMove(move, simulate): passing
   `true` makes shield absorption deterministic while suppressing the random
   dodge roll. Search MUST always pass `true` — a stochastic node score
   silently breaks alpha-beta pruning (the same position could "return" two
   different values depending on when it's visited). Only real, played moves
   (via engine.executeMoveAndUpdate / makeMove) should ever see `simulate =
   false`, so dodge only ever fires in the actual game, never inside search.
   ========================================================================= */

/** Centipawn values. Exposed as this.PIECE_VALUES for backward compatibility. */
const PIECE_VALUES = {
    pawn: 100,
    knight: 320,
    bishop: 330,
    rook: 500,
    queen: 900,
    king: 20000
};

/**
 * Piece-square tables, authored from BLACK's viewpoint (row 0 = rank 8,
 * i.e. black's home rank). For a white piece at board row r, the mirrored
 * row `7 - r` is looked up instead — see the flip in evaluate().
 */
const PST = {
    pawn: [
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [ 5,  5, 10, 25, 25, 10,  5,  5],
        [ 0,  0,  0, 20, 20,  0,  0,  0],
        [ 5, -5,-10,  0,  0,-10, -5,  5],
        [ 5, 10, 10,-20,-20, 10, 10,  5],
        [ 0,  0,  0,  0,  0,  0,  0,  0]
    ],
    knight: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    bishop: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10, 10,  5, 10, 10,  5, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    rook: [
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [ 5, 10, 10, 10, 10, 10, 10,  5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [ 0,  0,  0,  5,  5,  0,  0,  0]
    ],
    queen: [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [ -5,  0,  5,  5,  5,  5,  0, -5],
        [  0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    king: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [ 20, 20,  0,  0,  0,  0, 20, 20],
        [ 20, 30, 10,  0,  0, 10, 30, 20]
    ],
    king_endgame: [
        [-50,-40,-30,-20,-20,-30,-40,-50],
        [-30,-20,-10,  0,  0,-10,-20,-30],
        [-30,-10, 20, 30, 30, 20,-10,-30],
        [-30,-10, 30, 40, 40, 30,-10,-30],
        [-30,-10, 30, 40, 40, 30,-10,-30],
        [-30,-10, 20, 30, 30, 20,-10,-30],
        [-30,-30,  0,  0,  0,  0,-30,-30],
        [-50,-30,-30,-30,-30,-30,-30,-50]
    ]
};

/** Score assigned to a checkmate position (matches PIECE_VALUES.king). */
const MATE_SCORE = PIECE_VALUES.king;
/** Fixed-depth quiescence search cap for quiet (non-check) lines. */
const QUIESCENCE_DEPTH = 4;
/** Extra plies quiescence may spend forcibly resolving a check sequence
 *  before giving up and falling back to a static score (perpetual-check
 *  safety valve — without this, a repeating-check line could recurse
 *  indefinitely since quiescence has no repetition detection of its own). */
const QUIESCENCE_CHECK_EXTENSION = 4;
/** Weight (centipawns per extra pseudo-legal move) for the mobility term. */
const MOBILITY_WEIGHT = 5;
/** Flat bonus for delivering check in the static evaluation. */
const CHECK_BONUS = 30;
/** Move-ordering bonuses/penalties (centipawns, not real eval — heuristic only). */
const CASTLING_ORDERING_BONUS = 50;
const EN_PASSANT_ORDERING_BONUS = 900;
const ATTACKED_SQUARE_PENALTY = 50;

/**
 * Item-aware chess opponent: minimax + alpha-beta + quiescence.
 * Public API (unchanged): constructor(depth), setDepth, setMode,
 * getBestMove(engine), evaluate(engine,color), nodesEvaluated.
 */
class ChessAI {
    /** @param {number} [depth=3] Initial search depth (plies). */
    constructor(depth = 3) {
        this.maxDepth = depth;
        /** @type {'very_easy'|'easy'|'normal'|'hard'|'crazy'} */
        this.mode = 'normal';
        /** Diagnostic counter, reset at the start of every getBestMove(). */
        this.nodesEvaluated = 0;
        // Kept as instance fields for backward compatibility with any code
        // that reads ai.PIECE_VALUES / ai.PST directly; both simply alias
        // the shared module-level tables (no per-instance duplication).
        this.PIECE_VALUES = PIECE_VALUES;
        this.PST = PST;
    }

    /** @param {number} depth */
    setDepth(depth) { this.maxDepth = depth; }

    /**
     * Sets difficulty and derives search depth from it.
     * @param {'very_easy'|'easy'|'normal'|'hard'|'crazy'} mode
     */
    setMode(mode) {
        this.mode = mode;
        const depthMap = { very_easy: 1, easy: 2, normal: 3, hard: 4, crazy: 1 };
        if (depthMap[mode] !== undefined) this.maxDepth = depthMap[mode];
    }

    /* ======================================================================
       Best-move selection
       ==================================================================== */

    /**
     * Picks a move for the side to move in `engine`.
     * @param {ChessEngine} engine
     * @returns {Object|null} A move object, or null if no legal moves exist.
     */
    getBestMove(engine) {
        this.nodesEvaluated = 0;
        const color = engine.currentTurn;
        const legalMoves = engine.generateLegalMoves(color);

        if (legalMoves.length === 0) return null;
        if (legalMoves.length === 1) return legalMoves[0];

        // Crazy mode: deliberately play the worst move available.
        if (this.mode === 'crazy') {
            return this._getCrazyMove(engine, legalMoves);
        }

        // Very easy: mostly random, occasionally a shallow "real" search.
        if (this.mode === 'very_easy' && Math.random() < 0.7) {
            return legalMoves[Math.floor(Math.random() * legalMoves.length)];
        }

        const orderedMoves = this.orderMoves(engine, legalMoves);
        let bestMove = orderedMoves[0];
        let bestScore = -Infinity;
        let alpha = -Infinity;
        const beta = Infinity;

        for (const move of orderedMoves) {
            const clone = engine.clone();
            // simulate=true: deterministic shield only, no dodge RNG in search.
            clone.executeMove(move, true);
            clone.currentTurn = clone.currentTurn === 'white' ? 'black' : 'white';

            // Negamax: the child is scored from the OPPONENT's perspective;
            // negate to convert it back to "how good is this for me".
            const score = -this.minimax(clone, this.maxDepth - 1, -beta, -alpha, clone.currentTurn);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
            if (score > alpha) alpha = score;
        }

        return bestMove;
    }

    /**
     * Crazy mode: evaluates every legal move one ply deep and returns the
     * one that is WORST for the side actually moving.
     *
     * FIX: the previous implementation evaluated the resulting position
     * from the OPPONENT's perspective (after flipping currentTurn) and
     * took the minimum of that — since evaluate() is roughly antisymmetric,
     * that is approximately the same as taking the MAXIMUM from the
     * mover's own perspective, i.e. it was picking the objectively best
     * move instead of the worst one. Capturing `moverColor` before the
     * flip and evaluating from that fixed perspective corrects this.
     * @param {ChessEngine} engine
     * @param {Array<Object>} legalMoves
     * @returns {Object} The chosen (worst) move.
     */
    _getCrazyMove(engine, legalMoves) {
        const moverColor = engine.currentTurn;
        let worstMove = legalMoves[0];
        let worstScore = Infinity;

        // Fisher-Yates: `sort(() => Math.random() - 0.5)` (the old code)
        // is a well-known biased shuffle that does not produce a uniform
        // permutation; this does.
        const shuffled = this._shuffle(legalMoves.slice());

        for (const move of shuffled) {
            const clone = engine.clone();
            clone.executeMove(move, true); // deterministic, matches search elsewhere
            clone.currentTurn = clone.currentTurn === 'white' ? 'black' : 'white';

            const score = this.evaluate(clone, moverColor); // mover's own perspective
            if (score < worstScore) {
                worstScore = score;
                worstMove = move;
            }
        }
        return worstMove;
    }

    /**
     * In-place Fisher-Yates shuffle.
     * @template T
     * @param {T[]} arr
     * @returns {T[]} The same array, shuffled.
     */
    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /* ======================================================================
       Minimax with alpha-beta pruning
       ==================================================================== */

    /**
     * Negamax search with alpha-beta pruning.
     * @param {ChessEngine} engine - Position to search from.
     * @param {number} depth - Plies remaining.
     * @param {number} alpha - Best score the maximizer can already guarantee.
     * @param {number} beta - Best score the minimizer can already guarantee.
     * @param {'white'|'black'} color - Side to move at this node.
     * @returns {number} Score from `color`'s perspective.
     */
    minimax(engine, depth, alpha, beta, color) {
        this.nodesEvaluated++;

        if (depth === 0) {
            return this.quiescence(engine, alpha, beta, color, QUIESCENCE_DEPTH);
        }

        const legalMoves = engine.generateLegalMoves(color);
        if (legalMoves.length === 0) {
            if (engine.isInCheck(color)) {
                // Mate-distance scoring: prefer delivering mate SOONER and
                // (when losing) being mated LATER. `this.maxDepth - depth`
                // is the number of plies already played from the root, so
                // deeper mates (larger value) are scored less negatively.
                return -MATE_SCORE + (this.maxDepth - depth);
            }
            return 0; // Stalemate
        }

        const orderedMoves = this.orderMoves(engine, legalMoves);
        let bestScore = -Infinity;

        for (const move of orderedMoves) {
            const clone = engine.clone();
            clone.executeMove(move, true); // simulate: no dodge RNG inside search
            const nextColor = color === 'white' ? 'black' : 'white';
            clone.currentTurn = nextColor;

            const score = -this.minimax(clone, depth - 1, -beta, -alpha, nextColor);

            if (score > bestScore) bestScore = score;
            if (score > alpha) alpha = score;
            if (alpha >= beta) break; // Beta cutoff: opponent won't allow this line
        }

        return bestScore;
    }

    /* ======================================================================
       Quiescence search
       ==================================================================== */

    /**
     * Extends search past the horizon through captures (and, when in
     * check, through ALL evasions) so the static evaluator never judges a
     * position mid-exchange or mid-check.
     *
     * FIX: the previous version always "stood pat" (returned the static
     * eval) once depth hit 0, even while in check — so a mate sitting
     * exactly at the search horizon could be misjudged as a fine, quiet
     * position. Standing pat is only valid when NOT in check; when in
     * check, every legal reply is searched instead of only captures, with
     * a bounded extension (QUIESCENCE_CHECK_EXTENSION) so a repeating
     * check sequence cannot recurse forever.
     *
     * @param {ChessEngine} engine
     * @param {number} alpha @param {number} beta
     * @param {'white'|'black'} color
     * @param {number} depth - Remaining quiescence plies (may go negative
     *        while forcibly resolving a check, up to the extension cap).
     * @returns {number} Score from `color`'s perspective.
     */
    quiescence(engine, alpha, beta, color, depth) {
        this.nodesEvaluated++;
        const inCheck = engine.isInCheck(color);

        if (!inCheck) {
            const standPat = this.evaluate(engine, color);
            if (depth <= 0) return standPat;
            if (standPat >= beta) return beta;
            if (standPat > alpha) alpha = standPat;
        } else if (depth <= -QUIESCENCE_CHECK_EXTENSION) {
            // Safety valve: stop chasing a perpetual-check line and fall
            // back to a static score rather than recursing indefinitely.
            return this.evaluate(engine, color);
        }

        const legalMoves = engine.generateLegalMoves(color);
        if (legalMoves.length === 0) {
            // No legal replies at all: checkmate if in check, else stalemate.
            return inCheck ? -MATE_SCORE + Math.max(0, depth) : 0;
        }

        // Quiet positions only widen through captures; a position in check
        // must search every evasion (you cannot decline to address a check).
        const candidates = inCheck ? legalMoves : legalMoves.filter(m => m.capture);
        if (candidates.length === 0) return alpha; // quiet leaf, nothing to explore

        const ordered = this.orderMoves(engine, candidates);
        for (const move of ordered) {
            const clone = engine.clone();
            clone.executeMove(move, true); // simulate: deterministic, no dodge RNG
            const nextColor = color === 'white' ? 'black' : 'white';
            clone.currentTurn = nextColor;

            const score = -this.quiescence(clone, -beta, -alpha, nextColor, depth - 1);

            if (score >= beta) return beta;
            if (score > alpha) alpha = score;
        }
        return alpha;
    }

    /* ======================================================================
       Move ordering
       ==================================================================== */

    /**
     * Orders moves to maximize alpha-beta cutoffs: captures first via
     * MVV-LVA (Most Valuable Victim − Least Valuable Attacker), then
     * promotions and castling, with a penalty for moving into an
     * (already, pre-move) attacked square.
     * @param {ChessEngine} engine
     * @param {Array<Object>} moves
     * @returns {Array<Object>} New array, best-first.
     */
    orderMoves(engine, moves) {
        const scored = moves.map(move => {
            let score = 0;

            if (move.capture) {
                const victim = engine.getPiece(move.to.row, move.to.col);
                const attacker = engine.getPiece(move.from.row, move.from.col);
                if (victim && attacker) {
                    // MVV-LVA: prioritize capturing valuable pieces with
                    // cheap ones; ×10 on the victim keeps it dominant over
                    // the attacker term for any same-victim comparison.
                    score += this.PIECE_VALUES[victim.type] * 10 - this.PIECE_VALUES[attacker.type];
                }
                if (move.enPassant) score += EN_PASSANT_ORDERING_BONUS;
            }
            if (move.promotion) score += this.PIECE_VALUES[move.promotion];
            if (move.castling) score += CASTLING_ORDERING_BONUS;

            // Heuristic only: tests the CURRENT (pre-move) attack picture,
            // not the resulting position, so it's an approximation used
            // purely to bias search order, not a legality/safety check.
            const mover = engine.getPiece(move.from.row, move.from.col);
            if (mover) {
                const opp = mover.color === 'white' ? 'black' : 'white';
                if (engine.isSquareAttacked(move.to.row, move.to.col, opp)) {
                    score -= ATTACKED_SQUARE_PENALTY;
                }
            }

            return { move, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.map(s => s.move);
    }

    /* ======================================================================
       Static evaluation
       ==================================================================== */

    /**
     * Static position evaluation from `color`'s perspective: material +
     * piece-square tables + item value (PieceEntity.getItemValue()) +
     * mobility + a flat bonus for checking the opponent.
     *
     * PERF: mobility uses generateAllMoves() (pseudo-legal) rather than
     * generateLegalMoves(). The latter calls isLegalMove() per candidate,
     * which clones the entire engine to test for self-check — since
     * evaluate() runs at every search leaf (thousands of times per move
     * decision under quiescence), that made mobility by far the most
     * expensive term in the whole search. Pseudo-legal counting very
     * occasionally credits a pinned piece with "moves" it cannot legally
     * make; that imprecision is a good trade for removing an O(moves)
     * clone cascade from the hottest function in the engine.
     *
     * @param {ChessEngine} engine
     * @param {'white'|'black'} color - Perspective to evaluate from.
     * @returns {number} Centipawn score, positive favors `color`.
     */
    evaluate(engine, color) {
        let score = 0;
        const isEndgame = this.isEndgame(engine);

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = engine.getPiece(r, c);
                if (!piece) continue;

                const sign = piece.color === color ? 1 : -1;
                let pieceScore = this.PIECE_VALUES[piece.type];

                let pstKey = piece.type;
                if (piece.type === 'king' && isEndgame) pstKey = 'king_endgame';
                const pst = this.PST[pstKey];
                if (pst) {
                    // Tables are authored from black's viewpoint; mirror
                    // the row for white so both sides read "home rank
                    // first" in the same table.
                    const pstRow = piece.color === 'black' ? r : 7 - r;
                    pieceScore += pst[pstRow][c];
                }

                if (piece.getItemValue) pieceScore += piece.getItemValue();
                score += sign * pieceScore;
            }
        }

        // Mobility: reward having more options than the opponent.
        const opp = color === 'white' ? 'black' : 'white';
        const myMoves = engine.generateAllMoves(color).length;
        const oppMoves = engine.generateAllMoves(opp).length;
        score += (myMoves - oppMoves) * MOBILITY_WEIGHT;

        if (engine.isInCheck(opp)) score += CHECK_BONUS;

        return score;
    }

    /**
     * Cheap endgame heuristic: no queens, or few queens and few minors.
     * Used to switch the king to its more active endgame PST.
     * @param {ChessEngine} engine
     * @returns {boolean}
     */
    isEndgame(engine) {
        let queenCount = 0;
        let minorCount = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = engine.getPiece(r, c);
                if (!p) continue;
                if (p.type === 'queen') queenCount++;
                if (p.type === 'bishop' || p.type === 'knight') minorCount++;
            }
        }
        return queenCount === 0 || (queenCount <= 2 && minorCount <= 2);
    }
}
