/** Цвет фигуры */
export type PieceColor = 'white' | 'black';

/** Тип фигуры */
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

/** Позиция на доске (координаты) */
export interface Position {
  /** Колонка 0-7 (a-h) */
  col: number;
  /** Строка 0-7 (8-1, сверху вниз) */
  row: number;
}

/** Буквенно-цифровая нотация клетки (напр. "e4") */
export type SquareNotation = string;

/** Описание хода */
export interface Move {
  /** Откуда */
  from: Position;
  /** Куда */
  to: Position;
  /** Тип фигуры, которая ходит */
  pieceType: PieceType;
  /** Цвет фигуры */
  color: PieceColor;
  /** Был ли взят вражеский фишка */
  isCapture: boolean;
  /** Превращение пешки (если есть) */
  promotion?: PieceType;
  /** Рокировка */
  isCastling?: 'kingside' | 'queenside';
  /** Взятие на проходе */
  isEnPassant?: boolean;
}

/** Интерфейс для любой шахматной фигуры */
export interface IChessPiece {
  /** Тип фигуры */
  readonly type: PieceType;
  /** Цвет фигуры */
  readonly color: PieceColor;
  /** Текущая позиция */
  position: Position;
  /** Делала ли фигура ход (важно для рокировки и пешек) */
  hasMoved: boolean;

  /** Получить Unicode-символ фигуры */
  getSymbol(): string;

  /** Получить все легальные целевые клетки (без проверки шаха королю) */
  getPossibleMoves(board: IChessBoard): Position[];

  /** Переместить фигуру */
  moveTo(position: Position): void;
}

/** Интерфейс для шахматной доски */
export interface IChessBoard {
  /** Получить фигуру на клетке (или undefined) */
  getPieceAt(position: Position): IChessPiece | null;

  /** Получить все фигуры заданного цвета */
  getPiecesByColor(color: PieceColor): IChessPiece[];

  /** Проверить, находится ли позиция в пределах доски */
  isValidPosition(position: Position): boolean;

  /** Проверить, находится ли король данного цвета под шахом */
  isKingInCheck(color: PieceColor): boolean;

  /** Получить все легальные ходы для фигуры (с учётом шаха) */
  getLegalMoves(position: Position): Position[];

  /** Выполнить ход */
  makeMove(from: Position, to: Position): Move | null;

  /** Определить, чей ход */
  getCurrentTurn(): PieceColor;

  /** Получить клетку для взятия на проходе (или null) */
  getEnPassantTarget(): Position | null;
}

/** Unicode-символы фигур */
export const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

/** Преобразование координат в нотацию */
export function positionToNotation(pos: Position): SquareNotation {
  const file = String.fromCharCode(97 + pos.col); // a-h
  const rank = 8 - pos.row; // 8-1
  return `${file}${rank}`;
}

/** Преобразование нотации в координаты */
export function notationToPosition(notation: SquareNotation): Position {
  const col = notation.charCodeAt(0) - 97;
  const row = 8 - parseInt(notation[1], 10);
  return { col, row };
}
