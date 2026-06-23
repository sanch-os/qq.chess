/* ============================================
   Chess AI — Minimax with Alpha-Beta Pruning
   ============================================ */

class ChessAI {
    constructor(depth = 3) {
        this.maxDepth = depth;
        this.mode = 'normal'; // very_easy | easy | normal | hard | crazy
        this.nodesEvaluated = 0;

        // Piece values
        this.PIECE_VALUES = {
            pawn: 100,
            knight: 320,
            bishop: 330,
            rook: 500,
            queen: 900,
            king: 20000
        };

        // Piece-Square Tables (from black's perspective, flipped for white)
        this.PST = {
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
    }

    setDepth(depth) {
        this.maxDepth = depth;
    }

    setMode(mode) {
        this.mode = mode;
        // Adjust depth automatically based on mode
        const depthMap = {
            very_easy: 1,
            easy:      2,
            normal:    3,
            hard:      4,
            crazy:     1, // depth doesn't matter for crazy
        };
        if (depthMap[mode] !== undefined) {
            this.maxDepth = depthMap[mode];
        }
    }

    /* --- Best Move --- */

    getBestMove(engine) {
        this.nodesEvaluated = 0;
        const color = engine.currentTurn;
        const legalMoves = engine.generateLegalMoves(color);

        if (legalMoves.length === 0) return null;
        if (legalMoves.length === 1) return legalMoves[0];

        // ── CRAZY MODE: pick the worst possible move (play to lose) ──────────
        if (this.mode === 'crazy') {
            return this._getCrazyMove(engine, legalMoves);
        }

        // ── VERY EASY MODE: mostly random, with small chance of smart move ──
        if (this.mode === 'very_easy') {
            // 70% chance of a completely random move
            if (Math.random() < 0.7) {
                return legalMoves[Math.floor(Math.random() * legalMoves.length)];
            }
        }

        // Order moves for better pruning
        const orderedMoves = this.orderMoves(engine, legalMoves);

        let bestMove = orderedMoves[0];
        let bestScore = -Infinity;
        let alpha = -Infinity;
        const beta = Infinity;

        for (const move of orderedMoves) {
            const clone = engine.clone();
            clone.executeMove(move, false);
            clone.currentTurn = clone.currentTurn === 'white' ? 'black' : 'white';

            const score = -this.minimax(clone, this.maxDepth - 1, -beta, -alpha, clone.currentTurn);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
            if (score > alpha) {
                alpha = score;
            }
        }

        return bestMove;
    }

    // Crazy mode: pick the move with the WORST evaluation score
    _getCrazyMove(engine, legalMoves) {
        let worstMove = legalMoves[0];
        let worstScore = Infinity;

        // Shuffle first so ties are broken randomly
        const shuffled = [...legalMoves].sort(() => Math.random() - 0.5);

        for (const move of shuffled) {
            const clone = engine.clone();
            clone.executeMove(move, false);
            clone.currentTurn = clone.currentTurn === 'white' ? 'black' : 'white';
            const score = this.evaluate(clone, clone.currentTurn);
            if (score < worstScore) {
                worstScore = score;
                worstMove = move;
            }
        }
        return worstMove;
    }

    /* --- Minimax with Alpha-Beta --- */

    minimax(engine, depth, alpha, beta, color) {
        this.nodesEvaluated++;

        if (depth === 0) {
            return this.quiescence(engine, alpha, beta, color, 4);
        }

        const legalMoves = engine.generateLegalMoves(color);

        if (legalMoves.length === 0) {
            if (engine.isInCheck(color)) {
                return -20000 + (this.maxDepth - depth); // Checkmate (prefer sooner)
            }
            return 0; // Stalemate
        }

        const orderedMoves = this.orderMoves(engine, legalMoves);

        let bestScore = -Infinity;

        for (const move of orderedMoves) {
            const clone = engine.clone();
            clone.executeMove(move, false);
            const nextColor = color === 'white' ? 'black' : 'white';
            clone.currentTurn = nextColor;

            const score = -this.minimax(clone, depth - 1, -beta, -alpha, nextColor);

            if (score > bestScore) bestScore = score;
            if (score > alpha) alpha = score;
            if (alpha >= beta) break; // Beta cutoff
        }

        return bestScore;
    }

    /* --- Quiescence Search --- */

    quiescence(engine, alpha, beta, color, depth) {
        this.nodesEvaluated++;
        const standPat = this.evaluate(engine, color);

        if (depth === 0) return standPat;
        if (standPat >= beta) return beta;
        if (standPat > alpha) alpha = standPat;

        // Only look at captures
        const legalMoves = engine.generateLegalMoves(color);
        const captures = legalMoves.filter(m => m.capture);
        const orderedCaptures = this.orderMoves(engine, captures);

        for (const move of orderedCaptures) {
            const clone = engine.clone();
            clone.executeMove(move, false);
            const nextColor = color === 'white' ? 'black' : 'white';
            clone.currentTurn = nextColor;

            const score = -this.quiescence(clone, -beta, -alpha, nextColor, depth - 1);

            if (score >= beta) return beta;
            if (score > alpha) alpha = score;
        }

        return alpha;
    }

    /* --- Move Ordering --- */

    orderMoves(engine, moves) {
        const scored = moves.map(move => {
            let score = 0;

            // MVV-LVA for captures
            if (move.capture) {
                const victim = engine.getPiece(move.to.row, move.to.col);
                const attacker = engine.getPiece(move.from.row, move.from.col);
                if (victim) {
                    score += this.PIECE_VALUES[victim.type] * 10 - this.PIECE_VALUES[attacker.type];
                }
                if (move.enPassant) score += 900;
            }

            // Promotions
            if (move.promotion) {
                score += this.PIECE_VALUES[move.promotion];
            }

            // Castling bonus
            if (move.castling) score += 50;

            // Penalty for moving to attacked square
            const opp = engine.getPiece(move.from.row, move.from.col).color === 'white' ? 'black' : 'white';
            if (engine.isSquareAttacked(move.to.row, move.to.col, opp)) {
                score -= 50;
            }

            return { move, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.map(s => s.move);
    }

    /* --- Evaluation --- */

    evaluate(engine, color) {
        let score = 0;
        const isEndgame = this.isEndgame(engine);

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = engine.board[r][c];
                if (!piece) continue;

                const sign = piece.color === color ? 1 : -1;
                let pieceScore = this.PIECE_VALUES[piece.type];

                // Position bonus from PST
                let pstKey = piece.type;
                if (piece.type === 'king' && isEndgame) pstKey = 'king_endgame';

                const pst = this.PST[pstKey];
                if (pst) {
                    // Tables are from black's perspective; flip for white
                    const pstRow = piece.color === 'black' ? r : 7 - r;
                    pieceScore += pst[pstRow][c];
                }

                // Add item values
                if (piece.getItemValue) {
                    pieceScore += piece.getItemValue();
                }

                score += sign * pieceScore;
            }
        }

        // Mobility bonus
        const myMoves = engine.generateLegalMoves(color).length;
        const opp = color === 'white' ? 'black' : 'white';
        const oppMoves = engine.generateLegalMoves(opp).length;
        score += (myMoves - oppMoves) * 5;

        // Check bonus
        if (engine.isInCheck(opp)) score += 30;

        return score;
    }

    isEndgame(engine) {
        let queenCount = 0;
        let minorCount = 0;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = engine.board[r][c];
                if (!p) continue;
                if (p.type === 'queen') queenCount++;
                if (p.type === 'bishop' || p.type === 'knight') minorCount++;
            }
        }

        return queenCount === 0 || (queenCount <= 2 && minorCount <= 2);
    }
}
