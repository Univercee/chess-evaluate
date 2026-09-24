import {
  IChessBoard,
  IChessPiece,
  PieceColor,
  Position,
  Move,
  positionToNotation,
} from '../types/chess';
import { ChessPiece } from './ChessPiece';
import { King, Queen, Rook, Bishop, Knight, Pawn } from './Pieces';

/**
 * Класс шахматной доски.
 * Управляет расстановкой фигур, ходами и проверками.
 */
export class ChessBoard implements IChessBoard {
  /** Доска 8x8. null = пустая клетка */
  private board: (IChessPiece | null)[][];
  /** Чей сейчас ход */
  private currentTurn: PieceColor;
  /** История ходов */
  private moveHistory: Move[];

  constructor() {
    this.board = Array.from({ length: 8 }, () => Array(8).fill(null));
    this.currentTurn = 'white';
    this.moveHistory = [];
    this.setupInitialPosition();
  }

  /** Начальная расстановка фигур */
  private setupInitialPosition(): void {
    // Белые фигуры (ряды 6-7 для пешек, 7 для фигур)
    const backRowTypes = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'] as const;

    for (let col = 0; col < 8; col++) {
      // Белые фигуры (нижняя часть доски)
      this.placePiece(this.createPiece(backRowTypes[col], 'white', { col, row: 7 }));
      this.placePiece(this.createPiece('pawn', 'white', { col, row: 6 }));

      // Чёрные фигуры (верхняя часть доски)
      this.placePiece(this.createPiece(backRowTypes[col], 'black', { col, row: 0 }));
      this.placePiece(this.createPiece('pawn', 'black', { col, row: 1 }));
    }
  }

  /** Фабричный метод создания фигуры */
  private createPiece(type: string, color: PieceColor, position: Position): IChessPiece {
    switch (type) {
      case 'king': return new King(color, position);
      case 'queen': return new Queen(color, position);
      case 'rook': return new Rook(color, position);
      case 'bishop': return new Bishop(color, position);
      case 'knight': return new Knight(color, position);
      case 'pawn': return new Pawn(color, position);
      default: throw new Error(`Unknown piece type: ${type}`);
    }
  }

  /** Разместить фигуру на доске */
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

  /** Найти позицию короля заданного цвета */
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

  /** Проверить, атакуется ли клетка фигурами заданного цвета */
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

  /** Получить легальные ходы (с учётом шаха) */
  getLegalMoves(position: Position): Position[] {
    const piece = this.getPieceAt(position);
    if (!piece) return [];

    const possibleMoves = piece.getPossibleMoves(this);
    const legalMoves: Position[] = [];

    for (const target of possibleMoves) {
      // Симулируем ход и проверяем, не под шахом ли свой король
      if (this.isMoveLegal(position, target, piece.color)) {
        legalMoves.push(target);
      }
    }

    return legalMoves;
  }

  /** Проверить легальность хода (не оставляет ли короля под шахом) */
  private isMoveLegal(from: Position, to: Position, color: PieceColor): boolean {
    // Сохраняем состояние
    const capturedPiece = this.board[to.row][to.col];
    const movingPiece = this.board[from.row][from.col];

    // Выполняем ход временно
    this.board[to.row][to.col] = movingPiece;
    this.board[from.row][from.col] = null;

    // Проверяем, под шахом ли король
    const inCheck = this.isKingInCheck(color);

    // Откатываем ход
    this.board[from.row][from.col] = movingPiece;
    this.board[to.row][to.col] = capturedPiece;

    return !inCheck;
  }

  /** Выполнить ход */
  makeMove(from: Position, to: Position): Move | null {
    const piece = this.getPieceAt(from);
    if (!piece) return null;
    if (piece.color !== this.currentTurn) return null;

    const legalMoves = this.getLegalMoves(from);
    const isLegal = legalMoves.some(m => m.col === to.col && m.row === to.row);
    if (!isLegal) return null;

    const capturedPiece = this.board[to.row][to.col];
    const isCapture = capturedPiece !== null;

    // Выполняем ход
    this.board[to.row][to.col] = piece;
    this.board[from.row][from.col] = null;
    piece.moveTo(to);

    const move: Move = {
      from: { ...from },
      to: { ...to },
      pieceType: piece.type,
      color: piece.color,
      isCapture,
    };

    this.moveHistory.push(move);
    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';

    return move;
  }

  getCurrentTurn(): PieceColor {
    return this.currentTurn;
  }

  /** Получить историю ходов в нотации */
  getMoveHistory(): string[] {
    return this.moveHistory.map(
      (m) => `${positionToNotation(m.from)}→${positionToNotation(m.to)}`
    );
  }

  /** Получить всю доску для рендеринга */
  getBoardState(): (IChessPiece | null)[][] {
    return this.board;
  }

  /** Проверить мат */
  isCheckmate(color: PieceColor): boolean {
    if (!this.isKingInCheck(color)) return false;
    return !this.hasAnyLegalMove(color);
  }

  /** Проверить пат */
  isStalemate(color: PieceColor): boolean {
    if (this.isKingInCheck(color)) return false;
    return !this.hasAnyLegalMove(color);
  }

  /** Есть ли хотя бы один легальный ход */
  private hasAnyLegalMove(color: PieceColor): boolean {
    const pieces = this.getPiecesByColor(color);
    for (const piece of pieces) {
      const legalMoves = this.getLegalMoves(piece.position);
      if (legalMoves.length > 0) return true;
    }
    return false;
  }
}
