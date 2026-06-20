/* ============================================
   Chess Engine — Refactored with PieceEntity & Items
   ============================================ */

const PIECE_SYMBOLS = {
    white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
    black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
};

class ChessEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.board = this.createEmptyBoard();
        this.currentTurn = 'white';
        this.moveHistory = [];
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        this.gameOver = false;
        this.gameResult = null;
        this.gameResultReason = '';
        this.captureLog = [];  // [{attacker, victim, round}]
    }

    createEmptyBoard() {
        const board = [];
        for (let r = 0; r < 8; r++) {
            board[r] = [];
            for (let c = 0; c < 8; c++) {
                board[r][c] = null;
            }
        }
        return board;
    }

    clone() {
        const engine = new ChessEngine();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p && p.clone) {
                    engine.board[r][c] = p.clone();
                } else if (p) {
                    engine.board[r][c] = { type: p.type, color: p.color };
                } else {
                    engine.board[r][c] = null;
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
        engine.moveHistory = [];
        return engine;
    }

    /* --- Board Setup --- */

    setupStandard() {
        this.reset();
        PieceEntity.resetIdCounter();
        const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        for (let c = 0; c < 8; c++) {
            this.board[0][c] = new PieceEntity(backRank[c], 'black');
            this.board[1][c] = new PieceEntity('pawn', 'black');
            this.board[6][c] = new PieceEntity('pawn', 'white');
            this.board[7][c] = new PieceEntity(backRank[c], 'white');
        }
    }

    setupBlackStandard() {
        const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        for (let c = 0; c < 8; c++) {
            this.board[0][c] = new PieceEntity(backRank[c], 'black');
            this.board[1][c] = new PieceEntity('pawn', 'black');
        }
    }

    placePiece(row, col, type, color) {
        this.board[row][col] = new PieceEntity(type, color);
        return this.board[row][col];
    }

    removePiece(row, col) {
        const piece = this.board[row][col];
        this.board[row][col] = null;
        return piece;
    }

    getPiece(row, col) {
        if (row < 0 || row > 7 || col < 0 || col > 7) return undefined;
        return this.board[row][col];
    }

    /* --- Move Generation (Item-Aware) --- */

    generateAllMoves(color) {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === color) {
                    const pieceMoves = this.generatePieceMoves(r, c);
                    moves.push(...pieceMoves);
                }
            }
        }
        return moves;
    }

    generateLegalMoves(color) {
        const pseudoMoves = this.generateAllMoves(color);
        return pseudoMoves.filter(move => this.isLegalMove(move));
    }

    generatePieceMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];

        // Get item stats
        const stats = piece.getStats ? piece.getStats() : {};
        let effectiveType = piece.type;

        // King with crown → moves as queen
        if (piece.type === 'king' && stats.moveAsQueen) {
            effectiveType = 'queen_king'; // Special: queen moves + king identity
        }

        let moves = [];

        switch (effectiveType) {
            case 'pawn':
                moves = this.generatePawnMoves(row, col, piece.color, stats);
                break;
            case 'knight':
                moves = this.generateKnightMoves(row, col, piece.color, stats);
                break;
            case 'bishop':
                moves = this.generateSlidingMoves(row, col, piece.color,
                    [[-1,-1],[-1,1],[1,-1],[1,1]], stats);
                break;
            case 'rook':
                moves = this.generateSlidingMoves(row, col, piece.color,
                    [[-1,0],[1,0],[0,-1],[0,1]], stats);
                break;
            case 'queen':
                moves = this.generateSlidingMoves(row, col, piece.color,
                    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]], stats);
                break;
            case 'queen_king':
                // Queen-range moves
                moves = this.generateSlidingMoves(row, col, piece.color,
                    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]], stats);
                // Also add castling from king
                moves.push(...this._generateCastlingMoves(row, col, piece.color));
                break;
            case 'king':
                moves = this.generateKingMoves(row, col, piece.color);
                break;
            default:
                return [];
        }

        // Extra directions from items (range 1, non-sliding)
        if (stats.extraDirections && stats.extraDirections.length > 0) {
            for (const [dr, dc] of stats.extraDirections) {
                const nr = row + dr, nc = col + dc;
                if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
                const target = this.board[nr][nc];
                // Don't add if already reachable
                const alreadyHas = moves.some(m => m.to.row === nr && m.to.col === nc);
                if (alreadyHas) continue;
                if (!target || target.color !== piece.color) {
                    moves.push({
                        from: { row, col },
                        to: { row: nr, col: nc },
                        capture: !!target
                    });
                }
            }
        }

        // Extra knight offsets from items
        if (stats.extraKnightOffsets && stats.extraKnightOffsets.length > 0) {
            for (const [dr, dc] of stats.extraKnightOffsets) {
                const nr = row + dr, nc = col + dc;
                if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
                const target = this.board[nr][nc];
                const alreadyHas = moves.some(m => m.to.row === nr && m.to.col === nc);
                if (alreadyHas) continue;
                if (!target || target.color !== piece.color) {
                    moves.push({
                        from: { row, col },
                        to: { row: nr, col: nc },
                        capture: !!target
                    });
                }
            }
        }

        // Filter out captures blocked by item immunities
        moves = moves.filter(m => {
            if (!m.capture) return true;
            const victim = this.board[m.to.row][m.to.col];
            if (!victim) return true; // en passant handled separately
            if (m.enPassant) return true;

            const victimStats = victim.getStats ? victim.getStats() : {};

            // Absolute immunity
            if (victimStats.immuneToAll) return false;

            // Type-based immunities
            if (victimStats.immuneToPawns && piece.type === 'pawn') return false;
            if (victimStats.immuneToKnights && piece.type === 'knight') return false;
            if (victimStats.immuneToRooks && piece.type === 'rook') return false;
            if (victimStats.immuneToBishops && piece.type === 'bishop') return false;
            if (victimStats.immuneToQueens && (piece.type === 'queen' || piece.type === 'queen_king')) return false;

            return true;
        });

        // ⭐ moveAnywhere: Шапка бета-тестера
        // Добавляет ходы на ВСЕ клетки доски, кроме:
        // - клеток с дружественными фигурами
        // - клетки с вражеским королём (нельзя брать короля напрямую)
        if (stats.moveAnywhere) {
            for (let nr = 0; nr < 8; nr++) {
                for (let nc = 0; nc < 8; nc++) {
                    if (nr === row && nc === col) continue; // своя клетка
                    const target = this.board[nr][nc];

                    // Нельзя на дружественную фигуру
                    if (target && target.color === piece.color) continue;
                    // Нельзя брать вражеского короля напрямую
                    if (target && target.type === 'king') continue;

                    // Уже есть такой ход — обновим флаг capture если нужно
                    const existing = moves.find(m => m.to.row === nr && m.to.col === nc);
                    if (!existing) {
                        moves.push({
                            from: { row, col },
                            to: { row: nr, col: nc },
                            capture: !!target,
                            anywhereMove: true, // маркер для UI
                        });
                    }
                }
            }
        }

        // canStepAnyDirection: can move 1 step in any of 8 directions
        if (stats.canStepAnyDirection) {
            const dirs8 = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
            for (const [dr, dc] of dirs8) {
                const nr = row + dr, nc = col + dc;
                if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
                const target = this.board[nr][nc];
                if (!target || target.color !== piece.color) {
                    if (!moves.some(m => m.to.row === nr && m.to.col === nc)) {
                        moves.push({ from: {row, col}, to: {row: nr, col: nc}, capture: !!target });
                    }
                }
            }
        }

        // extraStep: jump exactly N squares in any direction (non-sliding, like a ranged king)
        if (stats.extraStep > 0) {
            const dirs8 = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
            for (const [dr, dc] of dirs8) {
                const nr = row + dr * stats.extraStep, nc = col + dc * stats.extraStep;
                if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
                const target = this.board[nr][nc];
                if (!target || target.color !== piece.color) {
                    if (!moves.some(m => m.to.row === nr && m.to.col === nc)) {
                        moves.push({ from: {row, col}, to: {row: nr, col: nc}, capture: !!target });
                    }
                }
            }
        }

        return moves;
    }

    generatePawnMoves(row, col, color, stats) {
        const moves = [];
        const dir = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;

        // Early promotion check
        let promoRow = color === 'white' ? 0 : 7;
        if (stats.earlyPromotion) {
            promoRow = color === 'white' ? 2 : 5;
        }

        // Single push
        const r1 = row + dir;
        if (r1 >= 0 && r1 <= 7 && !this.board[r1][col]) {
            if (r1 === promoRow || (stats.earlyPromotion && (
                (color === 'white' && r1 <= promoRow) ||
                (color === 'black' && r1 >= promoRow)
            ))) {
                ['queen', 'rook', 'bishop', 'knight'].forEach(pt => {
                    moves.push({ from: {row, col}, to: {row: r1, col}, promotion: pt });
                });
            } else {
                moves.push({ from: {row, col}, to: {row: r1, col} });
            }

            // Double push
            if (row === startRow) {
                const r2 = row + dir * 2;
                if (!this.board[r2][col]) {
                    moves.push({ from: {row, col}, to: {row: r2, col}, doublePush: true });
                }
            }
        }

        // Captures
        const captureRange = stats.pawnCaptureRange || 1;
        for (const dc of [-1, 1]) {
            for (let dist = 1; dist <= captureRange; dist++) {
                const cr = row + dir * dist;
                const cc = col + dc * dist;
                if (cr < 0 || cr > 7 || cc < 0 || cc > 7) continue;

                // Check path is clear for ranged captures (dist > 1)
                if (dist > 1) {
                    let pathClear = true;
                    for (let d = 1; d < dist; d++) {
                        if (this.board[row + dir * d][col + dc * d]) {
                            pathClear = false;
                            break;
                        }
                    }
                    if (!pathClear) continue;
                }

                const target = this.board[cr][cc];
                if (target && target.color !== color) {
                    const isPromo = cr === promoRow || (stats.earlyPromotion && (
                        (color === 'white' && cr <= promoRow) ||
                        (color === 'black' && cr >= promoRow)
                    ));
                    if (isPromo) {
                        ['queen', 'rook', 'bishop', 'knight'].forEach(pt => {
                            moves.push({ from: {row, col}, to: {row: cr, col: cc}, capture: true, promotion: pt });
                        });
                    } else {
                        moves.push({ from: {row, col}, to: {row: cr, col: cc}, capture: true });
                    }
                }
            }
        }

        // En passant (always range 1)
        for (const dc of [-1, 1]) {
            const nc = col + dc;
            if (this.enPassantTarget && this.enPassantTarget.row === r1 && this.enPassantTarget.col === nc) {
                moves.push({ from: {row, col}, to: {row: r1, col: nc}, enPassant: true, capture: true });
            }
        }

        // Retreat (pawn can go backward 1 square, no capture)
        if (stats.pawnCanRetreat) {
            const br = row - dir; // opposite of normal direction
            if (br >= 0 && br <= 7 && !this.board[br][col]) {
                moves.push({ from: {row, col}, to: {row: br, col} });
            }
        }

        // Always-double: can push 2 from anywhere (not just start row)
        if (stats.pawnAlwaysDouble) {
            const r2 = row + dir * 2;
            if (r2 >= 0 && r2 <= 7 && !this.board[r2][col] && !this.board[row + dir][col]) {
                // Only add if not already there
                if (!moves.some(m => m.to.row === r2 && m.to.col === col)) {
                    moves.push({ from: {row, col}, to: {row: r2, col}, doublePush: true });
                }
            }
        }

        // Extra forward: can move up to 1 + pawnExtraForward squares
        if (stats.pawnExtraForward > 0) {
            for (let dist = 2; dist <= 1 + stats.pawnExtraForward; dist++) {
                const fr = row + dir * dist;
                if (fr < 0 || fr > 7) break;
                // Path must be clear
                let clear = true;
                for (let d = 1; d < dist; d++) {
                    if (this.board[row + dir * d][col]) { clear = false; break; }
                }
                if (!clear) break;
                if (!this.board[fr][col]) {
                    if (!moves.some(m => m.to.row === fr && m.to.col === col)) {
                        moves.push({ from: {row, col}, to: {row: fr, col} });
                    }
                } else break;
            }
        }

        // Capture forward (directly in front)
        if (stats.pawnCanCaptureForward) {
            const fr = row + dir;
            if (fr >= 0 && fr <= 7) {
                const target = this.board[fr][col];
                if (target && target.color !== color) {
                    if (!moves.some(m => m.to.row === fr && m.to.col === col && m.capture)) {
                        moves.push({ from: {row, col}, to: {row: fr, col}, capture: true });
                    }
                }
            }
        }

        // Capture backward diagonally
        if (stats.pawnCanCaptureBackward) {
            const br = row - dir;
            for (const dc of [-1, 1]) {
                const bc = col + dc;
                if (br >= 0 && br <= 7 && bc >= 0 && bc <= 7) {
                    const target = this.board[br][bc];
                    if (target && target.color !== color) {
                        moves.push({ from: {row, col}, to: {row: br, col: bc}, capture: true });
                    }
                }
            }
        }

        return moves;
    }

    generateKnightMoves(row, col, color, stats) {
        const moves = [];
        const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, dc] of offsets) {
            const nr = row + dr, nc = col + dc;
            if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
            const target = this.board[nr][nc];
            if (!target || target.color !== color) {
                moves.push({ from: {row, col}, to: {row: nr, col: nc}, capture: !!target });
            }
        }
        return moves;
    }

    generateSlidingMoves(row, col, color, directions, stats) {
        const moves = [];
        const canJump = stats && stats.canJump;
        const pierceOne = stats && stats.pierceOne;

        for (const [dr, dc] of directions) {
            let nr = row + dr, nc = col + dc;
            let piercedOne = false; // for pierceOne — have we passed through 1 blocker?

            while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                const target = this.board[nr][nc];
                if (!target) {
                    moves.push({ from: {row, col}, to: {row: nr, col: nc} });
                } else {
                    if (target.color !== color) {
                        moves.push({ from: {row, col}, to: {row: nr, col: nc}, capture: true });
                    }
                    if (canJump && target.color === color) {
                        // Jump over ally — continue sliding
                        nr += dr;
                        nc += dc;
                        continue;
                    }
                    if (pierceOne && !piercedOne) {
                        // Pass through this one blocker (of either color)
                        piercedOne = true;
                        nr += dr;
                        nc += dc;
                        continue;
                    }
                    break;
                }
                nr += dr;
                nc += dc;
            }
        }
        return moves;
    }

    generateKingMoves(row, col, color) {
        const piece = this.board[row][col];
        const stats = piece && piece.getStats ? piece.getStats() : {};
        const moves = [];
        const baseOffsets = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

        for (const [dr, dc] of baseOffsets) {
            const nr = row + dr, nc = col + dc;
            if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
            const target = this.board[nr][nc];
            if (!target || target.color !== color) {
                moves.push({ from: {row, col}, to: {row: nr, col: nc}, capture: !!target });
            }
        }

        // extraKingMove: king can move up to 1+N squares like a short-range queen
        const extraKingMove = stats.extraKingMove || 0;
        if (extraKingMove > 0) {
            const allDirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
            for (const [dr, dc] of allDirs) {
                for (let dist = 2; dist <= 1 + extraKingMove; dist++) {
                    const nr = row + dr * dist, nc = col + dc * dist;
                    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) break;
                    // Path must be clear for non-adjacent squares
                    let clear = true;
                    for (let d = 1; d < dist; d++) {
                        if (this.board[row + dr * d][col + dc * d]) { clear = false; break; }
                    }
                    if (!clear) break;
                    const target = this.board[nr][nc];
                    if (!target || target.color !== color) {
                        if (!moves.some(m => m.to.row === nr && m.to.col === nc)) {
                            moves.push({ from: {row, col}, to: {row: nr, col: nc}, capture: !!target });
                        }
                    } else break;
                }
            }
        }

        moves.push(...this._generateCastlingMoves(row, col, color));
        return moves;
    }

    _generateCastlingMoves(row, col, color) {
        const moves = [];
        const rights = this.castlingRights[color];
        const kingRow = color === 'white' ? 7 : 0;

        if (row === kingRow && col === 4) {
            if (rights.kingSide) {
                const rook = this.board[kingRow][7];
                if (rook && rook.type === 'rook' && rook.color === color) {
                    if (!this.board[kingRow][5] && !this.board[kingRow][6]) {
                        const opp = color === 'white' ? 'black' : 'white';
                        if (!this.isSquareAttacked(kingRow, 4, opp) &&
                            !this.isSquareAttacked(kingRow, 5, opp) &&
                            !this.isSquareAttacked(kingRow, 6, opp)) {
                            moves.push({ from: {row, col}, to: {row: kingRow, col: 6}, castling: 'kingSide' });
                        }
                    }
                }
            }
            if (rights.queenSide) {
                const rook = this.board[kingRow][0];
                if (rook && rook.type === 'rook' && rook.color === color) {
                    if (!this.board[kingRow][1] && !this.board[kingRow][2] && !this.board[kingRow][3]) {
                        const opp = color === 'white' ? 'black' : 'white';
                        if (!this.isSquareAttacked(kingRow, 4, opp) &&
                            !this.isSquareAttacked(kingRow, 3, opp) &&
                            !this.isSquareAttacked(kingRow, 2, opp)) {
                            moves.push({ from: {row, col}, to: {row: kingRow, col: 2}, castling: 'queenSide' });
                        }
                    }
                }
            }
        }
        return moves;
    }

    /* --- Move Validation & Execution --- */

    isLegalMove(move) {
        const clone = this.clone();
        clone.executeMove(move, true);
        const color = this.board[move.from.row][move.from.col].color;
        return !clone.isInCheck(color);
    }

    getLegalMovesForPiece(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        const pseudoMoves = this.generatePieceMoves(row, col);
        return pseudoMoves.filter(m => this.isLegalMove(m));
    }

    makeMove(fromRow, fromCol, toRow, toCol, promotionType) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return null;
        if (piece.color !== this.currentTurn) return null;

        const legalMoves = this.getLegalMovesForPiece(fromRow, fromCol);
        let move = legalMoves.find(m =>
            m.to.row === toRow && m.to.col === toCol &&
            (!m.promotion || m.promotion === (promotionType || 'queen'))
        );

        if (!move) return null;

        if (move.promotion && !promotionType) {
            move = legalMoves.find(m =>
                m.to.row === toRow && m.to.col === toCol && m.promotion === 'queen'
            );
        }

        return this.executeMoveAndUpdate(move);
    }

    executeMoveAndUpdate(move) {
        const captured = this.executeMove(move, false);
        const notation = this.getMoveNotation(move, captured);

        // Track piece stats
        const movedPiece = this.board[move.to.row][move.to.col];
        if (movedPiece && movedPiece.moveCount !== undefined) {
            movedPiece.moveCount++;
            if (captured) movedPiece.captureCount++;
        }

        // --- Item effect processing on capture ---
        if (captured && movedPiece && movedPiece.getStats) {
            const attackerStats = movedPiece.getStats();
            let bonusGold = 0;

            // goldPerCapture
            bonusGold += attackerStats.goldPerCapture || 0;

            // Type-specific gold bonuses
            const capturedType = captured.type;
            if (capturedType === 'queen')  bonusGold += attackerStats.goldOnQueenCapture  || 0;
            if (capturedType === 'knight') bonusGold += attackerStats.goldOnKnightCapture || 0;
            if (capturedType === 'rook')   bonusGold += attackerStats.goldOnRookCapture   || 0;
            if (capturedType === 'bishop') bonusGold += attackerStats.goldOnBishopCapture || 0;
            if (capturedType === 'pawn')   bonusGold += attackerStats.goldOnPawnCapture   || 0;

            // goldOnLongCapture: extra gold for captures at distance >= 3
            if (attackerStats.goldOnLongCapture > 0) {
                const dist = Math.max(
                    Math.abs(move.to.row - move.from.row),
                    Math.abs(move.to.col - move.from.col)
                );
                if (dist >= 3) bonusGold += attackerStats.goldOnLongCapture;
            }

            // shieldOnHeavyCapture: gain shield on capturing rook or queen
            if (attackerStats.shieldOnHeavyCapture > 0 &&
                (capturedType === 'rook' || capturedType === 'queen')) {
                movedPiece.shield = (movedPiece.shield || 0) + attackerStats.shieldOnHeavyCapture;
            }

            // lifesteal: +1 shield on any capture
            if (attackerStats.lifesteal) {
                movedPiece.shield = (movedPiece.shield || 0) + 1;
            }

            // venomChance: chance to freeze victim (won't happen — victim captured — but if victim
            // was shielded and survived, it will be frozen next turn via 'frozen' field)
            if (attackerStats.venomChance > 0 && Math.random() < attackerStats.venomChance) {
                // Check if victim survived (shielded/dodged)
                const survivingVictim = this.board[move.from.row]?.[move.from.col];
                if (survivingVictim && survivingVictim.id === captured.id) {
                    survivingVictim.frozen = (survivingVictim.frozen || 0) + 1;
                }
            }

            // Accumulate gold on engine for pickup by run-manager
            if (bonusGold > 0) {
                if (!this.goldEarned) this.goldEarned = { white: 0, black: 0 };
                this.goldEarned[movedPiece.color] = (this.goldEarned[movedPiece.color] || 0) + bonusGold;
            }
        }

        this.moveHistory.push({
            move, captured, notation,
            prevCastling: null,
            prevEnPassant: null
        });

        if (captured) {
            this.captureLog.push({
                attacker: movedPiece,
                victim: captured,
            });
        }

        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        if (this.currentTurn === 'white') this.fullMoveNumber++;
        this.checkGameEnd();

        return { move, captured, notation };
    }

    executeMove(move, skipStateUpdate) {
        const { from, to } = move;
        const piece = this.board[from.row][from.col];
        let captured = this.board[to.row][to.col];

        // --- Shield / Dodge Check (only when NOT in AI search) ---
        if (!skipStateUpdate && captured && captured.getStats) {
            const victimStats = captured.getStats();

            // Dodge check
            if (victimStats.dodgeChance > 0 && Math.random() < victimStats.dodgeChance) {
                // Dodge! Move happens but capture is prevented
                // The piece still moves, but the victim stays
                // Actually for simplicity: the move is simply blocked
                // We'll return null to indicate no capture
                move._dodged = true;
                // Don't capture — but still move to the square? No, that's illegal in chess
                // Instead: move the piece but the victim teleports to attacker's old square
                this.board[to.row][to.col] = piece;
                this.board[from.row][from.col] = captured; // victim swaps
                captured = null; // no capture happened

                if (!skipStateUpdate) {
                    this.enPassantTarget = null;
                    if (piece.type === 'pawn' || captured) {
                        this.halfMoveClock = 0;
                    } else {
                        this.halfMoveClock++;
                    }
                }
                return captured;
            }

            // Shield check
            if (captured.shield > 0) {
                captured.shield--;
                // Shield absorbs capture — piece moves but victim survives at the same spot
                // Move the attacking piece to the square, but victim goes to attacker's old square
                move._shielded = true;
                this.board[to.row][to.col] = piece;
                this.board[from.row][from.col] = captured;
                captured = null;

                if (!skipStateUpdate) {
                    this.enPassantTarget = null;
                    this.halfMoveClock = 0;
                }
                return captured;
            }
        }

        // En passant capture
        if (move.enPassant) {
            const capturedRow = from.row;
            captured = this.board[capturedRow][to.col];
            this.board[capturedRow][to.col] = null;
        }

        // Move piece
        this.board[to.row][to.col] = piece;
        this.board[from.row][from.col] = null;

        // Promotion
        if (move.promotion) {
            const promoted = new PieceEntity(move.promotion, piece.color, piece.id);
            // Transfer items from pawn to promoted piece
            if (piece.items) {
                promoted.items = piece.items.slice();
                promoted.shield = piece.shield;
            }
            promoted.moveCount = piece.moveCount || 0;
            promoted.captureCount = piece.captureCount || 0;
            this.board[to.row][to.col] = promoted;
        }

        // Castling — move rook
        if (move.castling) {
            const rookRow = to.row;
            if (move.castling === 'kingSide') {
                this.board[rookRow][5] = this.board[rookRow][7];
                this.board[rookRow][7] = null;
            } else {
                this.board[rookRow][3] = this.board[rookRow][0];
                this.board[rookRow][0] = null;
            }
        }

        if (!skipStateUpdate) {
            if (piece.type === 'king') {
                this.castlingRights[piece.color].kingSide = false;
                this.castlingRights[piece.color].queenSide = false;
            }
            if (piece.type === 'rook') {
                if (from.col === 0) this.castlingRights[piece.color].queenSide = false;
                if (from.col === 7) this.castlingRights[piece.color].kingSide = false;
            }
            if (captured && captured.type === 'rook') {
                const capturedColor = captured.color;
                if (to.col === 0 && to.row === (capturedColor === 'white' ? 7 : 0)) {
                    this.castlingRights[capturedColor].queenSide = false;
                }
                if (to.col === 7 && to.row === (capturedColor === 'white' ? 7 : 0)) {
                    this.castlingRights[capturedColor].kingSide = false;
                }
            }

            if (move.doublePush) {
                this.enPassantTarget = { row: (from.row + to.row) / 2, col: to.col };
            } else {
                this.enPassantTarget = null;
            }

            if (piece.type === 'pawn' || captured) {
                this.halfMoveClock = 0;
            } else {
                this.halfMoveClock++;
            }
        }

        return captured;
    }

    undoLastMove() {
        if (this.moveHistory.length === 0) return false;
        const undoCount = this.moveHistory.length >= 2 ? 2 : 1;

        for (let i = 0; i < undoCount; i++) {
            const last = this.moveHistory.pop();
            if (!last) break;
            const { move, captured } = last;

            const movedPiece = this.board[move.to.row][move.to.col];

            if (move._dodged || move._shielded) {
                // Swap back
                this.board[move.from.row][move.from.col] = movedPiece;
                const other = this.board[move.to.row][move.to.col];
                // Actually these are special cases, simplified undo
                this.board[move.from.row][move.from.col] = this.board[move.to.row]?.[move.to.col];
                // This gets complex — for MVP just re-render
            }

            if (move.promotion) {
                this.board[move.from.row][move.from.col] = new PieceEntity('pawn', movedPiece.color, movedPiece.id);
                // Restore items
                if (movedPiece.items) {
                    this.board[move.from.row][move.from.col].items = movedPiece.items;
                    this.board[move.from.row][move.from.col].shield = movedPiece.shield;
                }
            } else {
                this.board[move.from.row][move.from.col] = movedPiece;
            }

            if (move.enPassant) {
                this.board[move.to.row][move.to.col] = null;
                this.board[move.from.row][move.to.col] = captured;
            } else {
                this.board[move.to.row][move.to.col] = captured || null;
            }

            if (move.castling) {
                const rookRow = move.to.row;
                if (move.castling === 'kingSide') {
                    this.board[rookRow][7] = this.board[rookRow][5];
                    this.board[rookRow][5] = null;
                } else {
                    this.board[rookRow][0] = this.board[rookRow][3];
                    this.board[rookRow][3] = null;
                }
            }

            this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
            if (this.currentTurn === 'black') this.fullMoveNumber--;
        }

        this.recomputeCastlingRights();
        this.recomputeEnPassant();
        this.gameOver = false;
        this.gameResult = null;
        this.gameResultReason = '';
        this.checkGameEnd();
        return true;
    }

    recomputeCastlingRights() {
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        const wk = this.board[7][4];
        if (!wk || wk.type !== 'king' || wk.color !== 'white') {
            this.castlingRights.white.kingSide = false;
            this.castlingRights.white.queenSide = false;
        }
        const bk = this.board[0][4];
        if (!bk || bk.type !== 'king' || bk.color !== 'black') {
            this.castlingRights.black.kingSide = false;
            this.castlingRights.black.queenSide = false;
        }
        if (!this.board[7][7] || this.board[7][7].type !== 'rook' || this.board[7][7].color !== 'white') this.castlingRights.white.kingSide = false;
        if (!this.board[7][0] || this.board[7][0].type !== 'rook' || this.board[7][0].color !== 'white') this.castlingRights.white.queenSide = false;
        if (!this.board[0][7] || this.board[0][7].type !== 'rook' || this.board[0][7].color !== 'black') this.castlingRights.black.kingSide = false;
        if (!this.board[0][0] || this.board[0][0].type !== 'rook' || this.board[0][0].color !== 'black') this.castlingRights.black.queenSide = false;

        for (const entry of this.moveHistory) {
            const m = entry.move;
            if (m.from.row === 7 && m.from.col === 4) { this.castlingRights.white.kingSide = false; this.castlingRights.white.queenSide = false; }
            if (m.from.row === 0 && m.from.col === 4) { this.castlingRights.black.kingSide = false; this.castlingRights.black.queenSide = false; }
            if (m.from.row === 7 && m.from.col === 7) this.castlingRights.white.kingSide = false;
            if (m.from.row === 7 && m.from.col === 0) this.castlingRights.white.queenSide = false;
            if (m.from.row === 0 && m.from.col === 7) this.castlingRights.black.kingSide = false;
            if (m.from.row === 0 && m.from.col === 0) this.castlingRights.black.queenSide = false;
        }
    }

    recomputeEnPassant() {
        this.enPassantTarget = null;
        if (this.moveHistory.length > 0) {
            const last = this.moveHistory[this.moveHistory.length - 1];
            if (last.move.doublePush) {
                this.enPassantTarget = { row: (last.move.from.row + last.move.to.row) / 2, col: last.move.to.col };
            }
        }
    }

    /* --- Check / Checkmate / Stalemate --- */

    findKing(color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p && p.type === 'king' && p.color === color) return { row: r, col: c };
            }
        }
        return null;
    }

    isSquareAttacked(row, col, byColor) {
        const pawnDir = byColor === 'white' ? 1 : -1;
        for (const dc of [-1, 1]) {
            const pr = row + pawnDir, pc = col + dc;
            if (pr >= 0 && pr <= 7 && pc >= 0 && pc <= 7) {
                const p = this.board[pr][pc];
                if (p && p.type === 'pawn' && p.color === byColor) return true;
            }
        }

        const knightOffsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, dc] of knightOffsets) {
            const nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                const p = this.board[nr][nc];
                if (p && p.type === 'knight' && p.color === byColor) return true;
            }
        }

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                    const p = this.board[nr][nc];
                    if (p && p.type === 'king' && p.color === byColor) return true;
                }
            }
        }

        const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        for (const [dr, dc] of directions) {
            let nr = row + dr, nc = col + dc;
            while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                const p = this.board[nr][nc];
                if (p) {
                    if (p.color === byColor) {
                        const isDiag = dr !== 0 && dc !== 0;
                        const isStraight = dr === 0 || dc === 0;
                        if (p.type === 'queen') return true;
                        if (p.type === 'bishop' && isDiag) return true;
                        if (p.type === 'rook' && isStraight) return true;
                        // King with crown = queen attack pattern
                        if (p.type === 'king' && p.getStats) {
                            const s = p.getStats();
                            if (s.moveAsQueen) return true;
                        }
                    }
                    break;
                }
                nr += dr;
                nc += dc;
            }
        }

        return false;
    }

    isInCheck(color) {
        const king = this.findKing(color);
        if (!king) return false;
        const opp = color === 'white' ? 'black' : 'white';
        return this.isSquareAttacked(king.row, king.col, opp);
    }

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
        if (this.isInsufficientMaterial()) {
            this.gameOver = true;
            this.gameResult = 'draw';
            this.gameResultReason = 'insufficient material';
        }
    }

    isInsufficientMaterial() {
        const pieces = { white: [], black: [] };
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p) pieces[p.color].push(p.type);
            }
        }
        const w = pieces.white.filter(t => t !== 'king');
        const b = pieces.black.filter(t => t !== 'king');
        if (w.length === 0 && b.length === 0) return true;
        if (w.length === 0 && b.length === 1 && (b[0] === 'bishop' || b[0] === 'knight')) return true;
        if (b.length === 0 && w.length === 1 && (w[0] === 'bishop' || w[0] === 'knight')) return true;
        return false;
    }

    /* --- Notation --- */

    getMoveNotation(move, captured) {
        const piece = this.board[move.to.row][move.to.col];
        const files = 'abcdefgh';
        const ranks = '87654321';

        if (move.castling === 'kingSide') return 'O-O';
        if (move.castling === 'queenSide') return 'O-O-O';

        let notation = '';
        const pieceLetters = { king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: '' };
        const actualType = move.promotion ? 'pawn' : piece.type;
        notation += pieceLetters[actualType] || '';

        if (captured || move.enPassant) {
            if (actualType === 'pawn') notation += files[move.from.col];
            notation += 'x';
        }

        notation += files[move.to.col] + ranks[move.to.row];

        if (move.promotion) {
            notation += '=' + pieceLetters[move.promotion];
        }

        if (move._shielded) notation += '🛡';
        if (move._dodged) notation += '💨';

        const opp = piece.color === 'white' ? 'black' : 'white';
        if (this.gameOver && this.gameResultReason === 'checkmate') {
            notation += '#';
        } else if (this.isInCheck(opp)) {
            notation += '+';
        }

        return notation;
    }

    /* --- Utility --- */

    getSymbol(piece) {
        if (!piece) return '';
        return PIECE_SYMBOLS[piece.color]?.[piece.type] || '?';
    }

    hasKing(color) { return this.findKing(color) !== null; }

    countPieces(color) {
        let count = 0;
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            const p = this.board[r][c];
            if (p && p.color === color) count++;
        }
        return count;
    }
}
