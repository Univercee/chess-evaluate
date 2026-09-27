import React from 'react';

interface BestMoveArrowProps {
  bestMove: string | null;
  boardWidth: number;
}

/**
 * Component to display best move arrow on the chess board
 */
export const BestMoveArrow: React.FC<BestMoveArrowProps> = ({ bestMove, boardWidth }) => {
  if (!bestMove || bestMove.length < 4) return null;

  // Parse UCI move notation (e.g., "e2e4")
  const fromSquare = bestMove.substring(0, 2);
  const toSquare = bestMove.substring(2, 4);

  // Convert square notation to coordinates
  const squareToCoords = (square: string) => {
    const file = square.charCodeAt(0) - 97; // 'a' = 0, 'h' = 7
    const rank = 8 - parseInt(square[1]); // '8' = 0, '1' = 7
    return { x: file, y: rank };
  };

  const from = squareToCoords(fromSquare);
  const to = squareToCoords(toSquare);

  const squareSize = boardWidth / 8;
  
  // Calculate center of squares
  const fromX = from.x * squareSize + squareSize / 2;
  const fromY = from.y * squareSize + squareSize / 2;
  const toX = to.x * squareSize + squareSize / 2;
  const toY = to.y * squareSize + squareSize / 2;

  // Calculate arrow angle
  const angle = Math.atan2(toY - fromY, toX - fromX);
  
  // Arrow head size
  const headLength = squareSize * 0.3;
  const headWidth = squareSize * 0.2;

  // Calculate arrow head points
  const headPoint1X = toX - headLength * Math.cos(angle) + headWidth * Math.sin(angle);
  const headPoint1Y = toY - headLength * Math.sin(angle) - headWidth * Math.cos(angle);
  const headPoint2X = toX - headLength * Math.cos(angle) - headWidth * Math.sin(angle);
  const headPoint2Y = toY - headLength * Math.sin(angle) + headWidth * Math.cos(angle);

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      width={boardWidth}
      height={boardWidth}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
      {/* Arrow line */}
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke="#22c55e"
        strokeWidth={squareSize * 0.15}
        strokeLinecap="round"
        opacity={0.8}
      />
      {/* Arrow head */}
      <polygon
        points={`${toX},${toY} ${headPoint1X},${headPoint1Y} ${headPoint2X},${headPoint2Y}`}
        fill="#22c55e"
        opacity={0.8}
      />
    </svg>
  );
};
