import { IChessBoard, Position } from '../types/chess';
import { ChessPiece } from './ChessPiece';

/** Король — ходит на одну клетку в любом направлении + рокировка */
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

    // Рокировка
    if (!this.hasMoved) {
      const row = this.position.row;
      const col = this.position.col;

      // Короткая рокировка (королевская сторона, ладья на col=7)
      const kingsideRook = board.getPieceAt({ col: 7, row });
      if (
        kingsideRook &&
        kingsideRook.type === 'rook' &&
        kingsideRook.color === this.color &&
        !kingsideRook.hasMoved &&
        !kingsideRook.isPromotedPawn
      ) {
        // Проверяем, что клетки между королём и ладьёй пусты
        const betweenKingside = [
          { col: col + 1, row },
          { col: col + 2, row },
        ];
        const pathClear = betweenKingside.every(
          (pos) => board.getPieceAt(pos) === null
        );
        if (pathClear) {
          // Целевая клетка рокировки (король перемещается на 2 клетки вправо)
          moves.push({ col: col + 2, row });
        }
      }

      // Длинная рокировка (ферзевая сторона, ладья на col=0)
      const queensideRook = board.getPieceAt({ col: 0, row });
      if (
        queensideRook &&
        queensideRook.type === 'rook' &&
        queensideRook.color === this.color &&
        !queensideRook.hasMoved &&
        !queensideRook.isPromotedPawn
      ) {
        // Проверяем, что клетки между королём и ладьёй пусты
        const betweenQueenside = [
          { col: col - 1, row },
          { col: col - 2, row },
          { col: col - 3, row },
        ];
        const pathClear = betweenQueenside.every(
          (pos) => board.getPieceAt(pos) === null
        );
        if (pathClear) {
          // Целевая клетка рокировки (король перемещается на 2 клетки влево)
          moves.push({ col: col - 2, row });
        }
      }
    }

    return moves;
  }
}

/** Ферзь — сочетает ходы ладьи и слона */
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

/** Ладья — ходит по горизонтали и вертикали */
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

/** Слон — ходит по диагоналям */
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

/** Конь — ходит буквой «Г» */
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

/** Пешка — ходит вперёд, бьёт по диагонали */
export class Pawn extends ChessPiece {
  constructor(color: 'white' | 'black', position: Position) {
    super('pawn', color, position);
  }

  getPossibleMoves(board: IChessBoard): Position[] {
    const moves: Position[] = [];
    const direction = this.color === 'white' ? -1 : 1;
    const startRow = this.color === 'white' ? 6 : 1;

    const { col, row } = this.position;

    // Ход вперёд на 1
    const oneForward = { col, row: row + direction };
    if (board.isValidPosition(oneForward) && board.getPieceAt(oneForward) === null) {
      moves.push(oneForward);

      // Ход вперёд на 2 с начальной позиции
      if (row === startRow) {
        const twoForward = { col, row: row + 2 * direction };
        if (board.isValidPosition(twoForward) && board.getPieceAt(twoForward) === null) {
          moves.push(twoForward);
        }
      }
    }

    // Взятие по диагонали
    for (const dc of [-1, 1]) {
      const diagonal = { col: col + dc, row: row + direction };
      if (board.isValidPosition(diagonal)) {
        const piece = board.getPieceAt(diagonal);
        if (piece !== null && piece.color !== this.color) {
          moves.push(diagonal);
        }
      }
    }

    // Взятие на проходе (en passant)
    const enPassantTarget = board.getEnPassantTarget();
    if (enPassantTarget !== null) {
      // Пешка может взять на проходе, если цель находится на диагонали от текущей позиции
      const targetCol = enPassantTarget.col;
      const targetRow = enPassantTarget.row;

      // Цель должна быть на одну клетку вперёд и на одну клетку в сторону
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
