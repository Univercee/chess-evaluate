/** Piece color */
export type PieceColor = 'white' | 'black';

/** Piece type */
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

/** Position on the board (coordinates) */
export interface Position {
  /** Column 0-7 (a-h) */
  col: number;
  /** Row 0-7 (8-1, top to bottom) */
  row: number;
}

/** Alphanumeric square notation (e.g. "e4") */
export type SquareNotation = string;

/** Move description */
export interface Move {
  /** From where */
  from: Position;
  /** To where */
  to: Position;
  /** Type of the moving piece */
  pieceType: PieceType;
  /** Piece color */
  color: PieceColor;
  /** Whether an enemy piece was captured */
  isCapture: boolean;
  /** Pawn promotion (if any) */
  promotion?: PieceType;
  /** Castling */
  isCastling?: 'kingside' | 'queenside';
  /** En passant capture */
  isEnPassant?: boolean;
}

/** Interface for any chess piece */
export interface IChessPiece {
  /** Piece type */
  readonly type: PieceType;
  /** Piece color */
  readonly color: PieceColor;
  /** Current position */
  position: Position;
  /** Whether the piece has moved (important for castling and pawns) */
  hasMoved: boolean;
  /** Whether this piece is a promoted pawn (important for castling) */
  readonly isPromotedPawn: boolean;

  /** Get the Unicode symbol of the piece */
  getSymbol(): string;

  /** Get all legal target squares (without checking for king's check) */
  getPossibleMoves(board: IChessBoard): Position[];

  /** Move the piece */
  moveTo(position: Position): void;
}

/** Game status */
export type GameStatus =
  | { type: 'playing'; turn: PieceColor; inCheck: boolean }
  | { type: 'checkmate'; winner: PieceColor; loser: PieceColor }
  | { type: 'stalemate' };

/** Interface for the chess board */
export interface IChessBoard {
  /** Get piece at a square (or null) */
  getPieceAt(position: Position): IChessPiece | null;

  /** Get all pieces of a given color */
  getPiecesByColor(color: PieceColor): IChessPiece[];

  /** Check if a position is within the board */
  isValidPosition(position: Position): boolean;

  /** Check if the king of a given color is in check */
  isKingInCheck(color: PieceColor): boolean;

  /** Get all legal moves for a piece (considering check) */
  getLegalMoves(position: Position): Position[];

  /** Execute a move. promotion — piece type for pawn promotion (queen/rook/bishop/knight) */
  makeMove(from: Position, to: Position, promotion?: PieceType): Move | null;

  /** Get whose turn it is */
  getCurrentTurn(): PieceColor;

  /** Get the en passant target square (or null) */
  getEnPassantTarget(): Position | null;

  /** Check if a player of a given color is in checkmate */
  isCheckmate(color: PieceColor): boolean;

  /** Check if a player of a given color is in stalemate */
  isStalemate(color: PieceColor): boolean;

  /** Get the current game status */
  getGameStatus(): GameStatus;
}

/**
 * Piece Unicode symbols.
 * All pieces use the same set of symbols (white ones),
 * coloring is done via CSS (white — white, black — black).
 */
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
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
};

/** Convert coordinates to notation */
export function positionToNotation(pos: Position): SquareNotation {
  const file = String.fromCharCode(97 + pos.col); // a-h
  const rank = 8 - pos.row; // 8-1
  return `${file}${rank}`;
}

/** Convert notation to coordinates */
export function notationToPosition(notation: SquareNotation): Position {
  const col = notation.charCodeAt(0) - 97;
  const row = 8 - parseInt(notation[1], 10);
  return { col, row };
}
