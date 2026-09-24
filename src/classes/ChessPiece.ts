import {
  IChessPiece,
  IChessBoard,
  PieceColor,
  PieceType,
  Position,
  PIECE_SYMBOLS,
} from '../types/chess';

/**
 * Абстрактный базовый класс для всех шахматных фигур.
 * Все конкретные фигуры наследуются от этого класса.
 */
export abstract class ChessPiece implements IChessPiece {
  readonly type: PieceType;
  readonly color: PieceColor;
  position: Position;
  hasMoved: boolean = false;

  constructor(type: PieceType, color: PieceColor, position: Position) {
    this.type = type;
    this.color = color;
    this.position = { ...position };
  }

  getSymbol(): string {
    return PIECE_SYMBOLS[this.color][this.type];
  }

  moveTo(position: Position): void {
    this.position = { ...position };
    this.hasMoved = true;
  }

  /**
   * Абстрактный метод — каждая фигура определяет свои возможные ходы.
   */
  abstract getPossibleMoves(board: IChessBoard): Position[];

  /**
   * Вспомогательный метод: получить ходы по направлению (для ферзя, ладьи, слона).
   * Движется в заданном направлении до упора или до препятствия.
   */
  protected getSlidingMoves(
    board: IChessBoard,
    directions: [number, number][]
  ): Position[] {
    const moves: Position[] = [];

    for (const [dc, dr] of directions) {
      let c = this.position.col + dc;
      let r = this.position.row + dr;

      while (board.isValidPosition({ col: c, row: r })) {
        const target = { col: c, row: r };
        const piece = board.getPieceAt(target);

        if (piece === null) {
          // Пустая клетка — можно идти
          moves.push(target);
        } else if (piece.color !== this.color) {
          // Вражеская фигура — можно взять и остановиться
          moves.push(target);
          break;
        } else {
          // Своя фигура — нельзя идти дальше
          break;
        }

        c += dc;
        r += dr;
      }
    }

    return moves;
  }

  /**
   * Вспомогательный метод: получить ходы на одну клетку (для короля, коня, пешки).
   */
  protected getSteppingMoves(
    board: IChessBoard,
    offsets: [number, number][]
  ): Position[] {
    const moves: Position[] = [];

    for (const [dc, dr] of offsets) {
      const target = {
        col: this.position.col + dc,
        row: this.position.row + dr,
      };

      if (!board.isValidPosition(target)) continue;

      const piece = board.getPieceAt(target);
      if (piece === null || piece.color !== this.color) {
        moves.push(target);
      }
    }

    return moves;
  }
}
