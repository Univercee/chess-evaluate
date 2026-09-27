import {
  IChessBoard,
  IChessPiece,
  PieceColor,
  PieceType,
  Position,
  Move,
  GameStatus,
  positionToNotation,
} from '../types/chess';
import { ChessPiece } from './ChessPiece';
import { King, Queen, Rook, Bishop, Knight, Pawn } from './Pieces';

/**
 * Chess board class.
 * Manages piece placement, moves, and validations.
 */
export class ChessBoard implements IChessBoard {
  /** 8x8 board. null = empty square */
  private board: (IChessPiece | null)[][];
  /** Whose turn it is */
  private currentTurn: PieceColor;
  /** Move history */
  private moveHistory: Move[];
  /** Square for en passant capture (or null) */
  private enPassantTarget: Position | null;

  constructor() {
    this.board = Array.from({ length: 8 }, () => Array(8).fill(null));
    this.currentTurn = 'white';
    this.moveHistory = [];
    this.enPassantTarget = null;
    this.setupInitialPosition();
  }

  /** Initial piece placement */
  private setupInitialPosition(): void {
    // White pieces (rows 6-7 for pawns, 7 for back rank)
    const backRowTypes = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'] as const;

    for (let col = 0; col < 8; col++) {
      // White pieces (bottom of the board)
      this.placePiece(this.createPiece(backRowTypes[col], 'white', { col, row: 7 }));
      this.placePiece(this.createPiece('pawn', 'white', { col, row: 6 }));

      // Black pieces (top of the board)
      this.placePiece(this.createPiece(backRowTypes[col], 'black', { col, row: 0 }));
      this.placePiece(this.createPiece('pawn', 'black', { col, row: 1 }));
    }
  }

  /** Factory method for creating pieces */
  private createPiece(
    type: string,
    color: PieceColor,
    position: Position,
    isPromotedPawn: boolean = false
  ): IChessPiece {
    switch (type) {
      case 'king': return new King(color, position);
      case 'queen': return new Queen(color, position, isPromotedPawn);
      case 'rook': return new Rook(color, position, isPromotedPawn);
      case 'bishop': return new Bishop(color, position, isPromotedPawn);
      case 'knight': return new Knight(color, position, isPromotedPawn);
      case 'pawn': return new Pawn(color, position);
      default: throw new Error(`Unknown piece type: ${type}`);
    }
  }

  /** Place a piece on the board */
  private placePiece(piece: IChessPiece): void {
    this.board[piece.position.row][piece.position.col] = piece;
  }

  getPieceAt(position: Position): IChessPiece | null {
    if (!this.isValidPosition(position)) return null;
    return this.board[position.row][position.col];
  }

  getPiecesByColor(color: PieceColor): IChessPiece[] {
    const pieces: IChessPiece[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === color) {
          pieces.push(piece);
        }
      }
    }
    return pieces;
  }

  isValidPosition(position: Position): boolean {
    return position.col >= 0 && position.col < 8 && position.row >= 0 && position.row < 8;
  }

  /** Find the position of the king of a given color */
  private findKing(color: PieceColor): Position | null {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { col, row };
        }
      }
    }
    return null;
  }

  /** Check if a square is attacked by pieces of a given color */
  private isSquareAttackedBy(position: Position, attackerColor: PieceColor): boolean {
    const attackers = this.getPiecesByColor(attackerColor);

    for (const piece of attackers) {
      const moves = piece.getPossibleMoves(this);
      if (moves.some(m => m.col === position.col && m.row === position.row)) {
        return true;
      }
    }
    return false;
  }

  isKingInCheck(color: PieceColor): boolean {
    const kingPos = this.findKing(color);
    if (!kingPos) return false;

    const opponentColor: PieceColor = color === 'white' ? 'black' : 'white';
    return this.isSquareAttackedBy(kingPos, opponentColor);
  }

  /** Get legal moves (considering check) */
  getLegalMoves(position: Position): Position[] {
    const piece = this.getPieceAt(position);
    if (!piece) return [];

    const possibleMoves = piece.getPossibleMoves(this);
    const legalMoves: Position[] = [];

    for (const target of possibleMoves) {
      // Simulate the move and check if own king is in check
      if (this.isMoveLegal(position, target, piece.color)) {
        legalMoves.push(target);
      }
    }

    return legalMoves;
  }

  /** Check move legality (whether it leaves the king in check) */
  private isMoveLegal(from: Position, to: Position, color: PieceColor): boolean {
    const movingPiece = this.board[from.row][from.col];
    if (!movingPiece) return false;

    const opponentColor: PieceColor = color === 'white' ? 'black' : 'white';

    // Special check for castling
    if (movingPiece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      // King must not be in check at the moment of castling
      if (this.isKingInCheck(color)) {
        return false;
      }

      // Determine castling direction
      const direction = to.col > from.col ? 1 : -1;

      // Check that king doesn't pass through an attacked square
      const intermediateSquare = { col: from.col + direction, row: from.row };
      if (this.isSquareAttackedBy(intermediateSquare, opponentColor)) {
        return false;
      }

      // Check that the destination square is not under attack
      if (this.isSquareAttackedBy(to, opponentColor)) {
        return false;
      }

      return true;
    }

    // Save state
    const capturedPiece = this.board[to.row][to.col];

    // Check for en passant
    let enPassantCapturedPiece: IChessPiece | null = null;
    let enPassantCapturedPos: Position | null = null;

    if (
      movingPiece.type === 'pawn' &&
      this.enPassantTarget !== null &&
      to.col === this.enPassantTarget.col &&
      to.row === this.enPassantTarget.row &&
      capturedPiece === null
    ) {
      // This is en passant — need to remove the enemy pawn
      const capturedPawnRow = movingPiece.color === 'white' ? to.row + 1 : to.row - 1;
      enPassantCapturedPos = { col: to.col, row: capturedPawnRow };
      enPassantCapturedPiece = this.board[capturedPawnRow][to.col];
      this.board[capturedPawnRow][to.col] = null;
    }

    // Temporarily make the move
    this.board[to.row][to.col] = movingPiece;
    this.board[from.row][from.col] = null;

    // Check if king is in check
    const inCheck = this.isKingInCheck(color);

    // Rollback the move
    this.board[from.row][from.col] = movingPiece;
    this.board[to.row][to.col] = capturedPiece;

    // Rollback en passant
    if (enPassantCapturedPos && enPassantCapturedPiece) {
      this.board[enPassantCapturedPos.row][enPassantCapturedPos.col] = enPassantCapturedPiece;
    }

    return !inCheck;
  }

  /** Check if pawn promotion is needed after moving to a given square */
  needsPromotion(from: Position, to: Position): boolean {
    const piece = this.getPieceAt(from);
    if (!piece || piece.type !== 'pawn') return false;

    // White pawn promotes on row 0 (8th rank),
    // black pawn promotes on row 7 (1st rank)
    const promotionRow = piece.color === 'white' ? 0 : 7;
    return to.row === promotionRow;
  }

  /** Execute a move */
  makeMove(from: Position, to: Position, promotion?: PieceType): Move | null {
    const piece = this.getPieceAt(from);
    if (!piece) return null;
    if (piece.color !== this.currentTurn) return null;

    const legalMoves = this.getLegalMoves(from);
    const isLegal = legalMoves.some(m => m.col === to.col && m.row === to.row);
    if (!isLegal) return null;

    // If pawn reached the end — promotion is required
    const requiresPromotion = this.needsPromotion(from, to);
    if (requiresPromotion && !promotion) {
      // Promotion not specified — return null
      // so UI can request user's choice
      return null;
    }

    // Validate promotion type
    if (requiresPromotion && promotion) {
      const validPromotions: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];
      if (!validPromotions.includes(promotion)) {
        return null;
      }
    }

    const capturedPiece = this.board[to.row][to.col];
    let isCapture = capturedPiece !== null;
    let isEnPassant = false;

    // En passant check
    if (
      piece.type === 'pawn' &&
      this.enPassantTarget !== null &&
      to.col === this.enPassantTarget.col &&
      to.row === this.enPassantTarget.row &&
      capturedPiece === null
    ) {
      isEnPassant = true;
      isCapture = true;

      // Remove the captured pawn (it's on the same column but on the capturing pawn's row)
      const capturedPawnRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
      this.board[capturedPawnRow][to.col] = null;
    }

    // Execute the move
    this.board[to.row][to.col] = piece;
    this.board[from.row][from.col] = null;
    piece.moveTo(to);

    // Pawn promotion
    let actualPromotion: PieceType | undefined;
    if (requiresPromotion && promotion) {
      actualPromotion = promotion;
      // Create a new piece in place of the pawn (isPromotedPawn = true)
      const newPiece = this.createPiece(promotion, piece.color, to, true);
      newPiece.hasMoved = true;
      this.board[to.row][to.col] = newPiece;
    }

    // Castling — move the rook
    let isCastling: 'kingside' | 'queenside' | undefined;
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      if (to.col > from.col) {
        // Kingside castling
        isCastling = 'kingside';
        const rook = this.board[from.row][7] as IChessPiece;
        this.board[from.row][to.col - 1] = rook;
        this.board[from.row][7] = null;
        rook.moveTo({ col: to.col - 1, row: from.row });
      } else {
        // Queenside castling
        isCastling = 'queenside';
        const rook = this.board[from.row][0] as IChessPiece;
        this.board[from.row][to.col + 1] = rook;
        this.board[from.row][0] = null;
        rook.moveTo({ col: to.col + 1, row: from.row });
      }
    }

    // Reset enPassantTarget and set a new one if pawn moved 2 squares
    this.enPassantTarget = null;
    if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
      // Square between start and end positions
      this.enPassantTarget = {
        col: from.col,
        row: (from.row + to.row) / 2,
      };
    }

    const move: Move = {
      from: { ...from },
      to: { ...to },
      pieceType: piece.type,
      color: piece.color,
      isCapture,
      isEnPassant,
      promotion: actualPromotion,
      isCastling,
    };

    this.moveHistory.push(move);
    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';

    return move;
  }

  getCurrentTurn(): PieceColor {
    return this.currentTurn;
  }

  getEnPassantTarget(): Position | null {
    return this.enPassantTarget;
  }

  /** Get move history in notation */
  getMoveHistory(): string[] {
    return this.moveHistory.map(
      (m) => `${positionToNotation(m.from)}→${positionToNotation(m.to)}`
    );
  }

  /** Get the entire board for rendering */
  getBoardState(): (IChessPiece | null)[][] {
    return this.board;
  }

  /** Check for checkmate: king is in check AND there are no legal moves */
  isCheckmate(color: PieceColor): boolean {
    if (!this.isKingInCheck(color)) return false;
    return !this.hasAnyLegalMove(color);
  }

  /** Check for stalemate: king is NOT in check, but there are no legal moves */
  isStalemate(color: PieceColor): boolean {
    if (this.isKingInCheck(color)) return false;
    return !this.hasAnyLegalMove(color);
  }

  /** Get the current game status */
  getGameStatus(): GameStatus {
    const turn = this.getCurrentTurn();

    // First check for checkmate — if king is in check and there are no moves
    if (this.isCheckmate(turn)) {
      const winner: PieceColor = turn === 'white' ? 'black' : 'white';
      return { type: 'checkmate', winner, loser: turn };
    }

    // Then check for stalemate — if king is not in check but there are no moves
    if (this.isStalemate(turn)) {
      return { type: 'stalemate' };
    }

    // Game continues
    return {
      type: 'playing',
      turn,
      inCheck: this.isKingInCheck(turn),
    };
  }

  /** Whether the player of a given color has at least one legal move */
  private hasAnyLegalMove(color: PieceColor): boolean {
    const pieces = this.getPiecesByColor(color);
    for (const piece of pieces) {
      const legalMoves = this.getLegalMoves(piece.position);
      if (legalMoves.length > 0) return true;
    }
    return false;
  }
}
