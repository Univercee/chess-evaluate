import {
  IChessPiece,
  IChessBoard,
  PieceColor,
  PieceType,
  Position,
  PIECE_SYMBOLS,
} from '../types/chess';

/**
 * Abstract base class for all chess pieces.
 * All concrete pieces inherit from this class.
 */
export abstract class ChessPiece implements IChessPiece {
  readonly type: PieceType;
  readonly color: PieceColor;
  position: Position;
  hasMoved: boolean = false;
  readonly isPromotedPawn: boolean;

  constructor(
    type: PieceType,
    color: PieceColor,
    position: Position,
    isPromotedPawn: boolean = false
  ) {
    this.type = type;
    this.color = color;
    this.position = { ...position };
    this.isPromotedPawn = isPromotedPawn;
  }

  getSymbol(): string {
    return PIECE_SYMBOLS[this.color][this.type];
  }

  moveTo(position: Position): void {
    this.position = { ...position };
    this.hasMoved = true;
  }

  /**
   * Abstract method — each piece defines its own possible moves.
   */
  abstract getPossibleMoves(board: IChessBoard): Position[];

  /**
   * Helper method: get moves in a direction (for queen, rook, bishop).
   * Moves in the given direction until blocked or hitting a piece.
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
          // Empty square — can move
          moves.push(target);
        } else if (piece.color !== this.color) {
          // Enemy piece — can capture and stop
          moves.push(target);
          break;
        } else {
          // Own piece — cannot move further
          break;
        }

        c += dc;
        r += dr;
      }
    }

    return moves;
  }

  /**
   * Helper method: get moves one square at a time (for king, knight, pawn).
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
