import { IChessBoard, Position } from '../types/chess';
import { ChessPiece } from './ChessPiece';

/** King — moves one square in any direction + castling */
export class King extends ChessPiece {
  constructor(color: 'white' | 'black', position: Position) {
    super('king', color, position);
  }

  getPossibleMoves(board: IChessBoard): Position[] {
    const directions: [number, number][] = [
      [-1, -1], [0, -1], [1, -1],
      [-1,  0],          [1,  0],
      [-1,  1], [0,  1], [1,  1],
    ];
    const moves = this.getSteppingMoves(board, directions);

    // Castling
    if (!this.hasMoved) {
      const row = this.position.row;
      const col = this.position.col;

      // Kingside castling (king's side, rook at col=7)
      const kingsideRook = board.getPieceAt({ col: 7, row });
      if (
        kingsideRook &&
        kingsideRook.type === 'rook' &&
        kingsideRook.color === this.color &&
        !kingsideRook.hasMoved &&
        !kingsideRook.isPromotedPawn
      ) {
        // Check that squares between king and rook are empty
        const betweenKingside = [
          { col: col + 1, row },
          { col: col + 2, row },
        ];
        const pathClear = betweenKingside.every(
          (pos) => board.getPieceAt(pos) === null
        );
        if (pathClear) {
          // Castling target square (king moves 2 squares to the right)
          moves.push({ col: col + 2, row });
        }
      }

      // Queenside castling (queen's side, rook at col=0)
      const queensideRook = board.getPieceAt({ col: 0, row });
      if (
        queensideRook &&
        queensideRook.type === 'rook' &&
        queensideRook.color === this.color &&
        !queensideRook.hasMoved &&
        !queensideRook.isPromotedPawn
      ) {
        // Check that squares between king and rook are empty
        const betweenQueenside = [
          { col: col - 1, row },
          { col: col - 2, row },
          { col: col - 3, row },
        ];
        const pathClear = betweenQueenside.every(
          (pos) => board.getPieceAt(pos) === null
        );
        if (pathClear) {
          // Castling target square (king moves 2 squares to the left)
          moves.push({ col: col - 2, row });
        }
      }
    }

    return moves;
  }
}

/** Queen — combines rook and bishop moves */
export class Queen extends ChessPiece {
  constructor(color: 'white' | 'black', position: Position, isPromotedPawn: boolean = false) {
    super('queen', color, position, isPromotedPawn);
  }

  getPossibleMoves(board: IChessBoard): Position[] {
    const directions: [number, number][] = [
      [-1, -1], [0, -1], [1, -1],
      [-1,  0],          [1,  0],
      [-1,  1], [0,  1], [1,  1],
    ];
    return this.getSlidingMoves(board, directions);
  }
}

/** Rook — moves horizontally and vertically */
export class Rook extends ChessPiece {
  constructor(color: 'white' | 'black', position: Position, isPromotedPawn: boolean = false) {
    super('rook', color, position, isPromotedPawn);
  }

  getPossibleMoves(board: IChessBoard): Position[] {
    const directions: [number, number][] = [
      [0, -1], [-1, 0], [1, 0], [0, 1],
    ];
    return this.getSlidingMoves(board, directions);
  }
}

/** Bishop — moves diagonally */
export class Bishop extends ChessPiece {
  constructor(color: 'white' | 'black', position: Position, isPromotedPawn: boolean = false) {
    super('bishop', color, position, isPromotedPawn);
  }

  getPossibleMoves(board: IChessBoard): Position[] {
    const directions: [number, number][] = [
      [-1, -1], [1, -1], [-1, 1], [1, 1],
    ];
    return this.getSlidingMoves(board, directions);
  }
}

/** Knight — moves in an "L" shape */
export class Knight extends ChessPiece {
  constructor(color: 'white' | 'black', position: Position, isPromotedPawn: boolean = false) {
    super('knight', color, position, isPromotedPawn);
  }

  getPossibleMoves(board: IChessBoard): Position[] {
    const offsets: [number, number][] = [
      [-2, -1], [-2, 1],
      [-1, -2], [-1, 2],
      [ 1, -2], [ 1, 2],
      [ 2, -1], [ 2, 1],
    ];
    return this.getSteppingMoves(board, offsets);
  }
}

/** Pawn — moves forward, captures diagonally */
export class Pawn extends ChessPiece {
  constructor(color: 'white' | 'black', position: Position) {
    super('pawn', color, position);
  }

  getPossibleMoves(board: IChessBoard): Position[] {
    const moves: Position[] = [];
    const direction = this.color === 'white' ? -1 : 1;
    const startRow = this.color === 'white' ? 6 : 1;

    const { col, row } = this.position;

    // Move forward by 1
    const oneForward = { col, row: row + direction };
    if (board.isValidPosition(oneForward) && board.getPieceAt(oneForward) === null) {
      moves.push(oneForward);

      // Move forward by 2 from starting position
      if (row === startRow) {
        const twoForward = { col, row: row + 2 * direction };
        if (board.isValidPosition(twoForward) && board.getPieceAt(twoForward) === null) {
          moves.push(twoForward);
        }
      }
    }

    // Diagonal capture
    for (const dc of [-1, 1]) {
      const diagonal = { col: col + dc, row: row + direction };
      if (board.isValidPosition(diagonal)) {
        const piece = board.getPieceAt(diagonal);
        if (piece !== null && piece.color !== this.color) {
          moves.push(diagonal);
        }
      }
    }

    // En passant capture
    const enPassantTarget = board.getEnPassantTarget();
    if (enPassantTarget !== null) {
      // Pawn can capture en passant if the target is diagonally from current position
      const targetCol = enPassantTarget.col;
      const targetRow = enPassantTarget.row;

      // Target must be one square forward and one square to the side
      if (
        targetRow === row + direction &&
        Math.abs(targetCol - col) === 1
      ) {
        moves.push(enPassantTarget);
      }
    }

    return moves;
  }
}
